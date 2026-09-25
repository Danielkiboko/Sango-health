import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  User, 
  AlertCircle, 
  PlusCircle, 
  FileText, 
  Download, 
  Printer, 
  X, 
  QrCode, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Appointment, Doctor, Prescription } from '../types';
import VideoConsultationRoomModal from '../components/VideoConsultationRoomModal';

interface PatientDashboardProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onCancel: (id: number) => void;
  onNewBooking: () => void;
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
}

export default function PatientDashboard({ 
  appointments, 
  doctors,
  onCancel, 
  onNewBooking,
  onSavePrescription
}: PatientDashboardProps) {
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past' | 'prescriptions'>('upcoming');
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [activeVideoCallApp, setActiveVideoCallApp] = useState<Appointment | null>(null);

  const upcomingAppointments = appointments.filter(app => app.status === 'Confirmé');
  const pastAppointments = appointments.filter(app => app.status === 'Annulé' || app.status === 'Terminé');
  const prescriptionAppointments = appointments.filter(app => !!app.prescription);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Espace Patient 100% Gratuit
            </span>
            <span className="text-xs text-slate-500 font-medium">Aucun abonnement requis</span>
          </div>
          <h1 className="font-brand text-3xl font-black text-slate-900 tracking-tight">Mon Dossier Santé Patient</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Consultez vos rendez-vous, accédez à vos ordonnances médicales électroniques et rejoignez vos téléconsultations.
          </p>
        </div>
        <button 
          onClick={onNewBooking}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center space-x-2 text-xs w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Prendre un nouveau RDV</span>
        </button>
      </div>

      {/* Patient Notice: Patient does not pay SaaS subscription */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start space-x-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-950 font-brand">Accès patient libre et sécurisé</h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Sur SangO Health, la prise de rendez-vous et le stockage de vos ordonnances sont entièrement gratuits pour les patients. Seuls les professionnels de santé et les structures hospitalières souscrivent à la plateforme SaaS.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6 text-sm font-semibold overflow-x-auto">
        <button 
          onClick={() => setFilterTab('upcoming')}
          className={`pb-3 transition relative whitespace-nowrap ${
            filterTab === 'upcoming' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Rendez-vous à venir ({upcomingAppointments.length})
        </button>
        <button 
          onClick={() => setFilterTab('prescriptions')}
          className={`pb-3 transition relative whitespace-nowrap flex items-center space-x-2 ${
            filterTab === 'prescriptions' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Mes Ordonnances Médicales ({prescriptionAppointments.length})</span>
        </button>
        <button 
          onClick={() => setFilterTab('past')}
          className={`pb-3 transition relative whitespace-nowrap ${
            filterTab === 'past' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Historique & Passés ({pastAppointments.length})
        </button>
      </div>

      {/* Tab: Prescriptions List */}
      {filterTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptionAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune ordonnance délivrée pour le moment</h3>
              <p className="text-sm text-slate-500 mb-6">
                Lors de votre téléconsultation ou consultation en cabinet, votre médecin pourra vous délivrer et signer une ordonnance numérique sécurisée directement transmise ici.
              </p>
              <button 
                onClick={onNewBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition text-xs"
              >
                Prendre une consultation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptionAppointments.map((app) => {
                const pres = app.prescription!;
                return (
                  <div 
                    key={pres.id} 
                    className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                          {pres.id}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{pres.date}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 font-brand mb-0.5">
                        Délivrée par {pres.doctorName}
                      </h3>
                      <p className="text-xs text-blue-600 font-semibold mb-3">
                        Patient : {pres.patientName}
                      </p>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Médicaments prescrits :</div>
                        {pres.medications.map((m, idx) => (
                          <div key={idx} className="text-xs text-slate-800 flex items-center justify-between">
                            <span className="font-semibold">&bull; {m.name}</span>
                            <span className="text-slate-500 text-[11px]">{m.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Signée numériquement</span>
                      </div>
                      <button
                        onClick={() => setViewingPrescription(pres)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Afficher / Imprimer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Upcoming Appointments */}
      {filterTab === 'upcoming' && (
        <div>
          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun rendez-vous à venir</h3>
              <p className="text-sm text-slate-500 mb-6">Trouvez un médecin disponible et prenez rendez-vous en quelques clics.</p>
              <button 
                onClick={onNewBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition text-xs"
              >
                Rechercher un praticien
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
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
                        <span className="text-xs text-slate-400 font-semibold">{app.type}</span>
                        {app.prescription && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700 flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>Ordonnance disponible</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{app.doctorName}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{app.specialty}</p>

                      <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700 mt-3">
                        <div className="flex items-center space-x-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                    {app.prescription && (
                      <button
                        onClick={() => setViewingPrescription(app.prescription!)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Voir ordonnance</span>
                      </button>
                    )}
                    <button 
                      onClick={() => onCancel(app.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      Annuler le RDV
                    </button>
                    <button 
                      onClick={() => setActiveVideoCallApp(app)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Rejoindre la visio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Past Appointments */}
      {filterTab === 'past' && (
        <div className="space-y-4">
          {pastAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun rendez-vous passé</h3>
              <p className="text-sm text-slate-500">L'historique de vos consultations s'affichera ici.</p>
            </div>
          ) : (
            pastAppointments.map((app) => (
              <div 
                key={app.id} 
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600">
                      {app.status}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{app.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{app.doctorName}</h3>
                  <p className="text-xs text-slate-500">{app.specialty} &bull; {app.date} à {app.time}</p>
                </div>
                {app.prescription && (
                  <button
                    onClick={() => setViewingPrescription(app.prescription!)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Consulter l'ordonnance</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Full Prescription View Modal */}
      {viewingPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-900 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setViewingPrescription(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Prescription Layout */}
            <div className="border border-slate-300 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start justify-between border-b-2 border-blue-600 pb-4 mb-4">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">République Démocratique du Congo</div>
                  <h2 className="text-xl font-black font-brand text-slate-900">{viewingPrescription.doctorName}</h2>
                  <p className="text-xs text-slate-500">Médecine & Téléconsultation &bull; Plateforme SangO Health</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                    {viewingPrescription.id}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Date : {viewingPrescription.date}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl mb-6 text-xs flex justify-between">
                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Patient</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingPrescription.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Émission</span>
                  <span className="font-semibold text-slate-700">Téléconsultation en direct</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Ordonnance Médicale</h4>
                <div className="space-y-4">
                  {viewingPrescription.medications.map((med, idx) => (
                    <div key={idx} className="pb-3 border-b border-slate-100">
                      <div className="font-bold text-sm text-slate-900">
                        {idx + 1}. {med.name}
                      </div>
                      <div className="text-xs text-blue-700 font-semibold mt-0.5">
                        Posologie : {med.dosage} &bull; Durée : {med.duration}
                      </div>
                      {med.instructions && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          Note : {med.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingPrescription.notes && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs mb-6">
                  <span className="font-bold text-blue-900 block mb-1">Directives du médecin :</span>
                  <p className="text-slate-700">{viewingPrescription.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">Validation Pharmacie RDC</div>
                    <div className="text-[9px] text-slate-400 font-mono">Code : {viewingPrescription.qrCodeToken}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded inline-block">
                    ✓ Signature Électronique Certifiée
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{viewingPrescription.doctorName}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button 
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'Ordonnance</span>
              </button>
              <button 
                onClick={() => setViewingPrescription(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Video Call Modal for Patient */}
      {activeVideoCallApp && (
        <VideoConsultationRoomModal
          appointment={activeVideoCallApp}
          doctor={
            doctors.find(d => d.name === activeVideoCallApp.doctorName) || {
              id: 1,
              name: activeVideoCallApp.doctorName,
              specialty: activeVideoCallApp.specialty,
              address: "Cabinet Médical Partenaire, Kinshasa",
              rating: 5.0,
              reviewsCount: 12,
              fee: "30 000 CDF",
              nextSlot: "En direct",
              image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
              consultationType: "Cabinet & Vidéo",
              bio: "Médecin praticien partenaire SangO Health.",
              slots: []
            }
          }
          userRole="patient"
          onClose={() => setActiveVideoCallApp(null)}
          onSavePrescription={onSavePrescription}
        />
      )}
    </div>
  );
}
