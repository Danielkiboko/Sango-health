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
  CheckCircle2,
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Eye,
  Trash2,
  Share2,
  FileCheck,
  Building,
  Heart
} from 'lucide-react';
import { Appointment, Doctor, Prescription, MedicalDocument } from '../types';
import VideoConsultationRoomModal from '../components/VideoConsultationRoomModal';

interface PatientDashboardProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onCancel: (id: number) => void;
  onNewBooking: () => void;
  onSavePrescription?: (appointmentId: number, prescription: Prescription) => void;
}

const INITIAL_DOCUMENTS: MedicalDocument[] = [
  {
    id: "DOC-2026-081",
    title: "Bilan Biologique Complet (NFS, Paludisme goutte épaisse, Glycémie)",
    category: "Biologie & Analyses",
    date: "18 Septembre 2026",
    facility: "Laboratoire INRB Gombe, Kinshasa",
    fileType: "pdf",
    fileSize: "1.4 Mo",
    notes: "Taux d'hémoglobine normal. Recherche de Plasmodium négative.",
    isSharedWithDoctor: true,
    uploadedAt: "19/09/2026"
  },
  {
    id: "DOC-2026-042",
    title: "Radiographie Thoracique Standard Face",
    category: "Imagerie & Radio",
    date: "04 Août 2026",
    facility: "Centre Médical de Kinshasa (CMK)",
    fileType: "image",
    fileUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
    fileSize: "3.8 Mo",
    notes: "Pas de foyer pleuro-pulmonaire décelable. Silhouette cardiaque normale.",
    isSharedWithDoctor: true,
    uploadedAt: "05/08/2026"
  }
];

export default function PatientDashboard({ 
  appointments, 
  doctors,
  onCancel, 
  onNewBooking,
  onSavePrescription
}: PatientDashboardProps) {
  const [filterTab, setFilterTab] = useState<'upcoming' | 'prescriptions' | 'documents' | 'past'>('upcoming');
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [activeVideoCallApp, setActiveVideoCallApp] = useState<Appointment | null>(null);
  
  // Documents médicaux & upload
  const [documents, setDocuments] = useState<MedicalDocument[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sango_patient_docs');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_DOCUMENTS;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<MedicalDocument | null>(null);
  const [isExportHealthBookletOpen, setIsExportHealthBookletOpen] = useState(false);

  // Form State Upload
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<MedicalDocument['category']>('Biologie & Analyses');
  const [docFacility, setDocFacility] = useState('Laboratoire INRB Gombe');
  const [docDate, setDocDate] = useState('2026-09-27');
  const [docNotes, setDocNotes] = useState('');
  const [docShare, setDocShare] = useState(true);
  const [docFilePreview, setDocFilePreview] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState('');

  const upcomingAppointments = appointments.filter(app => app.status === 'Confirmé');
  const pastAppointments = appointments.filter(app => app.status === 'Annulé' || app.status === 'Terminé');
  const prescriptionAppointments = appointments.filter(app => !!app.prescription);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      if (!docTitle) setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const newDoc: MedicalDocument = {
      id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: docTitle.trim(),
      category: docCategory,
      date: docDate,
      facility: docFacility.trim() || 'Centre Médical Kinshasa',
      fileType: docFileName.endsWith('.pdf') ? 'pdf' : 'image',
      fileUrl: docFilePreview || undefined,
      fileSize: "2.1 Mo",
      notes: docNotes.trim(),
      isSharedWithDoctor: docShare,
      uploadedAt: new Date().toLocaleDateString('fr-FR')
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sango_patient_docs', JSON.stringify(updated));
    }

    // Reset form
    setDocTitle('');
    setDocNotes('');
    setDocFilePreview(null);
    setDocFileName('');
    setIsUploadModalOpen(false);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sango_patient_docs', JSON.stringify(updated));
    }
    if (viewingDocument?.id === id) setViewingDocument(null);
  };

  const handleDownloadPrescriptionHTML = (pres: Prescription) => {
    const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ordonnance Médicale - ${pres.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 24px; font-weight: 900; color: #1e3a8a; }
    .sub { font-size: 12px; color: #64748b; }
    .section { margin-top: 30px; }
    .med-item { padding: 15px 0; border-bottom: 1px solid #e2e8f0; }
    .med-name { font-size: 16px; font-weight: bold; color: #0f172a; }
    .med-dose { font-size: 14px; color: #2563eb; font-weight: 600; margin-top: 4px; }
    .footer { margin-top: 50px; border-top: 2px solid #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; }
    .stamp { border: 2px dashed #059669; padding: 10px 15px; color: #059669; font-weight: bold; border-radius: 8px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">SANGO HEALTH &bull; ORDONNANCE MÉDICALE</div>
      <div class="sub">Plateforme Médicale Sécurisée &bull; Kinshasa, RDC</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold;">Réf : ${pres.id}</div>
      <div class="sub">Date : ${pres.date}</div>
    </div>
  </div>

  <div class="section" style="background: #f8fafc; padding: 15px; border-radius: 8px;">
    <div><strong>Praticien :</strong> ${pres.doctorName}</div>
    <div><strong>Patient :</strong> ${pres.patientName}</div>
  </div>

  <div class="section">
    <h3>Prescription Médicale</h3>
    ${pres.medications.map((m, i) => `
      <div class="med-item">
        <div class="med-name">${i + 1}. ${m.name}</div>
        <div class="med-dose">Posologie : ${m.dosage} &bull; Durée : ${m.duration}</div>
        ${m.instructions ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Directives : ${m.instructions}</div>` : ''}
      </div>
    `).join('')}
  </div>

  ${pres.notes ? `
    <div class="section" style="background: #eff6ff; padding: 15px; border-radius: 8px; font-size: 13px;">
      <strong>Recommandations médicales :</strong> ${pres.notes}
    </div>
  ` : ''}

  <div class="footer">
    <div>
      <div><strong>Validation Pharmacie Officielle</strong></div>
      <div style="font-size: 11px; color: #64748b;">Code numérique : ${pres.qrCodeToken || 'VALID-RD-CONGO'}</div>
    </div>
    <div class="stamp">
      ✓ SIGNATURE ÉLECTRONIQUE CERTIFIÉE<br>
      ${pres.doctorName}
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>
    `;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ordonnance-Sango-${pres.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-12">
      {/* En-tête Dossier Patient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Espace Patient 100% Gratuit
            </span>
            <span className="text-xs text-slate-500 font-medium">Kinshasa &bull; Dossier Médical Informatisé</span>
          </div>
          <h1 className="font-brand text-3xl font-black text-slate-900 tracking-tight">Mon Dossier Santé Patient</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Consultez vos rendez-vous, ordonnances électroniques, bilans d'analyses et radiographies en un seul lieu sécurisé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bouton Export Carnet Médical PDF */}
          <button 
            onClick={() => setIsExportHealthBookletOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-3 rounded-2xl shadow-sm transition flex items-center space-x-2 text-xs"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Exporter Carnet Santé (PDF)</span>
          </button>

          <button 
            onClick={onNewBooking}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center space-x-2 text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau Rendez-vous</span>
          </button>
        </div>
      </div>

      {/* Onglets du Dossier */}
      <div className="flex border-b border-slate-200 mb-6 space-x-4 sm:space-x-6 text-sm font-semibold overflow-x-auto scrollbar-none">
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
          className={`pb-3 transition relative whitespace-nowrap flex items-center space-x-1.5 ${
            filterTab === 'prescriptions' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Mes Ordonnances ({prescriptionAppointments.length})</span>
        </button>

        <button 
          onClick={() => setFilterTab('documents')}
          className={`pb-3 transition relative whitespace-nowrap flex items-center space-x-1.5 ${
            filterTab === 'documents' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-emerald-600" />
          <span>Mes Analyses & Radios ({documents.length})</span>
        </button>

        <button 
          onClick={() => setFilterTab('past')}
          className={`pb-3 transition relative whitespace-nowrap ${
            filterTab === 'past' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Historique ({pastAppointments.length})
        </button>
      </div>

      {/* ONGLET 1: RENDEZ-VOUS À VENIR */}
      {filterTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun rendez-vous à venir</h3>
              <p className="text-sm text-slate-500 mb-6">Trouvez un médecin disponible à Kinshasa et réservez en quelques clics.</p>
              <button 
                onClick={onNewBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition text-xs"
              >
                Rechercher un praticien
              </button>
            </div>
          ) : (
            upcomingAppointments.map((app) => (
              <div 
                key={app.id} 
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100 shadow-inner">
                    {app.type.includes('Vidéo') ? <Video className="w-6 h-6" /> : <CalendarIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{app.specialty}</span>
                      <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmé</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{app.doctorName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{app.date} à {app.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-slate-700">Modalité : {app.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                  {app.type.includes('Vidéo') && (
                    <button
                      onClick={() => setActiveVideoCallApp(app)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>Rejoindre la téléconsultation</span>
                    </button>
                  )}
                  <button 
                    onClick={() => onCancel(app.id)}
                    className="text-rose-600 hover:bg-rose-50 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-rose-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ONGLET 2: ORDONNANCES MÉDICALES */}
      {filterTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptionAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune ordonnance délivrée pour le moment</h3>
              <p className="text-sm text-slate-500 mb-6">
                Lors de votre consultation, votre médecin pourra vous délivrer et signer une ordonnance numérique avec QR Code sécurisé.
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

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleDownloadPrescriptionHTML(pres)}
                        title="Télécharger l'ordonnance"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-slate-200 text-xs flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>

                      <button
                        onClick={() => setViewingPrescription(pres)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimer / Afficher</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3: MES DOCUMENTS, ANALYSES & RADIOGRAPHIES (FEATURE 7) */}
      {filterTab === 'documents' && (
        <div className="space-y-6">
          {/* Header de la section Documents */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-5 sm:p-6 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Coffre-fort Médical
                </span>
                <span className="text-xs text-slate-500">Stockage sécurisé et partagé</span>
              </div>
              <h3 className="font-brand text-xl font-black text-slate-900">Analyses Biologiques & Imagerie Médicale</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Importez vos résultats de laboratoire (INRB, CMK...) et clichés de radio pour que votre médecin puisse les étudier avant votre consultation.
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 text-xs shrink-0 self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" />
              <span>Ajouter un document</span>
            </button>
          </div>

          {/* Grille des documents */}
          {documents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun document médical importé</h3>
              <p className="text-sm text-slate-500 mb-6">Ajoutez vos analyses de sang, échographies ou radiographies en quelques clics.</p>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition text-xs"
              >
                Ajouter mon premier document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        doc.category.includes('Biologie') 
                          ? 'bg-purple-100 text-purple-800' 
                          : doc.category.includes('Imagerie') 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {doc.category}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{doc.date}</span>
                    </div>

                    <h4 className="font-brand font-black text-slate-900 text-base mb-1 leading-snug">
                      {doc.title}
                    </h4>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{doc.facility}</span>
                    </div>

                    {doc.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 line-clamp-2">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs">
                      {doc.isSharedWithDoctor ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Partagé médecin</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Privé</span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">({doc.fileSize})</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setViewingDocument(doc)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Aperçu</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 4: HISTORIQUE & PASSÉS */}
      {filterTab === 'past' && (
        <div className="space-y-4">
          {pastAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune consultation passée</h3>
              <p className="text-sm text-slate-500">L'historique complet de vos rendez-vous médicaux s'affichera ici.</p>
            </div>
          ) : (
            pastAppointments.map((app) => (
              <div 
                key={app.id} 
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between opacity-80"
              >
                <div>
                  <div className="text-xs text-slate-400">{app.date} &bull; {app.specialty}</div>
                  <h4 className="font-bold text-slate-800">{app.doctorName}</h4>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  app.status === 'Terminé' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {app.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL IMPRESSION / VISUALISATION DE L'ORDONNANCE (FEATURE 3) */}
      {viewingPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-slate-100">
            <button 
              onClick={() => setViewingPrescription(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* FEUILLE D'ORDONNANCE MÉDICALE OFFICIELLE */}
            <div className="border-2 border-slate-200 rounded-2xl p-6 sm:p-8 bg-white shadow-inner relative">
              <div className="flex items-start justify-between pb-6 border-b-2 border-blue-600 mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <img src="/brand/sango-logo-blue.png" alt="SangO Health" className="h-8 w-auto object-contain" />
                    <span className="text-xs font-bold tracking-widest uppercase text-blue-900">RDC &bull; SANTÉ NUMÉRIQUE</span>
                  </div>
                  <div className="font-bold text-base text-slate-900 mt-2">{viewingPrescription.doctorName}</div>
                  <div className="text-xs text-slate-500">Médecin Praticien &bull; Ordre National des Médecins RDC</div>
                  <div className="text-[11px] text-slate-400">Cabinet Partenaire &bull; Kinshasa</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block">
                    Réf : {viewingPrescription.id}
                  </div>
                  <div className="text-xs text-slate-600 font-semibold mt-2">Kinshasa, le {viewingPrescription.date}</div>
                  <div className="text-xs text-slate-700 font-bold mt-1">Patient : {viewingPrescription.patientName}</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-1 border-b border-slate-100">
                  Prescription Médicale
                </h4>
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
                          Directives : {med.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingPrescription.notes && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs mb-6">
                  <span className="font-bold text-blue-900 block mb-1">Directives particulières :</span>
                  <p className="text-slate-700">{viewingPrescription.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">Délivrance Officine RDC</div>
                    <div className="text-[9px] text-slate-400 font-mono">Code : {viewingPrescription.qrCodeToken || 'VAL-KIN-2026'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-200">
                    ✓ Signature Numérique Certifiée
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{viewingPrescription.doctorName}</div>
                </div>
              </div>
            </div>

            {/* Actions du bas */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button 
                onClick={() => handleDownloadPrescriptionHTML(viewingPrescription)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition border border-slate-200 shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Télécharger Ordonnance (PDF)</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'Ordonnance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORT CARNET DE SANTÉ COMPLET (FEATURE 3) */}
      {isExportHealthBookletOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-slate-100">
            <button 
              onClick={() => setIsExportHealthBookletOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-2 border-slate-200 rounded-2xl p-6 sm:p-8 bg-white shadow-inner">
              <div className="flex items-center justify-between pb-6 border-b-2 border-blue-600 mb-6">
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-blue-800">
                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO &bull; SANTÉ
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-brand mt-1">Carnet Médical Numérique</h2>
                  <p className="text-xs text-slate-500">Dossier de Santé Individuel &bull; SangO Health</p>
                </div>
                <img src="/brand/sango-logo-blue.png" alt="SangO Health" className="h-9 w-auto object-contain" />
              </div>

              {/* Patient Profile Snapshot */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Titulaire</span>
                  <span className="font-bold text-slate-900">Patient SangO Health</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Identifiant Unique</span>
                  <span className="font-mono font-bold text-blue-600">SNG-KIN-9941</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Groupe Sanguin</span>
                  <span className="font-bold text-rose-600 flex items-center space-x-1">
                    <Heart className="w-3 h-3 fill-current" />
                    <span>O Positif (O+)</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact d'urgence</span>
                  <span className="font-bold text-slate-800">+243 81 000 0000</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ville</span>
                  <span className="font-bold text-slate-800">Kinshasa, RDC</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date d'édition</span>
                  <span className="font-bold text-slate-800">{new Date().toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Consultations */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 pb-1 border-b border-slate-100">
                  1. Synthèse des Consultations Récentes ({appointments.length})
                </h4>
                <div className="space-y-2 text-xs">
                  {appointments.slice(0, 4).map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-800">{a.doctorName}</span>
                        <span className="text-slate-500 ml-2">({a.specialty})</span>
                      </div>
                      <span className="text-slate-600 font-semibold">{a.date} - {a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ordonnances */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 pb-1 border-b border-slate-100">
                  2. Traitements & Prescriptions Actives ({prescriptionAppointments.length})
                </h4>
                <div className="space-y-2 text-xs">
                  {prescriptionAppointments.map((p, i) => (
                    <div key={i} className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="font-bold text-blue-950 mb-1">Réf : {p.prescription?.id} &bull; Par {p.prescription?.doctorName}</div>
                      <div className="text-slate-700">
                        {p.prescription?.medications.map(m => `${m.name} (${m.dosage})`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents & Analyses */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 pb-1 border-b border-slate-100">
                  3. Examens Biologiques & Imageries Enregistrés ({documents.length})
                </h4>
                <div className="space-y-1.5 text-xs">
                  {documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-800">&bull; {d.title}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{d.facility} ({d.date})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-10 h-10 text-slate-800" />
                  <span className="text-[10px] text-slate-400">Certifié conforme par SangO Health RDC</span>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  ✓ Document Médical Officiel Valide
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Enregistrer en PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT DE DOCUMENT MÉDICAL / UPLOAD (FEATURE 7) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 relative border border-slate-100">
            <button 
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-brand text-2xl font-black text-slate-900">Ajouter un Document Médical</h3>
              <p className="text-xs text-slate-500">Importez une analyse biologique, une échographie ou une radiographie.</p>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Titre du document *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex : Bilan Sanguin NFS, Radio Thorax..."
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Catégorie
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Biologie & Analyses">Biologie & Analyses</option>
                    <option value="Imagerie & Radio">Imagerie & Radio</option>
                    <option value="Échographie">Échographie</option>
                    <option value="Compte-rendu">Compte-rendu</option>
                    <option value="Ordonnance antérieure">Ordonnance antérieure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date de l'examen
                  </label>
                  <input 
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Établissement / Laboratoire émetteur
                </label>
                <input 
                  type="text"
                  placeholder="Ex : Laboratoire INRB Gombe, Clinique Ngaliema..."
                  value={docFacility}
                  onChange={(e) => setDocFacility(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Zone Drag & Drop / Fichier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fichier (PDF, Image ou Radio)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 transition relative">
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-700">
                    {docFileName ? `Fichier prêt : ${docFileName}` : 'Cliquez pour sélectionner un fichier'}
                  </div>
                  <div className="text-[10px] text-slate-400">PDF, JPG, PNG jusqu'à 25 Mo</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notes / Observations pour le médecin (Optionnel)
                </label>
                <textarea 
                  rows={2}
                  placeholder="Ex : Analyse de contrôle prescrite suite à de légers maux de tête..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input 
                  type="checkbox"
                  id="shareCheck"
                  checked={docShare}
                  onChange={(e) => setDocShare(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="shareCheck" className="text-xs text-slate-600 font-semibold cursor-pointer">
                  Partager automatiquement ce document avec mes médecins SangO Health
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition text-xs mt-2"
              >
                Enregistrer dans mon dossier santé
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APERÇU PLEIN ÉCRAN D'UN DOCUMENT (FEATURE 7) */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setViewingDocument(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase">
                  {viewingDocument.category}
                </span>
                <h3 className="text-xl font-black text-slate-900 font-brand mt-1">{viewingDocument.title}</h3>
                <p className="text-xs text-slate-500">{viewingDocument.facility} &bull; Émis le {viewingDocument.date}</p>
              </div>
            </div>

            {/* Aperçu du contenu */}
            <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden mb-4 border border-slate-200">
              {viewingDocument.fileUrl ? (
                <img 
                  src={viewingDocument.fileUrl} 
                  alt={viewingDocument.title} 
                  className="max-h-[460px] w-auto object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                  <div className="font-bold text-slate-800 text-sm">{viewingDocument.title}</div>
                  <div className="text-xs text-slate-500 mt-1">Fichier médical certifié ({viewingDocument.fileSize})</div>
                </div>
              )}
            </div>

            {viewingDocument.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4">
                <strong>Observations :</strong> {viewingDocument.notes}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setViewingDocument(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Téléconsultation Vidéo en direct pour Patient */}
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
