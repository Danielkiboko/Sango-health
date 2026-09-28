import React from 'react';
import { User, LogOut, ShieldCheck, Home, Search, FileText, Stethoscope, Users } from 'lucide-react';
import { UserProfile } from '../types';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: (portal?: 'patient' | 'doctor' | 'admin') => void;
  onLogout: () => void;
}

export default function Header({
  currentView,
  setCurrentView,
  currentUser,
  onOpenAuthModal,
  onLogout
}: HeaderProps) {
  const { t } = useLanguage();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group py-1" 
            onClick={() => setCurrentView('home')}
          >
            <img 
              src="/brand/sango-logo-blue.png" 
              alt="SangO Health" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </div>

          {/* ========================================================= */}
          {/* NAVIGATION DESKTOP : STRICTEMENT SPÉCIFIQUE À CHAQUE RÔLE */}
          {/* ========================================================= */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            {/* 1. LIEN ACCUEIL (Commun à tous) */}
            <button 
              onClick={() => setCurrentView('home')} 
              className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'home' ? 'text-blue-600 font-bold' : ''}`}
            >
              <Home className="w-4 h-4" />
              <span>{t('nav_home')}</span>
            </button>

            {/* 2. NAVIGATION SPÉCIFIQUE SUPER ADMIN */}
            {currentUser?.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('saas_admin')} 
                className={`hover:text-blue-600 transition flex items-center space-x-2 py-1.5 px-3 rounded-xl border ${
                  currentView === 'saas_admin' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold shadow-xs' 
                    : 'border-transparent text-slate-700 hover:bg-slate-50'
                }`}
                title="Accéder à la console de gestion SaaS et d'audit"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Console C-Panel SaaS</span>
              </button>
            )}

            {/* 3. NAVIGATION SPÉCIFIQUE MÉDECIN / PRATICIEN */}
            {currentUser?.role === 'doctor' && (
              <>
                <button 
                  onClick={() => setCurrentView('doctor_portal')} 
                  className={`hover:text-blue-600 transition flex items-center space-x-2 py-1.5 px-3 rounded-xl border ${
                    currentView === 'doctor_portal' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold shadow-xs' 
                      : 'border-transparent text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Mon Espace Cabinet</span>
                </button>

                <button 
                  onClick={() => setCurrentView('search')} 
                  className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'search' ? 'text-blue-600 font-bold' : ''}`}
                  title="Consulter l'annuaire des confrères pour adresser un patient"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Réseau Confrères</span>
                </button>
              </>
            )}

            {/* 4. NAVIGATION SPÉCIFIQUE PATIENT */}
            {currentUser?.role === 'patient' && (
              <>
                <button 
                  onClick={() => setCurrentView('search')} 
                  className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'search' ? 'text-blue-600 font-bold' : ''}`}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('nav_find_doctor')}</span>
                </button>

                <button 
                  onClick={() => setCurrentView('dashboard')} 
                  className={`hover:text-blue-600 transition flex items-center space-x-2 py-1.5 px-3 rounded-xl border ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold shadow-xs' 
                      : 'border-transparent text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{t('nav_my_records')}</span>
                </button>
              </>
            )}

            {/* 5. NAVIGATION VISITEUR NON CONNECTÉ */}
            {!currentUser && (
              <>
                <button 
                  onClick={() => setCurrentView('search')} 
                  className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'search' ? 'text-blue-600 font-bold' : ''}`}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('nav_find_doctor')}</span>
                </button>

                <a 
                  href="/loginns?role=doctor"
                  onClick={(e) => { e.preventDefault(); onOpenAuthModal('doctor'); }} 
                  className="hover:text-blue-600 transition flex items-center space-x-1.5 text-slate-600 cursor-pointer"
                  title="Connexion praticiens et cabinets médicaux"
                >
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Espace Soignants</span>
                </a>

                <a 
                  href="/loginns?role=admin"
                  onClick={(e) => { e.preventDefault(); onOpenAuthModal('admin'); }} 
                  className="hover:text-blue-600 transition flex items-center space-x-1.5 text-slate-600 cursor-pointer"
                  title="Accès direction et administration"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Espace Admin</span>
                </a>
              </>
            )}
          </nav>

          {/* ========================================================= */}
          {/* SECTION DROITE : SÉLECTEUR DE LANGUE + PROFIL / LOGIN */}
          {/* ========================================================= */}
          <div className="flex items-center space-x-3">
            <LanguageSelector />

            {currentUser ? (
              /* Badge Profil utilisateur connecté (Sans bouton C-Panel doublon) */
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                <button 
                  onClick={() => {
                    if (currentUser.role === 'admin') setCurrentView('saas_admin');
                    else if (currentUser.role === 'doctor') setCurrentView('doctor_portal');
                    else setCurrentView('dashboard');
                  }}
                  className="flex items-center space-x-2.5 text-left group"
                  title="Accéder à mon espace"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0 group-hover:bg-blue-700 transition">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider flex items-center space-x-1">
                      {currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0 inline" />
                          <span className="font-bold">Super Admin</span>
                        </>
                      ) : currentUser.role === 'doctor' ? (
                        <span>Médecin</span>
                      ) : (
                        <span>Patient</span>
                      )}
                    </div>
                  </div>
                </button>

                <button 
                  onClick={onLogout}
                  title={t('nav_logout')}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Bouton de connexion pour visiteur */
              <a 
                href="/loginns"
                onClick={(e) => { e.preventDefault(); onOpenAuthModal('patient'); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>{t('nav_signin')}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* NAVIGATION MOBILE STRICTEMENT SPÉCIFIQUE AU RÔLE */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            currentView === 'home' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t('nav_home')}</span>
        </button>

        {/* Menu mobile spécifique Super Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setCurrentView('saas_admin')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              currentView === 'saas_admin' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-700">C-Panel</span>
          </button>
        )}

        {/* Menu mobile spécifique Médecin */}
        {currentUser?.role === 'doctor' && (
          <>
            <button
              onClick={() => setCurrentView('doctor_portal')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                currentView === 'doctor_portal' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Stethoscope className="w-5 h-5 mb-0.5 text-blue-600" />
              <span className="text-[10px] font-bold">Mon Cabinet</span>
            </button>

            <button
              onClick={() => setCurrentView('search')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                currentView === 'search' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5 text-blue-600" />
              <span className="text-[10px]">Confrères</span>
            </button>
          </>
        )}

        {/* Menu mobile spécifique Patient */}
        {currentUser?.role === 'patient' && (
          <>
            <button
              onClick={() => setCurrentView('search')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                currentView === 'search' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Search className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{t('nav_find_doctor')}</span>
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                currentView === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5 text-blue-600" />
              <span className="text-[10px] font-bold">{t('nav_my_records')}</span>
            </button>
          </>
        )}

        {/* Menu mobile Visiteur non connecté */}
        {!currentUser && (
          <>
            <button
              onClick={() => setCurrentView('search')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                currentView === 'search' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Search className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{t('nav_find_doctor')}</span>
            </button>

            <a
              href="/loginns"
              onClick={(e) => { e.preventDefault(); onOpenAuthModal('patient'); }}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-blue-600 transition cursor-pointer"
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{t('nav_signin')}</span>
            </a>
          </>
        )}
      </nav>
    </>
  );
}
