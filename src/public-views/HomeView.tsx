import React from 'react';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Star, 
  Stethoscope, 
  HeartPulse, 
  User, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { Doctor } from '../types';

interface HomeViewProps {
  searchSpecialty: string;
  setSearchSpecialty: (val: string) => void;
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  doctors: Doctor[];
  onSelectDoctor: (doctor: Doctor) => void;
  onNavigateSearch: () => void;
}

export default function HomeView({
  searchSpecialty,
  setSearchSpecialty,
  searchLocation,
  setSearchLocation,
  onSearchSubmit,
  doctors,
  onSelectDoctor,
  onNavigateSearch
}: HomeViewProps) {
  const specialties = [
    { name: "Généraliste", icon: <Stethoscope className="w-6 h-6" />, count: "140+ praticiens" },
    { name: "Cardiologue", icon: <HeartPulse className="w-6 h-6" />, count: "45+ praticiens" },
    { name: "Pédiatre", icon: <User className="w-6 h-6" />, count: "60+ praticiens" },
    { name: "Dentiste", icon: <ShieldCheck className="w-6 h-6" />, count: "80+ praticiens" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>La santé simplifiée, disponible 24h/24 et 7j/7</span>
          </span>
          <h1 className="font-brand text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
            Prenez rendez-vous chez votre médecin en <span className="text-blue-400">quelques clics</span>
          </h1>
          <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto">
            Trouvez un professionnel de santé près de chez vous, réservez instantanément et gérez vos consultations en toute sécurité.
          </p>

          {/* Search Box Card */}
          <form onSubmit={onSearchSubmit} className="bg-white p-3 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-3 text-slate-800">
            <div className="flex-1 flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
              <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Médecin, spécialité, établissement..." 
                value={searchSpecialty}
                onChange={(e) => setSearchSpecialty(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
            <div className="flex-1 flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Ville, commune (Gombe, Lingwala...)" 
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>Rechercher</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Specialties Quick Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-brand text-2xl font-black text-slate-900 tracking-tight">Spécialités recherchées</h2>
            <p className="text-sm text-slate-500">Trouvez rapidement un spécialiste adapté à vos besoins</p>
          </div>
          <button onClick={onNavigateSearch} className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1">
            <span>Voir tout</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {specialties.map((spec, idx) => (
            <div 
              key={idx} 
              onClick={() => { setSearchSpecialty(spec.name); onNavigateSearch(); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer transition group"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                {spec.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{spec.name}</h3>
              <p className="text-xs text-slate-500">{spec.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Doctors Section */}
      <div className="bg-slate-100/70 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-brand text-2xl font-black text-slate-900 tracking-tight">Praticiens disponibles rapidement</h2>
              <p className="text-sm text-slate-500">Réservez un créneau dès aujourd'hui</p>
            </div>
            <button onClick={onNavigateSearch} className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1">
              <span>Tous les praticiens</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
                <div className="relative h-48 bg-slate-200">
                  <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    {doc.fee}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold mb-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal">({doc.reviewsCount} avis)</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-0.5">{doc.name}</h3>
                    <p className="text-blue-600 font-semibold text-xs mb-3">{doc.specialty}</p>
                    <div className="flex items-start space-x-2 text-slate-500 text-xs mb-4">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{doc.address}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Prochain créneau</span>
                      <span className="text-xs font-bold text-emerald-600">{doc.nextSlot}</span>
                    </div>
                    <button 
                      onClick={() => onSelectDoctor(doc)}
                      className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold px-4 py-2 rounded-xl text-xs transition"
                    >
                      Prendre RDV
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
