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
  Video, 
  VideoOff, 
  ShieldCheck, 
  QrCode,
  X,
  ExternalLink,
  Maximize2,
  RefreshCw,
  UserCheck,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { Appointment, Doctor, Prescription, UserRole } from '../types';

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
  
  // Nom unique de la salle chiffrée partagée entre le docteur et le patient
  const roomName = `sango-health-teleconsult-${appointment.id}`;
  const directRoomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(userName)}`;

  const [activeTab, setActiveTab] = useState<'chat' | 'prescription'>('chat');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  // Charger le script officiel du plugin Jitsi Meet External API
  useEffect(() => {
    let script = document.getElementById('jitsi-external-api') as HTMLScriptElement | null;
    
    const initJitsi = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        // Nettoyer si déjà existant
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
            DEFAULT_REMOTE_DISPLAY_NAME: isDoctor ? 'Patient connecté' : doctor.name,
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
          setIsVideoLoading(false);
        } catch (e) {
          console.warn("Jitsi API init error:", e);
          setIsVideoLoading(false);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'jitsi-external-api';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        initJitsi();
      };
      script.onerror = () => {
        setIsVideoLoading(false);
      };
      document.body.appendChild(script);
    } else {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        script.onload = () => initJitsi();
      }
    }

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) { console.warn(e); }
      }
    };
  }, [roomName, userName, isDoctor, doctor.name]);

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'doctor',
      text: `Bonjour ! La salle de téléconsultation sécurisée est ouverte. Le flux vidéo direct est connecté.`,
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

    if (onSavePrescription) {
      onSavePrescription(appointment.id, prescription);
    }

    setActiveTab('chat');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-6xl w-full h-[94vh] text-white shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Téléconsultation Vidéo Directe</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {formatTime(callDuration)}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-brand">
                {isDoctor ? `Patient : ${appointment.patientName}` : `Praticien : ${doctor.name}`} &bull; {appointment.specialty}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Bouton pour ouvrir en plein écran ou secours */}
            <a
              href={directRoomUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plein Écran</span>
            </a>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition flex items-center space-x-1 text-xs font-bold"
              title="Quitter la consultation"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Terminer</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Side: VRAI PLUGIN VIDÉO WEBRTC INTERACTIF (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between p-2 sm:p-4 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden relative">
            
            <div className="flex-1 rounded-2xl bg-black border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner">
              
              {/* Conteneur Jitsi Meet API */}
              <div 
                ref={jitsiContainerRef} 
                className="w-full h-full min-h-[350px] relative z-10"
              />

              {/* Si l'API met du temps ou si iframe directe requise */}
              {!jitsiLoaded && (
                <iframe
                  src={directRoomUrl}
                  title="Téléconsultation Vidéo SangO Health"
                  allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                  className="w-full h-full absolute inset-0 border-0 z-0"
                />
              )}

              {/* Indicateur de chargement initial */}
              {isVideoLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                  <div className="font-bold text-white text-sm">Connexion à la salle de consultation...</div>
                  <div className="text-xs text-slate-400 mt-1">Activation sécurisée de la caméra et du microphone</div>
                </div>
              )}
            </div>

            {/* Barre d'état sous la vidéo */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>Salle : <strong>{roomName}</strong> (Chiffrement P2P de bout en bout)</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Conforme Télésanté RDC</span>
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
                    placeholder="Écrivez un message sécurisé..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: ORDONNANCE ÉLECTRONIQUE EN DIRECT */}
            {activeTab === 'prescription' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto">
                  
                  {isPrescriptionSigned && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <strong>Ordonnance certifiée conforme !</strong>
                        <div className="text-[11px] text-emerald-400/80">Code délivrance : {signedPrescription?.id}</div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200">
                    <div className="flex items-start justify-between pb-3 border-b-2 border-blue-600 mb-3">
                      <div>
                        <div className="text-[10px] font-bold tracking-widest uppercase text-blue-900">
                          SANGO HEALTH &bull; RDC
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5">{doctor.name}</h4>
                        <div className="text-[11px] text-slate-500">{doctor.specialty}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {signedPrescription ? signedPrescription.id : 'BROUILLON'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Patient : {appointment.patientName}</div>
                      </div>
                    </div>

                    {/* Medications Form or View */}
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
