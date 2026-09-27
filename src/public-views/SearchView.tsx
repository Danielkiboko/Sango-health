import React, { useState } from 'react';
import { ArrowLeft, Building2, Video, AlertCircle, Star, MapPin, Map, List, Navigation } from 'lucide-react';
import { Doctor } from '../types';
import KinshasaInteractiveMap from '../components/KinshasaInteractiveMap';

interface SearchViewProps {
  doctors: Doctor[];
  initialSpecialty: string;
  initialLocation: string;
  onSelectDoctor: (doctor: Doctor) => void;
  onBack: () => void;
}

export default function SearchView({
  doctors,
  initialSpecialty,
  initialLocation,
  onSelectDoctor,
  onBack
}: SearchViewProps) {
  const [filterSpecialty, setFilterSpecialty] = useState(initialSpecialty || '');
  const [filterQuery, setFilterQuery] = useState(initialLocation || '');
  const [filterType, setFilterType] = useState<'all' | 'cabinet' | 'video'>('all');
  const [displayMode, setDisplayMode] = useState<'list' | 'map'>('list');

  const filteredDoctors = doctors.filter(doc => {
    const matchesSpecialty = filterSpecialty === '' || doc.specialty.toLowerCase().includes(filterSpecialty.toLowerCase());
    const matchesQuery = filterQuery === '' || 
                         doc.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
                         doc.address.toLowerCase().includes(filterQuery.toLowerCase()) ||
                         (doc.commune && doc.commune.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchesType = filterType === 'all' || 
                        (filterType === 'video' && doc.consultationType.includes('Vidéo')) || 
                        (filterType === 'cabinet' && doc.consultationType.includes('Cabinet'));
    return matchesSpecialty && matchesQuery && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button 
            onClick={onBack} 
            className="flex items-center space-x-2 text-sm text-slate-500 hover:text-blue-600 mb-2 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
          <h1 className="font-brand text-3xl font-black text-slate-900 tracking-tight">
            Répertoire Médical & Urgences
          </h1>
          <p className="text-sm text-slate-500">
            {filteredDoctors.length} professionnels de santé et pharmacies de garde disponibles à Kinshasa
          </p>
        </div>

        {/* Bouton de bascule Vue Liste / Vue Carte */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setDisplayMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              displayMode === 'list'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Vue Liste</span>
          </button>
          <button
            onClick={() => setDisplayMode('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              displayMode === 'map'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Carte Kinshasa & Garde</span>
          </button>
        </div>
      </div>

      {/* Mode Carte Interactive */}
      {displayMode === 'map' ? (
        <div className="mb-10">
          <KinshasaInteractiveMap 
            doctors={filteredDoctors} 
            onSelectDoctor={onSelectDoctor} 
          />
        </div>
      ) : (
        /* Mode Liste */
        <>
          {/* Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
              <input 
                type="text" 
                placeholder="Rechercher médecin, commune (Gombe, Limete...)..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 w-full md:w-72"
              />
              <select 
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">Toutes les spécialités</option>
                <option value="Généraliste">Généraliste</option>
                <option value="Cardiologue">Cardiologue</option>
                <option value="Pédiatre">Pédiatre</option>
                <option value="Dentiste">Dentiste</option>
                <option value="Gynécologue">Gynécologue</option>
                <option value="Ophtalmologue">Ophtalmologue</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <button 
                onClick={() => setFilterType('all')} 
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  filterType === 'all' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous
              </button>
              <button 
                onClick={() => setFilterType('cabinet')} 
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                  filterType === 'cabinet' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Cabinet</span>
              </button>
              <button 
                onClick={() => setFilterType('video')} 
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                  filterType === 'video' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Téléconsultation</span>
              </button>
            </div>
          </div>

          {/* Doctor Cards List */}
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun médecin trouvé</h3>
              <p className="text-sm text-slate-500">Essayez de modifier vos critères de recherche ou réinitialisez les filtres.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDoctors.map((doc) => (
                <div 
                  key={doc.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                >
                  <div className="flex items-start space-x-4">
                    <img src={doc.image} alt={doc.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/20 shadow" />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{doc.specialty}</span>
                        {doc.commune && (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {doc.commune}
                          </span>
                        )}
                        <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{doc.rating}</span>
                          <span className="text-slate-400 font-normal">({doc.reviewsCount})</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{doc.name}</h3>
                      <p className="text-xs text-slate-500 mb-3 max-w-lg">{doc.bio}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{doc.address}</span>
                        </div>
                        <div className="flex items-center space-x-1 font-semibold text-slate-700">
                          <span>Tarif : {doc.fee}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right w-full sm:w-auto">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Prochain RDV</span>
                      <span className="text-xs font-bold text-emerald-600">{doc.nextSlot}</span>
                    </div>
                    <button 
                      onClick={() => onSelectDoctor(doc)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition text-xs w-full sm:w-auto"
                    >
                      Prendre rendez-vous
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
