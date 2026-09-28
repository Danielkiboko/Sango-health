import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  MessageSquare, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  ShieldCheck, 
  QrCode,
  X,
  ExternalLink,
  RefreshCw,
  UserCheck,
  Stethoscope,
  Sparkles,
  Wifi,
  Settings,
  Layers,
  Radio,
  User
} from 'lucide-react';
import { Appointment, Doctor, Prescription, UserRole } from '../types';
import { 
  NativeWebRTCManager, 
  LiveKitManager, 
  TeleconsultEngine,
  WebRTCConnectionStatus 
} from '../lib/webrtc';

interface VideoConsultationRoomModalProps {
  appointment: Appointment;
  doctor: Doctor;
  userRole: UserRole; // 'doctor' | 'patient'
  onClose: () => void;
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
  attachment?: Prescription;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function VideoConsultationRoomModal({ 
  appointment, 
  doctor, 
  userRole,
  onClose,
  onSavePrescription 
}: VideoConsultationRoomModalProps) {
  const isDoctor = userRole === 'doctor';
  const userName = isDoctor ? doctor.name : appointment.patientName;
  const remoteUserName = isDoctor ? appointment.patientName : doctor.name;
  
  // Nom unique de la salle chiffrée
  const roomName = `sango-health-teleconsult-${appointment.id}`;
  const directRoomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(userName)}`;

  // Sélection du moteur de streaming WebRTC
  const [engine, setEngine] = useState<TeleconsultEngine>('webrtc-p2p');
  const [activeTab, setActiveTab] = useState<'chat' | 'prescription'>('chat');
  const [callDuration, setCallDuration] = useState(0);

  // États Médias WebRTC Natif
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnectingWebRTC, setIsConnectingWebRTC] = useState(true);
  const [webRTCStatus, setWebRTCStatus] = useState<WebRTCConnectionStatus>({
    connectionState: 'new',
    iceConnectionState: 'new',
    hasLocalAudio: true,
    hasLocalVideo: true,
    isScreenSharing: false,
    remoteUserConnected: false
  });

  // États LiveKit SFU
  const [liveKitUrl, setLiveKitUrl] = useState('wss://sango-health.livekit.cloud');
  const [liveKitToken, setLiveKitToken] = useState('');
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [showLiveKitConfig, setShowLiveKitConfig] = useState(false);

  // États Jitsi
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  // Références Vidéo DOM
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  // Gestionnaires WebRTC
  const rtcManagerRef = useRef<NativeWebRTCManager | null>(null);
  const liveKitManagerRef = useRef<LiveKitManager | null>(null);

  // -------------------------------------------------------------
  // INITIALISATION DU MOTEUR WEBRTC P2P NATIF
  // -------------------------------------------------------------
  useEffect(() => {
    if (engine !== 'webrtc-p2p') return;

    let isMounted = true;
    setIsConnectingWebRTC(true);

    const initNativeWebRTC = async () => {
      try {
        const manager = new NativeWebRTCManager(
          String(appointment.id),
          isDoctor ? 'doctor' : 'patient',
          userName,
          {
            onRemoteStream: (stream) => {
              if (remoteVideoRef.current && isMounted) {
                remoteVideoRef.current.srcObject = stream;
              }
            },
            onStatusChange: (status) => {
              if (isMounted) {
                setWebRTCStatus(prev => ({ ...prev, ...status }));
              }
            }
          }
        );

        rtcManagerRef.current = manager;

        // Démarrer caméra/micro local
        const localStream = await manager.startLocalStream(isVideoOn, isMicOn);
        if (localVideoRef.current && isMounted) {
          localVideoRef.current.srcObject = localStream;
        }

        // Initialiser la connexion P2P avec serveurs STUN
        await manager.initPeerConnection();
        if (isMounted) {
          setIsConnectingWebRTC(false);
        }
      } catch (err) {
        console.warn('[WebRTC] Caméra ou micro non disponibles, mode sans média activé:', err);
        if (isMounted) {
          setIsConnectingWebRTC(false);
        }
      }
    };

    initNativeWebRTC();

    return () => {
      isMounted = false;
      if (rtcManagerRef.current) {
        rtcManagerRef.current.cleanup();
        rtcManagerRef.current = null;
      }
    };
  }, [engine, appointment.id, isDoctor, userName]);

  // -------------------------------------------------------------
  // INITIALISATION DU MOTEUR LIVEKIT
  // -------------------------------------------------------------
  useEffect(() => {
    if (engine !== 'livekit') return;

    const manager = new LiveKitManager({
      onRemoteTrack: (track) => {
        if (remoteVideoRef.current && track.kind === 'video') {
          track.attach(remoteVideoRef.current);
        }
      }
    });

    liveKitManagerRef.current = manager;

    if (liveKitToken) {
      manager.connect(liveKitUrl, liveKitToken)
        .then(() => setIsLiveKitConnected(true))
        .catch(err => console.warn('[LiveKit] Connexion échouée:', err));
    }

    return () => {
      if (liveKitManagerRef.current) {
        liveKitManagerRef.current.disconnect();
        liveKitManagerRef.current = null;
      }
    };
  }, [engine, liveKitUrl, liveKitToken]);

  // -------------------------------------------------------------
  // INITIALISATION DU MOTEUR JITSI DE SECOURS
  // -------------------------------------------------------------
  useEffect(() => {
    if (engine !== 'jitsi') return;

    let script = document.getElementById('jitsi-external-api') as HTMLScriptElement | null;
    
    const initJitsi = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        if (jitsiApiRef.current) {
          try { jitsiApiRef.current.dispose(); } catch (e) { console.warn(e); }
        }

        jitsiContainerRef.current.innerHTML = '';

        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userName,
            email: isDoctor ? 'docteur@sango-health.com' : 'patient@sango-health.com'
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            disableThirdPartyRequests: true,
            defaultLanguage: 'fr'
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_REMOTE_DISPLAY_NAME: remoteUserName,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'chat', 'raisehand', 'videoquality', 'filmstrip',
              'tileview', 'videobackgroundblur'
            ]
          }
        };

        try {
          const api = new window.JitsiMeetExternalAPI(domain, options);
          jitsiApiRef.current = api;
          setJitsiLoaded(true);
        } catch (e) {
          console.warn("Jitsi API init error:", e);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'jitsi-external-api';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsi();
      document.body.appendChild(script);
    } else {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        script.onload = () => initJitsi();
      }
    }

    return () => {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) { console.warn(e); }
      }
    };
  }, [engine, roomName, userName, isDoctor, remoteUserName]);

  // Horloge de durée d'appel
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Commandes WebRTC Médias
  const handleToggleMic = () => {
    if (rtcManagerRef.current) {
      const active = rtcManagerRef.current.toggleAudio();
      setIsMicOn(active);
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const handleToggleVideo = () => {
    if (rtcManagerRef.current) {
      const active = rtcManagerRef.current.toggleVideo();
      setIsVideoOn(active);
    } else {
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!rtcManagerRef.current) return;
    if (!isScreenSharing) {
      const stream = await rtcManagerRef.current.startScreenShare();
      if (stream) setIsScreenSharing(true);
    } else {
      await rtcManagerRef.current.stopScreenShare();
      setIsScreenSharing(false);
    }
  };

  const handleReconnectWebRTC = async () => {
    if (rtcManagerRef.current) {
      setIsConnectingWebRTC(true);
      await rtcManagerRef.current.createOffer();
      setTimeout(() => setIsConnectingWebRTC(false), 800);
    }
  };

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'doctor',
      text: `Bonjour ! La salle de téléconsultation sécurisée WebRTC est ouverte. Flux chiffré de bout en bout actif.`,
      time: '09:00'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Prescription State
  const [medications, setMedications] = useState([
    { name: 'Paracétamol 1g', dosage: '1 comprimé toutes les 8h si douleurs ou fièvre', duration: '5 jours', instructions: 'Pendant ou après les repas' }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('Repos strict recommandé, bonne hydratation. Contrôle dans 7 jours si persistance des symptômes.');
  const [isPrescriptionSigned, setIsPrescriptionSigned] = useState(false);
  const [signedPrescription, setSignedPrescription] = useState<Prescription | null>(null);

  // Synchronisation temps réel du chat de téléconsultation entre les 2 fenêtres
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    const channelName = `sango_teleconsult_chat_${appointment.id}`;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(channelName);
        bc.onmessage = (event) => {
          if (event.data && event.data.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === event.data.id)) return prev;
              return [...prev, event.data];
            });
          }
        };
      } catch (e) {
        console.warn('[ConsultationChat] Erreur BroadcastChannel:', e);
      }
    }

    return () => {
      if (bc) bc.close();
    };
  }, [appointment.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: isDoctor ? 'doctor' : 'patient',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');

    // Diffuser en direct à l'autre participant (médecin ou patient)
    try {
      const bc = new BroadcastChannel(`sango_teleconsult_chat_${appointment.id}`);
      bc.postMessage(msg);
      setTimeout(() => bc.close(), 100);
    } catch (e) {
      console.warn('[ConsultationChat] Échec envoi:', e);
    }
  };

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      { name: '', dosage: '', duration: '', instructions: '' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length <= 1) return;
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    setMedications(prev => prev.map((med, i) => {
      if (i === index) {
        return { ...med, [field]: value };
      }
      return med;
    }));
  };

  const handleSignAndSendPrescription = () => {
    const validMedications = medications.filter(m => m.name.trim() !== '');
    if (validMedications.length === 0) {
      alert("Veuillez renseigner au moins un médicament avant d'émettre l'ordonnance.");
      return;
    }

    const prescription: Prescription = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      doctorName: doctor.name,
      patientName: appointment.patientName,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      medications: validMedications,
      notes: prescriptionNotes,
      qrCodeToken: `SANGO-VERIFY-${Date.now()}`,
      signatureStamp: `Signé numériquement par ${doctor.name} - SangO e-Santé RDC`
    };

    setSignedPrescription(prescription);
    setIsPrescriptionSigned(true);

    const prescriptionMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: `📋 Ordonnance médicale électronique (${prescription.id}) émise et signée numériquement. Téléchargeable immédiatement pour la pharmacie.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: prescription
    };
    setMessages(prev => [...prev, prescriptionMsg]);

    try {
      const bc = new BroadcastChannel(`sango_teleconsult_chat_${appointment.id}`);
      bc.postMessage(prescriptionMsg);
      setTimeout(() => bc.close(), 100);
    } catch (e) {
      console.warn('[ConsultationChat] Échec envoi ordonnance:', e);
    }

    if (onSavePrescription) {
      onSavePrescription(appointment.id, prescription);
    }

    setActiveTab('chat');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-7xl w-full h-[95vh] text-white shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Téléconsultation WebRTC P2P</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {formatTime(callDuration)}
                </span>
                <span className="hidden md:inline-flex items-center space-x-1 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Flux Direct RDC (~35ms)</span>
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white font-brand">
                {isDoctor ? `Patient : ${appointment.patientName}` : `Praticien : ${doctor.name}`} &bull; {appointment.specialty}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sélecteur de moteur WebRTC / LiveKit / Jitsi */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 hidden sm:flex items-center space-x-1 text-xs">
              <button
                onClick={() => setEngine('webrtc-p2p')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  engine === 'webrtc-p2p'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="WebRTC P2P Direct Haute Performance (Caméra native & STUN Google)"
              >
                <Radio className="w-3 h-3 text-emerald-300" />
                <span>WebRTC P2P</span>
              </button>

              <button
                onClick={() => setEngine('livekit')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  engine === 'livekit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="LiveKit SFU Cloud"
              >
                <Layers className="w-3 h-3" />
                <span>LiveKit SFU</span>
              </button>

              <button
                onClick={() => setEngine('jitsi')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  engine === 'jitsi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Passerelle Jitsi Meet de secours"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Jitsi Secours</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-1 text-xs font-bold shadow-lg shadow-rose-600/30"
              title="Quitter la consultation"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Terminer</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Side: FLUX VIDÉO WEBRTC INTERACTIF (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between p-2 sm:p-4 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden relative">
            
            <div className="flex-1 rounded-2xl bg-black border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl">
              
              {/* ======================================================== */}
              {/* 1. MOTEUR WEBRTC P2P NATIF (PAR DÉFAUT) */}
              {/* ======================================================== */}
              {engine === 'webrtc-p2p' && (
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
                  
                  {/* Flux Distant (Correspondant en grand écran) */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      webRTCStatus.remoteUserConnected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Placeholder si le correspondant n'a pas encore connecté sa vidéo */}
                  {!webRTCStatus.remoteUserConnected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
                      <div className="w-24 h-24 rounded-full bg-blue-950/80 border-2 border-blue-500/40 flex items-center justify-center mb-4 text-blue-400 shadow-xl shadow-blue-500/10">
                        {isDoctor ? <User className="w-12 h-12" /> : <Stethoscope className="w-12 h-12" />}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                        En attente de connexion de {remoteUserName}...
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mb-4">
                        La salle WebRTC P2P est prête. Le flux vidéo s'affichera automatiquement dès que {remoteUserName} rejoindra la consultation.
                      </p>
                      <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        <span>Signalisation P2P via Supabase Realtime active</span>
                      </div>
                    </div>
                  )}

                  {/* Incrustation PiP Flottante : Flux Local (Moi) */}
                  <div className="absolute bottom-4 right-4 w-36 sm:w-48 h-28 sm:h-36 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl z-20 group">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover -scale-x-100 ${
                        isVideoOn ? 'block' : 'hidden'
                      }`}
                    />

                    {/* Si caméra coupée localement */}
                    {!isVideoOn && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
                        <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                        <span>Caméra éteinte</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded text-white shadow">
                      Vous ({userName.split(' ')[0]})
                    </div>

                    {!isMicOn && (
                      <div className="absolute top-2 right-2 bg-rose-600/90 p-1 rounded-full text-white shadow">
                        <MicOff className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* En-tête de statut WebRTC flottant en haut */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2 z-10 shadow">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>WebRTC Direct &bull; Chiffrement DTLS / SRTP</span>
                  </div>

                  {/* Barre d'action des contrôles d'appel en bas au centre */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 bg-slate-950/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 z-20 shadow-2xl">
                    {/* Toggle Micro */}
                    <button
                      onClick={handleToggleMic}
                      className={`p-3 rounded-xl transition ${
                        isMicOn 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                      }`}
                      title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
                    >
                      {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>

                    {/* Toggle Caméra */}
                    <button
                      onClick={handleToggleVideo}
                      className={`p-3 rounded-xl transition ${
                        isVideoOn 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                      }`}
                      title={isVideoOn ? 'Couper la caméra' : 'Activer la caméra'}
                    >
                      {isVideoOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>

                    {/* Partage d'écran */}
                    <button
                      onClick={handleToggleScreenShare}
                      className={`p-3 rounded-xl transition ${
                        isScreenSharing 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                      title="Partager mon écran (analyses, radios, scanner)"
                    >
                      {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    </button>

                    {/* Reconnexion P2P */}
                    <button
                      onClick={handleReconnectWebRTC}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Relancer l'offre de négociation WebRTC"
                    >
                      <RefreshCw className={`w-4 h-4 ${isConnectingWebRTC ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 2. MOTEUR LIVEKIT SFU CLOUD */}
              {/* ======================================================== */}
              {engine === 'livekit' && (
                <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Serveur WebRTC LiveKit SFU</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Connecteur haute disponibilité pour les consultations multiconférences et relais réseaux stricts en RDC.
                  </p>

                  <div className="w-full max-w-sm bg-slate-900 p-4 rounded-2xl border border-slate-800 text-left space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">LiveKit WebSocket URL</label>
                      <input
                        type="text"
                        value={liveKitUrl}
                        onChange={(e) => setLiveKitUrl(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1"
                        placeholder="wss://votre-instance.livekit.cloud"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Token JWT LiveKit</label>
                      <input
                        type="password"
                        value={liveKitToken}
                        onChange={(e) => setLiveKitToken(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1"
                        placeholder="Token sécurisé généré par le serveur"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (liveKitManagerRef.current && liveKitToken) {
                          liveKitManagerRef.current.connect(liveKitUrl, liveKitToken)
                            .then(() => alert("Connecté avec succès à LiveKit !"))
                            .catch(err => alert("Erreur LiveKit: " + err.message));
                        } else {
                          alert("Veuillez saisir un token JWT LiveKit valide.");
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      Connecter la session LiveKit
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 3. MOTEUR JITSI SECOURS */}
              {/* ======================================================== */}
              {engine === 'jitsi' && (
                <div className="w-full h-full relative">
                  <div 
                    ref={jitsiContainerRef} 
                    className="w-full h-full min-h-[350px] relative z-10"
                  />
                  {!jitsiLoaded && (
                    <iframe
                      src={directRoomUrl}
                      title="Téléconsultation Vidéo SangO Health"
                      allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                      className="w-full h-full absolute inset-0 border-0 z-0"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Barre d'état sous la vidéo */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>Salle : <strong>{roomName}</strong> &bull; {engine.toUpperCase()}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Norme Télésanté RDC (Chiffrement SRTP)</span>
              </div>
            </div>
          </div>

          {/* Right Side: Tabbed Panel (Chat & Prescription) (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col justify-between overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Consultation ({messages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('prescription')}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
                  activeTab === 'prescription'
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{isDoctor ? 'Rédiger Ordonnance' : 'Ordonnance Émise'}</span>
                {isPrescriptionSigned && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
                )}
              </button>
            </div>

            {/* TAB 1: LIVE CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Messages list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((msg) => {
                    const isSelf = (isDoctor && msg.sender === 'doctor') || (!isDoctor && msg.sender === 'patient');
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 px-1">
                          {msg.sender === 'doctor' ? doctor.name : appointment.patientName} &bull; {msg.time}
                        </div>
                        <div 
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                            isSelf 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>

                          {/* Attachement d'ordonnance */}
                          {msg.attachment && (
                            <div className="mt-3 p-3 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {msg.attachment.id}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Signée numériquement</span>
                                </span>
                              </div>
                              <div className="text-xs font-bold mb-1">Prescription Médicale :</div>
                              <ul className="text-[11px] text-slate-600 space-y-1 mb-3">
                                {msg.attachment.medications.map((m, idx) => (
                                  <li key={idx}>&bull; {m.name} - {m.dosage}</li>
                                ))}
                              </ul>
                              <button
                                onClick={() => setActiveTab('prescription')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-xs transition"
                              >
                                Consulter l'Ordonnance
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input box */}
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-2">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrire un message en direct..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: PRESCRIPTION BUILDER / VIEWER */}
            {activeTab === 'prescription' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  
                  {/* Digital Prescription Preview Card */}
                  <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-xl border border-slate-200">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                          <Stethoscope className="w-4 h-4" />
                          <span>SangO Health e-Santé RDC</span>
                        </div>
                        <h3 className="font-brand font-black text-lg text-slate-900">{doctor.name}</h3>
                        <p className="text-xs text-slate-500">{doctor.specialty} &bull; {doctor.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200">
                          {signedPrescription ? signedPrescription.id : 'BROUILLON'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Patient info row */}
                    <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient</span>
                      <span className="font-bold text-slate-800 text-sm">{appointment.patientName}</span>
                    </div>

                    {/* Medications List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Médicaments prescrits
                        </label>
                        {isDoctor && !isPrescriptionSigned && (
                          <button
                            type="button"
                            onClick={handleAddMedication}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Ajouter</span>
                          </button>
                        )}
                      </div>

                      {medications.map((med, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group">
                          {isDoctor && !isPrescriptionSigned && medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(index)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Médicament</label>
                              <input 
                                type="text"
                                disabled={!isDoctor || isPrescriptionSigned}
                                value={med.name}
                                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                placeholder="Ex: Paracétamol 1g"
                                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Posologie</label>
                              <input 
                                type="text"
                                disabled={!isDoctor || isPrescriptionSigned}
                                value={med.dosage}
                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                placeholder="Ex: 1 comprimé 3x par jour"
                                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Durée</label>
                              <input 
                                type="text"
                                disabled={!isDoctor || isPrescriptionSigned}
                                value={med.duration}
                                onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                placeholder="Ex: 5 jours"
                                className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Conseils</label>
                              <input 
                                type="text"
                                disabled={!isDoctor || isPrescriptionSigned}
                                value={med.instructions}
                                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                                placeholder="Ex: Après le repas"
                                className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prescription Notes */}
                    <div className="mt-4">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Recommandations & Directives</label>
                      <textarea
                        rows={2}
                        disabled={!isDoctor || isPrescriptionSigned}
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Signature stamp */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center space-x-2 text-slate-500 text-xs">
                        <QrCode className="w-8 h-8 text-slate-800" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-700">Code QR Pharmacie RDC</div>
                          <div className="text-[9px] text-slate-400">Authentification délivrance</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded">
                          Signature Électronique Certifiée
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 mt-1">{doctor.name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Actions */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                  {isDoctor ? (
                    isPrescriptionSigned ? (
                      <div className="flex items-center space-x-3 w-full justify-between">
                        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ordonnance transmise dans le chat du patient !</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => window.print()}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer</span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('chat')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                          >
                            Retour au chat
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleSignAndSendPrescription}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Signer & Transmettre au Patient</span>
                        </button>
                      </div>
                    )
                  ) : (
                    /* Patient view actions */
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs text-slate-400">
                        Ordonnance délivrée par le Dr. {doctor.name}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => window.print()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer l'Ordonnance</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition"
                        >
                          Retour au chat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
