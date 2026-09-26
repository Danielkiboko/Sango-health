import React, { useState } from 'react';
import { X, Lock, CheckCircle2, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SetPasswordModalProps {
  userEmail?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SetPasswordModal({ userEmail, onClose, onSuccess }: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const isMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = isMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible d'enregistrer le mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-7 relative animate-in fade-in zoom-in duration-200 border border-slate-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="font-brand text-2xl font-black text-slate-900">Mot de passe enregistré !</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Votre accès administrateur SangO Health est désormais sécurisé par votre nouveau mot de passe.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-brand text-xl font-black text-slate-900">Créer mon mot de passe</h3>
              <p className="text-xs text-slate-500 mt-1">
                Accès Super Administrateur SangO Health
              </p>
              {userEmail && (
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                  {userEmail}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password strength checklist */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1">
                <div className={`flex items-center space-x-1.5 ${isMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  <span className="text-xs">{isMinLength ? '✓' : '•'}</span>
                  <span>Au moins 8 caractères</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  <span className="text-xs">{hasNumber ? '✓' : '•'}</span>
                  <span>Au moins 1 chiffre</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  <span className="text-xs">{hasUpper ? '✓' : '•'}</span>
                  <span>Au moins 1 majuscule</span>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center space-x-1.5 ${passwordsMatch ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}`}>
                    <span className="text-xs">{passwordsMatch ? '✓' : '✗'}</span>
                    <span>{passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>Enregistrement sécurisé...</span>
                ) : (
                  <span>Enregistrer mon mot de passe</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
