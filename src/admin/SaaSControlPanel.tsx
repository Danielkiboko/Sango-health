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
  BarChart3, 
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
  UserCheck,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  HeartPulse,
  User,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Settings,
  Home,
  FileText,
  Pill,
  Clock,
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
  doctors, 
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
      if (accs && accs.length > 0) setAccounts(accs);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* ── SIDEBAR (Style exact de la photo Amana Health -> SangO Health) ── */}
      <aside className={`w-full md:w-64 bg-[#0a1128] border-r border-slate-800/80 flex flex-col shrink-0 ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
        
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
          {/* Supervision des Consultations */}
          <button
            onClick={() => { setActiveTab('appointments'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'appointments'
                ? 'border border-slate-700/80 bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Supervision et audit des consultations du réseau"
          >
            <Activity className={`w-5 h-5 ${activeTab === 'appointments' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>Supervision Consultations</span>
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
        <div className="p-4 border-t border-slate-800/80 space-y-3">
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

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header / Bar */}
        <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Control Panel SaaS
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {activeTab === 'appointments' && 'Supervision globale des flux & consultations du réseau'}
                  {activeTab === 'messages' && 'Communications & alertes réseau'}
                  {activeTab === 'overview' && 'Supervision & indicateurs de santé'}
                  {activeTab === 'doctors' && 'Gestion des praticiens & établissements'}
                  {activeTab === 'teleconsultation' && 'Infrastructure visio WebRTC/LiveKit'}
                  {activeTab === 'billing' && 'Encaissements Mobile Money & plans SaaS'}
                  {activeTab === 'admins' && 'Super Administrateurs & sécurité RLS'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white font-brand capitalize">
                {activeTab === 'overview' ? 'Supervision Santé' : activeTab === 'doctors' ? 'Comptes Praticiens' : activeTab === 'teleconsultation' ? 'Téléconsultation SFU' : activeTab === 'admins' ? 'Sécurité & Admins' : activeTab === 'appointments' ? 'Supervision Consultations' : activeTab}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center space-x-2"
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
              <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-800/50 rounded-2xl p-4 flex items-start space-x-3 shadow-md">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h3 className="font-bold text-white text-sm">Supervision Globale des Consultations (Audit Réseau)</h3>
                  <p className="text-slate-300 mt-0.5">
                    Cette vue centralise l'ensemble des rendez-vous et téléconsultations pris par les patients auprès des praticiens du réseau. En tant qu'Administrateur, vous disposez d'un droit de regard pour l'audit qualité, la vérification du taux d'honorabilité et l'arbitrage en cas de litige.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Chercher patient, médecin, spécialité..."
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={appointmentStatusFilter}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400">
                  Total synchronisé Supabase : <strong className="text-white">{filteredAppointments.length}</strong> rendez-vous
                </div>
              </div>

              {/* Appointments Table */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">Praticien Assigné</th>
                        <th className="py-3.5 px-4">Date & Heure</th>
                        <th className="py-3.5 px-4">Mode</th>
                        <th className="py-3.5 px-4">Ordonnance</th>
                        <th className="py-3.5 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-medium">
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Aucun rendez-vous trouvé dans la base de données.
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map(app => (
                          <tr key={app.id} className="hover:bg-slate-700/30 transition">
                            <td className="py-4 px-4 font-bold text-white">
                              {app.patientName}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-200">{app.doctorName}</div>
                              <div className="text-[10px] text-blue-400">{app.specialty}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div>{app.date}</div>
                              <div className="text-[10px] text-slate-400">{app.time}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-slate-700 px-2 py-0.5 rounded-md text-[11px] text-slate-200">
                                {app.type}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {app.prescription ? (
                                <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{app.prescription.id}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                app.status === 'Confirmé'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : app.status === 'Annulé'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
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
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white font-brand">Centre de Notifications & Communications</h3>
                    <p className="text-xs text-slate-400">Rappels SMS de consultations et alertes du système SangO Health</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                    Passerelle SMS RDC Active
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">Confirmation de rendez-vous automatique transmise</h4>
                        <span className="text-[10px] text-slate-400">Il y a 5 min</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        SMS envoyé au patient (+243 81 000 0000) pour sa consultation avec le Dr. Marie Laurent.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">Encaissement M-Pesa validé avec succès</h4>
                        <span className="text-[10px] text-slate-400">Il y a 22 min</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Transaction RDC-PAY-88492 confirmée (59 USD). Abonnement "Pro Cabinet" actif pour le Cabinet Médical des Martyrs.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">Politiques de sécurité RLS Supabase vérifiées</h4>
                        <span className="text-[10px] text-slate-400">Aujourd'hui</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Cloisonnement strict actif pour les Super Administrateurs (danielkiboko218@gmail.com & kibongef15@gmail.com).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW / HEALTH TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Health Reminders & Health Profile section matching user's photo */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Health reminders
                  </h2>
                  <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">You're up to date</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        We'll notify you when you have new health reminders. Tous les services cliniques et serveurs fonctionnent normalement.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Health profile
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Documents */}
                    <div 
                      onClick={() => setActiveTab('appointments')}
                      className="bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-4 flex items-center space-x-3.5 transition group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition">Documents</h4>
                        <p className="text-xs text-slate-400">Analyses, bilans & dossiers médicaux</p>
                      </div>
                    </div>

                    {/* Medical conditions */}
                    <div 
                      onClick={() => setActiveTab('doctors')}
                      className="bg-slate-800/80 border border-slate-700/80 hover:border-rose-500/50 rounded-2xl p-4 flex items-center space-x-3.5 transition group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition">Medical conditions</h4>
                        <p className="text-xs text-slate-400">Pathologies surveillées & spécialités</p>
                      </div>
                    </div>

                    {/* Medications */}
                    <div 
                      onClick={() => setActiveTab('billing')}
                      className="bg-slate-800/80 border border-slate-700/80 hover:border-purple-500/50 rounded-2xl p-4 flex items-center space-x-3.5 transition group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition">Medications</h4>
                        <p className="text-xs text-slate-400">Prescriptions & ordonnances</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* MRR */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-3 text-xs font-semibold">
                  <span>Revenu Récurrent (MRR)</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-white font-brand">${mrrUSD} <span className="text-xs text-slate-400 font-sans font-medium">/ mois</span></div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  ~ {mrrCDF.toLocaleString()} CDF / mois
                </div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-blue-400 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+18.5% de croissance ce mois</span>
                </div>
              </div>

              {/* Active Clinics */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3 text-xs font-semibold">
                  <span>Cabinets & Médecins Actifs</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Stethoscope className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-white font-brand">{activeSubscribers} <span className="text-xs text-slate-400 font-sans font-medium">comptes</span></div>
                <div className="text-xs text-slate-400 mt-1">100% à jour de cotisation</div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-blue-400 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>4 praticiens à Kinshasa</span>
                </div>
              </div>

              {/* Total Consultations Managed By Doctors */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3 text-xs font-semibold">
                  <span>Consultations Traitées</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-white font-brand">{totalNetworkConsultations}</div>
                <div className="text-xs text-slate-400 mt-1">Gérées de façon autonome par les praticiens</div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-blue-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Activité réseau en hausse de +24%</span>
                </div>
              </div>

              {/* Video Calls (Infrastructure SaaS) */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3 text-xs font-semibold">
                  <span>Téléconsultations Visio</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Video className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-white font-brand">{totalVideoHours.toFixed(1)} <span className="text-xs text-slate-400 font-sans font-medium">heures</span></div>
                <div className="text-xs text-slate-400 mt-1">Infrastructure WebRTC opérationnelle (99.9%)</div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-blue-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Serveurs média stables</span>
                </div>
              </div>
            </div>

            {/* Business Breakdown & Recent Doctor Onboardings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700/70 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white font-brand">Derniers Cabinets Onboardés</h2>
                    <p className="text-xs text-slate-400">Les praticiens pilotent leurs agendas et leurs consultations en direct</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                  >
                    Voir tous &rarr;
                  </button>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {accounts.map(acc => (
                    <div key={acc.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3.5">
                        <img src={acc.image} alt={acc.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center space-x-2">
                            <span>{acc.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                              {acc.specialty}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">{acc.clinicName} &bull; {acc.address}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-400">${acc.monthlyFeeUSD}/mois</div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          acc.status === 'Actif' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {acc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SaaS Revenue Distribution by Plan */}
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white font-brand mb-1">Offres & Plans SaaS</h2>
                  <p className="text-xs text-slate-400 mb-6">Répartition des abonnements par formule</p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Pro Cabinet ($59/m)</span>
                        <span className="text-blue-400">2 abonnés (40%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Clinique Pro ($149/m)</span>
                        <span className="text-purple-400">1 abonné (50% du MRR)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Starter ($29/m)</span>
                        <span className="text-blue-300">1 abonné (10%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-700/50 bg-slate-900/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      SaaS conforme : les praticiens sont seuls responsables des dossiers et consultations de leurs patients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCTORS & CLINICS MANAGEMENT TAB */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Chercher praticien, clinique, spécialité..."
                    value={searchDoctorQuery}
                    onChange={(e) => setSearchDoctorQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Tous les plans</option>
                  <option value="Starter">Starter ($29)</option>
                  <option value="Pro Cabinet">Pro Cabinet ($59)</option>
                  <option value="Clinique Pro">Clinique Pro ($149)</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nouveau Compte Praticien</span>
              </button>
            </div>

            {/* Doctors Accounts Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-700">
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
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {filteredAccounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-4 px-4 flex items-center space-x-3">
                          <img src={acc.image} alt={acc.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                          <div>
                            <div className="font-bold text-white text-sm">{acc.name}</div>
                            <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{acc.clinicName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-slate-700 px-2.5 py-1 rounded-lg text-slate-200 font-semibold">
                            {acc.specialty}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-[11px] text-slate-300">{acc.phone}</div>
                          <div className="text-[10px] text-slate-400">{acc.email}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{acc.address}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-blue-400">{acc.plan}</div>
                          <div className="text-[11px] text-slate-400">${acc.monthlyFeeUSD} / mois</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{acc.totalConsultations} RDVs</div>
                          <div className="text-[10px] text-blue-300">{acc.videoHoursUsed} h visio gérées</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            acc.status === 'Actif'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => toggleStatus(acc.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              acc.status === 'Actif'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {acc.status === 'Actif' ? 'Suspendre' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    ))}
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
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">Praticien Solo</span>
                  <h3 className="text-2xl font-black text-white font-brand mt-4">Plan Starter</h3>
                  <div className="text-3xl font-black text-white mt-2 font-brand">$29 <span className="text-xs text-slate-400 font-sans font-normal">/ mois / praticien</span></div>
                  <p className="text-xs text-slate-400 mt-2">Pour les médecins indépendants avec gestion de cabinet simple.</p>
                  
                  <ul className="mt-5 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Agenda et RDV cabinet illimités</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Fiche référencée sur SangO Health</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Rappels SMS de RDV</span></li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-400">
                  Facturation Mobile Money ou Carte
                </div>
              </div>

              {/* Pro Cabinet Plan */}
              <div className="bg-gradient-to-b from-blue-950/60 to-slate-800 border-2 border-blue-500/50 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl shadow-blue-500/10">
                <span className="absolute top-4 right-4 bg-blue-500 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">Recommandé</span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full">Cabinet Médical</span>
                  <h3 className="text-2xl font-black text-white font-brand mt-4">Pro Cabinet</h3>
                  <div className="text-3xl font-black text-white mt-2 font-brand">$59 <span className="text-xs text-slate-400 font-sans font-normal">/ mois</span></div>
                  <p className="text-xs text-slate-300 mt-2">Inclut le module complet de Téléconsultation Vidéo HD.</p>
                  
                  <ul className="mt-5 space-y-2 text-xs text-slate-200">
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Toutes les options Starter</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Téléconsultations vidéo sécurisées</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Salle d'attente virtuelle praticien</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-blue-400" /><span>Support prioritaire Kinshasa</span></li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-blue-500/30 text-xs text-blue-300 font-semibold">
                  Abonnement le plus populaire
                </div>
              </div>

              {/* Clinique Pro Plan */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">Clinique & Centre</span>
                  <h3 className="text-2xl font-black text-white font-brand mt-4">Clinique Pro</h3>
                  <div className="text-3xl font-black text-white mt-2 font-brand">$149 <span className="text-xs text-slate-400 font-sans font-normal">/ mois</span></div>
                  <p className="text-xs text-slate-400 mt-2">Jusqu'à 10 praticiens, secrétariat et multi-spécialités.</p>
                  
                  <ul className="mt-5 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-400" /><span>Multi-médecins & secrétariat</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-400" /><span>Téléconsultations multi-postes</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-400" /><span>Statistiques d'activité de la clinique</span></li>
                    <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-purple-400" /><span>Gestionnaire de compte dédié</span></li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-400">
                  Facturation mensuelle ou annuelle (-15%)
                </div>
              </div>
            </div>

            {/* Mobile Money Collections Ledger */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-2 mb-4">
                <div>
                  <h4 className="text-base font-bold text-white font-brand">Encaissements Abonnements SaaS (Mobile Money & Carte)</h4>
                  <p className="text-xs text-slate-400">Suivi des règlements reçus par les praticiens et centres de santé</p>
                </div>
                <span className="text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">
                  M-Pesa &bull; Orange &bull; Airtel &bull; Visa
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Réf Transaction</th>
                      <th className="py-3 px-4">Médecin / Établissement</th>
                      <th className="py-3 px-4">Plan SaaS</th>
                      <th className="py-3 px-4">Moyen de Paiement</th>
                      <th className="py-3 px-4">Montant (USD / CDF)</th>
                      <th className="py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    <tr className="hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">RDC-PAY-88492</td>
                      <td className="py-3 px-4 font-bold text-white">Dr. Marie Laurent (Cabinet Gombe)</td>
                      <td className="py-3 px-4 text-slate-200">Pro Cabinet</td>
                      <td className="py-3 px-4">
                        <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          M-Pesa (+243 81 294 8831)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">$59 (168 150 CDF)</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Payé
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">RDC-PAY-72109</td>
                      <td className="py-3 px-4 font-bold text-white">Dr. Patrick Nzuzi (Clinique Ngaliema)</td>
                      <td className="py-3 px-4 text-slate-200">Clinique Pro</td>
                      <td className="py-3 px-4">
                        <span className="bg-orange-500/20 text-orange-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Orange Money (+243 89 550 1204)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">$149 (424 650 CDF)</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Payé
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">RDC-PAY-61024</td>
                      <td className="py-3 px-4 font-bold text-white">Dr. Sarah Tshala (Centre Limete)</td>
                      <td className="py-3 px-4 text-slate-200">Starter</td>
                      <td className="py-3 px-4">
                        <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Airtel Money (+243 97 102 3349)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">$29 (82 650 CDF)</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Payé
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INFRASTRUCTURE & VIDEO USAGE TAB */}
        {(activeTab === 'teleconsultation' || (activeTab as any) === 'infrastructure') && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-brand">Statut des Serveurs de Téléconsultation</h3>
                  <p className="text-xs text-slate-400">Monitoring WebRTC et bande passante pour les appels médicaux</p>
                </div>
                <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  <span>Opérationnel</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Latence Moyenne (Kinshasa)</div>
                  <div className="text-2xl font-black text-white mt-1 font-brand">28 ms</div>
                  <div className="text-[11px] text-blue-400 mt-1">Excellente qualité d'appel</div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Sessions Vidéo Ce Mois</div>
                  <div className="text-2xl font-black text-white mt-1 font-brand">342 appels</div>
                  <div className="text-[11px] text-blue-400 mt-1">98.8% sans coupure</div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Volume de Données Chiffrées</div>
                  <div className="text-2xl font-black text-white mt-1 font-brand">148 GB</div>
                  <div className="text-[11px] text-purple-400 mt-1">Chiffrement AES-256 de bout en bout</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUPER ADMINS & DIRECTION TAB */}
        {activeTab === 'admins' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header / Intro */}
            <div className="bg-gradient-to-r from-blue-900/60 via-slate-800 to-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Gouvernance & Sécurité RDC</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-brand">
                    Super Administrateurs SangO Health
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Gestion des accès de niveau direction, invitations officielles Supabase Auth et création des mots de passe sécurisés pour les deux Super Admins.
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-right">
                    <div className="text-[11px] text-slate-400 font-medium">Statut Supabase Auth</div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 justify-end mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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
                  className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={admin.avatar} 
                          alt={admin.name} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-400/40 shadow-md"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-black text-white font-brand">{admin.name}</h3>
                            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                              SUPER ADMIN
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{admin.email}</span>
                          </div>
                        </div>
                      </div>

                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{admin.status}</span>
                      </span>
                    </div>

                    {/* Permissions & Details */}
                    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/60 mb-5 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Privilèges Système Détenus :
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <div className="flex items-center space-x-1.5 text-blue-300">
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          <span>Contrôle SaaS Global</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-blue-300">
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          <span>Gestion Cabinets RDC</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-blue-300">
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          <span>Encaissements Mobile Money</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-blue-300">
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          <span>Accès Supabase PostgreSQL</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Feedback banner */}
                    {inviteStatus[admin.email] && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-2xl text-xs text-blue-200 flex items-start space-x-2 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{inviteStatus[admin.email]}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-700/70 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isInviting[admin.email]}
                      onClick={() => handleSendInvite(admin.email)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
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
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center space-x-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-300" />
                      <span>Définir Mot de Passe</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Supabase Infrastructure Security Info */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 shadow-lg">
              <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2 font-brand">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>Architecture Sécurité & Authentification</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="font-bold text-white mb-1">Serveur d'Auth Supabase</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    Connecté au projet Supabase <code className="text-blue-300 font-mono">fpfaerpzwkgivfluwvpe</code> avec conformité RGPD/HIPAA et TLS 1.3.
                  </div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="font-bold text-white mb-1">Mots de passe Chiffrés</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    Hachage cryptographique irréversible avec sel unique par administrateur. Aucun mot de passe en clair.
                  </div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="font-bold text-white mb-1">Invitations & Magic Link</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-brand">Créer un Compte Praticien / Cabinet</h3>
                <p className="text-xs text-slate-400">Le praticien recevra ses identifiants pour gérer ses consultations</p>
              </div>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nom Complet du Praticien *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Christian Mwamba"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Spécialité *
                  </label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Formule d'Abonnement SaaS *
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Starter">Starter ($29/m - Cabinet)</option>
                    <option value="Pro Cabinet">Pro Cabinet ($59/m - Cabinet & Visio)</option>
                    <option value="Clinique Pro">Clinique Pro ($149/m - Multi-postes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nom du Cabinet / Clinique
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centre Médical de la Paix"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Professionnel *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="praticien@clinique.cd"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Téléphone (WhatsApp / SMS)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Adresse du Cabinet (Kinshasa)
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/20 transition flex items-center space-x-1.5"
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
