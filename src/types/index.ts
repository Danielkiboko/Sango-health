export type UserRole = 'patient' | 'doctor' | 'admin' | 'pharmacy';

export interface UserProfile {
  name: string;
  role: UserRole;
  email: string;
}

export interface DoctorScheduleDay {
  day: string; // 'Lundi' | 'Mardi' | ...
  isActive: boolean;
  startHour: string;
  endHour: string;
  type: 'Cabinet & Vidéo' | 'Cabinet uniquement' | 'Vidéo uniquement';
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  address: string;
  rating: number;
  reviewsCount: number;
  fee: string;
  nextSlot: string;
  image: string;
  consultationType: string;
  bio: string;
  slots: string[];
  schedule?: DoctorScheduleDay[];
}

export interface Prescription {
  id: string;
  doctorName: string;
  patientName: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  notes?: string;
  qrCodeToken?: string;
  signatureStamp?: string;
  isDispensed?: boolean;
  dispensedAt?: string;
  dispensedByPharmacy?: string;
}

export interface Appointment {
  id: number;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: 'Confirmé' | 'Annulé' | 'Terminé';
  patientName: string;
  prescription?: Prescription;
}

export interface SaaSDoctorAccount {
  id: number;
  name: string;
  specialty: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  plan: 'Starter' | 'Pro Cabinet' | 'Clinique Pro';
  monthlyFeeUSD: number;
  status: 'Actif' | 'En attente' | 'Suspendu';
  joinedDate: string;
  totalConsultations: number;
  videoHoursUsed: number;
  image: string;
  lastPaymentDate?: string;
  paymentMethod?: 'M-Pesa' | 'Orange Money' | 'Airtel Money' | 'Carte Visa/Mastercard';
  paymentStatus?: 'Payé' | 'En attente' | 'Échu';
}

export interface SaaSSubscriptionInvoice {
  id: string;
  accountName: string;
  clinicName: string;
  plan: string;
  amountUSD: number;
  amountCDF: number;
  date: string;
  paymentMethod: 'M-Pesa' | 'Orange Money' | 'Airtel Money' | 'Carte Visa/Mastercard';
  phoneNumber?: string;
  status: 'Payé' | 'En cours' | 'Échoué';
  transactionRef: string;
}
