import React from 'react';
import { User, LogOut, ShieldCheck } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: (role?: UserRole) => void;
  onLogout: () => void;
}

export default function Header({
  currentView,
  setCurrentView,
  currentUser,
  onOpenAuthModal,
  onLogout
}: HeaderProps) {
  return (
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
            className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
          />
        </div>

        {/* Clean, Uncluttered Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <button 
            onClick={() => setCurrentView('home')} 
            className={`hover:text-blue-600 transition ${currentView === 'home' ? 'text-blue-600 font-semibold' : ''}`}
          >
            Accueil
          </button>
          
          <button 
            onClick={() => setCurrentView('search')} 
            className={`hover:text-blue-600 transition ${currentView === 'search' ? 'text-blue-600 font-semibold' : ''}`}
          >
            Trouver un médecin
          </button>

          {/* Conditional contextual link based on logged in role */}
          {currentUser?.role === 'patient' && (
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className={`hover:text-blue-600 transition ${currentView === 'dashboard' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Mes Rendez-vous
            </button>
          )}

          {currentUser?.role === 'doctor' && (
            <button 
              onClick={() => setCurrentView('doctor_portal')} 
              className={`hover:text-blue-600 transition ${currentView === 'doctor_portal' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Espace Praticien
            </button>
          )}

          {currentUser?.role === 'pharmacy' && (
            <button 
              onClick={() => setCurrentView('pharmacy_portal')} 
              className={`hover:text-blue-600 transition ${currentView === 'pharmacy_portal' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Portail Pharmacie
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => setCurrentView('saas_admin')} 
              className={`hover:text-blue-600 transition flex items-center space-x-1.5 ${currentView === 'saas_admin' ? 'text-blue-600 font-bold' : ''}`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>SaaS Control Panel</span>
            </button>
          )}
        </nav>

        {/* User Account & Login Portal Buttons */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Direct Super Admin access button */}
          <button 
            onClick={() => onOpenAuthModal('admin')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold transition shadow-sm"
            title="Connexion Super Administrateur SangO"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Portail Admin</span>
            <span className="sm:hidden">Admin</span>
          </button>

          {currentUser ? (
            <div className="flex items-center space-x-2.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{currentUser.name}</div>
                <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                  {currentUser.role === 'admin' ? 'Super Admin' : currentUser.role === 'doctor' ? 'Médecin' : currentUser.role === 'pharmacy' ? 'Pharmacie' : 'Patient'}
                </div>
              </div>
              <button 
                onClick={onLogout}
                title="Déconnexion"
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onOpenAuthModal('patient')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition text-xs sm:text-sm flex items-center space-x-1.5"
            >
              <User className="w-4 h-4" />
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
