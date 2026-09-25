import { Appointment } from '../types';

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 101,
    doctorName: "Dr. Marie Laurent",
    specialty: "Généraliste",
    date: "Aujourd'hui",
    time: "14:30",
    type: "Cabinet & Vidéo",
    status: "Confirmé",
    patientName: "Christian Kabeya",
    prescription: {
      id: "ORD-942810",
      doctorName: "Dr. Marie Laurent",
      patientName: "Christian Kabeya",
      date: "25 Septembre 2026",
      medications: [
        {
          name: "Amoxicilline 1g",
          dosage: "1 comprimé matin et soir",
          duration: "6 jours",
          instructions: "À prendre au milieu des repas"
        },
        {
          name: "Paracétamol 1000mg",
          dosage: "1 comprimé toutes les 6 heures si fièvre",
          duration: "5 jours",
          instructions: "Ne pas dépasser 3g par jour"
        }
      ],
      notes: "Repos complet pendant 48 heures. Hydratation abondante. Recontacter si la fièvre persiste au-delà de 72 heures.",
      qrCodeToken: "SANGO-VERIFY-942810",
      signatureStamp: "Signé numériquement par Dr. Marie Laurent - SangO Health RDC"
    }
  },
  {
    id: 102,
    doctorName: "Dr. Marie Laurent",
    specialty: "Généraliste",
    date: "Demain",
    time: "11:00",
    type: "Téléconsultation",
    status: "Confirmé",
    patientName: "Francine Mulamba"
  }
];
