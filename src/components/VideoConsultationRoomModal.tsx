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
  Camera,
  RefreshCw,
  UserCheck
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

export default function VideoConsultationRoomModal({ 
  appointment, 
  doctor, 
  userRole,
  onClose,
  onSavePrescription 
}: VideoConsultationRoomModalProps) {
  const isDoctor = userRole === 'doctor';
  const [activeTab, setActiveTab] = useState<'chat' | 'prescription'>('chat');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'simulated'>('prompt');
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC / Camera Stream Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Setup Webcam using standard navigator.mediaDevices.getUserMedia
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraPermission('granted');
      } else {
        setCameraPermission('simulated');
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable, falling back to simulated high-definition feed:", err);
      setCameraPermission('simulated');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, []);

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Toggle Video Track
  const handleToggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
    setIsVideoOn(!isVideoOn);
  };

  // Toggle Mic Track
  const handleToggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
      }
    }
    setIsMicOn(!isMicOn);
  };

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'patient',
      text: `Bonjour Docteur ${doctor.name}, je suis bien connecté à la téléconsultation.`,
      time: "10:02"
    },
    {
      id: '2',
      sender: 'doctor',
      text: `Bonjour ${appointment.patientName}. Je vous vois et vous entends parfaitement. Comment vous sentez-vous ?`,
      time: "10:03"
    }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Prescription builder state
  const [medications, setMedications] = useState<Array<{ name: string; dosage: string; duration: string; instructions: string }>>([
    {
      name: "Paracétamol 1g",
      dosage: "1 comprimé 3 fois par jour",
      duration: "5 jours",
      instructions: "En cas de fièvre ou de douleur, espacer de 6h"
    },
    {
      name: "Vitamine C 1000mg",
      dosage: "1 comprimé effervescent le matin",
      duration: "10 jours",
      instructions: "Prendre pendant le petit déjeuner"
    }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("Repos recommandé pendant 48h. Bien s'hydrater. Recontacter si les symptômes persistent au-delà de 72h.");
  const [isPrescriptionSigned, setIsPrescriptionSigned] = useState(!!appointment.prescription);
  const [signedPrescription, setSignedPrescription] = useState<Prescription | null>(appointment.prescription || null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: isDoctor ? 'doctor' : 'patient',
      text: newMessageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessageText('');
  };

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      { name: '', dosage: '', duration: '', instructions: '' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    setMedications(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-6xl w-full h-[92vh] text-white shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Téléconsultation SangO HD en direct
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {cameraPermission === 'granted' ? 'Webcam Réelle Connectée' : 'Flux Simulé HD'}
                </span>
              </div>
              <h2 className="text-lg font-black text-white font-brand">
                {isDoctor ? `Patient : ${appointment.patientName}` : `Praticien : ${doctor.name}`} &bull; {appointment.specialty}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Vous êtes connecté en tant que : <strong className="text-white">{isDoctor ? doctor.name : appointment.patientName}</strong></span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Fermer la consultation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Side: Video Call Stream (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden relative">
            
            {/* Main Remote / Interlocutor Feed Area */}
            <div className="flex-1 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 relative overflow-hidden flex items-center justify-center p-6 shadow-inner">
              
              {/* If viewing as Patient -> Main screen is Doctor */}
              {!isDoctor ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img 
                    src={doctor.image} 
                    alt={doctor.name} 
                    className="w-full h-full object-cover rounded-xl filter brightness-95" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none rounded-xl"></div>
                  
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-white">{doctor.name} (Praticien)</span>
                  </div>

                  <div className="absolute bottom-4 left-4 text-xs text-slate-300">
                    <div className="font-bold text-white">{doctor.specialty}</div>
                    <div className="text-[11px] text-slate-400">{doctor.address}</div>
                  </div>
                </div>
              ) : (
                /* If viewing as Doctor -> Main screen is Patient */
                <div className="text-center z-10">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600/20 border-2 border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-lg">
                    {appointment.patientName.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-white font-brand">{appointment.patientName}</h3>
                  <p className="text-xs text-blue-400 font-semibold mt-1">Patient connecté &bull; Flux chiffré HD</p>
                  <div className="mt-3 inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Audio & Vidéo connectés</span>
                  </div>
                </div>
              )}

              {/* PiP (Picture in Picture): Local User Feed (Webcam or mirrored selfie) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-40 sm:h-30 bg-slate-800 rounded-2xl border-2 border-blue-500/70 overflow-hidden shadow-2xl z-20">
                {isVideoOn ? (
                  cameraPermission === 'granted' ? (
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-2 text-center">
                      <Camera className="w-6 h-6 text-blue-400 mb-1" />
                      <span className="text-[10px] text-slate-300 font-semibold leading-tight">
                        Votre Caméra (Miroir)
                      </span>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-bold">
                    Caméra coupée
                  </div>
                )}
                
                <div className="absolute bottom-1.5 left-2 bg-black/75 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded-md font-semibold">
                  Vous ({isDoctor ? 'Médecin' : 'Patient'})
                </div>
              </div>

              {/* Toggle camera source hint */}
              {cameraPermission !== 'granted' && (
                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] flex items-center space-x-2">
                  <button 
                    onClick={startCamera}
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Activer ma webcam réelle</span>
                  </button>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="mt-4 flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl">
              <div className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>REC {formatTime(callDuration)}</span>
              </div>

              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleToggleMic}
                  className={`p-3 rounded-xl transition ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
                  title={isMicOn ? "Couper le micro" : "Activer le micro"}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button 
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-xl transition ${isVideoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
                  title={isVideoOn ? "Couper la caméra" : "Activer la caméra"}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button 
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-red-600/30 transition"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Terminer l'Appel</span>
                </button>
              </div>

              <button 
                onClick={() => setActiveTab(activeTab === 'chat' ? 'prescription' : 'chat')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
              >
                {activeTab === 'chat' 
                  ? (isDoctor ? 'Rédiger Ordonnance' : 'Consulter Ordonnance') 
                  : 'Retour au Chat'
                }
              </button>
            </div>
          </div>

          {/* Right Side: Chat & Prescription Generator (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col h-full overflow-hidden">
            
            {/* Tab Selector */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-bold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition ${
                  activeTab === 'chat' 
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discussion en direct ({messages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('prescription')}
                className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition ${
                  activeTab === 'prescription' 
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Ordonnance {isPrescriptionSigned && "✓"}</span>
              </button>
            </div>

            {/* TAB 1: Chat Stream */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMyMessage = (isDoctor && msg.sender === 'doctor') || (!isDoctor && msg.sender === 'patient');
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 px-1">
                          {msg.sender === 'doctor' ? `Dr. ${doctor.name}` : appointment.patientName} &bull; {msg.time}
                        </div>

                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          isMyMessage 
                            ? 'bg-blue-600 text-white rounded-tr-xs' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                        }`}>
                          {msg.text}

                          {/* Embedded Prescription Card */}
                          {msg.attachment && (
                            <div className="mt-3 bg-white text-slate-900 p-3.5 rounded-xl border border-blue-200 shadow-md">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="font-bold text-xs text-blue-900 font-brand">Ordonnance Médicale #{msg.attachment.id}</span>
                                </div>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                  Authentifiée
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 mb-2">
                                Prescrit par <span className="font-semibold text-slate-800">{msg.attachment.doctorName}</span> pour <span className="font-semibold text-slate-800">{msg.attachment.patientName}</span>
                              </div>

                              <div className="bg-slate-50 p-2 rounded-lg text-[11px] font-mono mb-2 border border-slate-100">
                                {msg.attachment.medications.map((m, idx) => (
                                  <div key={idx} className="truncate">
                                    &bull; {m.name} ({m.dosage} - {m.duration})
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>QR Pharmacie</span>
                                </span>
                                <button 
                                  onClick={() => setActiveTab('prescription')}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                                >
                                  Visualiser & Imprimer &rarr;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Action Footer */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2">
                  {isDoctor && (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setActiveTab('prescription')}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Rédiger une Ordonnance pour {appointment.patientName}</span>
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input 
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={isDoctor ? "Écrivez un message au patient..." : "Posez une question au médecin..."}
                      className="flex-1 bg-slate-800/90 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: Prescription Builder (Doctor) or Prescription View (Patient) */}
            {activeTab === 'prescription' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Cabinet Médical SangO Health</div>
                        <h4 className="text-base font-black text-slate-900 font-brand">{doctor.name}</h4>
                        <p className="text-[11px] text-slate-500">{doctor.specialty} &bull; {doctor.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                          {signedPrescription?.id || `ORD-${Date.now().toString().slice(-4)}`}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Date : {new Date().toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    <div className="py-2 border-b border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">Patient(e) :</span> <span className="font-bold text-slate-900">{appointment.patientName}</span>
                      </div>
                      <div className="text-slate-500">
                        Type : <span className="font-semibold text-slate-700">Téléconsultation en direct</span>
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Médicaments et posologies</span>
                        {isDoctor && !isPrescriptionSigned && (
                          <button
                            onClick={handleAddMedication}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Ajouter molécule</span>
                          </button>
                        )}
                      </div>

                      {medications.map((med, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group">
                          {isDoctor && !isPrescriptionSigned && (
                            <button
                              onClick={() => handleRemoveMedication(index)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 pr-6">
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
