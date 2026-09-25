import { SaaSDoctorAccount } from '../types';

export const INITIAL_SAAS_ACCOUNTS: SaaSDoctorAccount[] = [
  {
    id: 1,
    name: "Dr. Marie Laurent",
    specialty: "Généraliste",
    clinicName: "Cabinet Médical des Martyrs",
    address: "12 Avenue des Martyrs, Gombe, Kinshasa",
    phone: "+243 81 234 5678",
    email: "marie.laurent@sangohealth.cd",
    plan: "Pro Cabinet",
    monthlyFeeUSD: 59,
    status: "Actif",
    joinedDate: "15 Jan 2026",
    totalConsultations: 142,
    videoHoursUsed: 38.5,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: 2,
    name: "Dr. Jean-Paul Mukendi",
    specialty: "Cardiologue",
    clinicName: "Centre Cardio 30 Juin",
    address: "45 Boulevard du 30 Juin, Kinshasa",
    phone: "+243 89 876 5432",
    email: "jp.mukendi@cardiocenter.cd",
    plan: "Clinique Pro",
    monthlyFeeUSD: 149,
    status: "Actif",
    joinedDate: "02 Fév 2026",
    totalConsultations: 198,
    videoHoursUsed: 12.0,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: 3,
    name: "Dr. Aminata Diallo",
    specialty: "Pédiatre",
    clinicName: "Polyclinique de l'Enfant",
    address: "8 Rue de la Clinique, Gombe, Kinshasa",
    phone: "+243 82 456 7890",
    email: "a.diallo@pediatrie-kin.cd",
    plan: "Pro Cabinet",
    monthlyFeeUSD: 59,
    status: "Actif",
    joinedDate: "18 Fév 2026",
    totalConsultations: 245,
    videoHoursUsed: 54.2,
    image: "https://images.unsplash.com/photo-1594824813587-75c13e4b4792?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: 4,
    name: "Dr. Marc Tshilombo",
    specialty: "Dentiste",
    clinicName: "Cabinet Dentaire Espoir",
    address: "19 Avenue de la Paix, Lingwala, Kinshasa",
    phone: "+243 99 112 2334",
    email: "marc.tshilombo@dentiste.cd",
    plan: "Starter",
    monthlyFeeUSD: 29,
    status: "Actif",
    joinedDate: "10 Mar 2026",
    totalConsultations: 87,
    videoHoursUsed: 4.5,
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300"
  }
];
