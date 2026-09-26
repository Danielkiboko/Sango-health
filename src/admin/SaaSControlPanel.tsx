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
  RefreshCw
} from 'lucide-react';
import { Doctor, SaaSDoctorAccount, SuperAdminUser } from '../types';
import { INITIAL_SAAS_ACCOUNTS } from '../data/saasAccounts';
import { dataService } from '../lib/dataService';
import SetPasswordModal from '../components/SetPasswordModal';

interface SaaSControlPanelProps {
  doctors: Doctor[];
  onAddDoctor: (newDoctor: Doctor) => void;
  onUpdateDoctorStatus: (id: number, status: 'Actif' | 'Suspendu') => void;
}

export default function SaaSControlPanel({ onAddDoctor, onUpdateDoctorStatus }: SaaSControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'billing' | 'infrastructure' | 'admins'>('overview');
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

  const toggleStatus = (id: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const nextStatus = acc.status === 'Actif' ? 'Suspendu' : 'Actif';
        onUpdateDoctorStatus(id, nextStatus);
        return { ...acc, status: nextStatus };
      }
      return acc;
    }));
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchPlan = filterPlan === 'all' || acc.plan === filterPlan;
    const matchQuery = acc.name.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                       acc.clinicName.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                       acc.specialty.toLowerCase().includes(searchDoctorQuery.toLowerCase());
    return matchPlan && matchQuery;
  });

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen pb-16">
      {/* Top Banner / SaaS Admin Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Control Panel SaaS
                </span>
                <span className="text-xs text-slate-400">Supervision Business B2B</span>
              </div>
              <h1 className="text-xl font-black text-white font-brand">SangO Health &bull; Administration Centrale</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Créer un Médecin / Cabinet</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8 text-xs font-bold border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Vue d'Ensemble Business</span>
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'doctors'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Cabinets & Médecins ({accounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'billing'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Abonnements & Plans SaaS</span>
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className={`py-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'infrastructure'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Usage Vidéo Réseau</span>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'admins'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Équipe & Super Admins ({superAdmins.length || 2})</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
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
        {activeTab === 'infrastructure' && (
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
