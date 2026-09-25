import React, { useState } from 'react';
import { X, User, Stethoscope, ShieldCheck, Building2 } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

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
          : 'SuperAdmin SangO'
  );

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'patient') setName('Christian Kabeya');
    else if (selectedRole === 'doctor') setName('Dr. Marie Laurent');
    else if (selectedRole === 'pharmacy') setName('Pharmacie du Centre - Gombe');
    else setName('SuperAdmin SangO');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name,
      role,
      email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sangohealth.cd`
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
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
              className="h-12 w-auto object-contain" 
            />
          </div>
          <h2 className="font-brand text-2xl font-black text-slate-900">Connexion SangO Health</h2>
          <p className="text-xs text-slate-500 mt-1">Accédez à votre espace selon votre profil</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Je me connecte en tant que :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => handleRoleChange('patient')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
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
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
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
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
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
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                  role === 'admin' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin SaaS</span>
              </button>
            </div>
          </div>

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

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
          >
            <span>Se connecter à mon espace</span>
          </button>
        </form>
      </div>
    </div>
  );
}
