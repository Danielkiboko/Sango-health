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
  User,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Settings,
  Home,
  BarChart3,
  PieChart,
  Server,
  Zap,
  Globe,
  Radio,
  Clock,
  Star,
  CheckCircle,
  Menu,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Phone,
  Sparkles,
  Sliders
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
  onUpdateDoctorSubscription?: (doctorId: number, updates: {
    plan?: 'Starter' | 'Pro Cabinet' | 'Clinique Pro';
    subscriptionExpiresAt?: string;
    subscriptionStatus?: 'Actif' | 'Expiré' | 'Suspendu';
    status?: 'Actif' | 'Suspendu' | 'Expiré';
    monthlyFeeUSD?: number;
    lastPaymentDate?: string;
    paymentMethod?: string;
  }) => void;
  onReturnHome?: () => void;
  currentUser?: { name: string; email: string; role: string; uid?: string } | null;
}

export default function SaaSControlPanel({ 
  doctors, 
  appointments = [], 
  onAddDoctor, 
  onUpdateDoctorStatus,
  onUpdateDoctorSubscription,
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
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<'all' | 'active' | 'imminent' | 'expired'>('all');
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');

  // Subscription Management Modal State
  const [selectedDoctorForSub, setSelectedDoctorForSub] = useState<Doctor | null>(null);
  const [deactivationNotification, setDeactivationNotification] = useState<string | null>(null);

  useEffect(() => {
    dataService.getSuperAdmins().then(setSuperAdmins);
    dataService.getSaaSAccounts().then(accs => {
      if (accs && accs.length > 0) setAccounts(accs);
    });
  }, []);

  // Helper calculating remaining days & expiration status
  const getSubscriptionInfo = (doc: Doctor) => {
    if (!doc.subscriptionExpiresAt) {
      return { days: 999, isExpired: false, isImminent: false, label: 'Non défini' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(doc.subscriptionExpiresAt);
    exp.setHours(23, 59, 59, 999);
    const diffTime = exp.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = days <= 0 || doc.status === 'Suspendu' || doc.subscriptionStatus === 'Expiré';
    const isImminent = !isExpired && days <= 7;
    return { 
      days, 
      isExpired, 
      isImminent, 
      label: isExpired ? `Échu (${Math.abs(days)}j)` : `${days}j restants` 
    };
  };

  // Automated Expiration Check & Immediate Deactivation
  const runAutoDeactivationScan = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let countDeactivated = 0;

    doctors.forEach(doc => {
      if (doc.subscriptionExpiresAt) {
        const exp = new Date(doc.subscriptionExpiresAt);
        exp.setHours(23, 59, 59, 999);
        if (exp < today && doc.status !== 'Suspendu') {
          countDeactivated++;
          if (onUpdateDoctorSubscription) {
            onUpdateDoctorSubscription(doc.id, {
              status: 'Suspendu',
              subscriptionStatus: 'Expiré'
            });
          } else {
            onUpdateDoctorStatus(doc.id, 'Suspendu');
          }
        }
      }
    });

    if (countDeactivated > 0) {
      setDeactivationNotification(
        `⚡ Règle d'échéance appliquée : ${countDeactivated} praticien(s) dont l'échéance est dépassée ont été automatiquement DÉSACTIVÉS et retirés des recherches patients.`
      );
    } else {
      setDeactivationNotification(
        `✓ Contrôle automatique : Tous les comptes avec échéance dépassée sont déjà suspendus et masqués.`
      );
    }
  };

  // Quick 1-Click Renewal (+30 days, +90 days, etc.)
  const handleQuickRenewDoctor = (doctorId: number, daysToAdd = 30) => {
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) return;

    const baseDate = doc.subscriptionExpiresAt && new Date(doc.subscriptionExpiresAt) > new Date()
      ? new Date(doc.subscriptionExpiresAt)
      : new Date();
    
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newExpiresAt = baseDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    if (onUpdateDoctorSubscription) {
      onUpdateDoctorSubscription(doctorId, {
        status: 'Actif',
        subscriptionStatus: 'Actif',
        subscriptionExpiresAt: newExpiresAt,
        lastPaymentDate: todayStr
      });
    } else {
      onUpdateDoctorStatus(doctorId, 'Actif');
    }

    setDeactivationNotification(
      `🎉 Abonnement du ${doc.name} renouvelé avec succès pour +${daysToAdd} jours (jusqu'au ${newExpiresAt}). Le médecin est réactivé et réservable en ligne !`
    );
  };

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

  // Business Metrics Calculation based on Doctors
  const activeDoctorsList = doctors.filter(d => {
    const info = getSubscriptionInfo(d);
    return !info.isExpired && d.status === 'Actif';
  });
  const expiredDoctorsList = doctors.filter(d => {
    const info = getSubscriptionInfo(d);
    return info.isExpired || d.status === 'Suspendu';
  });
  const imminentDoctorsList = doctors.filter(d => getSubscriptionInfo(d).isImminent);

  const mrrUSD = activeDoctorsList.reduce((sum, d) => {
    const fee = d.monthlyFeeUSD || (d.subscriptionPlan === 'Starter' ? 29 : d.subscriptionPlan === 'Clinique Pro' ? 149 : 59);
    return sum + fee;
  }, 0);
  const mrrCDF = mrrUSD * 2850; // Approx rate 1 USD = 2850 CDF
  const totalNetworkConsultations = appointments.length > 0 ? appointments.length : 142;
  const totalVideoHours = Math.round(totalNetworkConsultations * 0.65);

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newEmail) return;

    const feeMap = {
      'Starter': 29,
      'Pro Cabinet': 59,
      'Clinique Pro': 149
    };

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);
    const expStr = expDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

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
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      subscriptionExpiresAt: expStr,
      subscriptionStatus: 'Actif'
    };

    setAccounts([newAccount, ...accounts]);
    dataService.addSaaSAccount(newAccount);

    // Push into public doctors list with full subscription binding
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
      slots: ["09:00", "11:00", "14:30", "16:00"],
      status: 'Actif',
      subscriptionPlan: newPlan,
      subscriptionExpiresAt: expStr,
      subscriptionStatus: 'Actif',
      monthlyFeeUSD: feeMap[newPlan],
      clinicName: newAccount.clinicName,
      phone: newPhone,
      email: newEmail,
      lastPaymentDate: todayStr,
      paymentMethod: 'M-Pesa'
    });

    // Reset & close
    setNewDoctorName('');
    setNewClinicName('');
    setNewEmail('');
    setIsAddModalOpen(false);
  };

  const toggleDoctorStatus = async (id: number) => {
    const doc = doctors.find(d => d.id === id);
    if (!doc) return;
    const nextStatus = doc.status === 'Actif' ? 'Suspendu' : 'Actif';
    if (onUpdateDoctorSubscription) {
      onUpdateDoctorSubscription(id, {
        status: nextStatus,
        subscriptionStatus: nextStatus === 'Actif' ? 'Actif' : 'Suspendu'
      });
    } else {
      onUpdateDoctorStatus(id, nextStatus);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchPlan = filterPlan === 'all' || doc.subscriptionPlan === filterPlan;
    const matchQuery = doc.name.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                       (doc.clinicName && doc.clinicName.toLowerCase().includes(searchDoctorQuery.toLowerCase())) ||
                       doc.specialty.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                       doc.address.toLowerCase().includes(searchDoctorQuery.toLowerCase());
    
    const info = getSubscriptionInfo(doc);
    let matchStatus = true;
    if (doctorStatusFilter === 'active') matchStatus = !info.isExpired && doc.status === 'Actif';
    if (doctorStatusFilter === 'expired') matchStatus = info.isExpired || doc.status === 'Suspendu';
    if (doctorStatusFilter === 'imminent') matchStatus = info.isImminent;

    return matchPlan && matchQuery && matchStatus;
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
          {/* 1. Vue d'ensemble & Analyses SaaS */}
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'overview'
                ? 'border border-blue-500/40 bg-blue-600/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'overview' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>Analyses & Dashboard</span>
          </button>

          {/* 2. Finances & Abonnements SaaS */}
          <button
            onClick={() => { setActiveTab('billing'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'billing'
                ? 'border border-emerald-500/40 bg-emerald-600/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <DollarSign className={`w-5 h-5 ${activeTab === 'billing' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Finances & Facturation</span>
          </button>

          {/* 3. Praticiens & Cabinets Réseau */}
          <button
            onClick={() => { setActiveTab('doctors'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'doctors'
                ? 'border border-blue-500/40 bg-blue-600/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Stethoscope className={`w-5 h-5 ${activeTab === 'doctors' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>Praticiens & Cabinets</span>
            <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              {accounts.length}
            </span>
          </button>

          {/* 4. Supervision des Consultations */}
          <button
            onClick={() => { setActiveTab('appointments'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'appointments'
                ? 'border border-purple-500/40 bg-purple-600/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'appointments' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Supervision Flux RDV</span>
            {appointments && appointments.length > 0 && (
              <span className="ml-auto text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                {appointments.length}
              </span>
            )}
          </button>

          {/* 5. Infrastructure Vidéo SFU */}
          <button
            onClick={() => { setActiveTab('teleconsultation'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'teleconsultation'
                ? 'border border-amber-500/40 bg-amber-600/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Video className={`w-5 h-5 ${activeTab === 'teleconsultation' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Serveurs Vidéo SFU</span>
          </button>

          {/* 6. Passerelle SMS & Alertes */}
          <button
            onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'messages'
                ? 'border border-slate-700/80 bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'text-white' : 'text-slate-400'}`} />
            <span>Passerelle SMS & Alertes</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* 7. Sécurité & Super Admins */}
          <button
            onClick={() => { setActiveTab('admins'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'admins'
                ? 'border border-indigo-500/40 bg-indigo-600/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'admins' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span>Sécurité & Admins</span>
          </button>
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
                  {activeTab === 'overview' && 'Analyses globales, finances et indicateurs de performance SaaS'}
                  {activeTab === 'billing' && 'Encaissements Mobile Money, plans d\'abonnement et comptabilité SaaS'}
                  {activeTab === 'doctors' && 'Gestion de la plateforme, validation et onboarding des praticiens'}
                  {activeTab === 'appointments' && 'Supervision globale des flux et consultations du réseau'}
                  {activeTab === 'teleconsultation' && 'Infrastructure visio WebRTC / LiveKit SFU'}
                  {activeTab === 'admins' && 'Super Administrateurs, contrôle d\'accès et sécurité RLS'}
                  {activeTab === 'messages' && 'Passerelle SMS & notifications réseau'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-brand">
                {activeTab === 'overview' ? 'Analyses & Tableau de Bord SaaS' : 
                 activeTab === 'billing' ? 'Finances & Abonnements SaaS' : 
                 activeTab === 'doctors' ? 'Gestion Praticiens & Cabinets' : 
                 activeTab === 'appointments' ? 'Supervision des Consultations' : 
                 activeTab === 'teleconsultation' ? 'Infrastructure Vidéo SFU' : 
                 activeTab === 'admins' ? 'Sécurité & Super Administrateurs' : 
                 'Passerelle SMS & Alertes'}
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

          {/* OVERVIEW / ANALYTICS TAB (TABLEAU DE BORD SAAS EXÉCUTIF & ANALYTICS) */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Executive Welcome & Platform Status Banner */}
              <div className="bg-gradient-to-r from-[#0a1128] via-[#101f42] to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>PLATEFORME SANGO HEALTH EN DIRECT • KINSHASA</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-brand tracking-tight text-white">
                    Supervision & Analytics de l'Application
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Pilotage centralisé de la plateforme SaaS : analyse d'usage, suivi des finances et abonnements, modération des cabinets et santé de l'infrastructure.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Finances & Facturation</span>
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Inscrire un Praticien</span>
                  </button>
                </div>
              </div>

              {/* SECTION ANALYSES D'USAGE DE L'APPLICATION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Analyse des Modes de Consultation */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-brand">Répartition des Modes de Consultation</h3>
                      <p className="text-xs text-slate-500">Volume comparatif Cabinet Physique vs Vidéo HD</p>
                    </div>
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                      Temps Réel
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Visual Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-blue-700 flex items-center space-x-1.5">
                          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                          <span>Cabinet Présentiel (68%)</span>
                        </span>
                        <span className="text-emerald-700 flex items-center space-x-1.5">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                          <span>Téléconsultation Vidéo (32%)</span>
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                        <div className="bg-blue-600 h-full rounded-l-full transition-all duration-500" style={{ width: '68%' }}></div>
                        <div className="bg-emerald-500 h-full rounded-r-full transition-all duration-500" style={{ width: '32%' }}></div>
                      </div>
                    </div>

                    {/* Stats Highlights */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Présentiel</span>
                        <span className="text-base font-black text-slate-900">68%</span>
                        <span className="text-[10px] text-slate-500 block">En cabinet</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Téléconsult.</span>
                        <span className="text-base font-black text-emerald-600">32%</span>
                        <span className="text-[10px] text-slate-500 block">WebRTC SFU</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Durée Moyenne</span>
                        <span className="text-base font-black text-blue-600">22 min</span>
                        <span className="text-[10px] text-slate-500 block">Par consultation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Analyse des Spécialités les Plus Sollicitées à Kinshasa */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-brand">Spécialités les Plus Demandées</h3>
                      <p className="text-xs text-slate-500">Demande de consultations par domaine médical</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">Kinshasa RDC</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Médecine Générale</span>
                        <span className="font-bold text-slate-900">38%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: '38%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Pédiatrie & Santé Enfant</span>
                        <span className="font-bold text-slate-900">24%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '24%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Gynécologie & Obstétrique</span>
                        <span className="font-bold text-slate-900">18%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Cardiologie & Vasculaire</span>
                        <span className="font-bold text-slate-900">12%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Dermatologie & Autres</span>
                        <span className="font-bold text-slate-900">8%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. PERFORMANCE & SYSTEM HEALTH */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Taux de Présence RDV</div>
                      <div className="text-[10px] text-slate-500">Rappels SMS automatiques</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-brand">94.2%</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">Seulement 5.8% de no-show</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Satisfaction Réseau</div>
                      <div className="text-[10px] text-slate-500">Avis patients certifiés</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-brand">4.9 / 5.0</div>
                  <div className="text-[10px] text-slate-500 mt-1">Sur 150+ avis recueillis</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Supabase & RLS</div>
                      <div className="text-[10px] text-slate-500">Base de données Cloud</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-brand">100%</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">Latence 38ms • RLS Actif</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Serveurs Vidéo SFU</div>
                      <div className="text-[10px] text-slate-500">WebRTC LiveKit</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-brand">99.98%</div>
                  <div className="text-[10px] text-purple-600 font-semibold mt-1">Haute disponibilité</div>
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
                  <div className="text-3xl font-black text-slate-900 font-brand">{activeDoctorsList.length} <span className="text-xs text-slate-500 font-sans font-medium">comptes</span></div>
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

                  {doctors.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Building className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Aucun cabinet ou praticien enregistré</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Cliquez sur "+ Nouveau Compte Praticien" pour onboarder vos praticiens partenaires.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {doctors.slice(0, 5).map(doc => {
                        const subInfo = getSubscriptionInfo(doc);
                        const plan = doc.subscriptionPlan || 'Pro Cabinet';
                        const fee = doc.monthlyFeeUSD || (plan === 'Starter' ? 29 : plan === 'Clinique Pro' ? 149 : 59);

                        return (
                          <div key={doc.id} className="py-3.5 flex items-center justify-between">
                            <div className="flex items-center space-x-3.5">
                              {doc.image ? (
                                <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                                  {doc.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                  <span>{doc.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
                                    {doc.specialty}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">{doc.clinicName || doc.address}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-bold text-blue-600">${fee}/mois</div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                subInfo.isExpired 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {subInfo.isExpired ? 'Désactivé' : 'Actif'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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
              {/* Notification Banner when automatic deactivation runs or update occurs */}
              {deactivationNotification && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start justify-between space-x-3 text-xs text-blue-900 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Gestion des Abonnements en Direct</h4>
                      <p className="text-slate-700 mt-0.5">{deactivationNotification}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDeactivationNotification(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Warning Alert if any doctor is expired and deactivated */}
              {expiredDoctorsList.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-rose-900 shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-rose-900">
                        {expiredDoctorsList.length} Praticien(s) Désactivé(s) pour Échéance Dépassée
                      </h4>
                      <span className="bg-rose-200/60 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        Règle Stricte Active
                      </span>
                    </div>
                    <p className="text-rose-800 mt-1">
                      Conformément à la règle de la plateforme SangO Health, tout médecin dont l'abonnement SaaS est échu est <strong>automatiquement désactivé</strong> : son profil est retiré de la recherche patient et les prises de rendez-vous sont bloquées jusqu'au renouvellement par l'administration ou validation du paiement Mobile Money.
                    </p>
                  </div>
                  <button
                    onClick={runAutoDeactivationScan}
                    className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Synchroniser & Désactiver</span>
                  </button>
                </div>
              )}

              {/* KPI Summary Specific to Doctor Subscriptions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Praticiens</div>
                  <div className="text-2xl font-black text-slate-900 font-brand mt-1">{doctors.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Réseau SangO Health</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Actifs & En Ligne</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-brand mt-1">{activeDoctorsList.length}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Visibles & Réservables</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Échéance &lt; 7 jours</span>
                  </div>
                  <div className="text-2xl font-black text-amber-700 font-brand mt-1">{imminentDoctorsList.length}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Renouvellement imminent</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Échus &bull; Désactivés</span>
                  </div>
                  <div className="text-2xl font-black text-rose-700 font-brand mt-1">{expiredDoctorsList.length}</div>
                  <div className="text-[10px] text-rose-600 mt-0.5">Bloqués hors plateforme</div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative flex-1 min-w-[240px]">
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
                    <option value="all">Tous les plans SaaS</option>
                    <option value="Starter">Starter ($29/m)</option>
                    <option value="Pro Cabinet">Pro Cabinet ($59/m)</option>
                    <option value="Clinique Pro">Clinique Pro ($149/m)</option>
                  </select>

                  <select
                    value={doctorStatusFilter}
                    onChange={(e) => setDoctorStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs (En ligne)</option>
                    <option value="imminent">Échéance &lt; 7 jours</option>
                    <option value="expired">Expirés / Suspendus (Désactivés)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={runAutoDeactivationScan}
                    title="Contrôle en un clic : détecte et suspend immédiatement les praticiens dont l'abonnement a expiré"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Vérifier Échéances</span>
                  </button>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2 shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouveau Praticien</span>
                  </button>
                </div>
              </div>

              {/* Unified Doctors & Subscriptions Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Médecin & Établissement</th>
                        <th className="py-3.5 px-4">Spécialité & Contact</th>
                        <th className="py-3.5 px-4">Formule SaaS & Tarif</th>
                        <th className="py-3.5 px-4">Échéance & Validité</th>
                        <th className="py-3.5 px-4">Statut Plateforme</th>
                        <th className="py-3.5 px-4 text-right">Actions Rapides</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                              <User className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">Aucun médecin ne correspond à votre filtre</p>
                            <p className="text-xs text-slate-400 mt-0.5">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map(doc => {
                          const subInfo = getSubscriptionInfo(doc);
                          const plan = doc.subscriptionPlan || 'Pro Cabinet';
                          const fee = doc.monthlyFeeUSD || (plan === 'Starter' ? 29 : plan === 'Clinique Pro' ? 149 : 59);

                          return (
                            <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                              {/* Médecin & Établissement */}
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  {doc.image ? (
                                    <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                                      {doc.name.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                                      <span>{doc.name}</span>
                                      {subInfo.isExpired && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                      )}
                                    </div>
                                    <div className="text-slate-500 text-[11px] flex items-center space-x-1 mt-0.5">
                                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate max-w-[200px]">{doc.clinicName || doc.address}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Spécialité & Contact */}
                              <td className="py-4 px-4">
                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold inline-block mb-1">
                                  {doc.specialty}
                                </span>
                                <div className="text-[11px] text-slate-500">{doc.phone || '+243 81 000 0000'}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{doc.email || 'contact@sango-health.com'}</div>
                              </td>

                              {/* Formule SaaS */}
                              <td className="py-4 px-4">
                                <div className="font-bold text-blue-600">{plan}</div>
                                <div className="text-[11px] font-semibold text-slate-700">${fee} / mois</div>
                                <div className="text-[10px] text-slate-400 font-mono">~ {(fee * 2850).toLocaleString()} CDF</div>
                              </td>

                              {/* Échéance & Compte à Rebours */}
                              <td className="py-4 px-4">
                                <div className="text-[11px] font-semibold text-slate-800">
                                  {doc.subscriptionExpiresAt 
                                    ? new Date(doc.subscriptionExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Non définie'}
                                </div>
                                <div className="mt-1">
                                  {subInfo.isExpired ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                      <span>ÉCHU &bull; DÉSACTIVÉ</span>
                                    </span>
                                  ) : subInfo.isImminent ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>{subInfo.label}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                                      <span>{subInfo.label}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Statut Plateforme */}
                              <td className="py-4 px-4">
                                {subInfo.isExpired ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      Hors Ligne (Bloqué)
                                    </span>
                                    <div className="text-[9px] text-rose-600 font-medium">Masqué aux patients</div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      En Ligne (Actif)
                                    </span>
                                    <div className="text-[9px] text-emerald-600 font-medium">Réservable en direct</div>
                                  </div>
                                )}
                              </td>

                              {/* Actions Rapides */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  {/* 1-Click +30 Days Renewal */}
                                  <button
                                    onClick={() => handleQuickRenewDoctor(doc.id, 30)}
                                    title="Renouveler immédiatement pour 30 jours et réactiver le médecin"
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center space-x-1"
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    <span>+30j</span>
                                  </button>

                                  {/* Full Manage Modal */}
                                  <button
                                    onClick={() => setSelectedDoctorForSub(doc)}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                                  >
                                    Gérer
                                  </button>

                                  {/* Suspend/Reactivate Toggle */}
                                  <button
                                    onClick={() => toggleDoctorStatus(doc.id)}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                                      doc.status === 'Actif' && !subInfo.isExpired
                                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {doc.status === 'Actif' && !subInfo.isExpired ? 'Suspendre' : 'Activer'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Revenu Mensuel (MRR)</div>
                  <div className="text-3xl font-black text-slate-900 font-brand mt-1">${mrrUSD} <span className="text-xs text-slate-500 font-sans font-normal">/ mois</span></div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">~ {mrrCDF.toLocaleString()} CDF</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Abonnements Actifs</div>
                  <div className="text-3xl font-black text-emerald-700 font-brand mt-1">{activeDoctorsList.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Praticiens cotisants à jour</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Comptes Échus / Bloqués</div>
                  <div className="text-3xl font-black text-rose-700 font-brand mt-1">{expiredDoctorsList.length}</div>
                  <div className="text-xs text-rose-600 mt-1 font-semibold">Désactivés de la plateforme</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Projection Annuelle (ARR)</div>
                  <div className="text-3xl font-black text-blue-700 font-brand mt-1">${(mrrUSD * 12).toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">Sur base du parc actuel</div>
                </div>
              </div>

              {/* Plans Overview Cards */}
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

              {/* Mobile Money Collections Ledger with Real Doctor Subscriptions */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 font-brand">Grand Livre des Abonnements & Règlements Praticiens</h4>
                    <p className="text-xs text-slate-500">Suivi des cotisations Mobile Money (M-Pesa, Orange Money, Airtel Money) et dates d'échéances</p>
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
                        <th className="py-3 px-4">Moyen de Règlement</th>
                        <th className="py-3 px-4">Cotisation Mensuelle</th>
                        <th className="py-3 px-4">Date d'Échéance</th>
                        <th className="py-3 px-4">Statut Abonnement</th>
                        <th className="py-3 px-4 text-right">Renouvellement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {doctors.map((doc, idx) => {
                        const subInfo = getSubscriptionInfo(doc);
                        const plan = doc.subscriptionPlan || 'Pro Cabinet';
                        const fee = doc.monthlyFeeUSD || (plan === 'Starter' ? 29 : plan === 'Clinique Pro' ? 149 : 59);
                        const method = doc.paymentMethod || (idx % 2 === 0 ? 'M-Pesa' : 'Orange Money');

                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">
                              SANGO-SUB-{(1000 + doc.id)}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {doc.name}
                              <div className="text-[10px] font-normal text-slate-500">{doc.clinicName || doc.address}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded">
                                {plan}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                {method}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-emerald-600 font-bold">
                              ${fee} ({(fee * 2850).toLocaleString()} CDF)
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[11px] font-semibold text-slate-800">
                                {doc.subscriptionExpiresAt 
                                  ? new Date(doc.subscriptionExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : 'Non définie'}
                              </div>
                              <div className="text-[10px] text-slate-400">{subInfo.label}</div>
                            </td>
                            <td className="py-3 px-4">
                              {subInfo.isExpired ? (
                                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                  Échu &bull; Désactivé
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                  Actif en règle
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleQuickRenewDoctor(doc.id, 30)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                >
                                  +30j
                                </button>
                                <button
                                  onClick={() => setSelectedDoctorForSub(doc)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                                >
                                  Éditer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* MODAL: MANAGE DOCTOR SUBSCRIPTION & EXPIRATION */}
      {selectedDoctorForSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setSelectedDoctorForSub(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 font-brand">Gérer l'Abonnement Praticien</h3>
                <p className="text-xs text-slate-500">Contrôle du plan SaaS, de l'échéance et de la désactivation automatique</p>
              </div>
            </div>

            {/* Doctor Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedDoctorForSub.image ? (
                  <img src={selectedDoctorForSub.image} alt={selectedDoctorForSub.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {selectedDoctorForSub.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedDoctorForSub.name}</div>
                  <div className="text-xs text-slate-500">{selectedDoctorForSub.specialty} &bull; {selectedDoctorForSub.clinicName || selectedDoctorForSub.address}</div>
                </div>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  getSubscriptionInfo(selectedDoctorForSub).isExpired
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {getSubscriptionInfo(selectedDoctorForSub).isExpired ? 'Désactivé' : 'Actif en ligne'}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const plan = (form.elements.namedItem('plan') as HTMLSelectElement).value as any;
              const expiresAt = (form.elements.namedItem('expiresAt') as HTMLInputElement).value;
              const paymentMethod = (form.elements.namedItem('paymentMethod') as HTMLSelectElement).value;
              const status = (form.elements.namedItem('status') as HTMLSelectElement).value as any;

              const feeMap: Record<string, number> = {
                'Starter': 29,
                'Pro Cabinet': 59,
                'Clinique Pro': 149
              };

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const expDate = new Date(expiresAt);
              expDate.setHours(23, 59, 59, 999);
              const isExp = expDate < today;

              const finalStatus = isExp ? 'Suspendu' : status;
              const finalSubStatus = isExp ? 'Expiré' : status === 'Suspendu' ? 'Suspendu' : 'Actif';

              if (onUpdateDoctorSubscription) {
                onUpdateDoctorSubscription(selectedDoctorForSub.id, {
                  plan,
                  subscriptionExpiresAt: expiresAt,
                  status: finalStatus,
                  subscriptionStatus: finalSubStatus,
                  monthlyFeeUSD: feeMap[plan] || 59,
                  paymentMethod,
                  lastPaymentDate: new Date().toISOString().split('T')[0]
                });
              } else {
                onUpdateDoctorStatus(selectedDoctorForSub.id, finalStatus);
              }

              setSelectedDoctorForSub(null);
              setDeactivationNotification(
                isExp 
                  ? `⚠️ Attention : L'échéance (${expiresAt}) étant dépassée, le praticien a été automatiquement DÉSACTIVÉ et retiré des recherches patients.`
                  : `✓ Abonnement du ${selectedDoctorForSub.name} mis à jour avec succès (Actif jusqu'au ${expiresAt}). Praticien visible et réservable en ligne.`
              );
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan d'Abonnement SaaS *
                  </label>
                  <select
                    name="plan"
                    defaultValue={selectedDoctorForSub.subscriptionPlan || 'Pro Cabinet'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Starter">Starter ($29/mois)</option>
                    <option value="Pro Cabinet">Pro Cabinet ($59/mois)</option>
                    <option value="Clinique Pro">Clinique Pro ($149/mois)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Statut du Compte Praticien *
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedDoctorForSub.status || 'Actif'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Actif">Actif (En ligne & Réservable)</option>
                    <option value="Suspendu">Suspendu (Désactivé de la plateforme)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Date d'Échéance de l'Abonnement *
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">Règle de désactivation automatique</span>
                </div>
                <input
                  type="date"
                  name="expiresAt"
                  required
                  id="expiresAtInput"
                  defaultValue={selectedDoctorForSub.subscriptionExpiresAt || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                />

                {/* Quick Add Buttons */}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Prolonger rapidement :</span>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('expiresAtInput') as HTMLInputElement;
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      if (input) input.value = d.toISOString().split('T')[0];
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg transition"
                  >
                    +30 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('expiresAtInput') as HTMLInputElement;
                      const d = new Date();
                      d.setDate(d.getDate() + 90);
                      if (input) input.value = d.toISOString().split('T')[0];
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg transition"
                  >
                    +90 jours (3 mois)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('expiresAtInput') as HTMLInputElement;
                      const d = new Date();
                      d.setDate(d.getDate() + 365);
                      if (input) input.value = d.toISOString().split('T')[0];
                    }}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg transition"
                  >
                    +1 an (-15%)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Moyen d'Encaissement Mobile Money
                  </label>
                  <select
                    name="paymentMethod"
                    defaultValue={selectedDoctorForSub.paymentMethod || 'M-Pesa'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="M-Pesa">M-Pesa (Vodacom RDC)</option>
                    <option value="Orange Money">Orange Money RDC</option>
                    <option value="Airtel Money">Airtel Money RDC</option>
                    <option value="Carte Bancaire">Carte Visa / Mastercard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Réf Transaction RDC
                  </label>
                  <input
                    type="text"
                    defaultValue={`PAY-RDC-${(1000 + selectedDoctorForSub.id)}`}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Informative Rule Callout */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Règle d'échéance :</strong> Si la date d'échéance sélectionnée est passée par rapport à aujourd'hui, le médecin est automatiquement <strong>désactivé</strong> et masqué de l'annuaire patient. Pour le réactiver, choisissez une date future et validez.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForSub(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer l'Abonnement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
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
