import { FormEvent, useState } from 'react';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { sonatrachLogo } from '@/components/Brand';
import { navigate } from '@/components/Shell';
import { loginUser, USER_ROLES } from '@/session';
import type { UserRole } from '@/types';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<UserRole>('Chef de service');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    loginUser({
      name: 'Ing. R. Bensalem',
      identifier: identifier.trim() || 'SH-54980',
      role,
    });
    navigate('dashboard');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden w-1/2 flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        <div>
          <button onClick={() => navigate('home')} className="flex items-center gap-3">
            <img src={sonatrachLogo} alt="Sonatrach" className="h-16 w-auto rounded-md bg-white object-contain p-1.5" />
            <span className="heading text-sm font-bold uppercase tracking-wider">Raffinerie d'Alger</span>
          </button>
          <div className="mt-28 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Direction Maintenance</p>
            <h1 className="heading mt-4 text-5xl font-extrabold leading-tight">
              Votre quart, votre <span className="text-orange-400">visibilité.</span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-400">Pilotez les interventions et gardez le contrôle des opérations critiques depuis un même espace.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Système de suivi des travaux · v4.2.0-SDA</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <button onClick={() => navigate('home')} className="mb-10 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
            <ArrowLeft size={16} /> Retour à l'accueil
          </button>
          <div className="mb-8 lg:hidden">
            <img src={sonatrachLogo} alt="Sonatrach" className="mb-4 h-16 w-auto object-contain" />
            <h1 className="heading text-2xl font-extrabold text-slate-950">Raffinerie d'Alger</h1>
            <p className="text-sm font-semibold text-sonatrach">Direction Maintenance</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
            <div className="mb-8">
              <div className="mb-4 inline-flex rounded-xl bg-orange-50 p-3 text-sonatrach">
                <LockKeyhole size={22} />
              </div>
              <h2 className="heading text-2xl font-extrabold text-slate-950">Bienvenue dans votre espace</h2>
              <p className="mt-2 text-sm text-slate-500">Connectez-vous avec vos identifiants Sonatrach.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Identifiant</span>
                <input
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Ex : SH-54980"
                  className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sonatrach focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Fonction</span>
                <select
                  required
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sonatrach focus:bg-white focus:ring-2 focus:ring-orange-100"
                >
                  {USER_ROLES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Mot de passe</span>
                <input required type="password" placeholder="Votre mot de passe" className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sonatrach focus:bg-white focus:ring-2 focus:ring-orange-100" />
              </label>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="rounded border-slate-300 text-sonatrach focus:ring-sonatrach" /> Se souvenir de moi
                </label>
                <button type="button" className="font-semibold text-sonatrach hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
              <button className="w-full rounded-lg bg-sonatrach py-3.5 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600">Se connecter</button>
            </form>
            <div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" /> Accès réservé au personnel habilité
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">Besoin d'assistance ? Poste interne 44-21 / 44-22</p>
        </div>
      </div>
    </div>
  );
}
