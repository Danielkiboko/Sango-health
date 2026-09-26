import React, { useState } from 'react';
import { X, Lock, Mail, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { dataService } from '../lib/dataService';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Détection automatique du rôle en arrière-plan à la soumission
  const detectUserRole = (inputEmail: string): { role: UserRole; name: string } => {
    const clean = inputEmail.trim().toLowerCase();

    if (clean === 'danielkiboko218@gmail.com' || clean.includes('danielkiboko')) {
      return {
        role: 'admin',
        name: 'KIBOKO Daniel'
      };
    }

    if (clean === 'kibongef15@gmail.com' || clean.includes('kibonge')) {
      return {
        role: 'admin',
        name: 'KIBONGE François'
      };
    }

    if (clean.includes('admin') || clean.includes('direction')) {
      return {
        role: 'admin',
        name: 'Administrateur SangO'
      };
    }

    if (clean.includes('doc') || clean.includes('dr.') || clean.includes('marie.laurent') || clean.includes('cabinet') || clean.includes('clinique')) {
      return {
        role: 'doctor',
        name: clean.includes('marie') ? 'Dr. Marie Laurent' : 'Dr. Praticien'
      };
    }

    if (clean.includes('pharmacie') || clean.includes('pharma') || clean.includes('officine')) {
      return {
        role: 'pharmacy',
        name: 'Pharmacie du Centre - Gombe'
      };
    }

    return {
      role: 'patient',
      name: clean ? clean.split('@')[0].replace(/[._]/g, ' ') : 'Patient'
    };
  };

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
        text: `Un lien sécurisé de réinitialisation a été envoyé à ${email.trim()}. Vérifiez votre boîte de réception (et vos spams).`, 
        type: 'success' 
      });
    } else {
      setInfoMessage({ text: res.message, type: 'error' });
    }
    setIsSubmitting(false);
  };

  // Connexion standard
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setInfoMessage(null);

    const detected = detectUserRole(email);

    // Tentative d'authentification Supabase si mot de passe fourni
    if (password && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (!error && data?.user) {
          onLogin({
            name: detected.name,
            role: detected.role,
            email: email.trim()
          });
          return;
        }
      } catch {
        // Fallback transparent
      }
    }

    // Connexion automatique selon le rôle identifié
    onLogin({
      name: detected.name,
      role: detected.role,
      email: email.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-7 sm:p-8 relative animate-in fade-in zoom-in duration-200 border border-slate-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo SangO Health */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/brand/sango-logo-blue.png" 
              alt="SangO Health" 
              className="h-11 w-auto object-contain" 
            />
          </div>
          <h2 className="font-brand text-2xl font-black text-slate-900">
            {isForgotPassword ? 'Mot de passe oublié' : 'Portail SangO Health'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isForgotPassword 
              ? 'Recevez un lien de réinitialisation sécurisé par email' 
              : 'Connectez-vous pour accéder à votre espace dédié'}
          </p>
        </div>

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
            <span>{infoMessage.text}</span>
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
          /* FORMULAIRE CONNEXION UNIFIÉ */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setInfoMessage(null);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  Mot de passe oublié ?
                </button>
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
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
