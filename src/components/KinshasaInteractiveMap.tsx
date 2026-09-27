import React, { useState } from 'react';
import { 
  MapPin, 
  Stethoscope, 
  Pill, 
  Phone, 
  Clock, 
  Navigation, 
  Calendar, 
  Star, 
  CheckCircle2, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut, 
  Layers
} from 'lucide-react';
import { Doctor, PharmacyOnDuty } from '../types';
import { KINSHASA_PHARMACIES_ON_DUTY } from '../data/pharmacies';

interface KinshasaInteractiveMapProps {
  doctors: Doctor[];
  onSelectDoctor: (doctor: Doctor) => void;
}

export default function KinshasaInteractiveMap({ doctors, onSelectDoctor }: KinshasaInteractiveMapProps) {
  const [filterType, setFilterType] = useState<'all' | 'doctors' | 'pharmacies'>('all');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<{ type: 'doctor'; data: Doctor } | { type: 'pharmacy'; data: PharmacyOnDuty } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const communes = ['all', 'Gombe', 'Ngaliema', 'Limete', 'Lingwala', 'Kasa-Vubu', 'Bandalungwa'];

  // Normalisation des coordonnées pour les placer sur notre canevas SVG Kinshasa
  // Kinshasa approximatif : Lat [-4.36, -4.29], Lng [15.25, 15.36]
  const mapCoordsToXY = (lat: number, lng: number) => {
    const minLat = -4.37;
    const maxLat = -4.28;
    const minLng = 15.24;
    const maxLng = 15.36;

    // Normalisation en % de 0 à 100
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

    return { 
      x: Math.max(8, Math.min(92, x)), 
      y: Math.max(12, Math.min(88, y)) 
    };
  };

  const filteredDoctors = doctors.filter(doc => {
    if (filterType === 'pharmacies') return false;
    if (selectedCommune !== 'all' && doc.commune && doc.commune !== selectedCommune) return false;
    return true;
  });

  const filteredPharmacies = KINSHASA_PHARMACIES_ON_DUTY.filter(pharma => {
    if (filterType === 'doctors') return false;
    if (selectedCommune !== 'all' && pharma.commune !== selectedCommune) return false;
    return true;
  });

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Barre d'outils et filtres de la carte */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Kinshasa Santé Direct & Garde 24h/24
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-brand flex items-center space-x-2">
            <span>Carte Médicale Interactive</span>
          </h2>
          <p className="text-xs text-slate-400">
            Localisez les cabinets médicaux et les pharmacies de garde ouvertes autour de vous.
          </p>
        </div>

        {/* Filtre Type & Communes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type */}
          <div className="bg-slate-800/90 p-1 rounded-xl flex items-center border border-slate-700">
            <button
              onClick={() => { setFilterType('all'); setActiveItem(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({doctors.length + KINSHASA_PHARMACIES_ON_DUTY.length})
            </button>
            <button
              onClick={() => { setFilterType('doctors'); setActiveItem(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                filterType === 'doctors' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Médecins ({doctors.length})</span>
            </button>
            <button
              onClick={() => { setFilterType('pharmacies'); setActiveItem(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                filterType === 'pharmacies' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Pharmacies Garde ({KINSHASA_PHARMACIES_ON_DUTY.length})</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.45))} 
              className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-700"
              title="Zoomer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.9))} 
              className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-700"
              title="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setZoomLevel(1); setSelectedCommune('all'); setActiveItem(null); }} 
              className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-700 text-[10px] font-bold px-2"
              title="Réinitialiser la carte"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Filtres par commune de Kinshasa */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
        <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1 flex items-center space-x-1">
          <Navigation className="w-3 h-3 text-blue-400" />
          <span>Commune :</span>
        </span>
        {communes.map((comm) => (
          <button
            key={comm}
            onClick={() => { setSelectedCommune(comm); setActiveItem(null); }}
            className={`px-3 py-1 rounded-full font-bold text-xs shrink-0 transition ${
              selectedCommune === comm
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {comm === 'all' ? 'Toutes les communes' : comm}
          </button>
        ))}
      </div>

      {/* Surface Interactive de la Carte */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Grille stylisée et repères topographiques de Kinshasa */}
        <div 
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Fond fleuve Congo */}
          <svg className="w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2"/>
              </linearGradient>
            </defs>
            {/* Tracé stylisé de la courbe du fleuve Congo à Kinshasa */}
            <path 
              d="M 0,90 Q 200,60 450,85 T 900,40 T 1400,20 L 1400,0 L 0,0 Z" 
              fill="url(#riverGrad)" 
            />
            {/* Tracé du Boulevard du 30 Juin & grandes artères */}
            <path 
              d="M 120,240 Q 350,210 650,230 T 1100,260" 
              stroke="#334155" 
              strokeWidth="4" 
              fill="none" 
              strokeDasharray="6,4"
            />
            <path 
              d="M 280,100 L 320,400" 
              stroke="#1e293b" 
              strokeWidth="3" 
              fill="none" 
            />
            <path 
              d="M 600,100 L 640,420" 
              stroke="#1e293b" 
              strokeWidth="3" 
              fill="none" 
            />
          </svg>

          {/* Zones et étiquettes des communes de Kinshasa */}
          <div className="absolute top-[18%] left-[28%] text-slate-500 font-black tracking-widest text-[11px] sm:text-xs uppercase pointer-events-none select-none opacity-60">
            GOMBE
          </div>
          <div className="absolute top-[34%] left-[12%] text-slate-500 font-black tracking-widest text-[11px] sm:text-xs uppercase pointer-events-none select-none opacity-60">
            NGALIEMA
          </div>
          <div className="absolute top-[48%] left-[34%] text-slate-500 font-black tracking-widest text-[11px] sm:text-xs uppercase pointer-events-none select-none opacity-60">
            LINGWALA
          </div>
          <div className="absolute top-[52%] left-[65%] text-slate-500 font-black tracking-widest text-[11px] sm:text-xs uppercase pointer-events-none select-none opacity-60">
            LIMETE
          </div>
          <div className="absolute top-[68%] left-[26%] text-slate-500 font-black tracking-widest text-[11px] sm:text-xs uppercase pointer-events-none select-none opacity-60">
            BANDALUNGWA
          </div>
          <div className="absolute top-[72%] left-[44%] text-slate-500 font-black tracking-widest text-[11px] sm:text-xs uppercase pointer-events-none select-none opacity-60">
            KASA-VUBU
          </div>
          <div className="absolute top-[6%] left-[48%] text-cyan-400 font-bold tracking-widest text-[9px] uppercase pointer-events-none select-none opacity-50 flex items-center space-x-1">
            <span>FLEUVE CONGO</span>
          </div>

          {/* Marqueurs des Médecins */}
          {filteredDoctors.map((doc) => {
            const coords = doc.coordinates || { lat: -4.305, lng: 15.304 };
            const { x, y } = mapCoordsToXY(coords.lat, coords.lng);
            const isSelected = activeItem?.type === 'doctor' && activeItem.data.id === doc.id;

            return (
              <div
                key={`doc-${doc.id}`}
                onClick={() => setActiveItem({ type: 'doctor', data: doc })}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20 group ${
                  isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                }`}
              >
                <div className="relative flex flex-col items-center">
                  {/* Badge nom au survol */}
                  <div className={`mb-1 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl transition pointer-events-none ${
                    isSelected 
                      ? 'bg-blue-600 text-white ring-2 ring-white' 
                      : 'bg-slate-900/90 text-blue-200 border border-slate-700 opacity-90 group-hover:opacity-100'
                  }`}>
                    {doc.name.split(' ')[0]} {doc.name.split(' ')[1] || ''} ({doc.specialty})
                  </div>

                  {/* Pin Médecin */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                    isSelected 
                      ? 'bg-blue-500 text-white ring-4 ring-blue-400/40 ring-offset-2 ring-offset-slate-950 animate-bounce' 
                      : 'bg-blue-600 text-white hover:bg-blue-500 ring-2 ring-white/60'
                  }`}>
                    <Stethoscope className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Marqueurs des Pharmacies de Garde */}
          {filteredPharmacies.map((pharma) => {
            const { x, y } = mapCoordsToXY(pharma.coordinates.lat, pharma.coordinates.lng);
            const isSelected = activeItem?.type === 'pharmacy' && activeItem.data.id === pharma.id;

            return (
              <div
                key={`pharma-${pharma.id}`}
                onClick={() => setActiveItem({ type: 'pharmacy', data: pharma })}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20 group ${
                  isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                }`}
              >
                <div className="relative flex flex-col items-center">
                  {/* Badge pharmacie au survol */}
                  <div className={`mb-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl transition pointer-events-none ${
                    isSelected 
                      ? 'bg-emerald-600 text-white ring-2 ring-white' 
                      : 'bg-slate-900/90 text-emerald-300 border border-slate-700 opacity-90 group-hover:opacity-100'
                  }`}>
                    💊 {pharma.name.split(' ')[0]} {pharma.name.split(' ')[1] || ''}
                  </div>

                  {/* Pin Pharmacie */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                    isSelected 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/40 ring-offset-2 ring-offset-slate-950 animate-bounce' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-white/60'
                  }`}>
                    <Pill className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende en bas à gauche de la carte */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-3 shadow-lg pointer-events-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="font-semibold">Médecins & Cabinets</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-semibold">Pharmacies Garde 24h</span>
          </div>
        </div>

        {/* POPUP DÉTAIL FLOTTANT QUAND UN MARQUEUR EST SÉLECTIONNÉ */}
        {activeItem && (
          <div className="absolute bottom-4 right-4 max-w-sm w-[90%] sm:w-80 bg-white rounded-2xl shadow-2xl p-4 border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom duration-200 text-slate-800">
            <div className="flex items-start justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeItem.type === 'doctor' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeItem.type === 'doctor' ? activeItem.data.specialty : 'Pharmacie de garde 24h'}
              </span>
              <button 
                onClick={() => setActiveItem(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {activeItem.type === 'doctor' ? (
              /* Carte Médecin */
              <div>
                <div className="flex items-center space-x-3 mb-2.5">
                  <img 
                    src={activeItem.data.image} 
                    alt={activeItem.data.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{activeItem.data.name}</h4>
                    <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{activeItem.data.rating}</span>
                      <span className="text-slate-400 font-normal">({activeItem.data.reviewsCount} avis)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{activeItem.data.address}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-700">{activeItem.data.nextSlot}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectDoctor(activeItem.data)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Prendre Rendez-vous ({activeItem.data.fee})</span>
                </button>
              </div>
            ) : (
              /* Carte Pharmacie de Garde */
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{activeItem.data.name}</h4>
                <div className="space-y-1.5 text-xs text-slate-500 mb-3 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                  <div className="flex items-start space-x-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{activeItem.data.address}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeItem.data.hours}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeItem.data.phone}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <a
                    href={`tel:${activeItem.data.phone.replace(/\s+/g, '')}`}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 shadow transition text-center"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Appeler</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeItem.data.name + ' ' + activeItem.data.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition text-center"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Itinéraire</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
