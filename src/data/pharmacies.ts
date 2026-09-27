import { PharmacyOnDuty } from '../types';

export const KINSHASA_PHARMACIES_ON_DUTY: PharmacyOnDuty[] = [
  {
    id: 101,
    name: "Grande Pharmacie du Boulevard (24h/24)",
    commune: "Gombe",
    address: "32 Boulevard du 30 Juin, en face de la BCDC, Kinshasa - Gombe",
    phone: "+243 81 555 0101",
    isOnDuty: true,
    isOpenNow: true,
    hours: "Ouvert 24h/24 - 7j/7 (Garde officielle)",
    distanceKm: 0.8,
    coordinates: { lat: -4.3032, lng: 15.3015 }
  },
  {
    id: 102,
    name: "Pharmacie Moderne de Ngaliema",
    commune: "Ngaliema",
    address: "Carrefour Kintambo Magasin, Réf. Arrêt Métro, Kinshasa",
    phone: "+243 82 444 0202",
    isOnDuty: true,
    isOpenNow: true,
    hours: "Service de garde de nuit jusqu'à 08h00",
    distanceKm: 3.4,
    coordinates: { lat: -4.3312, lng: 15.2678 }
  },
  {
    id: 103,
    name: "Pharmacie de la Paix - Limete",
    commune: "Limete",
    address: "7ème Rue Résidentielle, Rond-point Échangeur, Kinshasa",
    phone: "+243 99 777 0303",
    isOnDuty: true,
    isOpenNow: true,
    hours: "Ouvert 24h/24 - Garde continue",
    distanceKm: 5.2,
    coordinates: { lat: -4.3512, lng: 15.3421 }
  },
  {
    id: 104,
    name: "Pharmacie Centrale des Huileries",
    commune: "Lingwala",
    address: "Croisement Av. des Huileries et Av. de la Libération, Kinshasa",
    phone: "+243 85 111 0404",
    isOnDuty: false,
    isOpenNow: true,
    hours: "07:30 - 22:30",
    distanceKm: 2.1,
    coordinates: { lat: -4.3210, lng: 15.3090 }
  },
  {
    id: 105,
    name: "Pharmacie Maman Yemo / Kasa-Vubu",
    commune: "Kasa-Vubu",
    address: "Avenue Gambela n°144, Kinshasa",
    phone: "+243 89 222 0505",
    isOnDuty: true,
    isOpenNow: true,
    hours: "De garde 24h/24",
    distanceKm: 4.0,
    coordinates: { lat: -4.3415, lng: 15.3120 }
  },
  {
    id: 106,
    name: "Pharmacie Saint-Luc Bandal",
    commune: "Bandalungwa",
    address: "Avenue Kasa-Vubu près de la maison communale, Bandal",
    phone: "+243 81 333 0606",
    isOnDuty: false,
    isOpenNow: true,
    hours: "08:00 - 21:00",
    distanceKm: 3.9,
    coordinates: { lat: -4.3370, lng: 15.2890 }
  }
];
