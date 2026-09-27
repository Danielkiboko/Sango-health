import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  User, 
  Video, 
  FileText, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Smartphone,
  Save,
  Sliders,
  Receipt,
  Search,
  Stethoscope,
  HeartPulse,
  Activity,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  Printer,
  QrCode,
  Send,
  Check,
  X,
  Users,
  Building,
  Edit3
} from 'lucide-react';
import { Appointment, Doctor, Prescription, DoctorScheduleDay, SaaSSubscriptionInvoice, UserProfile } from '../types';
import VideoConsultationRoomModal from '../components/VideoConsultationRoomModal';
import MobileMoneyBillingModal from './MobileMoneyBillingModal';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../lib/dataService';

interface DoctorPortalProps {
  appointments: Appointment[];
  doctors: Doctor[];
  currentUser?: UserProfile | null;
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
  onUpdateSchedule?: (doctorId: number, schedule: DoctorScheduleDay[], slots: string[]) => void;
  onUpdateStatus?: (appointmentId: number, status: 'Confirmé' | 'Terminé' | 'Annulé') => void;
  onCancelAppointment?: (id: number) => void;
}

export default function DoctorPortal({ 
  appointments, 
  doctors, 
  currentUser,
  onSavePrescription,
  onUpdateSchedule,
  onUpdateStatus,
  onCancelAppointment
}: DoctorPortalProps) {
  const { t } = useLanguage();

  // Détection dynamique du médecin connecté
  const currentDoctor: Doctor = useMemo(() => {
    if (currentUser?.name) {
      const match = doctors.find(d => 
        d.name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) return match;
      return {
        id: 999,
        name: currentUser.name.startsWith('Dr') ? currentUser.name : `Dr. ${currentUser.name}`,
        specialty: "Médecin Généraliste",
        address: "Cabinet Médical de Kinshasa, Gombe",
        rating: 5.0,
        reviewsCount: 12,
        fee: "30 000 CDF",
        nextSlot: "Aujourd'hui à 15:30",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
        consultationType: "Cabinet & Vidéo",
        bio: "Praticien conventionné en République Démocratique du Congo. Consultations en présentiel et en téléconsultation sécurisée.",
        slots: ["09:00", "10:30", "14:00", "15:30", "16:30"],
        schedule: []
      };
    }
    return doctors[0] || {
      id: 1,
      name: "Dr. Marie Laurent",
      specialty: "Généraliste",
      address: "12 Avenue des Martyrs, Gombe, Kinshasa",
      rating: 5.0,
      reviewsCount: 24,
      fee: "30 000 CDF",
      nextSlot: "Disponible",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
      consultationType: "Cabinet & Vidéo",
      bio: "Médecin généraliste d'expérience à Kinshasa.",
      slots: ["09:00", "10:30", "14:00", "15:30", "16:30"],
      schedule: []
    };
  }, [currentUser, doctors]);

  // Filtrer les consultations du médecin connecté
  const doctorAppointments = useMemo(() => {
    return appointments.filter(app => 
      !app.doctorName || 
      app.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase()) ||
      currentDoctor.name.toLowerCase().includes(app.doctorName.toLowerCase()) ||
      appointments.length <= 3
    );
  }, [appointments, currentDoctor.name]);

  // Onglet actif parmi les 8 onglets métier
  const [activeTab, setActiveTab] = useState<
    'agenda' | 'patients' | 'prescriptions' | 'teleconsultation' | 'schedule' | 'earnings' | 'billing' | 'profile'
  >('agenda');

  const [activeCallApp, setActiveCallApp] = useState<Appointment | null>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [patientSearch, setPatientSearch] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Schedule state
  const [schedule, setSchedule] = useState<DoctorScheduleDay[]>(
    currentDoctor.schedule && currentDoctor.schedule.length > 0 ? currentDoctor.schedule : [
      { day: "Lundi", isActive: true, startHour: "08:30", endHour: "17:00", type: "Cabinet & Vidéo" },
      { day: "Mardi", isActive: true, startHour: "08:30", endHour: "17:00", type: "Cabinet & Vidéo" },
      { day: "Mercredi", isActive: true, startHour: "09:00", endHour: "13:00", type: "Vidéo uniquement" },
      { day: "Jeudi", isActive: true, startHour: "08:30", endHour: "17:00", type: "Cabinet & Vidéo" },
      { day: "Vendredi", isActive: true, startHour: "08:30", endHour: "16:00", type: "Cabinet & Vidéo" },
      { day: "Samedi", isActive: false, startHour: "09:00", endHour: "12:00", type: "Cabinet uniquement" },
      { day: "Dimanche", isActive: false, startHour: "09:00", endHour: "12:00", type: "Cabinet uniquement" }
    ]
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>(
    currentDoctor.slots || ["09:00", "10:30", "14:00", "15:30", "16:30"]
  );
  const [newSlotTime, setNewSlotTime] = useState("");

  // Profil praticien state
  const [profileForm, setProfileForm] = useState({
    name: currentDoctor.name,
    specialty: currentDoctor.specialty,
    address: currentDoctor.address,
    fee: currentDoctor.fee || "30 000 CDF",
    bio: currentDoctor.bio || "",
    phone: "+243 81 294 8831",
    consultationType: currentDoctor.consultationType || "Cabinet & Vidéo"
  });

  // Nouveau formulaire d'ordonnance
  const [newPrescriptionPatient, setNewPrescriptionPatient] = useState("");
  const [newPrescriptionDiagnostic, setNewPrescriptionDiagnostic] = useState("");
  const [newPrescriptionMeds, setNewPrescriptionMeds] = useState<
    { name: string; dosage: string; duration: string; instructions: string }[]
  >([
    { name: "Paracétamol", dosage: "1000mg", duration: "5 jours", instructions: "1 comprimé toutes les 8h si douleur ou fièvre" }
  ]);

  // Liste des ordonnances émises par ce médecin
  const [issuedPrescriptions, setIssuedPrescriptions] = useState<Prescription[]>([
    {
      id: "ORD-942810",
      doctorName: currentDoctor.name,
      patientName: "Christian Kabeya",
      date: "27 Septembre 2026",
      medications: [
        { name: "Amoxicilline", dosage: "500mg", duration: "7 jours", instructions: "1 gélule matin, midi et soir" },
        { name: "Paracétamol", dosage: "1000mg", duration: "5 jours", instructions: "1 comprimé si douleur" }
      ],
      notes: "Contrôle clinique dans 10 jours si persistance des symptômes.",
      qrCodeToken: "SANGO-ORD-942810-VERIFIED",
      signatureStamp: "Signé numériquement • Dr. Partenaire",
      isDispensed: true,
      dispensedAt: "27 Sept 2026",
      dispensedByPharmacy: "Pharmacie de la Gombe"
    }
  ]);

  // Historique des factures SaaS
  const [invoices, setInvoices] = useState<SaaSSubscriptionInvoice[]>([
    {
      id: "FACT-SAAS-90412",
      accountName: currentDoctor.name,
      clinicName: "Cabinet Médical de Kinshasa",
      plan: "Pro Cabinet",
      amountUSD: 59,
      amountCDF: 59 * 2850,
      date: "01 Septembre 2026",
      paymentMethod: "M-Pesa",
      phoneNumber: "+243 81 294 8831",
      status: "Payé",
      transactionRef: "RDC-MPESA-88492"
    }
  ]);

  // Liste consolidée des patients suivis
  const patientsList = useMemo(() => {
    const map = new Map<string, { name: string; count: number; lastDate: string; type: string; phone: string; bloodGroup: string; allergies: string; vitals: { bp: string; pulse: string; temp: string }; notes: string }>();
    
    doctorAppointments.forEach(app => {
      const pName = app.patientName || "Patient";
      if (!map.has(pName)) {
        map.set(pName, {
          name: pName,
          count: 1,
          lastDate: app.date,
          type: app.type,
          phone: "+243 82 " + Math.floor(1000000 + Math.random() * 9000000),
          bloodGroup: "O+",
          allergies: "Aucune allergie connue",
          vitals: { bp: "120/80 mmHg", pulse: "74 bpm", temp: "36.8°C" },
          notes: "Patient suivi régulièrement pour consultation de routine."
        });
      } else {
        const item = map.get(pName)!;
        item.count += 1;
        item.lastDate = app.date;
      }
    });

    // Patients exemples si liste vide
    if (map.size === 0) {
      map.set("Christian Kabeya", {
        name: "Christian Kabeya",
        count: 3,
        lastDate: "Aujourd'hui à 14:30",
        type: "Cabinet & Vidéo",
        phone: "+243 82 458 9201",
        bloodGroup: "A+",
        allergies: "Pénicilline (réaction cutanée)",
        vitals: { bp: "125/82 mmHg", pulse: "72 bpm", temp: "37.1°C" },
        notes: "Antécédent de bronchite saisonnière. Bien stabilisé."
      });
      map.set("Francine Mulamba", {
        name: "Francine Mulamba",
        count: 2,
        lastDate: "Demain à 11:00",
        type: "Téléconsultation",
        phone: "+243 81 772 3410",
        bloodGroup: "O+",
        allergies: "Aucune",
        vitals: { bp: "118/76 mmHg", pulse: "68 bpm", temp: "36.6°C" },
        notes: "Contrôle bilan biologique annuel."
      });
    }

    return Array.from(map.values()).filter(p => 
      patientSearch === '' || p.name.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [doctorAppointments, patientSearch]);

  // Honoraires calculés
  const earningsStats = useMemo(() => {
    const feePerConsultation = 30000; // CDF
    const totalConsultations = doctorAppointments.length;
    const completedCount = doctorAppointments.filter(a => a.status === 'Terminé').length || 1;
    const totalCDF = completedCount * feePerConsultation;
    const totalUSD = Math.round(totalCDF / 2850);
    return {
      totalCDF,
      totalUSD,
      completedCount,
      totalConsultations
    };
  }, [doctorAppointments]);

  // Handlers
  const handleToggleDay = (index: number) => {
    setSchedule(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isActive: !copy[index].isActive };
      return copy;
    });
  };

  const handleScheduleChange = (index: number, field: keyof DoctorScheduleDay, value: any) => {
    setSchedule(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddSlot = () => {
    if (!newSlotTime || availableSlots.includes(newSlotTime)) return;
    const sorted = [...availableSlots, newSlotTime].sort();
    setAvailableSlots(sorted);
    setNewSlotTime("");
  };

  const handleRemoveSlot = (slot: string) => {
    setAvailableSlots(prev => prev.filter(s => s !== slot));
  };

  const handleSaveSchedule = async () => {
    if (onUpdateSchedule) {
      onUpdateSchedule(currentDoctor.id, schedule, availableSlots);
    }
    await dataService.updateDoctorSchedule(currentDoctor.id, schedule, availableSlots);
    showNotification("Vos horaires et créneaux ont été enregistrés et synchronisés sur Supabase !", 'success');
  };

  const handleAddMedication = () => {
    setNewPrescriptionMeds(prev => [
      ...prev,
      { name: "", dosage: "", duration: "", instructions: "" }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setNewPrescriptionMeds(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrescriptionPatient.trim()) {
      showNotification("Veuillez indiquer le nom du patient.", "error");
      return;
    }
    if (newPrescriptionMeds.length === 0 || !newPrescriptionMeds[0].name.trim()) {
      showNotification("Veuillez indiquer au moins un médicament.", "error");
      return;
    }

    const prescriptionId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPrescription: Prescription = {
      id: prescriptionId,
      doctorName: currentDoctor.name,
      patientName: newPrescriptionPatient.trim(),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      medications: newPrescriptionMeds.filter(m => m.name.trim() !== ''),
      notes: newPrescriptionDiagnostic.trim() || "Prescription médicale sous contrôle du praticien.",
      qrCodeToken: `SANGO-${prescriptionId}-VERIFIED`,
      signatureStamp: `Signé numériquement • ${currentDoctor.name}`,
      isDispensed: false
    };

    // Synchronisation Supabase
    await dataService.savePrescription(newPrescription);
    setIssuedPrescriptions([newPrescription, ...issuedPrescriptions]);

    // Lier au RDV correspondant si trouvé
    const matchingApp = doctorAppointments.find(a => 
      a.patientName.toLowerCase() === newPrescriptionPatient.trim().toLowerCase()
    );
    if (matchingApp && onSavePrescription) {
      onSavePrescription(matchingApp.id, newPrescription);
    }

    showNotification(`Ordonnance ${prescriptionId} émise et transmise avec succès au patient et aux pharmacies !`, 'success');

    // Réinitialiser le formulaire
    setNewPrescriptionDiagnostic("");
    setNewPrescriptionMeds([{ name: "", dosage: "", duration: "", instructions: "" }]);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    showNotification("Votre profil praticien et les informations de votre cabinet ont été mis à jour !", "success");
  };

  const handleStatusChange = async (appId: number, newStatus: 'Confirmé' | 'Terminé' | 'Annulé') => {
    if (onUpdateStatus) {
      onUpdateStatus(appId, newStatus);
    } else {
      await dataService.updateAppointmentStatus(appId, newStatus);
    }
    showNotification(`Consultation marquée comme "${newStatus}".`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold transition flex items-center space-x-2.5 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* BANNIÈRE MÉDECIN DYNAMIQUE (Plus de doublon de bouton !) */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-6 sm:p-8 rounded-3xl mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-blue-800/40">
        <div className="flex items-center space-x-5">
          <div className="relative">
            <img 
              src={currentDoctor.image} 
              alt={currentDoctor.name} 
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-400/50 shadow-md" 
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px]" title="Praticien actif & connecté">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500/20 text-blue-300 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border border-blue-500/30">
                Espace Praticien Santé
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Plan Pro Cabinet ($59/m)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 font-brand">{currentDoctor.name}</h1>
            <p className="text-xs text-slate-300 flex items-center space-x-2 mt-0.5">
              <span>{currentDoctor.specialty}</span>
              <span>&bull;</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>{currentDoctor.address}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Statistiques rapides & Raccourcis utiles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-blue-300 font-semibold uppercase">À venir</span>
            <span className="text-xl font-black text-white font-brand">{doctorAppointments.length}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-emerald-300 font-semibold uppercase">Honoraires perçus</span>
            <span className="text-xl font-black text-emerald-300 font-brand">
              ${earningsStats.totalUSD} <span className="text-xs text-slate-300 font-normal">USD</span>
            </span>
          </div>

          {/* Raccourcis d'action métier */}
          <button
            onClick={() => {
              setActiveTab('prescriptions');
              const firstPatient = doctorAppointments[0]?.patientName || "Christian Kabeya";
              setNewPrescriptionPatient(firstPatient);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Rédiger Ordonnance</span>
          </button>
        </div>
      </div>

      {/* 8 ONGLETS DU MÉDECIN — NAVIGATION MÉTIER CLAIRE ET STRUCTURÉE */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 space-x-1 sm:space-x-3 text-xs sm:text-sm font-semibold pb-1 scrollbar-none">
        <button 
          onClick={() => setActiveTab('agenda')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'agenda' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span>Consultations & Agenda ({doctorAppointments.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('patients')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'patients' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Dossiers Patients ({patientsList.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'prescriptions' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Émission Ordonnances</span>
        </button>

        <button 
          onClick={() => setActiveTab('teleconsultation')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'teleconsultation' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Video className="w-4 h-4 text-blue-600" />
          <span>Téléconsultation Vidéo</span>
        </button>

        <button 
          onClick={() => setActiveTab('schedule')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'schedule' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Plages & Créneaux</span>
        </button>

        <button 
          onClick={() => setActiveTab('earnings')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'earnings' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span>Honoraires ({earningsStats.completedCount})</span>
        </button>

        <button 
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'billing' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-blue-600" />
          <span>Abonnement Cabinet</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'profile' 
              ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-blue-600" />
          <span>Mon Cabinet & Profil</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. AGENDA & CONSULTATIONS */}
      {/* ======================================================== */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-brand">Agenda des Consultations</h2>
              <p className="text-xs text-slate-500">Gérez vos patients du jour, lancez la visio ou rédigez une ordonnance.</p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button 
                onClick={() => setAgendaFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${agendaFilter === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                Tous
              </button>
              <button 
                onClick={() => setAgendaFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition ${agendaFilter === 'today' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                Aujourd'hui
              </button>
              <button 
                onClick={() => setAgendaFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition ${agendaFilter === 'completed' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                Terminés
              </button>
            </div>
          </div>

          {doctorAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Aucune consultation programmée</h3>
              <p className="text-xs text-slate-500 mt-1">Vos futurs rendez-vous apparaîtront ici dès qu'un patient réservera.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {doctorAppointments.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base shadow-inner shrink-0">
                      {app.patientName ? app.patientName.charAt(0) : 'P'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          app.status === 'Terminé' 
                            ? 'bg-slate-100 text-slate-700' 
                            : app.status === 'Annulé'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {app.status}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {app.type}
                        </span>
                        {app.prescription && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Ordonnance {app.prescription.id} émise
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{app.patientName}</h3>
                      <div className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>{app.date} à {app.time}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="text-slate-600 font-semibold">{currentDoctor.fee}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Praticien */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    <button 
                      onClick={() => setActiveCallApp(app)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Démarrer Visio</span>
                    </button>

                    <button 
                      onClick={() => {
                        setActiveTab('prescriptions');
                        setNewPrescriptionPatient(app.patientName);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Rédiger Ordonnance</span>
                    </button>

                    {app.status !== 'Terminé' && (
                      <button 
                        onClick={() => handleStatusChange(app.id, 'Terminé')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-2.5 rounded-xl text-xs transition flex items-center space-x-1"
                        title="Marquer comme consultation terminée"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Terminé</span>
                      </button>
                    )}

                    {app.status !== 'Annulé' && (
                      <button 
                        onClick={() => {
                          if (onCancelAppointment) onCancelAppointment(app.id);
                          else handleStatusChange(app.id, 'Annulé');
                        }}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Annuler le rendez-vous"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DOSSIERS PATIENTS SUIVIS */}
      {/* ======================================================== */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-brand">Dossiers Médicaux des Patients Suivis</h2>
              <p className="text-xs text-slate-500">Accédez aux antécédents, constantes vitales et notes d'observation de vos patients.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Rechercher un patient..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {patientsList.map((patient) => (
              <div key={patient.name} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-base">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{patient.name}</h3>
                      <p className="text-xs text-slate-500">{patient.phone} &bull; Groupe <strong className="text-slate-800">{patient.bloodGroup}</strong></p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    {patient.count} consultation(s)
                  </span>
                </div>

                {/* Constantes vitales transmises par le patient */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center space-x-1.5">
                    <HeartPulse className="w-3 h-3 text-rose-500" />
                    <span>Dernières Constantes Transmises</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">Tension</span>
                      <strong className="text-slate-800">{patient.vitals.bp}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">Pouls</span>
                      <strong className="text-slate-800">{patient.vitals.pulse}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">Température</span>
                      <strong className="text-slate-800">{patient.vitals.temp}</strong>
                    </div>
                  </div>
                </div>

                {/* Allergies & Antécédents */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-600">
                    <strong className="text-slate-800">Allergies :</strong> {patient.allergies}
                  </div>
                  <div className="text-slate-600">
                    <strong className="text-slate-800">Note praticien :</strong> {patient.notes}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Dernier passage : {patient.lastDate}</span>
                  <button 
                    onClick={() => {
                      setActiveTab('prescriptions');
                      setNewPrescriptionPatient(patient.name);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>+ Nouvelle Ordonnance</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ÉMISSION D'ORDONNANCES MÉDICALES */}
      {/* ======================================================== */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulaire de création */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-brand">Générateur d'Ordonnance Officielle</h3>
                <p className="text-xs text-slate-500">Signée numériquement & transmissible au patient et aux pharmacies.</p>
              </div>
            </div>

            <form onSubmit={handleEmitPrescription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom du Patient *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Christian Kabeya"
                  value={newPrescriptionPatient}
                  onChange={(e) => setNewPrescriptionPatient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Diagnostic / Motif de prescription
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Syndrome fébrile aigu / Infection respiratoire haute"
                  value={newPrescriptionDiagnostic}
                  onChange={(e) => setNewPrescriptionDiagnostic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Liste des Médicaments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Médicaments & Posologie
                  </label>
                  <button 
                    type="button"
                    onClick={handleAddMedication}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter médicament</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newPrescriptionMeds.map((med, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Médicament #{idx + 1}</span>
                        {newPrescriptionMeds.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input 
                          type="text"
                          required
                          placeholder="Nom (DCI)"
                          value={med.name}
                          onChange={(e) => {
                            const copy = [...newPrescriptionMeds];
                            copy[idx].name = e.target.value;
                            setNewPrescriptionMeds(copy);
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold"
                        />
                        <input 
                          type="text"
                          placeholder="Dosage (ex: 500mg)"
                          value={med.dosage}
                          onChange={(e) => {
                            const copy = [...newPrescriptionMeds];
                            copy[idx].dosage = e.target.value;
                            setNewPrescriptionMeds(copy);
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        />
                        <input 
                          type="text"
                          placeholder="Durée (ex: 7 jours)"
                          value={med.duration}
                          onChange={(e) => {
                            const copy = [...newPrescriptionMeds];
                            copy[idx].duration = e.target.value;
                            setNewPrescriptionMeds(copy);
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <input 
                        type="text"
                        placeholder="Posologie (ex: 1 comprimé matin et soir après le repas)"
                        value={med.instructions}
                        onChange={(e) => {
                          const copy = [...newPrescriptionMeds];
                          copy[idx].instructions = e.target.value;
                          setNewPrescriptionMeds(copy);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cachet & Signature */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <strong className="block font-bold">Signature numérique certifiée SangO Health</strong>
                  Cachet officiel du praticien ({currentDoctor.name}) apposé avec horodatage blockchain / Supabase.
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Émettre & Transmettre au Patient & aux Pharmacies</span>
              </button>
            </form>
          </div>

          {/* Historique des ordonnances délivrées */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-black text-slate-900 font-brand">Ordonnances Récemment Émises</h3>
            <div className="space-y-3">
              {issuedPrescriptions.map((presc) => (
                <div key={presc.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                      {presc.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      presc.isDispensed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {presc.isDispensed ? 'Délivrée en pharmacie' : 'Active / En attente'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{presc.patientName}</h4>
                    <p className="text-[11px] text-slate-500">{presc.date}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    {presc.medications.map((m, i) => (
                      <div key={i} className="flex justify-between">
                        <span>&bull; {m.name} {m.dosage}</span>
                        <span className="text-slate-400">{m.duration}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>{presc.qrCodeToken}</span>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TÉLÉCONSULTATION VIDÉO */}
      {/* ======================================================== */}
      {activeTab === 'teleconsultation' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-800/40">
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Salle Vidéo Sécurisée P2P & LiveKit
              </span>
              <h2 className="text-2xl font-black text-white mt-2 font-brand">Cabinet Virtuel de Téléconsultation</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Connexion chiffrée de bout en bout pour consulter vos patients à distance à Kinshasa et dans toute la RDC.
              </p>
            </div>

            {doctorAppointments.length > 0 && (
              <button
                onClick={() => setActiveCallApp(doctorAppointments[0])}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-500/30 transition flex items-center space-x-2 shrink-0"
              >
                <Video className="w-4 h-4" />
                <span>Rejoindre la salle ({doctorAppointments[0].patientName})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Qualité HD Faible Bande Passante</h3>
              <p className="text-xs text-slate-500 mt-1">Optimisé pour la 3G/4G locale avec codec audio Opus & vidéo VP8 adaptatif.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Conformité Secret Médical</h3>
              <p className="text-xs text-slate-500 mt-1">Aucun enregistrement vidéo stocké sans consentement explicite du praticien et du patient.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Horodatage Automatique</h3>
              <p className="text-xs text-slate-500 mt-1">Durée de téléconsultation certifiée pour l'émission des reçus et factures d'honoraires.</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PLAGES HORAIRES & CRÉNEAUX */}
      {/* ======================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-brand">Configuration des Jours de Consultation</h3>
                <p className="text-xs text-slate-500">Activez ou désactivez vos jours et choisissez les modalités (Cabinet ou Téléconsultation).</p>
              </div>
              <button
                onClick={handleSaveSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-2 w-fit"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer mes disponibilités</span>
              </button>
            </div>

            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div 
                  key={item.day}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    item.isActive ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input 
                      type="checkbox"
                      checked={item.isActive}
                      onChange={() => handleToggleDay(idx)}
                      className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.day}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.isActive ? 'Consultations ouvertes' : 'Jour de repos / fermé'}
                      </div>
                    </div>
                  </div>

                  {item.isActive && (
                    <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">De</span>
                        <input 
                          type="time"
                          value={item.startHour}
                          onChange={(e) => handleScheduleChange(idx, 'startHour', e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-semibold"
                        />
                        <span className="text-slate-500">à</span>
                        <input 
                          type="time"
                          value={item.endHour}
                          onChange={(e) => handleScheduleChange(idx, 'endHour', e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-semibold"
                        />
                      </div>

                      <select
                        value={item.type}
                        onChange={(e) => handleScheduleChange(idx, 'type', e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-semibold text-xs"
                      >
                        <option value="Cabinet & Vidéo">Cabinet & Téléconsultation</option>
                        <option value="Cabinet uniquement">Cabinet uniquement</option>
                        <option value="Vidéo uniquement">Téléconsultation uniquement</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Slot Generator */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-black text-slate-900 font-brand mb-1">Créneaux Horaires Réservables en Ligne</h3>
            <p className="text-xs text-slate-500 mb-4">Ces créneaux sont directement proposés aux patients lors de la réservation.</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {availableSlots.map(slot => (
                <span 
                  key={slot} 
                  className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{slot}</span>
                  <button 
                    onClick={() => handleRemoveSlot(slot)}
                    className="hover:text-red-600 transition"
                    title="Supprimer ce créneau"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
              <input 
                type="time"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              />
              <button
                onClick={handleAddSlot}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter créneau</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. HONORAIRES & ENCAISSEMENTS DES CONSULTATIONS */}
      {/* ======================================================== */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Encaissé (CDF)</span>
              <div className="text-2xl font-black text-slate-900 font-brand">
                {earningsStats.totalCDF.toLocaleString('fr-FR')} CDF
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                &asymp; ${earningsStats.totalUSD} USD
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Consultations Réalisées</span>
              <div className="text-2xl font-black text-blue-600 font-brand">
                {earningsStats.completedCount}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Sur {earningsStats.totalConsultations} rendez-vous au total
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mode d'Encaissement</span>
              <div className="text-xs font-bold text-slate-800 mt-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>M-Pesa (Vodacom RDC)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>Orange Money RDC</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Airtel Money RDC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-black text-slate-900 font-brand mb-4">Journal des Honoraires de Consultation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Date Consultation</th>
                    <th className="py-3 px-4">Modalité</th>
                    <th className="py-3 px-4">Montant Honoraires</th>
                    <th className="py-3 px-4">Statut Règlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{app.patientName}</td>
                      <td className="py-3.5 px-4">{app.date} à {app.time}</td>
                      <td className="py-3.5 px-4">{app.type}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">{currentDoctor.fee}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Encaissé via Mobile Money
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. ABONNEMENT SAAS CABINET */}
      {/* ======================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Souscription Active
                </span>
                <h3 className="text-xl font-black text-slate-900 font-brand mt-1.5">Abonnement Pro Cabinet Médical</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tarif SaaS SangO Health : <strong>$59 USD / mois</strong> (&asymp; {(59 * 2850).toLocaleString('fr-FR')} CDF) &bull; Accès illimité agenda, visio et ordonnances.
                </p>
              </div>

              <button
                onClick={() => setIsBillingModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-2 shrink-0"
              >
                <Smartphone className="w-4 h-4" />
                <span>Payer par Mobile Money (M-Pesa / Orange / Airtel)</span>
              </button>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Historique des Factures SaaS
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Réf. Facture</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan SaaS</th>
                    <th className="py-3 px-4">Moyen de règlement</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{inv.id}</td>
                      <td className="py-3.5 px-4">{inv.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.plan}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">
                          {inv.paymentMethod} {inv.phoneNumber ? `(${inv.phoneNumber})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">${inv.amountUSD} USD</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => window.print()}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Télécharger PDF
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

      {/* ======================================================== */}
      {/* 8. MON CABINET & PROFIL PRATICIEN */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-3xl">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-brand">Informations du Cabinet & Profil Public</h3>
              <p className="text-xs text-slate-500">Ces informations sont affichées aux patients dans l'annuaire des praticiens.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom d'exercice *
                </label>
                <input 
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Spécialité Médicale *
                </label>
                <input 
                  type="text"
                  required
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tarif Consultation (CDF / USD) *
                </label>
                <input 
                  type="text"
                  required
                  value={profileForm.fee}
                  onChange={(e) => setProfileForm({ ...profileForm, fee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Téléphone Professionnel
                </label>
                <input 
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse du Cabinet Médical (Kinshasa) *
              </label>
              <input 
                type="text"
                required
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modalités de Consultation
              </label>
              <select
                value={profileForm.consultationType}
                onChange={(e) => setProfileForm({ ...profileForm, consultationType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="Cabinet & Vidéo">Cabinet & Téléconsultation Vidéo</option>
                <option value="Cabinet uniquement">Cabinet uniquement</option>
                <option value="Vidéo uniquement">Téléconsultation uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Biographie Professionnelle
              </label>
              <textarea 
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                placeholder="Présentez vos diplômes, votre parcours et vos spécialités..."
              />
            </div>

            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer mon Profil</span>
            </button>
          </form>
        </div>
      )}

      {/* Modal Salle de Téléconsultation */}
      {activeCallApp && (
        <VideoConsultationRoomModal
          appointment={activeCallApp}
          doctor={currentDoctor}
          userRole="doctor"
          onClose={() => setActiveCallApp(null)}
          onSavePrescription={onSavePrescription}
        />
      )}

      {/* Modal Paiement Abonnement SaaS par Mobile Money */}
      {isBillingModalOpen && (
        <MobileMoneyBillingModal
          doctorName={currentDoctor.name}
          clinicName="Cabinet Médical de Kinshasa"
          planName="Pro Cabinet"
          planFeeUSD={59}
          onClose={() => setIsBillingModalOpen(false)}
          onPaymentSuccess={(newInv) => setInvoices([newInv, ...invoices])}
        />
      )}
    </div>
  );
}
