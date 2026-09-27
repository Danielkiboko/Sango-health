import React from 'react';
import { User, LogOut, ShieldCheck, Home, Search, FileText, Stethoscope, Users } from 'lucide-react';
import { UserProfile } from '../types';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo - Official Blue & White */}
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <button 
              onClick={() => setCurrentView('home')} 
              className={`hover:text-blue-600 transition ${currentView === 'home' ? 'text-blue-600 font-semibold' : ''}`}
            >
              {t('nav_home')}
            </button>
            
            {/* "Trouver un médecin" : Uniquement pour les visiteurs non connectés ou patients */}
            {(!currentUser || currentUser.role === 'patient') && (
              <button 
                onClick={() => setCurrentView('search')} 
                className={`hover:text-blue-600 transition ${currentView === 'search' ? 'text-blue-600 font-semibold' : ''}`}
              >
                {t('nav_find_doctor')}
              </button>
            )}

            {/* Pour les soignants : Réseau Confrères (annuaire professionnel pour orientation patient) */}
            {currentUser?.role === 'doctor' && (
              <button 
                onClick={() => setCurrentView('search')} 
                className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'search' ? 'text-blue-600 font-semibold' : ''}`}
                title="Consulter l'annuaire des confrères pour adresser un patient"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Réseau Confrères</span>
              </button>
            )}

            {/* Espace Dossier Patient */}
            {currentUser?.role === 'patient' && (
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`hover:text-blue-600 transition ${currentView === 'dashboard' ? 'text-blue-600 font-semibold' : ''}`}
              >
                {t('nav_my_records')}
              </button>
            )}

            {/* Espace Médecin */}
            {currentUser?.role === 'doctor' && (
              <button 
                onClick={() => setCurrentView('doctor_portal')} 
                className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'doctor_portal' ? 'text-blue-600 font-bold' : ''}`}
              >
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>Mon Espace Cabinet</span>
              </button>
            )}

            {currentUser?.role === 'pharmacy' && (
              <button 
                onClick={() => setCurrentView('pharmacy_portal')} 
                className={`hover:text-blue-600 transition ${currentView === 'pharmacy_portal' ? 'text-blue-600 font-semibold' : ''}`}
              >
                {t('nav_pharmacy_portal')}
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('saas_admin')} 
                className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'saas_admin' ? 'text-blue-600 font-bold' : ''}`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{t('nav_cpanel')}</span>
              </button>
            )}
          </nav>

          {/* Right Section: Language Selector + Mobile & Desktop Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* SÉLECTEUR DE LANGUE (6 LANGUES : FR, EN, LN, SW, KG, TS) */}
            <LanguageSelector />

            {/* BOUTON C-PANEL DÉDIÉ (Visible sur mobile ET ordinateur pour les Super Admins) */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('saas_admin')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-bold text-xs transition shadow-sm ${
                  currentView === 'saas_admin'
                    ? 'bg-blue-600 text-white shadow-blue-600/30'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
                title="Accéder au SaaS Control Panel"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold">C-Panel</span>
              </button>
            )}

            {currentUser?.role === 'patient' && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`md:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  currentView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dossier</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-50 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <button 
                  onClick={() => {
                    if (currentUser.role === 'admin') setCurrentView('saas_admin');
                    else if (currentUser.role === 'doctor') setCurrentView('doctor_portal');
                    else if (currentUser.role === 'pharmacy') setCurrentView('pharmacy_portal');
                    else setCurrentView('dashboard');
                  }}
                  className="flex items-center space-x-2 text-left group"
                  title="Accéder à mon espace"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0 group-hover:bg-blue-700 transition">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[90px] sm:max-w-[130px]">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-blue-600 font-semibold uppercase tracking-wider flex items-center space-x-1">
                      {currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0 inline" />
                          <span className="font-bold">Super Admin</span>
                        </>
                      ) : currentUser.role === 'doctor' ? 'Médecin' : currentUser.role === 'pharmacy' ? 'Pharmacie' : 'Patient'}
                    </div>
                  </div>
                </button>

                <button 
                  onClick={onLogout}
                  title={t('nav_logout')}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuthModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2"
              >
                <User className="w-4 h-4" />
                <span>{t('nav_signin')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barre de navigation mobile en bas d'écran (Smartphones) */}
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

        {/* Recherche praticien : Uniquement pour les visiteurs non connectés ou patients */}
        {(!currentUser || currentUser.role === 'patient') && (
          <button
            onClick={() => setCurrentView('search')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              currentView === 'search' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{t('nav_find_doctor')}</span>
          </button>
        )}

        {/* Confrères : Pour les médecins */}
        {currentUser?.role === 'doctor' && (
          <button
            onClick={() => setCurrentView('search')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              currentView === 'search' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5 text-blue-600" />
            <span className="text-[10px]">Confrères</span>
          </button>
        )}

        {currentUser?.role === 'admin' ? (
          <button
            onClick={() => setCurrentView('saas_admin')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              currentView === 'saas_admin' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-700">C-Panel</span>
          </button>
        ) : currentUser?.role === 'doctor' ? (
          <button
            onClick={() => setCurrentView('doctor_portal')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              currentView === 'doctor_portal' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-5 h-5 mb-0.5 text-blue-600" />
            <span className="text-[10px] font-bold">Mon Cabinet</span>
          </button>
        ) : currentUser?.role === 'patient' ? (
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              currentView === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{t('nav_my_records')}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-blue-600 transition"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{t('nav_signin')}</span>
          </button>
        )}
      </nav>
    </>
  );
}
