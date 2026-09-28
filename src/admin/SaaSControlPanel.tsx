import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Stethoscope, 
  PlusCircle, 
  CreditCard, 
  ArrowUpRight, 
  Search, 
  Building, 
  Activity, 
  Video, 
  X, 
  Calendar, 
  ShieldCheck, 
  Check,
  CheckCircle2,
  Mail,
  KeyRound,
  Lock,
  Send,
  RefreshCw,
  MessageSquare,
  HeartPulse,
  User,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Settings,
  Home,
  FileText,
  Pill,
  ShieldAlert,
  Flame,
  HeartHandshake,
  Menu
} from 'lucide-react';
import { Doctor, SaaSDoctorAccount, SuperAdminUser, Appointment } from '../types';
import { INITIAL_SAAS_ACCOUNTS } from '../data/saasAccounts';
import { dataService } from '../lib/dataService';
import SetPasswordModal from '../components/SetPasswordModal';
import { useLanguage } from '../context/LanguageContext';

interface SaaSControlPanelProps {
  doctors: Doctor[];
  appointments?: Appointment[];
  onAddDoctor: (newDoctor: Doctor) => void;
  onUpdateDoctorStatus: (id: number, status: 'Actif' | 'Suspendu') => void;
  onReturnHome?: () => void;
  currentUser?: { name: string; email: string; role: string; uid?: string } | null;
}

export default function SaaSControlPanel({ 
  doctors: _doctors, 
  appointments = [], 
  onAddDoctor, 
  onUpdateDoctorStatus,
  onReturnHome,
  currentUser
}: SaaSControlPanelProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'appointments' | 'messages' | 'overview' | 'doctors' | 'teleconsultation' | 'billing' | 'admins'>('overview');
  const [isMoreOpen, setIsMoreOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [accounts, setAccounts] = useState<SaaSDoctorAccount[]>(INITIAL_SAAS_ACCOUNTS);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ [email: string]: string }>({});
  const [isInviting, setIsInviting] = useState<{ [email: string]: boolean }>({});
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');

  useEffect(() => {
    dataService.getSuperAdmins().then(setSuperAdmins);
    dataService.getSaaSAccounts().then(accs => {
      if (accs) setAccounts(accs);
    });
  }, []);

  const handleSendInvite = async (email: string) => {
    setIsInviting(prev => ({ ...prev, [email]: true }));
    const res = await dataService.sendAdminInvite(email);
    setInviteStatus(prev => ({ ...prev, [email]: res.message }));
    setIsInviting(prev => ({ ...prev, [email]: false }));
    setTimeout(() => {
      setInviteStatus(prev => {
        const copy = { ...prev };
        delete copy[email];
        return copy;
      });
    }, 7000);
  };

  // Form State for new doctor onboarding
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('Généraliste');
  const [newClinicName, setNewClinicName] = useState('');
  const [newAddress, setNewAddress] = useState('Gombe, Kinshasa');
  const [newPhone, setNewPhone] = useState('+243 ');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Pro Cabinet' | 'Clinique Pro'>('Pro Cabinet');

  // Business Metrics Calculation
  const activeSubscribers = accounts.filter(a => a.status === 'Actif').length;
  const mrrUSD = accounts
    .filter(a => a.status === 'Actif')
    .reduce((sum, a) => sum + a.monthlyFeeUSD, 0);
  const mrrCDF = mrrUSD * 2850; // Approx rate 1 USD = 2850 CDF
  const totalNetworkConsultations = accounts.reduce((sum, a) => sum + a.totalConsultations, 0);
  const totalVideoHours = accounts.reduce((sum, a) => sum + a.videoHoursUsed, 0);

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newEmail) return;

    const feeMap = {
      'Starter': 29,
      'Pro Cabinet': 59,
      'Clinique Pro': 149
    };

    const newAccount: SaaSDoctorAccount = {
      id: Date.now(),
      name: newDoctorName.startsWith('Dr.') ? newDoctorName : `Dr. ${newDoctorName}`,
      specialty: newSpecialty,
      clinicName: newClinicName || `Cabinet ${newDoctorName}`,
      address: newAddress,
      phone: newPhone,
      email: newEmail,
      plan: newPlan,
      monthlyFeeUSD: feeMap[newPlan],
      status: 'Actif',
      joinedDate: "Aujourd'hui",
      totalConsultations: 0,
      videoHoursUsed: 0,
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
    };

    setAccounts([newAccount, ...accounts]);
    dataService.addSaaSAccount(newAccount);

    // Push into public doctors list
    onAddDoctor({
      id: newAccount.id,
      name: newAccount.name,
      specialty: newAccount.specialty,
      address: newAccount.address,
      rating: 5.0,
      reviewsCount: 1,
      fee: "30 000 CDF",
      nextSlot: "Aujourd'hui à 15:00",
      image: newAccount.image,
      consultationType: newPlan === 'Starter' ? "Cabinet uniquement" : "Cabinet & Vidéo",
      bio: `${newAccount.specialty} au sein de ${newAccount.clinicName}. Prise en charge des consultations et suivi médical digitalisé via SangO Health.`,
      slots: ["09:00", "11:00", "14:30", "16:00"]
    });

    // Reset & close
    setNewDoctorName('');
    setNewClinicName('');
    setNewEmail('');
    setIsAddModalOpen(false);
  };

  const toggleStatus = async (id: number) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    const nextStatus = acc.status === 'Actif' ? 'Suspendu' : 'Actif';
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
    onUpdateDoctorStatus(id, nextStatus);
    await dataService.updateSaaSAccountStatus(id, nextStatus);
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchPlan = filterPlan === 'all' || acc.plan === filterPlan;
    const matchQuery = acc.name.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                       acc.clinicName.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                       acc.specialty.toLowerCase().includes(searchDoctorQuery.toLowerCase());
    return matchPlan && matchQuery;
  });

  const filteredAppointments = appointments.filter(app => {
    const matchesStatus = appointmentStatusFilter === 'all' || app.status === appointmentStatusFilter;
    const matchesQuery = appointmentSearch === '' || 
      app.patientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      app.doctorName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      app.specialty.toLowerCase().includes(appointmentSearch.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row font-sans">
      {/* ── SIDEBAR (Style exact de la photo Amana Health -> SangO Health : Fond Navy Sombre) ── */}
      <aside className={`w-full md:w-64 bg-[#0a1128] border-r border-slate-800 flex flex-col shrink-0 ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
        
        {/* Brand Header */}
        <div className="p-5 pb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onReturnHome}>
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/20">
              <Stethoscope className="w-6 h-6 text-blue-400 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black text-white font-brand tracking-tight">SangO Health</span>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Control Panel SaaS</div>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {/* Appointments / Supervision des Consultations */}
          <button
            onClick={() => { setActiveTab('appointments'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'appointments'
                ? 'border border-slate-700/80 bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'appointments' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>Appointments</span>
            {appointments && appointments.length > 0 && (
              <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                {appointments.length}
              </span>
            )}
          </button>

          {/* Messages */}
          <button
            onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'messages'
                ? 'border border-slate-700/80 bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'text-white' : 'text-slate-400'}`} />
            <span>Messages</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* Health (active in photo) */}
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'overview'
                ? 'border border-slate-700/80 bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <HeartPulse className={`w-5 h-5 ${activeTab === 'overview' ? 'text-white' : 'text-slate-400'}`} />
            <span>Health</span>
          </button>

          {/* Account */}
          <button
            onClick={() => { setActiveTab('doctors'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'doctors'
                ? 'border border-slate-700/80 bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'doctors' ? 'text-white' : 'text-slate-400'}`} />
            <span>Account</span>
            <span className="ml-auto text-[10px] text-slate-400 font-mono">
              ({accounts.length})
            </span>
          </button>

          {/* More with Dropdown */}
          <div className="pt-1">
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center space-x-3.5">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
                <span>More</span>
              </div>
              {isMoreOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isMoreOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-1 mt-1">
                <button
                  onClick={() => { setActiveTab('teleconsultation'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'teleconsultation'
                      ? 'border border-slate-700/80 bg-slate-800/90 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                  }`}
                >
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Teleconsultation</span>
                </button>

                <button
                  onClick={() => { setActiveTab('billing'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'billing'
                      ? 'border border-slate-700/80 bg-slate-800/90 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Billing</span>
                </button>

                <button
                  onClick={() => { setActiveTab('admins'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'admins'
                      ? 'border border-slate-700/80 bg-slate-800/90 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer with Super Admin identity */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'DK'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.name || 'KIBOKO Daniel'}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Super Admin • RLS Sécurisé</span>
              </div>
            </div>
          </div>

          {onReturnHome && (
            <button
              onClick={onReturnHome}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Retour au site public</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN WORKSPACE (Style exact : Fond clair médical moderne #f8fafc) ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header / Bar */}
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Control Panel SaaS
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {activeTab === 'appointments' && 'Supervision globale des flux & consultations du réseau'}
                  {activeTab === 'messages' && 'Communications & alertes réseau'}
                  {activeTab === 'overview' && 'Supervision & indicateurs de santé'}
                  {activeTab === 'doctors' && 'Gestion des praticiens & établissements'}
                  {activeTab === 'teleconsultation' && 'Infrastructure visio WebRTC/LiveKit'}
                  {activeTab === 'billing' && 'Encaissements Mobile Money & plans SaaS'}
                  {activeTab === 'admins' && 'Super Administrateurs & sécurité RLS'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-brand capitalize">
                {activeTab === 'overview' ? 'Supervision Santé' : activeTab === 'doctors' ? 'Comptes Praticiens' : activeTab === 'teleconsultation' ? 'Téléconsultation SFU' : activeTab === 'admins' ? 'Sécurité & Admins' : activeTab === 'appointments' ? 'Supervision Consultations' : activeTab}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cpanel_add_doctor')}</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* APPOINTMENTS TAB (SUPERVISION RESEAU) */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Bannière de cadrage Supervision Admin */}
              <div className="bg-white border border-blue-100 rounded-2xl p-4 flex items-start space-x-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h3 className="font-bold text-slate-900 text-sm">Supervision Globale des Consultations (Audit Réseau)</h3>
                  <p className="text-slate-600 mt-0.5">
                    Cette vue centralise l'ensemble des rendez-vous et téléconsultations pris par les patients auprès des praticiens du réseau. En tant qu'Administrateur, vous disposez d'un droit de regard pour l'audit qualité et l'arbitrage en cas de litige.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Chercher patient, médecin, spécialité..."
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <select
                    value={appointmentStatusFilter}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500">
                  Total synchronisé Supabase : <strong className="text-slate-900">{filteredAppointments.length}</strong> rendez-vous
                </div>
              </div>

              {/* Appointments Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">Praticien Assigné</th>
                        <th className="py-3.5 px-4">Date & Heure</th>
                        <th className="py-3.5 px-4">Mode</th>
                        <th className="py-3.5 px-4">Ordonnance</th>
                        <th className="py-3.5 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">Aucun rendez-vous pour le moment</p>
                            <p className="text-xs text-slate-400 mt-0.5">Dès qu'un patient ou médecin prend rendez-vous, il s'affiche ici en temps réel.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map(app => (
                          <tr key={app.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-4 font-bold text-slate-900">
                              {app.patientName}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-900">{app.doctorName}</div>
                              <div className="text-[10px] text-blue-600">{app.specialty}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div>{app.date}</div>
                              <div className="text-[10px] text-slate-500">{app.time}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px] text-slate-700 font-semibold">
                                {app.type}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {app.prescription ? (
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{app.prescription.id}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                app.status === 'Confirmé'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : app.status === 'Annulé'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-brand">Centre de Notifications & Communications</h3>
                    <p className="text-xs text-slate-500">Rappels SMS de consultations et alertes du système SangO Health</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                    Passerelle SMS RDC Active
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Passerelle de notifications opérationnelle</h4>
                        <span className="text-[10px] text-slate-400">Actif</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Les notifications SMS et emails de confirmation de rendez-vous sont automatiquement envoyées aux patients et praticiens.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Passerelle Mobile Money connectée</h4>
                        <span className="text-[10px] text-slate-400">En ligne</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Prise en charge des paiements M-Pesa, Orange Money, Airtel Money et cartes bancaires.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Sécurité & Cloisonnement RLS Supabase</h4>
                        <span className="text-[10px] text-slate-400">Certifié</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Protection stricte des données médicales conforme au secret médical et cloisonnement des accès praticiens/patients/admins.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW / HEALTH TAB (STYLE EXACT DE LA RECOMMANDATION VISUELLE) */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* 1. HEALTH REMINDERS (Exactement comme la photo fournie) */}
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-3 font-brand">
                  Health reminders
                </h2>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">You're up to date</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      We'll notify you when you have new health reminders
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. HEALTH PROFILE (Liste structurée avec pastilles colorées comme sur la photo) */}
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-3 font-brand">
                  Health profile
                </h2>
                <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
                  {/* Documents */}
                  <button 
                    onClick={() => setActiveTab('appointments')}
                    className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">Documents</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Medical conditions */}
                  <button 
                    onClick={() => setActiveTab('doctors')}
                    className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition">Medical conditions</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Medications */}
                  <button 
                    onClick={() => setActiveTab('billing')}
                    className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Pill className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition">Medications</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Allergies */}
                  <div className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Allergies</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Lifestyle */}
                  <div className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Lifestyle</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Family history */}
                  <div className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Family history</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* 3. TOP KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* MRR */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500 mb-3 text-xs font-semibold">
                    <span>Revenu Récurrent (MRR)</span>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <DollarSign className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-brand">${mrrUSD} <span className="text-xs text-slate-500 font-sans font-medium">/ mois</span></div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    ~ {mrrCDF.toLocaleString()} CDF / mois
                  </div>
                  <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Actif en temps réel</span>
                  </div>
                </div>

                {/* Active Clinics */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3 text-xs font-semibold">
                    <span>Praticiens & Cabinets Actifs</span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Stethoscope className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-brand">{activeSubscribers} <span className="text-xs text-slate-500 font-sans font-medium">comptes</span></div>
                  <div className="text-xs text-slate-500 mt-1">100% à jour de cotisation</div>
                  <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-blue-600 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Comptes certifiés</span>
                  </div>
                </div>

                {/* Total Consultations Managed By Doctors */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3 text-xs font-semibold">
                    <span>Consultations Traitées</span>
                    <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-brand">{totalNetworkConsultations}</div>
                  <div className="text-xs text-slate-500 mt-1">Gérées par les praticiens</div>
                  <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Activité réseau en direct</span>
                  </div>
                </div>

                {/* Video Calls (Infrastructure SaaS) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3 text-xs font-semibold">
                    <span>Téléconsultations Visio</span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Video className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-brand">{totalVideoHours.toFixed(1)} <span className="text-xs text-slate-500 font-sans font-medium">heures</span></div>
                  <div className="text-xs text-slate-500 mt-1">Infrastructure WebRTC opérationnelle (99.9%)</div>
                  <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Serveurs média stables</span>
                  </div>
                </div>
              </div>

              {/* 4. BUSINESS BREAKDOWN & PRACTITIONERS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 font-brand">Cabinets & Praticiens Partenaires</h2>
                      <p className="text-xs text-slate-500">Les praticiens pilotent leurs agendas et leurs consultations en direct</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('doctors')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                    >
                      Voir tous &rarr;
                    </button>
                  </div>

                  {accounts.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Building className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Aucun cabinet ou praticien enregistré</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Cliquez sur "+ Nouveau Compte Praticien" pour onboarder vos vrais agents et partenaires cliniques.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {accounts.map(acc => (
                        <div key={acc.id} className="py-3.5 flex items-center justify-between">
                          <div className="flex items-center space-x-3.5">
                            {acc.image ? (
                              <img src={acc.image} alt={acc.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                                {acc.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                <span>{acc.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
                                  {acc.specialty}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">{acc.clinicName} &bull; {acc.address}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-blue-600">${acc.monthlyFeeUSD}/mois</div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              acc.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {acc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SaaS Revenue Distribution by Plan */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-brand mb-1">Offres & Plans SaaS</h2>
                    <p className="text-xs text-slate-500 mb-6">Grille tarifaire des abonnements professionnels</p>

                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-800">Pro Cabinet ($59/m)</span>
                          <span className="text-blue-600">Cabinet & Téléconsultation</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Idéal pour les praticiens libéraux avec consultations vidéo HD.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-800">Clinique Pro ($149/m)</span>
                          <span className="text-purple-600">Multi-postes & Secrétariat</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Pour les centres médicaux avec plusieurs médecins et secrétaire.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-800">Starter ($29/m)</span>
                          <span className="text-emerald-600">Cabinet physique</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Gestion d'agenda et dossiers médicaux au cabinet.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-2.5 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Praticiens autonomes & certifiés par l'Ordre.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCTORS & CLINICS MANAGEMENT TAB */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Chercher praticien, clinique, spécialité..."
                      value={searchDoctorQuery}
                      onChange={(e) => setSearchDoctorQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="all">Tous les plans</option>
                    <option value="Starter">Starter ($29)</option>
                    <option value="Pro Cabinet">Pro Cabinet ($59)</option>
                    <option value="Clinique Pro">Clinique Pro ($149)</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2 w-full sm:w-auto justify-center"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nouveau Compte Praticien</span>
                </button>
              </div>

              {/* Doctors Accounts Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Médecin & Établissement</th>
                        <th className="py-3.5 px-4">Spécialité</th>
                        <th className="py-3.5 px-4">Coordonnées Pro</th>
                        <th className="py-3.5 px-4">Plan SaaS</th>
                        <th className="py-3.5 px-4">Activité Consultations</th>
                        <th className="py-3.5 px-4">Statut Compte</th>
                        <th className="py-3.5 px-4 text-right">Action SaaS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                              <User className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">Aucun compte praticien pour le moment</p>
                            <p className="text-xs text-slate-400 mt-0.5">Cliquez sur "+ Nouveau Compte Praticien" pour créer votre premier agent.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map(acc => (
                          <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-4 flex items-center space-x-3">
                              {acc.image ? (
                                <img src={acc.image} alt={acc.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                                  {acc.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{acc.name}</div>
                                <div className="text-slate-500 text-[11px] flex items-center space-x-1">
                                  <Building className="w-3 h-3 text-slate-400" />
                                  <span>{acc.clinicName}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                                {acc.specialty}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-[11px] text-slate-700 font-medium">{acc.phone}</div>
                              <div className="text-[10px] text-slate-500">{acc.email}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">{acc.address}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-blue-600">{acc.plan}</div>
                              <div className="text-[11px] text-slate-500">${acc.monthlyFeeUSD} / mois</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900">{acc.totalConsultations} RDVs</div>
                              <div className="text-[10px] text-blue-600 font-medium">{acc.videoHoursUsed} h visio gérées</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                acc.status === 'Actif'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {acc.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => toggleStatus(acc.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  acc.status === 'Actif'
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {acc.status === 'Actif' ? 'Suspendre' : 'Activer'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BILLING & SUBSCRIPTIONS TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter Plan */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">Praticien Solo</span>
                    <h3 className="text-xl font-black text-slate-900 font-brand mt-4">Plan Starter</h3>
                    <div className="text-3xl font-black text-slate-900 mt-2 font-brand">$29 <span className="text-xs text-slate-500 font-sans font-normal">/ mois / praticien</span></div>
                    <p className="text-xs text-slate-500 mt-2">Pour les médecins indépendants avec gestion de cabinet simple.</p>
                    
                    <ul className="mt-5 space-y-2 text-xs text-slate-600">
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Agenda et RDV cabinet illimités</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Fiche référencée sur SangO Health</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Rappels SMS de RDV</span></li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    Facturation Mobile Money ou Carte
                  </div>
                </div>

                {/* Pro Cabinet Plan */}
                <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-md shadow-blue-500/10 flex flex-col justify-between relative">
                  <span className="absolute top-4 right-4 bg-blue-600 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">Recommandé</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">Cabinet Médical</span>
                    <h3 className="text-xl font-black text-slate-900 font-brand mt-4">Pro Cabinet</h3>
                    <div className="text-3xl font-black text-slate-900 mt-2 font-brand">$59 <span className="text-xs text-slate-500 font-sans font-normal">/ mois</span></div>
                    <p className="text-xs text-slate-600 mt-2">Inclut le module complet de Téléconsultation Vidéo HD.</p>
                    
                    <ul className="mt-5 space-y-2 text-xs text-slate-700">
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Toutes les options Starter</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Téléconsultations vidéo sécurisées</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Salle d'attente virtuelle praticien</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-600" /><span>Support prioritaire Kinshasa</span></li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-4 border-t border-blue-100 text-xs text-blue-700 font-semibold">
                    Abonnement le plus populaire
                  </div>
                </div>

                {/* Clinique Pro Plan */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">Clinique & Centre</span>
                    <h3 className="text-xl font-black text-slate-900 font-brand mt-4">Clinique Pro</h3>
                    <div className="text-3xl font-black text-slate-900 mt-2 font-brand">$149 <span className="text-xs text-slate-500 font-sans font-normal">/ mois</span></div>
                    <p className="text-xs text-slate-500 mt-2">Jusqu'à 10 praticiens, secrétariat et multi-spécialités.</p>
                    
                    <ul className="mt-5 space-y-2 text-xs text-slate-600">
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-600" /><span>Multi-médecins & secrétariat</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-600" /><span>Téléconsultations multi-postes</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-600" /><span>Statistiques d'activité de la clinique</span></li>
                      <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-600" /><span>Gestionnaire de compte dédié</span></li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    Facturation mensuelle ou annuelle (-15%)
                  </div>
                </div>
              </div>

              {/* Mobile Money Collections Ledger */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 font-brand">Encaissements Abonnements SaaS (Mobile Money & Carte)</h4>
                    <p className="text-xs text-slate-500">Suivi des règlements reçus par les praticiens et centres de santé</p>
                  </div>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                    M-Pesa &bull; Orange &bull; Airtel &bull; Visa
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Réf Transaction</th>
                        <th className="py-3 px-4">Médecin / Établissement</th>
                        <th className="py-3 px-4">Plan SaaS</th>
                        <th className="py-3 px-4">Moyen de Paiement</th>
                        <th className="py-3 px-4">Montant (USD / CDF)</th>
                        <th className="py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {accounts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                            Aucun encaissement d'abonnement pour le moment. Dès qu'un compte praticien est activé, ses transactions apparaissent ici.
                          </td>
                        </tr>
                      ) : (
                        accounts.map((acc, idx) => (
                          <tr key={acc.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">RDC-PAY-{acc.id.toString().slice(-5) || idx + 100}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{acc.name} ({acc.clinicName})</td>
                            <td className="py-3 px-4 text-slate-700">{acc.plan}</td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                Mobile Money
                              </span>
                            </td>
                            <td className="py-3 px-4 text-emerald-600 font-bold">${acc.monthlyFeeUSD} ({(acc.monthlyFeeUSD * 2850).toLocaleString()} CDF)</td>
                            <td className="py-3 px-4">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {acc.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* INFRASTRUCTURE & VIDEO USAGE TAB */}
          {(activeTab === 'teleconsultation' || (activeTab as any) === 'infrastructure') && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-brand">Statut des Serveurs de Téléconsultation</h3>
                    <p className="text-xs text-slate-500">Monitoring WebRTC et bande passante pour les appels médicaux</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Opérationnel</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="text-xs text-slate-500 font-semibold">Latence Moyenne (Kinshasa)</div>
                    <div className="text-2xl font-black text-slate-900 mt-1 font-brand">28 ms</div>
                    <div className="text-[11px] text-blue-600 font-medium mt-1">Excellente qualité d'appel</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="text-xs text-slate-500 font-semibold">Sessions Vidéo Ce Mois</div>
                    <div className="text-2xl font-black text-slate-900 mt-1 font-brand">342 appels</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">98.8% sans coupure</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="text-xs text-slate-500 font-semibold">Volume de Données Chiffrées</div>
                    <div className="text-2xl font-black text-slate-900 mt-1 font-brand">148 GB</div>
                    <div className="text-[11px] text-purple-600 font-medium mt-1">Chiffrement AES-256 bout en bout</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPER ADMINS & DIRECTION TAB */}
          {activeTab === 'admins' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header / Intro */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Gouvernance & Sécurité RDC</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-brand">
                      Super Administrateurs SangO Health
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
                      Gestion des accès de niveau direction, invitations officielles Supabase Auth et création des mots de passe sécurisés pour les deux Super Admins.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-right">
                      <div className="text-[11px] text-slate-500 font-medium">Statut Supabase Auth</div>
                      <div className="text-xs font-bold text-emerald-600 flex items-center space-x-1.5 justify-end mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Opérationnel & Connecté</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* List of 2 Super Admins */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {superAdmins.map((admin) => (
                  <div 
                    key={admin.email}
                    className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={admin.avatar} 
                            alt={admin.name} 
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-200 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-black text-slate-900 font-brand">{admin.name}</h3>
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                SUPER ADMIN
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{admin.email}</span>
                            </div>
                          </div>
                        </div>

                        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{admin.status}</span>
                        </span>
                      </div>

                      {/* Permissions & Details */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 mb-5 space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Privilèges Système Détenus :
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                          <div className="flex items-center space-x-1.5 text-blue-700">
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>Contrôle SaaS Global</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-blue-700">
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>Gestion Cabinets RDC</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-blue-700">
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>Encaissements Mobile Money</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-blue-700">
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>Accès Supabase PostgreSQL</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Feedback banner */}
                      {inviteStatus[admin.email] && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-start space-x-2 animate-in fade-in duration-200">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{inviteStatus[admin.email]}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={isInviting[admin.email]}
                        onClick={() => handleSendInvite(admin.email)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
                      >
                        {isInviting[admin.email] ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Envoi de l'invitation...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Renvoyer l'email d'invitation</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAdminEmail(admin.email);
                          setIsSetPasswordOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center space-x-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Définir Mot de Passe</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Supabase Infrastructure Security Info */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2 font-brand">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Architecture Sécurité & Authentification</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="font-bold text-slate-900 mb-1">Serveur d'Auth Supabase</div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">
                      Connecté au projet Supabase <code className="text-blue-700 font-mono font-semibold">fpfaerpzwkgivfluwvpe</code> avec conformité RGPD/HIPAA et TLS 1.3.
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="font-bold text-slate-900 mb-1">Mots de passe Chiffrés</div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">
                      Hachage cryptographique irréversible avec sel unique par administrateur. Aucun mot de passe en clair.
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="font-bold text-slate-900 mb-1">Invitations & Magic Link</div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">
                      Tokens temporaires à usage unique (TTL 3600s) envoyés directement aux adresses emails vérifiées des Super Admins.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: DEFINIR MOT DE PASSE SUPER ADMIN */}
      {isSetPasswordOpen && (
        <SetPasswordModal
          userEmail={selectedAdminEmail}
          onClose={() => setIsSetPasswordOpen(false)}
          onSuccess={() => {
            setInviteStatus(prev => ({
              ...prev,
              [selectedAdminEmail]: "Mot de passe défini avec succès !"
            }));
          }}
        />
      )}

      {/* MODAL: ONBOARD NEW DOCTOR ACCOUNT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 font-brand">Créer un Compte Praticien / Cabinet</h3>
                <p className="text-xs text-slate-500">Le praticien recevra ses accès pour gérer ses consultations et son cabinet</p>
              </div>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom Complet du Praticien *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Christian Mwamba"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Spécialité *
                  </label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Généraliste">Généraliste</option>
                    <option value="Cardiologue">Cardiologue</option>
                    <option value="Pédiatre">Pédiatre</option>
                    <option value="Dentiste">Dentiste</option>
                    <option value="Gynécologue">Gynécologue</option>
                    <option value="Ophtalmologue">Ophtalmologue</option>
                    <option value="Dermatologue">Dermatologue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Formule d'Abonnement SaaS *
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Starter">Starter ($29/m - Cabinet)</option>
                    <option value="Pro Cabinet">Pro Cabinet ($59/m - Cabinet & Visio)</option>
                    <option value="Clinique Pro">Clinique Pro ($149/m - Multi-postes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom du Cabinet / Clinique
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centre Médical de la Paix"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Professionnel *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="praticien@clinique.cd"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Téléphone (WhatsApp / SMS)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adresse du Cabinet (Kinshasa)
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Activer le Compte Médecin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
