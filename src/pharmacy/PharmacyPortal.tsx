import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode, 
  Printer, 
  Clock, 
  Calendar, 
  FileText,
  Check,
  PackageCheck,
  XCircle
} from 'lucide-react';
import { Appointment, Prescription } from '../types';

interface PharmacyPortalProps {
  appointments: Appointment[];
  onDispensePrescription: (prescriptionId: string, pharmacyName: string) => void;
}

export default function PharmacyPortal({ appointments, onDispensePrescription }: PharmacyPortalProps) {
  const [searchToken, setSearchToken] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState('Pharmacie du Centre - Gombe');
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);

  // Extract all prescriptions from appointments
  const allPrescriptions = appointments
    .filter(a => !!a.prescription)
    .map(a => a.prescription!);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim()) return;

    const term = searchToken.trim().toLowerCase();
    const found = allPrescriptions.find(p => 
      p.id.toLowerCase() === term || 
      (p.qrCodeToken && p.qrCodeToken.toLowerCase() === term) ||
      p.patientName.toLowerCase().includes(term)
    );

    if (found) {
      setActivePrescription(found);
      setDispenseSuccessMessage(null);
    } else {
      setActivePrescription(null);
      alert("Aucune ordonnance valide trouvée pour cet identifiant ou code QR.");
    }
  };

  const handleDispense = (prescription: Prescription) => {
    if (prescription.isDispensed) {
      alert("Cette ordonnance a déjà été délivrée et ne peut être servie deux fois.");
      return;
    }

    onDispensePrescription(prescription.id, selectedPharmacy);
    setActivePrescription({
      ...prescription,
      isDispensed: true,
      dispensedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      dispensedByPharmacy: selectedPharmacy
    });
    setDispenseSuccessMessage(`Médicaments délivrés avec succès par ${selectedPharmacy} !`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-8 rounded-3xl mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Réseau Officines RDC
              </span>
              <span className="text-xs text-slate-300 font-medium">Kinshasa & Provinces</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 font-brand">Portail Validation Ordonnances SangO</h1>
            <p className="text-xs text-slate-300">Vérification de l'authenticité et délivrance sécurisée des médicaments</p>
          </div>
        </div>

        {/* Selected Pharmacy Selector */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
          <label className="block text-[10px] text-emerald-300 font-bold uppercase tracking-wider mb-1">
            Pharmacie Active
          </label>
          <select 
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            className="bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-400"
          >
            <option value="Pharmacie du Centre - Gombe">Pharmacie du Centre - Gombe</option>
            <option value="Pharmacie Moderne - Limete">Pharmacie Moderne - Limete</option>
            <option value="Pharmacie de la Victoire - Kasa-Vubu">Pharmacie de la Victoire - Kasa-Vubu</option>
            <option value="Pharmacie Royale - Kintambo">Pharmacie Royale - Kintambo</option>
          </select>
        </div>
      </div>

      {/* Search and Scan Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
        <h2 className="text-lg font-black text-slate-900 font-brand mb-2">Vérifier une Ordonnance</h2>
        <p className="text-xs text-slate-500 mb-4">
          Saisissez le numéro d'ordonnance (ex: <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">ORD-942810</code>) ou le jeton de sécurité du QR Code présenté par le patient.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="text"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              placeholder="Ex: ORD-942810 ou nom du patient..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Valider l'Ordonnance</span>
          </button>
        </form>

        {/* Quick click suggestions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Ordonnances récentes dans le système :</span>
          {allPrescriptions.slice(0, 3).map(p => (
            <button
              key={p.id}
              onClick={() => { setSearchToken(p.id); setActivePrescription(p); }}
              className="font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold transition text-[11px]"
            >
              {p.id} ({p.patientName})
            </button>
          ))}
        </div>
      </div>

      {/* Active Prescription Details */}
      {activePrescription && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 relative mb-8">
          {dispenseSuccessMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{dispenseSuccessMessage}</span>
            </div>
          )}

          {/* Status banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg">
                  {activePrescription.id}
                </span>
                {activePrescription.isDispensed ? (
                  <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-lg flex items-center space-x-1">
                    <PackageCheck className="w-4 h-4 text-amber-600" />
                    <span>DÉJÀ DÉLIVRÉE</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>VALIDE POUR DÉLIVRANCE</span>
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-brand mt-2">
                Patient(e) : {activePrescription.patientName}
              </h3>
              <p className="text-xs text-slate-500">
                Prescrit par : <strong className="text-slate-800">{activePrescription.doctorName}</strong> &bull; Date d'émission : {activePrescription.date}
              </p>
            </div>

            {/* Dispensation Action */}
            <div>
              {activePrescription.isDispensed ? (
                <div className="text-right text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-slate-500">Servie le {activePrescription.dispensedAt || "Récemment"}</div>
                  <div className="font-bold text-slate-800 mt-0.5">Par : {activePrescription.dispensedByPharmacy || selectedPharmacy}</div>
                </div>
              ) : (
                <button
                  onClick={() => handleDispense(activePrescription)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Délivrer et marquer comme servie</span>
                </button>
              )}
            </div>
          </div>

          {/* Medications to Dispense */}
          <div className="my-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Liste des molécules et posologies à délivrer
            </h4>

            <div className="space-y-3">
              {activePrescription.medications.map((med, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{med.name}</span>
                    </div>
                    <div className="text-xs text-blue-700 font-semibold mt-1">
                      Posologie : {med.dosage} &bull; Durée : {med.duration}
                    </div>
                    {med.instructions && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">
                        Instructions spéciales : {med.instructions}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Prêt à servir
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Directives */}
          {activePrescription.notes && (
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs mb-6">
              <span className="font-bold text-blue-900 block mb-1">Recommandations du médecin traitant :</span>
              <p className="text-slate-700">{activePrescription.notes}</p>
            </div>
          )}

          {/* Bottom Security Seals */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <QrCode className="w-10 h-10 text-slate-800" />
              <div>
                <div className="text-xs font-bold text-slate-800">Signature Électronique Certifiée RDC</div>
                <div className="text-[10px] text-slate-400 font-mono">Token : {activePrescription.qrCodeToken || `SANGO-TOKEN-${activePrescription.id}`}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le reçu pharmacie</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
