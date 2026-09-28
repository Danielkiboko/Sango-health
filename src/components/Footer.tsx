import React from 'react';
import { Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  setCurrentView: (view: string) => void;
  onOpenAuthForDoctor: () => void;
}

export default function Footer({ setCurrentView, onOpenAuthForDoctor }: FooterProps) {
  const { t } = useLanguage();

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
            {t('footer_desc')}
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_patients')}</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setCurrentView('search')} className="hover:text-white transition">{t('footer_find_doctor')}</button></li>
            <li><button onClick={() => setCurrentView('search')} className="hover:text-white transition">{t('footer_teleconsultation')}</button></li>
            <li><button onClick={() => setCurrentView('dashboard')} className="hover:text-white transition">{t('footer_health_record')}</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_pros')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/loginns?role=doctor" onClick={(e) => { e.preventDefault(); onOpenAuthForDoctor(); }} className="hover:text-white transition">{t('footer_are_you_pro')}</a></li>
            <li><a href="/loginns?role=doctor" onClick={(e) => { e.preventDefault(); onOpenAuthForDoctor(); }} className="hover:text-white transition">{t('footer_pro_space')}</a></li>
            <li><button onClick={() => setCurrentView('search')} className="hover:text-white transition">{t('footer_directory')}</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_emergency_title')}</h4>
          <p className="text-xs text-slate-400 mb-3">{t('footer_emergency_desc')}</p>
          <div className="flex items-center space-x-2 text-white font-bold bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 w-fit">
            <Phone className="w-4 h-4 text-blue-400" />
            <span>112 / 117</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SangO Health Inc. {t('footer_rights')}
      </div>
    </footer>
  );
}
