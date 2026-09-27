import React, { useState } from 'react';
import { X, Lock, Mail, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, KeyRound, User, Stethoscope, ShieldCheck } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { dataService } from '../lib/dataService';
import SetPasswordModal from './SetPasswordModal';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const { t } = useLanguage();
  const [selectedPortal, setSelectedPortal] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSettingPasswordOpen, setIsSettingPasswordOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialisation du mot de passe (Mot de passe oublié)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setInfoMessage({ text: "Veuillez saisir votre adresse email.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setInfoMessage(null);

    const res = await dataService.sendAdminInvite(email.trim());
    if (res.success) {
      setInfoMessage({ 
        text: `Un lien sécurisé de réinitialisation a été envoyé à ${email.trim()}. Vérifiez vos messages et vos spams. Vous pouvez également définir votre mot de passe directement via le bouton ci-dessous.`, 
        type: 'success' 
      });
    } else {
      setInfoMessage({ text: res.message, type: 'error' });
    }
    setIsSubmitting(false);
  };

  const SUPER_ADMIN_EMAILS = ['danielkiboko218@gmail.com', 'kibongef15@gmail.com'];
  const isSuperAdminEmail = (emailStr: string) => SUPER_ADMIN_EMAILS.includes(emailStr.trim().toLowerCase());

  // Connexion avec séparation stricte des dossiers (Patient, Praticien, Admin)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setInfoMessage(null);
    const cleanEmail = email.trim().toLowerCase();

    // SÉCURITÉ ABSOLUE : Vérification que l'email Admin ne peut JAMAIS devenir Patient ou Médecin
    if (isSuperAdminEmail(cleanEmail) && selectedPortal !== 'admin') {
      setSelectedPortal('admin');
      setInfoMessage({
        text: "🔒 Sécurité : Cette adresse est enregistrée comme Super Administrateur. Vous ne pouvez pas vous connecter en tant que patient ou praticien avec cet email. Veuillez saisir votre mot de passe administrateur.",
        type: 'error'
      });
      setIsSubmitting(false);
      return;
    }

    // 1. DOSSIER PATIENT (Réservé exclusivement aux patients)
    if (selectedPortal === 'patient') {
      if (isSuperAdminEmail(cleanEmail)) {
        setInfoMessage({
          text: "Accès refusé. Cette adresse email appartient à un Super Administrateur et ne peut pas créer de dossier patient.",
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      const storedPwd = typeof window !== 'undefined' ? window.localStorage.getItem(`sango_pwd_${cleanEmail}`) : null;
      if (storedPwd && storedPwd !== password) {
        setInfoMessage({
          text: `Mot de passe incorrect pour le compte patient ${email.trim()}.`,
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      } else if (password && typeof window !== 'undefined') {
        window.localStorage.setItem(`sango_pwd_${cleanEmail}`, password);
      }

      const displayName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');

      onLogin({
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        role: 'patient',
        email: email.trim()
      });
      return;
    }

    // 2. DOSSIER PRATICIEN / PRO (Réservé aux soignants)
    if (selectedPortal === 'doctor') {
      if (isSuperAdminEmail(cleanEmail)) {
        setInfoMessage({
          text: "Accès refusé. Cette adresse email appartient à un Super Administrateur.",
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      const storedPwd = typeof window !== 'undefined' ? window.localStorage.getItem(`sango_pwd_${cleanEmail}`) : null;
      if (storedPwd && storedPwd !== password) {
        setInfoMessage({
          text: `Mot de passe incorrect pour ce compte professionnel.`,
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      } else if (password && typeof window !== 'undefined') {
        window.localStorage.setItem(`sango_pwd_${cleanEmail}`, password);
      }

      onLogin({
        name: cleanEmail.includes('marie') ? 'Dr. Marie Laurent' : 'Dr. Praticien Partenaire',
        role: 'doctor',
        email: email.trim()
      });
      return;
    }

    // 3. CONSOLE SUPER ADMIN (Accès strictement vérifié et réservé aux Super Admins)
    if (selectedPortal === 'admin') {
      if (!isSuperAdminEmail(cleanEmail)) {
        setInfoMessage({
          text: "Accès refusé. Seuls les Super Administrateurs autorisés (Daniel KIBOKO & François KIBONGE) peuvent se connecter à cette console.",
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      if (!password) {
        setInfoMessage({ 
          text: "Veuillez saisir votre mot de passe administrateur.", 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      // Vérification du mot de passe propre à cet administrateur spécifique
      const check = await dataService.verifyAdminPassword(email, password);
      if (!check.valid) {
        setInfoMessage({ 
          text: check.message || `Mot de passe incorrect pour le compte administrateur ${email.trim()}.`, 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      onLogin({
        name: cleanEmail.includes('daniel') ? 'KIBOKO Daniel' : 'KIBONGE François',
        role: 'admin',
        email: email.trim()
      });
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in duration-200 border border-slate-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo SangO Health */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <img 
              src="/brand/sango-logo-blue.png" 
              alt="SangO Health" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <h2 className="font-brand text-2xl font-black text-slate-900">
            {isForgotPassword ? 'Mot de passe oublié' : 'Connexion SangO Health'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isForgotPassword 
              ? 'Recevez un lien de réinitialisation sécurisé par email' 
              : selectedPortal === 'patient' 
                ? 'Mon Dossier Santé & Historique des Rendez-vous'
                : selectedPortal === 'doctor'
                  ? 'Gestion de cabinet & Téléconsultations'
                  : 'Console Super Admin (Daniel & François)'}
          </p>
        </div>

        {/* Séparation claire des dossiers via des onglets visuels */}
        {!isForgotPassword && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => { 
                if (isSuperAdminEmail(email)) {
                  setInfoMessage({
                    text: "🔒 Ce compte est un Super Administrateur. Le rôle est strictement verrouillé sur la Console d'Administration.",
                    type: 'error'
                  });
                  return;
                }
                setSelectedPortal('patient'); 
                setInfoMessage(null); 
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                selectedPortal === 'patient' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('auth_tab_patient')}</span>
            </button>
            <button
              type="button"
              onClick={() => { 
                if (isSuperAdminEmail(email)) {
                  setInfoMessage({
                    text: "🔒 Ce compte est un Super Administrateur. Le rôle est strictement verrouillé sur la Console d'Administration.",
                    type: 'error'
                  });
                  return;
                }
                setSelectedPortal('doctor'); 
                setInfoMessage(null); 
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                selectedPortal === 'doctor' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{t('auth_tab_doctor')}</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPortal('admin'); setInfoMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                selectedPortal === 'admin' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('auth_tab_admin')}</span>
            </button>
          </div>
        )}

        {/* Message d'information/succès/erreur */}
        {infoMessage && (
          <div className={`mb-4 p-3.5 rounded-2xl text-xs flex items-start space-x-2.5 ${
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
                Votre Adresse Email
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}</span>
            </button>

            {email.trim() && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSettingPasswordOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline transition"
                >
                  Ou définir mon mot de passe directement
                </button>
              </div>
            )}

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
          /* FORMULAIRE CONNEXION */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {selectedPortal === 'patient' 
                  ? 'Email Patient' 
                  : selectedPortal === 'doctor' 
                    ? 'Email Professionnel' 
                    : 'Email Super Admin'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (isSuperAdminEmail(val)) {
                      setSelectedPortal('admin');
                      setInfoMessage({
                        text: "🛡️ Compte Super Administrateur détecté : accès automatiquement verrouillé sur le C-Panel.",
                        type: 'info'
                      });
                    }
                  }}
                  placeholder={selectedPortal === 'admin' ? "danielkiboko218@gmail.com" : "votre-email@exemple.com"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('auth_password')}
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!email.trim()) {
                        setInfoMessage({ text: "Veuillez d'abord renseigner votre adresse email.", type: 'error' });
                        return;
                      }
                      setIsSettingPasswordOpen(true);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    {t('auth_set_pwd')}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setInfoMessage(null);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition"
                  >
                    {t('auth_forgot')}
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
            >
              <span>{t('auth_submit')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Modal pour définir le mot de passe propre à CET email */}
        {isSettingPasswordOpen && (
          <SetPasswordModal
            userEmail={email.trim()}
            onClose={() => setIsSettingPasswordOpen(false)}
            onSuccess={() => {
              setInfoMessage({
                text: `Mot de passe enregistré avec succès pour ${email.trim()} ! Vous pouvez maintenant vous connecter avec ce mot de passe.`,
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
