import React, { useState } from 'react';
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
  Receipt
} from 'lucide-react';
import { Appointment, Doctor, Prescription, DoctorScheduleDay, SaaSSubscriptionInvoice } from '../types';
import VideoConsultationRoomModal from '../components/VideoConsultationRoomModal';
import MobileMoneyBillingModal from './MobileMoneyBillingModal';

interface DoctorPortalProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
  onUpdateSchedule?: (doctorId: number, schedule: DoctorScheduleDay[], slots: string[]) => void;
}

export default function DoctorPortal({ 
  appointments, 
  doctors, 
  onSavePrescription,
  onUpdateSchedule
}: DoctorPortalProps) {
  const currentDoctor = doctors[0] || {
    id: 1,
    name: "Dr. Marie Laurent",
    specialty: "Généraliste",
    address: "12 Avenue des Martyrs, Gombe, Kinshasa",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    slots: ["09:00", "10:30", "14:00", "15:30", "16:30"],
    schedule: []
  };

  const doctorAppointments = appointments.filter(app => app.doctorName === currentDoctor.name);
  const [activeCallApp, setActiveCallApp] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'agenda' | 'schedule' | 'billing'>('agenda');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // Doctor Availability Schedule state
  const [schedule, setSchedule] = useState<DoctorScheduleDay[]>(
    currentDoctor.schedule || [
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
  const [scheduleSaveSuccess, setScheduleSaveSuccess] = useState(false);

  // Billing history state for this doctor
  const [invoices, setInvoices] = useState<SaaSSubscriptionInvoice[]>([
    {
      id: "FACT-SAAS-90412",
      accountName: currentDoctor.name,
      clinicName: "Cabinet Médical de la Gombe",
      plan: "Pro Cabinet",
      amountUSD: 59,
      amountCDF: 59 * 2850,
      date: "01 Septembre 2026",
      paymentMethod: "M-Pesa",
      phoneNumber: "+243 81 294 8831",
      status: "Payé",
      transactionRef: "RDC-PAY-88492"
    }
  ]);

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

  const handleSaveSchedule = () => {
    if (onUpdateSchedule) {
      onUpdateSchedule(currentDoctor.id, schedule, availableSlots);
    }
    setScheduleSaveSuccess(true);
    setTimeout(() => setScheduleSaveSuccess(false), 3000);
  };

  const handlePaymentSuccess = (newInvoice: SaaSSubscriptionInvoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-8 rounded-3xl mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-5">
          <img 
            src={currentDoctor.image} 
            alt={currentDoctor.name} 
            className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400/50 shadow" 
          />
          <div>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Espace Praticien &bull; Plan Pro Cabinet ($59/m)
            </span>
            <h1 className="text-2xl font-black text-white mt-1 font-brand">{currentDoctor.name}</h1>
            <p className="text-xs text-slate-300">{currentDoctor.specialty} &bull; {currentDoctor.address}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-blue-300 font-semibold uppercase">Consultations Prévues</span>
            <span className="text-2xl font-black text-white font-brand">{doctorAppointments.length}</span>
          </div>

          <button
            onClick={() => setIsBillingModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Régler Abonnement SaaS</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6 text-sm font-semibold">
        <button 
          onClick={() => setActiveTab('agenda')}
          className={`pb-3 transition relative flex items-center space-x-2 ${
            activeTab === 'agenda' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Agenda & Consultations ({doctorAppointments.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 transition relative flex items-center space-x-2 ${
            activeTab === 'schedule' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Disponibilités & Créneaux Horaires</span>
        </button>

        <button 
          onClick={() => setActiveTab('billing')}
          className={`pb-3 transition relative flex items-center space-x-2 ${
            activeTab === 'billing' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Facturation SaaS & Mobile Money</span>
        </button>
      </div>

      {/* TAB 1: Agenda */}
      {activeTab === 'agenda' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-brand">Agenda & Gestion des Consultations</h2>
              <p className="text-xs text-slate-500">Vous pilotez directement vos appels de téléconsultation et vos dossiers patients</p>
            </div>
          </div>

          {doctorAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune consultation programmée</h3>
              <p className="text-sm text-slate-500">Votre agenda praticien est actuellement libre.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {doctorAppointments.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700">
                          {app.status}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Modalité : {app.type}</span>
                        {app.prescription && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            Ordonnance émise ({app.prescription.id})
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{app.patientName}</h3>
                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{app.date} à {app.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => setActiveCallApp(app)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Démarrer l'Appel Consultation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Schedule & Slots Management */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {scheduleSaveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Vos horaires et créneaux ont été mis à jour avec succès et synchronisés sur la vitrine publique !</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-brand">Configuration des Jours de Consultation</h3>
                <p className="text-xs text-slate-500">Activez ou désactivez vos jours et choisissez les modalités (Cabinet ou Téléconsultation)</p>
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
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 font-brand mb-1">Créneaux Horaires Réservables</h3>
            <p className="text-xs text-slate-500 mb-4">Ces créneaux sont directement proposés aux patients lors de la prise de RDV.</p>

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

      {/* TAB 3: SaaS Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Souscription Active
                </span>
                <h3 className="text-xl font-black text-slate-900 font-brand mt-1">Abonnement Pro Cabinet</h3>
                <p className="text-xs text-slate-500">
                  Tarif : <strong>$59 USD / mois</strong> (&asymp; {(59 * 2850).toLocaleString('fr-FR')} CDF) &bull; Renouvellement mensuel
                </p>
              </div>

              <button
                onClick={() => setIsBillingModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Payer par Mobile Money (M-Pesa / Orange / Airtel)</span>
              </button>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Historique des Paiements SaaS
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Réf. Facture</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan SaaS</th>
                    <th className="py-3 px-4">Mode de règlement</th>
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
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${inv.amountUSD} USD
                      </td>
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

      {/* Active Consultation Call Modal */}
      {activeCallApp && (
        <VideoConsultationRoomModal
          appointment={activeCallApp}
          doctor={currentDoctor as Doctor}
          userRole="doctor"
          onClose={() => setActiveCallApp(null)}
          onSavePrescription={onSavePrescription}
        />
      )}

      {/* Mobile Money Billing Modal */}
      {isBillingModalOpen && (
        <MobileMoneyBillingModal
          doctorName={currentDoctor.name}
          clinicName="Cabinet Médical de la Gombe"
          planName="Pro Cabinet"
          planFeeUSD={59}
          onClose={() => setIsBillingModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
