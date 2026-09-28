import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  AlertCircle,
  PlusCircle,
  FileText,
  Printer,
  X,
  Upload,
  FolderOpen,
  Heart,
  MessageSquare,
  CreditCard,
  Send,
  Activity,
  User,
  Pill,
  Thermometer,
  TrendingUp,
  ChevronRight,
  Building2,
  Phone,
  Bell,
  ShieldCheck,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  Stethoscope,
  BarChart3
} from 'lucide-react';
import { Appointment, Doctor, Prescription, MedicalDocument } from '../types';
import VideoConsultationRoomModal from '../components/VideoConsultationRoomModal';
import { useLanguage } from '../context/LanguageContext';

interface PatientDashboardProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onCancel: (id: number) => void;
  onNewBooking: () => void;
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
}

type TabId = 'overview' | 'appointments' | 'medical_records' | 'prescriptions' | 'messages' | 'billing' | 'teleconsult' | 'vitals' | 'profile';

interface VitalSign {
  label: string;
  value: string;
  unit: string;
  date: string;
  status: 'normal' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface Message {
  id: number;
  sender: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  avatar: string;
}

interface Invoice {
  id: string;
  description: string;
  amount: string;
  status: 'Payée' | 'En attente' | 'Remboursée';
  date: string;
  category: string;
}

// Aucun faux dossier : uniquement les données réelles du patient
const INITIAL_DOCUMENTS: MedicalDocument[] = [];
const INITIAL_MESSAGES: Message[] = [];
const INITIAL_INVOICES: Invoice[] = [];

const invoiceStatusStyle = (s: Invoice['status']) =>
  s === 'Payée' ? 'bg-emerald-100 text-emerald-700' : s === 'Remboursée' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';

export default function PatientDashboard({ appointments, doctors, onCancel, onNewBooking, onSavePrescription }: PatientDashboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [activeVideoCallApp, setActiveVideoCallApp] = useState<Appointment | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [documents, setDocuments] = useState<MedicalDocument[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sango_patient_docs');
      if (saved) { try { return JSON.parse(saved); } catch { /* noop */ } }
    }
    return INITIAL_DOCUMENTS;
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<MedicalDocument | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<MedicalDocument['category']>('Biologie & Analyses');
  const [docFacility, setDocFacility] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docNotes, setDocNotes] = useState('');
  const [docShare, setDocShare] = useState(true);
  const [docFilePreview, setDocFilePreview] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState('');
  const [isAddVitalOpen, setIsAddVitalOpen] = useState(false);
  const [localVitals, setLocalVitals] = useState<{ label: string; value: string; unit: string; date: string; status: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sango_patient_vitals');
      if (saved) { try { return JSON.parse(saved); } catch { /* noop */ } }
    }
    return [];
  });
  const [newVital, setNewVital] = useState({ label: '', value: '', unit: '', date: new Date().toISOString().split('T')[0] });

  const baseVitals: { label: string; value: string; unit: string; date: string; status: string }[] = [];

  const allVitals = [...baseVitals, ...localVitals];
  const upcoming = appointments.filter(a => a.status === 'Confirmé');
  const past = appointments.filter(a => a.status === 'Annulé' || a.status === 'Terminé');
  const prescriptionApps = appointments.filter(a => !!a.prescription);
  const videoApps = upcoming.filter(a => a.type.includes('Vidéo'));
  const unreadCount = messages.filter(m => !m.isRead).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFileName(file.name);
    if (!docTitle) setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onloadend = () => setDocFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    const doc: MedicalDocument = {
      id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: docTitle.trim(), category: docCategory, date: docDate,
      facility: docFacility.trim() || 'Centre Médical Kinshasa',
      fileType: docFileName.endsWith('.pdf') ? 'pdf' : 'image',
      fileUrl: docFilePreview || undefined, fileSize: "2.1 Mo",
      notes: docNotes.trim(), isSharedWithDoctor: docShare,
      uploadedAt: new Date().toLocaleDateString('fr-FR')
    };
    const updated = [doc, ...documents];
    setDocuments(updated);
    localStorage.setItem('sango_patient_docs', JSON.stringify(updated));
    setDocTitle(''); setDocNotes(''); setDocFilePreview(null); setDocFileName('');
    setIsUploadOpen(false);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem('sango_patient_docs', JSON.stringify(updated));
    if (viewingDoc?.id === id) setViewingDoc(null);
  };

  const handleDownloadPrescription = (pres: Prescription) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ordonnance ${pres.id}</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;color:#1e293b;}
    .brand{color:#2563eb;font-size:22px;font-weight:900;border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;}
    .stamp{border:2px dashed #059669;padding:10px;color:#059669;font-weight:bold;border-radius:8px;margin-top:20px;}</style></head><body>
    <div class="brand">SangO Health — Ordonnance Médicale</div>
    <p><b>Réf :</b> ${pres.id} | <b>Date :</b> ${pres.date}</p>
    <p><b>Praticien :</b> ${pres.doctorName}</p><p><b>Patient :</b> ${pres.patientName}</p>
    <h3>Médicaments :</h3><ul>${pres.medications.map(m => `<li><b>${m.name}</b> — ${m.dosage} — ${m.duration}</li>`).join('')}</ul>
    ${pres.notes ? `<p><b>Note :</b> ${pres.notes}</p>` : ''}
    <div class="stamp">Validée électroniquement par ${pres.doctorName}</div>
    <script>window.print();</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Ordonnance-SangoHealth-${pres.id}.html`; a.click(); URL.revokeObjectURL(url);
  };

  const handleExportHealthBooklet = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carnet Médical SangO Health</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1e293b;}
    .brand{color:#2563eb;font-size:28px;font-weight:900;}.section{margin:24px 0;border-top:1px solid #e2e8f0;padding-top:16px;}
    table{width:100%;border-collapse:collapse;}th,td{text-align:left;padding:8px;border-bottom:1px solid #e2e8f0;}th{background:#f1f5f9;font-size:11px;}</style></head><body>
    <div class="brand">SangO Health</div><p>Carnet Médical Numérique — Exporté le ${new Date().toLocaleDateString('fr-FR')}</p>
    <div class="section"><h2>Constantes Vitales</h2><table><tr><th>Paramètre</th><th>Valeur</th><th>Unité</th><th>Date</th></tr>
    ${allVitals.map(v => `<tr><td>${v.label}</td><td>${v.value}</td><td>${v.unit}</td><td>${v.date}</td></tr>`).join('')}</table></div>
    <div class="section"><h2>Rendez-vous (${appointments.length})</h2><table><tr><th>Médecin</th><th>Spécialité</th><th>Date</th><th>Statut</th></tr>
    ${appointments.map(a => `<tr><td>${a.doctorName}</td><td>${a.specialty}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('')}</table></div>
    <div class="section"><h2>Documents (${documents.length})</h2><table><tr><th>Titre</th><th>Catégorie</th><th>Établissement</th><th>Date</th></tr>
    ${documents.map(d => `<tr><td>${d.title}</td><td>${d.category}</td><td>${d.facility}</td><td>${d.date}</td></tr>`).join('')}</table></div>
    <script>window.print();</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'CarnetSante-SangoHealth.html'; a.click(); URL.revokeObjectURL(url);
  };

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVital.label || !newVital.value) return;
    setLocalVitals(prev => [...prev, { ...newVital, status: 'normal' }]);
    setNewVital({ label: '', value: '', unit: '', date: new Date().toISOString().split('T')[0] });
    setIsAddVitalOpen(false);
  };

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Tableau de bord' },
    { id: 'appointments', label: 'Rendez-vous', badge: upcoming.length },
    { id: 'teleconsult', label: 'Téléconsultation', badge: videoApps.length },
    { id: 'medical_records', label: 'Dossier Médical' },
    { id: 'vitals', label: 'Constantes' },
    { id: 'prescriptions', label: 'Ordonnances', badge: prescriptionApps.length },
    { id: 'messages', label: 'Messagerie', badge: unreadCount },
    { id: 'billing', label: 'Facturation' },
    { id: 'profile', label: 'Mon Profil' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Espace Patient · Gratuit</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Kinshasa · Dossier Médical Sécurisé</span>
          </div>
          <h1 className="font-brand text-3xl font-black text-slate-900 tracking-tight">Mon Espace Santé</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Gérez vos rendez-vous, dossiers, ordonnances et consultations vidéo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleExportHealthBooklet} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-2xl shadow-sm transition flex items-center space-x-2 text-xs">
            <Printer className="w-4 h-4 text-blue-600" /><span>Exporter Carnet</span>
          </button>
          <button onClick={onNewBooking} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center space-x-2 text-xs">
            <PlusCircle className="w-4 h-4" /><span>Nouveau Rendez-vous</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-1 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 transition-all relative whitespace-nowrap flex items-center space-x-1.5 text-sm font-semibold
              ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{upcoming.length > 0 ? 'Prochain Rendez-vous' : 'Aucun RDV prévu'}</span>
                <CalendarIcon className="w-6 h-6 text-blue-100" />
              </div>
              {upcoming.length > 0 ? (
                <>
                  <h3 className="text-2xl font-brand font-black mb-1">{upcoming[0].doctorName}</h3>
                  <p className="text-blue-100 text-sm mb-6">{upcoming[0].specialty} · {upcoming[0].date} à {upcoming[0].time} · {upcoming[0].type}</p>
                  <div className="flex gap-3 flex-wrap">
                    {upcoming[0].type.includes('Vidéo') && (
                      <button onClick={() => setActiveVideoCallApp(upcoming[0])} className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5">
                        <Video className="w-4 h-4" /><span>Rejoindre la Vidéo</span>
                      </button>
                    )}
                    <button onClick={() => onCancel(upcoming[0].id)} className="bg-blue-800/50 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition">Annuler / Reporter</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-blue-100 text-sm mb-6">Prenez un rendez-vous avec un médecin près de chez vous.</p>
                  <button onClick={onNewBooking} className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-xs font-bold transition">Trouver un Médecin</button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {([
                { id: 'appointments' as TabId, label: 'Rendez-vous', icon: CalendarIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
                { id: 'teleconsult' as TabId, label: 'Téléconsulter', icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
                { id: 'medical_records' as TabId, label: 'Dossier', icon: FolderOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { id: 'prescriptions' as TabId, label: 'Ordonnances', icon: Pill, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { id: 'messages' as TabId, label: 'Messages', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
              ]).map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    className={`${item.bg} p-4 rounded-2xl border border-white hover:shadow-md transition text-center group`}>
                    <Icon className={`w-6 h-6 ${item.color} mb-2 mx-auto group-hover:scale-110 transition-transform`} />
                    <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'RDV à venir', value: upcoming.length, color: 'text-blue-600' },
                { label: 'Consultations', value: past.filter(a => a.status === 'Terminé').length, color: 'text-emerald-600' },
                { label: 'Documents', value: documents.length, color: 'text-purple-600' },
                { label: 'Ordonnances', value: prescriptionApps.length, color: 'text-orange-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2 text-sm">
                <Bell className="w-4 h-4 text-amber-500" /><span>À ne pas oublier</span>
              </h3>
              <ul className="space-y-3">
                {INITIAL_INVOICES.filter(i => i.status === 'En attente').map(inv => (
                  <li key={inv.id} className="text-xs flex items-start space-x-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{inv.description} — <b>{inv.amount}</b></span>
                  </li>
                ))}
                {unreadCount > 0 && (
                  <li className="text-xs flex items-start space-x-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{unreadCount} message(s) non lu(s)</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center space-x-2 text-sm">
                <Heart className="w-4 h-4 text-rose-500" /><span>Constantes (dernières)</span>
              </h3>
              <div className="space-y-2">
                {baseVitals.slice(0, 3).map(v => (
                  <div key={v.label} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{v.label}</span>
                    <span className="font-bold text-slate-800">{v.value} <span className="text-slate-400 font-normal">{v.unit}</span></span>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('vitals')} className="mt-4 w-full text-xs font-bold text-blue-600 hover:underline text-left flex items-center space-x-1">
                <span>Voir toutes les constantes</span><ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl border border-emerald-100">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900 text-sm">Carnet de Santé</h3>
              </div>
              <p className="text-xs text-emerald-700 mb-3">Téléchargez votre historique médical complet.</p>
              <button onClick={handleExportHealthBooklet} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-4 py-2 rounded-xl text-xs transition">Exporter le Carnet (PDF)</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RENDEZ-VOUS ── */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" /><span>Rendez-vous à venir ({upcoming.length})</span>
              </h3>
              <button onClick={onNewBooking} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center space-x-1">
                <PlusCircle className="w-3.5 h-3.5" /><span>Nouveau</span>
              </button>
            </div>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />Aucun rendez-vous à venir.
                </div>
              ) : upcoming.map(app => (
                <div key={app.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      {app.type.includes('Vidéo') ? <Video className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{app.doctorName}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">{app.specialty}</div>
                      <div className="text-xs font-medium text-slate-600 mt-1">{app.date} à {app.time} · {app.type}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    {app.type.includes('Vidéo') && (
                      <button onClick={() => setActiveVideoCallApp(app)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1">
                        <Video className="w-3.5 h-3.5" /><span>Rejoindre</span>
                      </button>
                    )}
                    <button onClick={() => onCancel(app.id)} className="bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition">Annuler</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /><span>Historique ({past.length})</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {past.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Aucun historique disponible.</p>
              ) : past.map(app => (
                <div key={app.id} className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-xl px-2 transition">
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{app.doctorName}</div>
                    <div className="text-xs text-slate-500">{app.date} · {app.specialty}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${app.status === 'Terminé' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{app.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TÉLÉCONSULTATION ── */}
      {activeTab === 'teleconsult' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Video className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-black">Téléconsultation SangO</h2>
                <p className="text-purple-200 text-sm">Consultez un médecin en vidéo, où que vous soyez</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[{ label: 'Consultations vidéo', value: String(videoApps.length), desc: 'à venir' }, { label: 'Durée moy.', value: '22', desc: 'minutes' }, { label: 'Satisfaction', value: '4.9', desc: '/ 5 étoiles' }].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black">{s.value}</div>
                  <div className="text-xs text-purple-200 mt-0.5">{s.desc}</div>
                  <div className="text-[10px] text-purple-300 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {videoApps.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">Consultations Vidéo programmées</h3>
              {videoApps.map(app => (
                <div key={app.id} className="bg-white rounded-2xl border border-purple-100 p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Video className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold text-slate-900">{app.doctorName}</div>
                      <div className="text-xs text-slate-500">{app.specialty} · {app.date} à {app.time}</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveVideoCallApp(app)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2">
                    <Video className="w-4 h-4" /><span>Rejoindre</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <Video className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Aucune téléconsultation prévue</h3>
              <p className="text-sm text-slate-500 mb-6">Prenez rendez-vous avec un médecin proposant des consultations vidéo.</p>
              <button onClick={onNewBooking} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition">Prendre un RDV Vidéo</button>
            </div>
          )}

          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">Comment ça marche ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[{ step: '1', title: 'Réservez', desc: 'Choisissez un médecin et un créneau vidéo disponible.' }, { step: '2', title: 'Rejoignez', desc: "Cliquez sur 'Rejoindre' à l'heure du rendez-vous." }, { step: '3', title: 'Consultez', desc: 'Échangez avec le médecin et recevez votre ordonnance.' }].map(s => (
                <div key={s.step} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-black text-sm shrink-0">{s.step}</div>
                  <div><div className="font-bold text-slate-800 text-sm">{s.title}</div><div className="text-xs text-slate-500 mt-0.5">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DOSSIER MÉDICAL ── */}
      {activeTab === 'medical_records' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-brand text-xl font-black text-emerald-900">Dossier Médical Numérique</h3>
              <p className="text-xs text-emerald-700 mt-1">{documents.length} document(s) · Stockage sécurisé et chiffré</p>
            </div>
            <button onClick={() => setIsUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition flex items-center space-x-2 text-xs shrink-0">
              <Upload className="w-4 h-4" /><span>Ajouter un document</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />Aucun document médical disponible.
              </div>
            ) : documents.map(doc => (
              <div key={doc.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">{doc.category}</span>
                  <span className="text-xs text-slate-400">{doc.date}</span>
                </div>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    {doc.fileType === 'pdf' ? <FileText className="w-5 h-5 text-blue-500" /> : <Eye className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{doc.title}</h4>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                      <Building2 className="w-3 h-3" /><span>{doc.facility}</span>
                    </div>
                  </div>
                </div>
                {doc.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-3 italic">"{doc.notes}"</p>}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                    {doc.isSharedWithDoctor && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">Partagé</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setViewingDoc(doc)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold transition">Voir</button>
                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-bold transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONSTANTES VITALES ── */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Suivi des Constantes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enregistrez et suivez vos paramètres de santé</p>
            </div>
            <button onClick={() => setIsAddVitalOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5">
              <PlusCircle className="w-4 h-4" /><span>Ajouter</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allVitals.map((v, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Normal</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{v.value} <span className="text-sm font-medium text-slate-400">{v.unit}</span></div>
                <div className="text-xs font-semibold text-slate-700 mt-1">{v.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{v.date}</div>
              </div>
            ))}
          </div>

          {isAddVitalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
                <button onClick={() => setIsAddVitalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full"><X className="w-5 h-5" /></button>
                <h3 className="text-xl font-black text-slate-900 mb-5">Ajouter une Constante</h3>
                <form onSubmit={handleAddVital} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paramètre *</label>
                    <input type="text" required placeholder="Ex: Tension artérielle" value={newVital.label}
                      onChange={e => setNewVital(p => ({ ...p, label: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valeur *</label>
                      <input type="text" required placeholder="Ex: 120/80" value={newVital.value}
                        onChange={e => setNewVital(p => ({ ...p, value: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unité</label>
                      <input type="text" placeholder="mmHg, kg, °C..." value={newVital.unit}
                        onChange={e => setNewVital(p => ({ ...p, unit: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date de mesure</label>
                    <input type="date" value={newVital.date} onChange={e => setNewVital(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm transition">Enregistrer la Constante</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORDONNANCES ── */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptionApps.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune Ordonnance</h3>
              <p className="text-sm text-slate-500">Les ordonnances de vos médecins apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptionApps.map(app => {
                const pres = app.prescription!;
                return (
                  <div key={pres.id} className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">{pres.id}</span>
                      <span className="text-xs text-slate-400">{pres.date}</span>
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Stethoscope className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">{pres.doctorName}</h3>
                        <p className="text-xs text-slate-500">Patient : {pres.patientName}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5">
                      {pres.medications.map((m, idx) => (
                        <div key={idx} className="text-xs text-slate-800 flex justify-between">
                          <span className="font-semibold flex items-center space-x-1.5"><Pill className="w-3 h-3 text-indigo-500" /><span>{m.name}</span></span>
                          <span className="text-slate-500">{m.dosage} · {m.duration}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button onClick={() => handleDownloadPrescription(pres)} className="text-slate-500 hover:text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-200 transition flex items-center space-x-1">
                        <Download className="w-3.5 h-3.5" /><span>PDF</span>
                      </button>
                      <button onClick={() => setViewingPrescription(pres)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5" /><span>Voir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MESSAGERIE ── */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row" style={{ height: 600 }}>
          <div className="w-full md:w-2/5 border-r border-slate-100 bg-slate-50 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Boîte de réception</h3>
              {unreadCount > 0 && <p className="text-xs text-blue-600 mt-0.5">{unreadCount} non lu(s)</p>}
            </div>
            <div className="overflow-y-auto flex-1">
              {messages.map(msg => (
                <button key={msg.id} onClick={() => { setSelectedMessage(msg); setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m)); }}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-100 transition ${selectedMessage.id === msg.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${!msg.isRead ? 'border-l-4 border-l-blue-400' : ''}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 ${!msg.isRead ? 'bg-blue-600' : 'bg-slate-300'}`}>{msg.avatar}</div>
                    <div className="min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs truncate ${!msg.isRead ? 'font-black text-slate-900' : 'text-slate-600'}`}>{msg.sender}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">{msg.date}</span>
                      </div>
                      <div className={`text-sm mt-0.5 truncate ${!msg.isRead ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{msg.subject}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="w-full md:w-3/5 flex flex-col bg-white">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{selectedMessage.subject}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedMessage.sender} · {selectedMessage.date}</p>
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="bg-blue-50 text-blue-900 p-4 rounded-2xl text-sm inline-block max-w-[85%]">
                {selectedMessage.body}
                <div className="text-[10px] text-blue-400 mt-2 text-right">{selectedMessage.date}</div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Écrire une réponse sécurisée..." value={replyText}
                  onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) setReplyText(''); }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                <button onClick={() => setReplyText('')} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FACTURATION ── */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Payé', amount: '30 000 CDF', color: 'bg-emerald-50 border-emerald-200', tc: 'text-emerald-700', icon: CheckCircle2 },
              { label: 'En attente', amount: '15 000 CDF', color: 'bg-amber-50 border-amber-200', tc: 'text-amber-700', icon: Clock },
              { label: 'Remboursé', amount: '45 000 CDF', color: 'bg-blue-50 border-blue-200', tc: 'text-blue-700', icon: Download },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${s.color} border rounded-2xl p-5 flex items-center justify-between`}>
                  <div><div className={`text-xl font-black ${s.tc}`}>{s.amount}</div><div className="text-xs text-slate-600 mt-0.5">{s.label}</div></div>
                  <Icon className={`w-5 h-5 ${s.tc}`} />
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-900">Historique des Paiements</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Réf</th><th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Catégorie</th><th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Montant</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INITIAL_INVOICES.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{inv.id}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{inv.description}</td>
                      <td className="px-5 py-4"><span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{inv.category}</span></td>
                      <td className="px-5 py-4 text-xs">{inv.date}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{inv.amount}</td>
                      <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${invoiceStatusStyle(inv.status)}`}>{inv.status}</span></td>
                      <td className="px-5 py-4 text-right">
                        {inv.status === 'En attente'
                          ? <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">Payer</button>
                          : <button className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center space-x-1"><Download className="w-3.5 h-3.5" /><span>Reçu</span></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center space-x-2"><Phone className="w-4 h-4 text-green-500" /><span>Moyens de paiement acceptés</span></h3>
            <div className="flex flex-wrap gap-3">
              {['M-Pesa', 'Orange Money', 'Airtel Money', 'Carte Visa/Mastercard'].map(p => (
                <span key={p} className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl shadow-sm">{p}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MON PROFIL ── */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white flex items-center space-x-5">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black"><User className="w-10 h-10" /></div>
            <div><h2 className="text-2xl font-black">Mon Profil Patient</h2><p className="text-blue-200 text-sm">Gérez vos informations personnelles et médicales</p></div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5">Informations Personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: 'Prénom', placeholder: 'Ex : Daniel' }, { label: 'Nom de famille', placeholder: 'Ex : Kiboko' }, { label: 'Date de naissance', placeholder: '01/01/1990', type: 'date' }, { label: 'Téléphone', placeholder: '+243 8X X XX XX XX', type: 'tel' }, { label: 'Email', placeholder: 'exemple@gmail.com', type: 'email' }, { label: 'Commune / Quartier', placeholder: 'Ex : Gombe, Kinshasa' }].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5">Informations Médicales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: 'Groupe Sanguin', placeholder: 'Ex : A+' }, { label: 'Taille (cm)', placeholder: 'Ex : 175' }, { label: 'Poids (kg)', placeholder: 'Ex : 70' }, { label: 'Médecin traitant', placeholder: 'Dr. Nom Prénom' }].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{f.label}</label>
                  <input type="text" placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Allergies connues</label>
                <textarea rows={3} placeholder="Ex : Pénicilline, pollen, arachides..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Antécédents médicaux</label>
                <textarea rows={3} placeholder="Ex : Diabète de type 2, hypertension..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
            <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition">Enregistrer le profil</button>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Upload Document */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative border border-slate-100">
            <button onClick={() => setIsUploadOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center"><Upload className="w-6 h-6 text-emerald-600" /></div>
              <div><h3 className="font-brand text-xl font-black text-slate-900">Ajouter un Document</h3><p className="text-xs text-slate-500">Formats acceptés : PDF, JPG, PNG</p></div>
            </div>
            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titre du document *</label>
                <input type="text" required placeholder="Ex : Bilan Sanguin Mars 2026" value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catégorie</label>
                  <select value={docCategory} onChange={e => setDocCategory(e.target.value as MedicalDocument['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500">
                    <option>Biologie & Analyses</option>
                    <option>Imagerie & Radio</option>
                    <option>Échographie</option>
                    <option>Compte-rendu</option>
                    <option>Ordonnance antérieure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Établissement</label>
                <input type="text" placeholder="Ex : Clinique Ngaliema, Kinshasa" value={docFacility}
                  onChange={e => setDocFacility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Résultat</label>
                <textarea rows={2} placeholder="Résultat ou observations..." value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fichier (optionnel)</label>
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-emerald-400 transition bg-slate-50">
                  {docFileName ? (
                    <span className="text-xs font-bold text-emerald-600">{docFileName}</span>
                  ) : (
                    <><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-500">Cliquer pour uploader</span></>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={docShare} onChange={e => setDocShare(e.target.checked)} className="rounded border-slate-300" />
                <span className="text-xs font-medium text-slate-700">Partager avec mon médecin traitant</span>
              </label>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-sm">Enregistrer le document</button>
            </form>
          </div>
        </div>
      )}

      {/* Aperçu Document */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 relative shadow-2xl">
            <button onClick={() => setViewingDoc(null)} className="absolute top-4 right-4 text-slate-400 p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold mb-1 pr-8">{viewingDoc.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{viewingDoc.facility} · {viewingDoc.date}</p>
            <div className="bg-slate-100 p-8 flex justify-center rounded-2xl mb-4 min-h-[200px] items-center">
              {viewingDoc.fileUrl
                ? <img src={viewingDoc.fileUrl} className="max-h-64 object-contain rounded-xl" alt={viewingDoc.title} />
                : <div className="text-center"><FileText className="w-16 h-16 text-blue-400 mx-auto mb-2" /><p className="text-xs text-slate-500">Document PDF</p></div>}
            </div>
            {viewingDoc.notes && <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-4 italic">{viewingDoc.notes}</p>}
            <button onClick={() => setViewingDoc(null)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-sm transition">Fermer</button>
          </div>
        </div>
      )}

      {/* Ordonnance Detail */}
      {viewingPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 relative shadow-2xl">
            <button onClick={() => setViewingPrescription(null)} className="absolute top-4 right-4 text-slate-400 p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div>
              <div><h2 className="text-xl font-black text-slate-900">Ordonnance {viewingPrescription.id}</h2><p className="text-xs text-slate-500">{viewingPrescription.date}</p></div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl mb-4 border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">{viewingPrescription.doctorName}</p>
              <p className="text-xs text-slate-500 mb-3">Patient : {viewingPrescription.patientName}</p>
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {viewingPrescription.medications.map((m, i) => (
                  <div key={i} className="text-sm flex items-start space-x-2">
                    <Pill className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-slate-500"> — {m.dosage} — {m.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {viewingPrescription.notes && <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-xl mb-4 border border-amber-100"><b>Note :</b> {viewingPrescription.notes}</p>}
            <button onClick={() => handleDownloadPrescription(viewingPrescription)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 transition flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" /><span>Télécharger (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Téléconsultation Vidéo */}
      {activeVideoCallApp && (
        <VideoConsultationRoomModal
          appointment={activeVideoCallApp}
          doctor={{ id: 1, name: activeVideoCallApp.doctorName, specialty: activeVideoCallApp.specialty, address: "", rating: 5, reviewsCount: 0, fee: "", nextSlot: "", image: "", consultationType: "", bio: "", slots: [] }}
          userRole="patient"
          onClose={() => setActiveVideoCallApp(null)}
          onSavePrescription={onSavePrescription}
        />
      )}
    </div>
  );
}
