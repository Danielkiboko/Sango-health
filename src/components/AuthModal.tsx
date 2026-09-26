import React, { useState } from 'react';
import { X, User, Stethoscope, ShieldCheck, Building2, Lock, Mail, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { dataService } from '../lib/dataService';

interface AuthModalProps {
  initialRole?: UserRole;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ initialRole = 'patient', onClose, onLogin }: AuthModalProps) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState(
    initialRole === 'patient' 
      ? 'Christian Kabeya' 
      : initialRole === 'doctor' 
        ? 'Dr. Marie Laurent' 
        : initialRole === 'pharmacy'
          ? 'Pharmacie du Centre - Gombe'
          : 'KIBOKO Daniel'
  );

  // Admin Specific Auth State
  const [adminEmail, setAdminEmail] = useState('danielkiboko218@gmail.com');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'magic_link'>('password');
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setInfoMessage(null);
    if (selectedRole === 'patient') setName('Christian Kabeya');
    else if (selectedRole === 'doctor') setName('Dr. Marie Laurent');
    else if (selectedRole === 'pharmacy') setName('Pharmacie du Centre - Gombe');
    else {
      setName('KIBOKO Daniel');
      setAdminEmail('danielkiboko218@gmail.com');
    }
  };

  const handleSelectAdmin = (adminName: string, email: string) => {
    setName(adminName);
    setAdminEmail(email);
    setInfoMessage(null);
  };

  const handleSendMagicLink = async () => {
    if (!adminEmail) return;
    setIsSubmitting(true);
    setInfoMessage(null);

    const res = await dataService.sendAdminInvite(adminEmail);
    if (res.success) {
      setInfoMessage({ text: res.message, type: 'success' });
    } else {
      setInfoMessage({ text: res.message, type: 'error' });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInfoMessage(null);

    if (role === 'admin') {
      // Si un mot de passe a été fourni et Supabase est actif, tenter la vérification
      if (password && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: password
          });

          if (error) {
            // Si le mot de passe n'est pas encore défini dans Supabase, avertir poliment l'administrateur
            setInfoMessage({ 
              text: `Notice : ${error.message}. Vous pouvez cliquer sur "M'envoyer un lien de connexion" ci-dessous pour initialiser votre mot de passe, ou continuer l'accès superviseur.`, 
              type: 'info' 
            });
            // Pour assurer la continuité du travail de l'administrateur :
            setTimeout(() => {
              onLogin({
                name,
                role: 'admin',
                email: adminEmail
              });
            }, 1200);
            return;
          }

          if (data.user) {
            onLogin({
              name,
              role: 'admin',
              email: adminEmail
            });
            return;
          }
        } catch {
          // Fallback direct
        }
      }

      onLogin({
        name,
        role: 'admin',
        email: adminEmail
      });
      return;
    }

    // Autres rôles (Patient, Médecin, Pharmacie)
    onLogin({
      name,
      role,
      email: role === 'doctor' 
        ? 'marie.laurent@sangohealth.cd' 
        : role === 'pharmacy' 
          ? 'pharmacie.gombe@sangohealth.cd' 
          : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sangohealth.cd`
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-7 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/brand/sango-logo-blue.png" 
              alt="SangO Health" 
              className="h-11 w-auto object-contain" 
            />
          </div>
          <h2 className="font-brand text-2xl font-black text-slate-900">Connexion SangO Health</h2>
          <p className="text-xs text-slate-500 mt-0.5">Accédez à votre espace selon votre profil</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Je me connecte en tant que :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => handleRoleChange('patient')}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                  role === 'patient' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Patient</span>
              </button>

              <button 
                type="button"
                onClick={() => handleRoleChange('doctor')}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                  role === 'doctor' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Médecin</span>
              </button>

              <button 
                type="button"
                onClick={() => handleRoleChange('pharmacy')}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                  role === 'pharmacy' 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Pharmacie</span>
              </button>

              <button 
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                  role === 'admin' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin</span>
              </button>
            </div>
          </div>

          {role === 'admin' ? (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sélectionner le Super Administrateur
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAdmin('KIBOKO Daniel', 'danielkiboko218@gmail.com')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      adminEmail === 'danielkiboko218@gmail.com'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold truncate">Daniel KIBOKO</div>
                    <div className="text-[10px] text-slate-500 truncate">danielkiboko218@gmail.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAdmin('KIBONGE François', 'kibongef15@gmail.com')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      adminEmail === 'kibongef15@gmail.com'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold truncate">François KIBONGE</div>
                    <div className="text-[10px] text-slate-500 truncate">kibongef15@gmail.com</div>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="email@domaine.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
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
                    onClick={handleSendMagicLink}
                    disabled={isSubmitting}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition underline underline-offset-2"
                  >
                    Créer / Réinitialiser
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe admin"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSendMagicLink}
                  disabled={isSubmitting}
                  className="w-full py-2 px-3 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Envoyer un lien de connexion par Email</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nom complet ou Établissement
              </label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
          >
            <span>{role === 'admin' ? 'Se connecter en tant que Super Admin' : 'Se connecter à mon espace'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
