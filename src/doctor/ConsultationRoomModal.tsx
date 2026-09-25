import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { Appointment, Doctor, Prescription } from '../types';

interface ConsultationRoomModalProps {
  appointment: Appointment;
  doctor: Doctor;
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

export default function ConsultationRoomModal({ 
  appointment, 
  doctor, 
  onClose,
  onSavePrescription 
}: ConsultationRoomModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'prescription'>('chat');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'patient',
      text: "Bonjour Docteur, merci de me recevoir. J'ai de la fièvre depuis 2 jours et des maux de tête persistants.",
      time: "10:02"
    },
    {
      id: '2',
      sender: 'doctor',
      text: "Bonjour. Je vous entends très bien. Avez-vous mesuré votre température ce matin ?",
      time: "10:03"
    },
    {
      id: '3',
      sender: 'patient',
      text: "Oui, j'avais 38.6°C ce matin au réveil.",
      time: "10:04"
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
  const [prescriptionNotes, setPrescriptionNotes] = useState("Repos recommandé pendant 48h. Bien s'hydrater. Recontacter si la fièvre persiste au-delà de 72h.");
  const [isPrescriptionSigned, setIsPrescriptionSigned] = useState(!!appointment.prescription);
  const [signedPrescription, setSignedPrescription] = useState<Prescription | null>(appointment.prescription || null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'doctor',
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

    // Also push a chat message with the attachment
    const prescriptionMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: `📋 J'ai généré votre ordonnance médicale électronique (${prescription.id}). Vous pouvez la télécharger et la présenter en pharmacie.`,
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-6xl w-full h-[92vh] text-white shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Téléconsultation Sécurisée</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono font-medium">AES-256</span>
              </div>
              <h2 className="text-lg font-black text-white font-brand">{appointment.patientName} &bull; {doctor.name}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conforme Ordre des Médecins RDC</span>
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
          
          {/* Left Side: Video Call Stream (7 columns on desktop) */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden relative">
            
            {/* Patient Video Display Area */}
            <div className="flex-1 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 relative overflow-hidden flex items-center justify-center p-6 shadow-inner">
              
              {/* Patient Avatar & Indicator */}
              <div className="text-center z-10">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600/20 border-2 border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-lg">
                  {appointment.patientName.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-white font-brand">{appointment.patientName}</h3>
                <p className="text-xs text-blue-400 font-semibold mt-1">Patient en direct &bull; Flux chiffré HD</p>
                <div className="mt-3 inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Audio & Vidéo connectés</span>
                </div>
              </div>

              {/* Doctor Pip Picture-in-Picture */}
              <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-36 sm:h-28 bg-slate-800 rounded-2xl border-2 border-blue-500/60 overflow-hidden shadow-2xl">
                {isVideoOn ? (
                  <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-bold">
                    Caméra éteinte
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded-md font-semibold">
                  Vous (Médecin)
                </div>
              </div>

              {/* Consultation Details Floating Badge */}
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-3 py-2 rounded-xl text-xs space-y-0.5">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Motif du RDV</div>
                <div className="text-white font-bold">{appointment.specialty} &bull; Téléconsultation</div>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="mt-4 flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl">
              <div className="text-xs font-mono font-bold text-slate-400">
                00:14:32
              </div>

              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-xl transition ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
                  title={isMicOn ? "Couper le micro" : "Activer le micro"}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button 
                  onClick={() => setIsVideoOn(!isVideoOn)}
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
                {activeTab === 'chat' ? 'Générer Ordonnance' : 'Retour au Chat'}
              </button>
            </div>
          </div>

          {/* Right Side: Chat & Prescription Generator (5 columns) */}
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
                <span>Ordonnance Médicale {isPrescriptionSigned && "✓"}</span>
              </button>
            </div>

            {/* Tab 1: Chat with Patient */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 px-1">
                        {msg.sender === 'doctor' ? `Vous (${doctor.name})` : appointment.patientName} &bull; {msg.time}
                      </div>

                      <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        msg.sender === 'doctor' 
                          ? 'bg-blue-600 text-white rounded-tr-xs' 
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                      }`}>
                        {msg.text}

                        {/* If Message contains an attached prescription */}
                        {msg.attachment && (
                          <div className="mt-3 bg-white text-slate-900 p-3.5 rounded-xl border border-blue-200 shadow-md">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-bold text-xs text-blue-900 font-brand">Ordonnance Médicale #{msg.attachment.id}</span>
                              </div>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Sécurisée
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
                                <span>Code QR Pharmacie</span>
                              </span>
                              <button 
                                onClick={() => setActiveTab('prescription')}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                              >
                                Visualiser le PDF &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Action Footer */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('prescription')}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Rédiger une Ordonnance pour {appointment.patientName}</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input 
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Écrivez un message au patient..."
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

            {/* Tab 2: Interactive Prescription Builder & Digital Signing */}
            {activeTab === 'prescription' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Digital Document Header Preview */}
                  <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Cabinet Médical SangO Health</div>
                        <h4 className="text-base font-black text-slate-900 font-brand">{doctor.name}</h4>
                        <p className="text-[11px] text-slate-500">{doctor.specialty} &bull; {doctor.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                          {signedPrescription?.id || `ORD-REF-${Date.now().toString().slice(-4)}`}
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
                        Type : <span className="font-semibold text-slate-700">Téléconsultation</span>
                      </div>
                    </div>

                    {/* Medications List */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Médicaments et posologies</span>
                        {!isPrescriptionSigned && (
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
                          {!isPrescriptionSigned && (
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
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Médicament / Dosage</label>
                              <input 
                                type="text"
                                disabled={isPrescriptionSigned}
                                value={med.name}
                                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                placeholder="Ex: Amoxicilline 500mg"
                                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Fréquence / Prise</label>
                              <input 
                                type="text"
                                disabled={isPrescriptionSigned}
                                value={med.dosage}
                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                placeholder="Ex: 1 comprimé 3x par jour"
                                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Durée</label>
                              <input 
                                type="text"
                                disabled={isPrescriptionSigned}
                                value={med.duration}
                                onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                placeholder="Ex: 7 jours"
                                className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Conseils d'utilisation</label>
                              <input 
                                type="text"
                                disabled={isPrescriptionSigned}
                                value={med.instructions}
                                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                                placeholder="Ex: Pendant les repas"
                                className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prescription Notes */}
                    <div className="mt-4">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Recommandations & Directives cliniques</label>
                      <textarea
                        rows={2}
                        disabled={isPrescriptionSigned}
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Digital Signature & Verification Box */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center space-x-2 text-slate-500 text-xs">
                        <QrCode className="w-8 h-8 text-slate-800" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-700">Vérification QR SangO Health</div>
                          <div className="text-[9px] text-slate-400">Authentification délivrance pharmacie</div>
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

                {/* Prescription Bottom Action Footer */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                  {isPrescriptionSigned ? (
                    <div className="flex items-center space-x-3 w-full justify-between">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ordonnance transmise dans le chat et dans l'espace patient !</span>
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
