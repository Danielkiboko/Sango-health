import React, { useState } from 'react';
import { X, Lock, Mail, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '../types';
import { dataService } from '../lib/dataService';
import SetPasswordModal from './SetPasswordModal';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  initialPortal?: 'patient' | 'doctor' | 'admin';
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSettingPasswordOpen, setIsSettingPasswordOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SUPER_ADMIN_EMAILS = ['danielkiboko218@gmail.com', 'kibongef15@gmail.com'];
  const isSuperAdminEmail = (emailStr: string) => SUPER_ADMIN_EMAILS.includes(emailStr.trim().toLowerCase());

  // Réinitialisation du mot de passe
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setInfoMessage({ text: "Veuillez renseigner votre adresse email.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setInfoMessage(null);

    const res = await dataService.sendAdminInvite(email.trim());
    if (res.success) {
      setInfoMessage({ 
        text: `Un lien sécurisé de réinitialisation a été envoyé à ${email.trim()}. Vérifiez votre boîte de réception.`, 
        type: 'success' 
      });
    } else {
      setInfoMessage({ text: res.message || "Email envoyé avec succès.", type: 'success' });
    }
    setIsSubmitting(false);
  };

  // Connexion unifiée : Détection 100% automatique du rôle (Super Admin, Médecin ou Patient)
  // Plus besoin de demander manuellement à l'utilisateur de choisir son rôle !
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setInfoMessage({ text: "Veuillez saisir votre adresse email.", type: 'error' });
      return;
    }
    if (!password) {
      setInfoMessage({ text: "Veuillez saisir votre mot de passe.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setInfoMessage(null);

    // Vérification mot de passe stocké si existant
    const storedPwd = typeof window !== 'undefined' ? window.localStorage.getItem(`sango_pwd_${cleanEmail}`) : null;
    if (storedPwd && storedPwd !== password) {
      setInfoMessage({
        text: "Mot de passe incorrect. Cliquez sur 'Mot de passe oublié ?' si vous l'avez égaré.",
        type: 'error'
      });
      setIsSubmitting(false);
      return;
    } else if (password && typeof window !== 'undefined') {
      window.localStorage.setItem(`sango_pwd_${cleanEmail}`, password);
    }

    // 1. DÉTECTION AUTOMATIQUE : SUPER ADMIN
    if (isSuperAdminEmail(cleanEmail)) {
      onLogin({
        name: cleanEmail.includes('daniel') ? 'KIBOKO Daniel' : 'KIBONGE François',
        role: 'admin',
        email: cleanEmail
      });
      setIsSubmitting(false);
      return;
    }

    // 2. DÉTECTION AUTOMATIQUE : MÉDECIN / PRATICIEN
    try {
      const [saasAccs, doctors] = await Promise.all([
        dataService.getSaaSAccounts().catch(() => []),
        dataService.getDoctors().catch(() => [])
      ]);

      const foundSaas = saasAccs.find(a => a.email.toLowerCase() === cleanEmail);
      const isDoctorEmail = cleanEmail.includes('dr.') || cleanEmail.includes('docteur') || !!foundSaas;

      if (isDoctorEmail || foundSaas) {
        let doctorName = foundSaas?.name;
        if (!doctorName) {
          const matchedDoc = doctors.find(d => cleanEmail.includes(d.name.toLowerCase().replace(/[^a-z]/g, '')));
          doctorName = matchedDoc ? matchedDoc.name : undefined;
        }

        if (!doctorName) {
          const raw = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
          const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
          doctorName = cap.startsWith('Dr') ? cap : `Dr. ${cap}`;
        }

        onLogin({
          name: doctorName,
          role: 'doctor',
          email: cleanEmail
        });
        setIsSubmitting(false);
        return;
      }
    } catch {
      // noop
    }

    // 3. DÉTECTION AUTOMATIQUE : PATIENT (Par défaut)
    const rawName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const patientName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    onLogin({
      name: patientName,
      role: 'patient',
      email: cleanEmail
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in duration-200 border border-slate-100">
        
        {/* Bouton Fermer */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo SangO Health & Titre Épuré */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/brand/sango-logo-blue.png" 
              alt="SangO Health" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <h2 className="font-brand text-2xl font-black text-slate-900 tracking-tight">
            {isForgotPassword ? 'Mot de passe oublié' : 'Se connecter'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isForgotPassword 
              ? 'Recevez un lien de réinitialisation sécurisé par email' 
              : 'Accédez à votre espace sécurisé SangO Health'}
          </p>
        </div>

        {/* Message d'information/succès/erreur */}
        {infoMessage && (
          <div className={`mb-5 p-3.5 rounded-2xl text-xs flex items-start space-x-2.5 ${
            infoMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : infoMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {infoMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{infoMessage.text}</span>
              {infoMessage.type === 'error' && infoMessage.text.includes('configuré') && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingPasswordOpen(true)}
                    className="font-bold text-blue-700 underline text-xs hover:text-blue-900"
                  >
                    👉 Définir mon mot de passe maintenant
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isForgotPassword ? (
          /* FORMULAIRE MOT DE PASSE OUBLIÉ */
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition text-sm flex items-center justify-center space-x-2"
            >
              <span>Envoyer le lien de réinitialisation</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setInfoMessage(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition flex items-center justify-center space-x-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </form>
        ) : (
          /* FORMULAIRE CONNEXION ÉPURÉ : EMAIL + MOT DE PASSE AVEC PRÉVISUALISATION + MOT DE PASSE OUBLIÉ */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* 1. Champ Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* 2. Champ Mot de passe avec prévisualisation (Eye/EyeOff) et lien Mot de passe oublié */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('auth_password')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setInfoMessage(null);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
                {/* Bouton Prévisualiser le mot de passe */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Bouton Se connecter */}
            <button 
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition text-sm flex items-center justify-center space-x-2 mt-2"
            >
              <span>{t('nav_signin')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Modal pour définir le mot de passe si besoin */}
        {isSettingPasswordOpen && (
          <SetPasswordModal
            userEmail={email.trim()}
            onClose={() => setIsSettingPasswordOpen(false)}
            onSuccess={() => {
              setInfoMessage({
                text: `Mot de passe enregistré avec succès pour ${email.trim()} ! Vous pouvez maintenant vous connecter.`,
                type: 'success'
              });
              setPassword('');
              setIsSettingPasswordOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
