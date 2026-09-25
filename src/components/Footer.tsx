import React from 'react';
import { Phone } from 'lucide-react';

interface FooterProps {
  setCurrentView: (view: string) => void;
  onOpenAuthForDoctor: () => void;
}

export default function Footer({ setCurrentView, onOpenAuthForDoctor }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={() => setCurrentView('home')}>
            <img 
              src="/brand/sango-logo-white.png" 
              alt="SangO Health" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <p className="text-sm text-slate-400">
            La plateforme SaaS médicale de référence pour simplifier vos rendez-vous et accéder à des soins de qualité en cabinet et téléconsultation.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Patients</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setCurrentView('search')} className="hover:text-white transition">Rechercher un médecin</button></li>
            <li><button onClick={() => setCurrentView('search')} className="hover:text-white transition">Téléconsultation</button></li>
            <li><button onClick={() => setCurrentView('dashboard')} className="hover:text-white transition">Carnet de santé</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Professionnels de santé</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={onOpenAuthForDoctor} className="hover:text-white transition">Vous êtes médecin ?</button></li>
            <li><a href="#pro" onClick={(e) => { e.preventDefault(); setCurrentView('doctor_portal'); }} className="hover:text-white transition">Gestion de cabinet</a></li>
            <li><a href="#saas" onClick={(e) => { e.preventDefault(); setCurrentView('saas_admin'); }} className="hover:text-white transition">Console SaaS Admin</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Assistance & Urgences</h4>
          <p className="text-xs text-slate-400 mb-3">En cas d'urgence vitale, veuillez contacter immédiatement les services de secours de votre région.</p>
          <div className="flex items-center space-x-2 text-white font-bold bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 w-fit">
            <Phone className="w-4 h-4 text-blue-400" />
            <span>112 / 117</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SangO Health Inc. Tous droits réservés. Plateforme médicale digitalisée en RDC.
      </div>
    </footer>
  );
}
