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
  ChevronDown,
  Building2,
  Phone,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  Stethoscope,
  BarChart3,
  Globe,
  LogOut,
  Sparkles,
  Users,
  Menu,
  ArrowLeft,
  HeartPulse
} from 'lucide-react';
import { Appointment, Doctor, Prescription, MedicalDocument, UserProfile } from '../types';
import VideoConsultationRoomModal from '../components/VideoConsultationRoomModal';
import { useLanguage } from '../context/LanguageContext';

interface PatientDashboardProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onCancel: (id: number) => void;
  onNewBooking: () => void;
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
  currentUser?: UserProfile | null;
  onReturnHome?: () => void;
  onLogout?: () => void;
}

type TabId =
  | 'health'
  | 'appointments'
  | 'messages'
  | 'account'
  | 'teleconsult'
  | 'medical_records'
  | 'prescriptions'
  | 'vitals'
  | 'billing';

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

const INITIAL_DOCUMENTS: MedicalDocument[] = [];
const INITIAL_MESSAGES: Message[] = [];
const INITIAL_INVOICES: Invoice[] = [];

const invoiceStatusStyle = (s: Invoice['status']) =>
  s === 'Payée'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Remboursée'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-amber-100 text-amber-700';

export default function PatientDashboard({
  appointments,
  doctors,
  onCancel,
  onNewBooking,
  onSavePrescription,
  currentUser,
  onReturnHome,
  onLogout
}: PatientDashboardProps) {
  const { t } = useLanguage();
  // Tab par défaut: 'health' correspondant au design mockup de référence (Health reminders + Health profile)
  const [activeTab, setActiveTab] = useState<TabId>('health');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [activeVideoCallApp, setActiveVideoCallApp] = useState<Appointment | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  // Health Profile Modal Details
  const [activeProfileModal, setActiveProfileModal] = useState<
    'conditions' | 'allergies' | 'family_history' | null
  >(null);

  const [documents, setDocuments] = useState<MedicalDocument[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sango_patient_docs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* noop */
        }
      }
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
  const [localVitals, setLocalVitals] = useState<
    { label: string; value: string; unit: string; date: string; status: string }[]
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sango_patient_vitals');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* noop */
        }
      }
    }
    return [];
  });
  const [newVital, setNewVital] = useState({
    label: '',
    value: '',
    unit: '',
    date: new Date().toISOString().split('T')[0]
  });

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
      title: docTitle.trim(),
      category: docCategory,
      date: docDate,
      facility: docFacility.trim() || 'Centre Médical Kinshasa',
      fileType: docFileName.endsWith('.pdf') ? 'pdf' : 'image',
      fileUrl: docFilePreview || undefined,
      fileSize: '2.1 Mo',
      notes: docNotes.trim(),
      isSharedWithDoctor: docShare,
      uploadedAt: new Date().toLocaleDateString('fr-FR')
    };
    const updated = [doc, ...documents];
    setDocuments(updated);
    localStorage.setItem('sango_patient_docs', JSON.stringify(updated));
    setDocTitle('');
    setDocNotes('');
    setDocFilePreview(null);
    setDocFileName('');
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ordonnance-SangoHealth-${pres.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CarnetSante-SangoHealth.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVital.label || !newVital.value) return;
    setLocalVitals(prev => [...prev, { ...newVital, status: 'normal' }]);
    setNewVital({ label: '', value: '', unit: '', date: new Date().toISOString().split('T')[0] });
    setIsAddVitalOpen(false);
  };

  // Titre dynamique de l'espace principal
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'health':
        return 'Santé & Prévention';
      case 'appointments':
        return 'Mes Rendez-vous';
      case 'messages':
        return 'Messagerie Médicale';
      case 'account':
        return 'Mon Compte Patient';
      case 'teleconsult':
        return 'Téléconsultation Vidéo';
      case 'medical_records':
        return 'Dossier Médical Numérique';
      case 'prescriptions':
        return 'Ordonnances Électroniques';
      case 'vitals':
        return 'Constantes Vitales';
      case 'billing':
        return 'Facturation & Paiements';
      default:
        return 'Mon Espace Santé';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* ── 1. BARRE LATÉRALE GAUCHE (DARK SIDEBAR) ── */}
      {/* Exactement comme dans le mockup de référence (media_1790538291446.png) */}
      <aside className="hidden md:flex w-64 bg-[#0a1128] text-white flex-col shrink-0 border-r border-slate-800 z-30 select-none">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800/80">
          <button
            onClick={onReturnHome}
            className="flex items-center space-x-3 text-left group w-full"
            title="Retourner à l'accueil"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="font-brand font-black text-lg tracking-tight text-white flex items-center gap-1">
                SangO <span className="text-blue-400">Health</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Portail Patient Kinshasa</div>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {/* Appointments */}
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'appointments'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <CalendarIcon className={`w-5 h-5 ${activeTab === 'appointments' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Appointments</span>
            </div>
            {upcoming.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black rounded-full px-2 py-0.5">
                {upcoming.length}
              </span>
            )}
          </button>

          {/* Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'messages'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Messages</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Health (Primary Tab - Rappels et Profil de Santé) */}
          <button
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'health'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Heart className={`w-5 h-5 ${activeTab === 'health' ? 'text-rose-400 fill-rose-400/20' : 'text-slate-400'}`} />
              <span>Health</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          {/* Account */}
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'account'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <User className={`w-5 h-5 ${activeTab === 'account' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Account</span>
            </div>
          </button>

          {/* Collapsible / Accordion for More Services */}
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition"
            >
              <span>Plus de services</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`mt-1 space-y-1 ${isMoreMenuOpen ? 'block' : 'hidden'}`}>
              <button
                onClick={() => setActiveTab('teleconsult')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'teleconsult' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Téléconsultation</span>
                </div>
                {videoApps.length > 0 && (
                  <span className="text-[9px] bg-purple-600 px-1.5 py-0.2 rounded text-white">{videoApps.length}</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('medical_records')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'medical_records' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FolderOpen className="w-4 h-4 text-sky-400" />
                  <span>Dossier Médical</span>
                </div>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">{documents.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'prescriptions' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Pill className="w-4 h-4 text-indigo-400" />
                  <span>Ordonnances</span>
                </div>
                {prescriptionApps.length > 0 && (
                  <span className="text-[9px] bg-indigo-600 px-1.5 py-0.2 rounded text-white">{prescriptionApps.length}</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('vitals')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'vitals' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Constantes Vitales</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'billing' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Factures & Mobile Money</span>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer: Patient Avatar & Logout/Home buttons */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-inner">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.name || 'Patient SangO'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || 'Kinshasa, RDC'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {onReturnHome && (
              <button
                onClick={onReturnHome}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition border border-slate-800"
                title="Retour au site public"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Accueil</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-slate-800"
                title="Déconnexion sécurisée"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sortir</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── 2. CONTENU PRINCIPAL À DROITE (MAIN CONTENT) ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {getHeaderTitle()}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Espace patient sécurisé · Kinshasa, République Démocratique du Congo
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportHealthBooklet}
              className="hidden sm:flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Carnet (PDF)</span>
            </button>
            <button
              onClick={onNewBooking}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau RDV</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full pb-24 md:pb-12">
          {/* ══════════════════════════════════════════════════════════════
              ONGLET HEALTH (Santé & Prévention)
              STRICTEMENT IDENTIQUE AU MOCKUP (media_1790538291446.png)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'health' && (
            <div className="space-y-8 max-w-3xl">
              {/* SECTION 1: Health Reminders */}
              <section>
                <h2 className="text-lg font-black text-slate-900 mb-3 tracking-tight">
                  Health reminders
                </h2>
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex items-center space-x-5 hover:border-slate-300 transition">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">You're up to date</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No reminders right now. Well done! Tous vos rappels de vaccination et examens périodiques sont en ordre.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Health Profile */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Health profile
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">Kinshasa RDC</span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                  {/* Item 1: Documents */}
                  <button
                    onClick={() => setActiveTab('medical_records')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Documents</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {documents.length > 0
                            ? `${documents.length} document(s) enregistré(s) : bilans, analyses, comptes-rendus`
                            : "Dossiers médicaux, ordonnances et résultats d'analyses"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Item 2: Medical conditions */}
                  <button
                    onClick={() => setActiveProfileModal('conditions')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Heart className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Medical conditions</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Diagnostics médicaux, antécédents et suivis chroniques
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Item 3: Medications */}
                  <button
                    onClick={() => setActiveTab('prescriptions')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Pill className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Medications</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {prescriptionApps.length > 0
                            ? `${prescriptionApps.length} ordonnance(s) en cours de suivi`
                            : 'Traitements actifs, posologies et ordonnances numérisées'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Item 4: Allergies */}
                  <button
                    onClick={() => setActiveProfileModal('allergies')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Allergies</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Allergies médicamenteuses et alimentaires connues
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Item 5: Lifestyle */}
                  <button
                    onClick={() => setActiveTab('vitals')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Lifestyle</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Mode de vie, constantes (tension, glycémie, poids) et activité
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Item 6: Family history */}
                  <button
                    onClick={() => setActiveProfileModal('family_history')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Family history</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Antécédents médicaux familiaux et facteurs de prédisposition
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET APPOINTMENTS (Mes Rendez-vous)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              {/* Prochain RDV Card */}
              {upcoming.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                      Prochain Rendez-vous
                    </span>
                    <CalendarIcon className="w-6 h-6 text-blue-100" />
                  </div>
                  <h3 className="text-2xl font-brand font-black mb-1">{upcoming[0].doctorName}</h3>
                  <p className="text-blue-100 text-sm mb-6">
                    {upcoming[0].specialty} · {upcoming[0].date} à {upcoming[0].time} · {upcoming[0].type}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {upcoming[0].type.includes('Vidéo') && (
                      <button
                        onClick={() => setActiveVideoCallApp(upcoming[0])}
                        className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>Rejoindre la Vidéo</span>
                      </button>
                    )}
                    <button
                      onClick={() => onCancel(upcoming[0].id)}
                      className="bg-blue-800/50 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                      Annuler / Reporter
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des rendez-vous à venir */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span>Rendez-vous à venir ({upcoming.length})</span>
                  </h3>
                  <button
                    onClick={onNewBooking}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nouveau</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {upcoming.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      Aucun rendez-vous à venir.
                    </div>
                  ) : (
                    upcoming.map(app => (
                      <div
                        key={app.id}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            {app.type.includes('Vidéo') ? (
                              <Video className="w-5 h-5" />
                            ) : (
                              <Stethoscope className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{app.doctorName}</h4>
                            <div className="text-xs text-slate-500 mt-0.5">{app.specialty}</div>
                            <div className="text-xs font-medium text-slate-600 mt-1">
                              {app.date} à {app.time} · {app.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 shrink-0">
                          {app.type.includes('Vidéo') && (
                            <button
                              onClick={() => setActiveVideoCallApp(app)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Rejoindre</span>
                            </button>
                          )}
                          <button
                            onClick={() => onCancel(app.id)}
                            className="bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Historique des rendez-vous */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Historique des consultations ({past.length})</span>
                </h3>
                <div className="divide-y divide-slate-100">
                  {past.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Aucun historique disponible.</p>
                  ) : (
                    past.map(app => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-xl px-2 transition"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{app.doctorName}</div>
                          <div className="text-xs text-slate-500">
                            {app.date} · {app.specialty}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                            app.status === 'Terminé'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET MESSAGES (Messagerie)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'messages' && (
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row"
              style={{ minHeight: 520 }}
            >
              <div className="w-full md:w-2/5 border-r border-slate-100 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Boîte de réception</h3>
                  {unreadCount > 0 && <span className="text-xs text-blue-600 font-bold">{unreadCount} non lu(s)</span>}
                </div>
                <div className="overflow-y-auto flex-1">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucun message. Les communications avec vos médecins s'afficheront ici.
                    </div>
                  ) : (
                    messages.map(msg => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, isRead: true } : m)));
                        }}
                        className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-100 transition ${
                          selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        } ${!msg.isRead ? 'border-l-4 border-l-blue-400 font-bold' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 ${
                              !msg.isRead ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          >
                            {msg.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <span className={`text-xs truncate ${!msg.isRead ? 'font-black text-slate-900' : 'text-slate-600'}`}>
                                {msg.sender}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-1">{msg.date}</span>
                            </div>
                            <div className={`text-sm mt-0.5 truncate ${!msg.isRead ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                              {msg.subject}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="w-full md:w-3/5 flex flex-col bg-white">
                {selectedMessage ? (
                  <>
                    <div className="p-5 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900">{selectedMessage.subject}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedMessage.sender} · {selectedMessage.date}
                      </p>
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto">
                      <div className="bg-blue-50 text-blue-900 p-4 rounded-2xl text-sm inline-block max-w-[85%]">
                        {selectedMessage.body}
                        <div className="text-[10px] text-blue-400 mt-2 text-right">{selectedMessage.date}</div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Écrire une réponse sécurisée..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && replyText.trim()) setReplyText('');
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => setReplyText('')}
                          className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-sm font-medium">Sélectionnez une conversation pour afficher les messages</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET ACCOUNT (Mon Profil & Coordonnées)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'account' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white flex items-center space-x-5 shadow-lg shadow-blue-600/20">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Mon Compte Patient</h2>
                  <p className="text-blue-100 text-sm">Informations personnelles, médicales et sécurité</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-5">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Prénom', placeholder: 'Ex : Daniel', defaultValue: currentUser?.name?.split(' ')[0] },
                    { label: 'Nom de famille', placeholder: 'Ex : Kiboko', defaultValue: currentUser?.name?.split(' ')[1] || '' },
                    { label: 'Date de naissance', placeholder: '01/01/1990', type: 'date' },
                    { label: 'Téléphone', placeholder: '+243 8X X XX XX XX', type: 'tel' },
                    { label: 'Email', placeholder: 'exemple@gmail.com', type: 'email', defaultValue: currentUser?.email },
                    { label: 'Commune / Quartier', placeholder: 'Ex : Gombe, Kinshasa' }
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        placeholder={f.placeholder}
                        defaultValue={f.defaultValue}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-5">Informations Médicales Générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Groupe Sanguin', placeholder: 'Ex : A+' },
                    { label: 'Taille (cm)', placeholder: 'Ex : 175' },
                    { label: 'Poids (kg)', placeholder: 'Ex : 70' },
                    { label: 'Médecin traitant', placeholder: 'Dr. Nom Prénom' }
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Allergies connues</label>
                    <textarea
                      rows={2}
                      placeholder="Ex : Pénicilline, arachides..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Antécédents médicaux</label>
                    <textarea
                      rows={2}
                      placeholder="Ex : Hypertension, asthme..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET TELECONSULT (Téléconsultation)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'teleconsult' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-purple-600/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Téléconsultation Médicale</h2>
                    <p className="text-purple-200 text-sm">Consultez votre praticien en direct, en toute confidentialité</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { label: 'Consultations vidéo', value: String(videoApps.length), desc: 'programmées' },
                    { label: 'Durée moy.', value: '22', desc: 'minutes' },
                    { label: 'Qualité vidéo', value: 'HD', desc: 'Chiffrée WebRTC' }
                  ].map(s => (
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
                  <h3 className="font-bold text-slate-800">Consultations Vidéo disponibles</h3>
                  {videoApps.map(app => (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl border border-purple-100 p-5 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{app.doctorName}</div>
                          <div className="text-xs text-slate-500">
                            {app.specialty} · {app.date} à {app.time}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveVideoCallApp(app)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Rejoindre</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                  <Video className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Aucune téléconsultation prévue</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Prenez rendez-vous avec un médecin proposant des consultations vidéo.
                  </p>
                  <button
                    onClick={onNewBooking}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
                  >
                    Prendre un RDV Vidéo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET MEDICAL RECORDS (Dossier Médical & Documents)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'medical_records' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-brand text-xl font-black text-emerald-900">Dossier Médical Numérique</h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    {documents.length} document(s) · Stockage sécurisé et chiffré
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-2 text-xs shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Ajouter un document</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    Aucun document médical disponible. Cliquez sur "Ajouter un document" pour sauvegarder vos résultats.
                  </div>
                ) : (
                  documents.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                        <span className="text-xs text-slate-400">{doc.date}</span>
                      </div>
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          {doc.fileType === 'pdf' ? (
                            <FileText className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Eye className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{doc.title}</h4>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                            <Building2 className="w-3 h-3" />
                            <span>{doc.facility}</span>
                          </div>
                        </div>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-3 italic">"{doc.notes}"</p>
                      )}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                          {doc.isSharedWithDoctor && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                              Partagé
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setViewingDoc(doc)}
                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold transition"
                          >
                            Voir
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-bold transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET PRESCRIPTIONS (Ordonnances)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptionApps.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                  <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune Ordonnance Électronique</h3>
                  <p className="text-sm text-slate-500">
                    Les prescriptions médicales délivrées lors de vos consultations apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptionApps.map(app => {
                    const pres = app.prescription!;
                    return (
                      <div key={pres.id} className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                            {pres.id}
                          </span>
                          <span className="text-xs text-slate-400">{pres.date}</span>
                        </div>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{pres.doctorName}</h3>
                            <p className="text-xs text-slate-500">Patient : {pres.patientName}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5">
                          {pres.medications.map((m, idx) => (
                            <div key={idx} className="text-xs text-slate-800 flex justify-between">
                              <span className="font-semibold flex items-center space-x-1.5">
                                <Pill className="w-3 h-3 text-indigo-500" />
                                <span>{m.name}</span>
                              </span>
                              <span className="text-slate-500">
                                {m.dosage} · {m.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadPrescription(pres)}
                            className="text-slate-500 hover:text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-200 transition flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => setViewingPrescription(pres)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET VITALS (Constantes Vitales)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Suivi des Constantes</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enregistrez et suivez vos paramètres de santé</p>
                </div>
                <button
                  onClick={() => setIsAddVitalOpen(true)}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ajouter une constante</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allVitals.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <Activity className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    Aucune constante enregistrée pour le moment.
                  </div>
                ) : (
                  allVitals.map((v, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Normal
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {v.value} <span className="text-sm font-medium text-slate-400">{v.unit}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-1">{v.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{v.date}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ONGLET BILLING (Facturation & Mobile Money)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Payé', amount: '0 CDF', color: 'bg-emerald-50 border-emerald-200', tc: 'text-emerald-700', icon: CheckCircle2 },
                  { label: 'En attente', amount: '0 CDF', color: 'bg-amber-50 border-amber-200', tc: 'text-amber-700', icon: Clock },
                  { label: 'Remboursé', amount: '0 CDF', color: 'bg-blue-50 border-blue-200', tc: 'text-blue-700', icon: Download }
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`${s.color} border rounded-2xl p-5 flex items-center justify-between`}>
                      <div>
                        <div className={`text-xl font-black ${s.tc}`}>{s.amount}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
                      </div>
                      <Icon className={`w-5 h-5 ${s.tc}`} />
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span>Moyens de paiement acceptés en RDC</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['M-Pesa (Vodacom)', 'Orange Money', 'Airtel Money', 'Carte Visa/Mastercard'].map(p => (
                    <span
                      key={p}
                      className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── 3. BOTTOM NAVIGATION BAR ON MOBILE (media_1790539772052.png) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a1128] text-white border-t border-slate-800 px-3 py-2 flex justify-around items-center z-40">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
            activeTab === 'appointments' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-0.5" />
          <span>RDV</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
            activeTab === 'messages' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span>Messages</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
            activeTab === 'health' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Heart className="w-5 h-5 mb-0.5" />
          <span>Health</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
            activeTab === 'account' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Compte</span>
        </button>

        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="flex flex-col items-center py-1 px-2 text-[10px] font-semibold text-slate-400"
          >
            <Globe className="w-5 h-5 mb-0.5" />
            <span>Accueil</span>
          </button>
        )}
      </div>

      {/* ── 4. MODALS & SUB-VIEWS ── */}

      {/* Modal Profile Details (Conditions, Allergies, Family History) */}
      {activeProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative border border-slate-100">
            <button
              onClick={() => setActiveProfileModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {activeProfileModal === 'conditions' && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-brand text-xl font-black text-slate-900">Conditions Médicales</h3>
                    <p className="text-xs text-slate-500">Antécédents et diagnostics documentés</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 mb-4">
                  <p>Aucune pathologie chronique active déclarée.</p>
                  <p className="text-[11px] text-slate-400">
                    Votre médecin traitant peut mettre à jour vos conditions médicales lors de chaque consultation.
                  </p>
                </div>
              </div>
            )}

            {activeProfileModal === 'allergies' && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-brand text-xl font-black text-slate-900">Allergies & Intolérances</h3>
                    <p className="text-xs text-slate-500">Sécurité médicamenteuse et alimentaire</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 mb-4">
                  <p>Aucune allergie critique enregistrée.</p>
                  <p className="text-[11px] text-slate-400">
                    Signalez immédiatement toute allergie à la pénicilline ou aux sulfamides à votre médecin.
                  </p>
                </div>
              </div>
            )}

            {activeProfileModal === 'family_history' && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-brand text-xl font-black text-slate-900">Antécédents Familiaux</h3>
                    <p className="text-xs text-slate-500">Facteurs génétiques et héréditaires</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 mb-4">
                  <p>Aucun facteur de risque héréditaire majeur signalé.</p>
                  <p className="text-[11px] text-slate-400">
                    Utile pour le dépistage précoce du diabète et de l'hypertension artérielle.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveProfileModal(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Upload Document */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative border border-slate-100">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-brand text-xl font-black text-slate-900">Ajouter un Document</h3>
                <p className="text-xs text-slate-500">Formats acceptés : PDF, JPG, PNG</p>
              </div>
            </div>
            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titre du document *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Bilan Sanguin Mars 2026"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catégorie</label>
                  <select
                    value={docCategory}
                    onChange={e => setDocCategory(e.target.value as MedicalDocument['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option>Biologie & Analyses</option>
                    <option>Imagerie & Radio</option>
                    <option>Échographie</option>
                    <option>Compte-rendu</option>
                    <option>Ordonnance antérieure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={e => setDocDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Établissement</label>
                <input
                  type="text"
                  placeholder="Ex : Clinique Ngaliema, Kinshasa"
                  value={docFacility}
                  onChange={e => setDocFacility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Résultat</label>
                <textarea
                  rows={2}
                  placeholder="Résultat ou observations..."
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fichier (optionnel)</label>
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-emerald-400 transition bg-slate-50">
                  {docFileName ? (
                    <span className="text-xs font-bold text-emerald-600">{docFileName}</span>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Cliquer pour uploader</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={docShare}
                  onChange={e => setDocShare(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700">Partager avec mon médecin traitant</span>
              </label>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-sm"
              >
                Enregistrer le document
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aperçu Document */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute top-4 right-4 text-slate-400 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1 pr-8">{viewingDoc.title}</h3>
            <p className="text-xs text-slate-500 mb-4">
              {viewingDoc.facility} · {viewingDoc.date}
            </p>
            <div className="bg-slate-100 p-8 flex justify-center rounded-2xl mb-4 min-h-[200px] items-center">
              {viewingDoc.fileUrl ? (
                <img src={viewingDoc.fileUrl} className="max-h-64 object-contain rounded-xl" alt={viewingDoc.title} />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Document PDF</p>
                </div>
              )}
            </div>
            {viewingDoc.notes && (
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-4 italic">{viewingDoc.notes}</p>
            )}
            <button
              onClick={() => setViewingDoc(null)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-sm transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Ordonnance Detail */}
      {viewingPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setViewingPrescription(null)}
              className="absolute top-4 right-4 text-slate-400 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Ordonnance {viewingPrescription.id}</h2>
                <p className="text-xs text-slate-500">{viewingPrescription.date}</p>
              </div>
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
                      <span className="text-slate-500">
                        {' '}
                        — {m.dosage} — {m.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {viewingPrescription.notes && (
              <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-xl mb-4 border border-amber-100">
                <b>Note :</b> {viewingPrescription.notes}
              </p>
            )}
            <button
              onClick={() => handleDownloadPrescription(viewingPrescription)}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 transition flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Add Vital */}
      {isAddVitalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddVitalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-5">Ajouter une Constante</h3>
            <form onSubmit={handleAddVital} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paramètre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tension artérielle"
                  value={newVital.label}
                  onChange={e => setNewVital(p => ({ ...p, label: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valeur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 120/80"
                    value={newVital.value}
                    onChange={e => setNewVital(p => ({ ...p, value: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unité</label>
                  <input
                    type="text"
                    placeholder="mmHg, kg, °C..."
                    value={newVital.unit}
                    onChange={e => setNewVital(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date de mesure</label>
                <input
                  type="date"
                  value={newVital.date}
                  onChange={e => setNewVital(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm transition"
              >
                Enregistrer la Constante
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Téléconsultation Vidéo WebRTC */}
      {activeVideoCallApp && (
        <VideoConsultationRoomModal
          appointment={activeVideoCallApp}
          doctor={{
            id: 1,
            name: activeVideoCallApp.doctorName,
            specialty: activeVideoCallApp.specialty,
            address: '',
            rating: 5,
            reviewsCount: 0,
            fee: '',
            nextSlot: '',
            image: '',
            consultationType: '',
            bio: '',
            slots: []
          }}
          userRole="patient"
          onClose={() => setActiveVideoCallApp(null)}
          onSavePrescription={onSavePrescription}
        />
      )}
    </div>
  );
}
