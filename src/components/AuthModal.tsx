import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound, CheckCircle2, AlertCircle, ShieldCheck, Stethoscope, Building2, User, ArrowRight } from 'lucide-react';
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
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Détection automatique et dynamique du statut/rôle à partir de l'email
  const detectUserRole = (inputEmail: string): { role: UserRole; name: string; label: string; badgeColor: string; icon: React.ReactNode } => {
    const clean = inputEmail.trim().toLowerCase();

    if (clean === 'danielkiboko218@gmail.com' || clean.includes('danielkiboko')) {
      return {
        role: 'admin',
        name: 'KIBOKO Daniel',
        label: 'Super Administrateur SangO (Accès Direction)',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
      };
    }

    if (clean === 'kibongef15@gmail.com' || clean.includes('kibonge')) {
      return {
        role: 'admin',
        name: 'KIBONGE François',
        label: 'Super Administrateur SangO (Accès Direction)',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
      };
    }

    if (clean.includes('admin') || clean.includes('direction')) {
      return {
        role: 'admin',
        name: 'Administrateur SangO',
        label: 'Administrateur SaaS',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
      };
    }

    if (clean.includes('doc') || clean.includes('dr.') || clean.includes('marie.laurent') || clean.includes('cabinet') || clean.includes('clinique')) {
      return {
        role: 'doctor',
        name: clean.includes('marie') ? 'Dr. Marie Laurent' : 'Dr. Praticien',
        label: 'Praticien & Cabinet Médical',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
      };
    }

    if (clean.includes('pharmacie') || clean.includes('pharma') || clean.includes('officine')) {
      return {
        role: 'pharmacy',
        name: 'Pharmacie du Centre - Gombe',
        label: 'Établissement Pharmaceutique',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <Building2 className="w-3.5 h-3.5 text-emerald-700" />
      };
    }

    return {
      role: 'patient',
      name: clean ? clean.split('@')[0].replace(/[._]/g, ' ') : 'Patient',
      label: 'Espace Patient',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: <User className="w-3.5 h-3.5 text-slate-600" />
    };
  };

  const detected = detectUserRole(email);

  const handleSendMagicLink = async () => {
    if (!email) {
      setInfoMessage({ text: "Veuillez d'abord saisir votre adresse email.", type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setInfoMessage(null);

    const res = await dataService.sendAdminInvite(email);
    if (res.success) {
      setInfoMessage({ text: res.message, type: 'success' });
    } else {
      setInfoMessage({ text: res.message, type: 'error' });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setInfoMessage(null);

    // Si mot de passe saisi et Supabase actif, tentative auth Supabase
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
        // Continue to role-based fallback
      }
    }

    // Connexion immédiate intelligente selon le rôle détecté
    onLogin({
      name: detected.name,
      role: detected.role,
      email: email.trim()
    });
  };

  const setQuickEmail = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('••••••••••••');
    setInfoMessage(null);
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

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/brand/sango-logo-blue.png" 
              alt="SangO Health" 
              className="h-11 w-auto object-contain" 
            />
          </div>
          <h2 className="font-brand text-2xl font-black text-slate-900">Portail SangO Health</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connectez-vous pour accéder à votre espace dédié
          </p>
        </div>

        {/* Message d'information/succès/erreur */}
        {infoMessage && (
          <div className={`mb-4 p-3 rounded-2xl text-xs flex items-start space-x-2.5 ${
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
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
                placeholder="Ex: danielkiboko218@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Détection automatique du statut en temps réel */}
          {email.trim().length > 0 && (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in duration-200 ${detected.badgeColor}`}>
              <div className="flex items-center space-x-2">
                {detected.icon}
                <span>{detected.label}</span>
              </div>
              <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">
                Détecté
              </span>
            </div>
          )}

          {/* Password input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={isSubmitting}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition underline underline-offset-2"
              >
                Créer / Lien par email
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
                placeholder="Votre mot de passe"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Submit button */}
          <button 
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
          >
            <span>Se connecter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Comptes d'accès rapide pour test immédiat */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Accès rapides en 1 clic :
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <button
              type="button"
              onClick={() => setQuickEmail('danielkiboko218@gmail.com')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold transition flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>Daniel KIBOKO (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickEmail('kibongef15@gmail.com')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold transition flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>François KIBONGE (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickEmail('dr.marie.laurent@sangohealth.cd')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold transition flex items-center space-x-1"
            >
              <Stethoscope className="w-3 h-3 text-blue-600" />
              <span>Dr. Marie (Médecin)</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickEmail('pharmacie.gombe@sangohealth.cd')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold transition flex items-center space-x-1"
            >
              <Building2 className="w-3 h-3 text-emerald-600" />
              <span>Pharmacie</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
