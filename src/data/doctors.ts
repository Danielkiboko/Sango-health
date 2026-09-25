import { Doctor } from '../types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Dr. Marie Laurent",
    specialty: "Généraliste",
    address: "12 Avenue des Martyrs, Gombe, Kinshasa",
    rating: 4.9,
    reviewsCount: 124,
    fee: "25 000 CDF",
    nextSlot: "Aujourd'hui à 14:30",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    consultationType: "Cabinet & Vidéo",
    bio: "Médecin généraliste diplômée de l'Université de Kinshasa, spécialisée en médecine préventive et familiale.",
    slots: ["10:00", "11:30", "14:30", "16:00", "17:15"]
  },
  {
    id: 2,
    name: "Dr. Jean-Paul Mukendi",
    specialty: "Cardiologue",
    address: "45 Boulevard du 30 Juin, Kinshasa",
    rating: 4.8,
    reviewsCount: 98,
    fee: "50 000 CDF",
    nextSlot: "Demain à 09:00",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    consultationType: "Cabinet uniquement",
    bio: "Cardiologue interventionnel, ancien chef de clinique. Prise en charge des pathologies cardiovasculaires.",
    slots: ["09:00", "09:45", "11:00", "15:00"]
  },
  {
    id: 3,
    name: "Dr. Aminata Diallo",
    specialty: "Pédiatre",
    address: "8 Rue de la Clinique, Gombe, Kinshasa",
    rating: 5.0,
    reviewsCount: 210,
    fee: "35 000 CDF",
    nextSlot: "Aujourd'hui à 16:00",
    image: "https://images.unsplash.com/photo-1594824813587-75c13e4b4792?auto=format&fit=crop&q=80&w=300",
    consultationType: "Cabinet & Vidéo",
    bio: "Pédiatre passionnée par le développement de l'enfant et la néonatalogie. Accueil chaleureux des nourrissons.",
    slots: ["13:00", "14:00", "16:00", "16:45"]
  },
  {
    id: 4,
    name: "Dr. Marc Tshilombo",
    specialty: "Dentiste",
    address: "19 Avenue de la Paix, Lingwala, Kinshasa",
    rating: 4.7,
    reviewsCount: 85,
    fee: "40 000 CDF",
    nextSlot: "Mercredi à 10:15",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
    consultationType: "Cabinet uniquement",
    bio: "Chirurgien-dentiste spécialisé en esthétique dentaire et implantologie.",
    slots: ["08:30", "10:15", "14:00", "15:30"]
  }
];
