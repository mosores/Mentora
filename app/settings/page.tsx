'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Globe,
  GraduationCap,
  Clock,
  Bell,
  Shield,
  LogOut,
  Loader2,
  ChevronLeft,
  Sliders,
  CheckCircle2,
  Sparkles,
  Moon,
  Type
} from 'lucide-react';
import { AppSidebar } from '@/components/mentora/AppSidebar';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  status: 'active' | 'disabled';
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<'es' | 'en'>('es');
  const [profile, setProfile] = useState<any>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    document.title = locale === 'en' ? 'Settings | Mentora' : 'Configuración | Mentora';
    (async () => {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('mentora.session') : null;
      if (!raw) {
        router.push('/auth/login');
        return;
      }
      const session = JSON.parse(raw);
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        // Load learning profile if present
        try {
          const pRes = await fetch('/api/onboarding/profile', {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          if (pRes.ok) {
            const pData = await pRes.json();
            setProfile(pData.profile || null);
          }
        } catch {
          /* profile endpoint optional */
        }
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const isEs = locale === 'es';

  const t = {
    title: isEs ? 'Configuración' : 'Settings',
    subtitle: isEs ? 'Administra tu cuenta y preferencias' : 'Manage your account and preferences',
    account: isEs ? 'Cuenta' : 'Account',
    profile: isEs ? 'Perfil de aprendizaje' : 'Learning profile',
    preferences: isEs ? 'Preferencias' : 'Preferences',
    danger: isEs ? 'Zona sensible' : 'Danger zone',
    name: isEs ? 'Nombre' : 'Name',
    email: isEs ? 'Correo' : 'Email',
    role: isEs ? 'Rol' : 'Role',
    language: isEs ? 'Idioma de la interfaz' : 'Interface language',
    spanish: isEs ? 'Español' : 'Spanish',
    english: isEs ? 'Inglés' : 'English',
    notifications: isEs ? 'Notificaciones' : 'Notifications',
    notifDesc: isEs ? 'Recibe recordatorios de estudio y novedades' : 'Get study reminders and updates',
    retakeOnboarding: isEs ? 'Volver a hacer el perfil de aprendizaje' : 'Retake learning profile',
    retakeDesc: isEs ? 'Reconfigura tu estilo de estudio' : 'Reconfigure your study style',
    logout: isEs ? 'Cerrar sesión' : 'Log out',
    saved: isEs ? 'Preferencia guardada' : 'Preference saved',
    noProfile: isEs ? 'Aún no has completado tu perfil de aprendizaje.' : 'You have not completed your learning profile yet.'
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('mentora.session');
    }
    router.push('/');
  };

  const handleLocaleChange = (lang: 'en' | 'es') => {
    setLocale(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mentora.locale', lang);
    }
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fdfb]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0f766e]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fdfb] font-outfit flex">
      <AppSidebar
        user={{ name: user.name, email: user.email }}
        currentPath="settings"
        onNavigate={(path) => {
          if (path === 'dashboard') router.push('/dashboard');
          else if (path === 'settings') router.push('/settings');
          else if (path === 'onboarding') router.push('/onboarding');
          else if (path === 'spaces') router.push('/dashboard');
        }}
        onLogout={logout}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />

      <main className="flex-1 min-w-0 p-6 lg:p-8">
        {savedToast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            {t.saved}
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {isEs ? 'Dashboard' : 'Dashboard'}
            </button>
            <h1 className="text-2xl font-extrabold text-slate-800">{t.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
          </div>

          {/* Account section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0f766e]" />
              {t.account}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3 h-3" /> {t.name}
                </label>
                <div className="mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
                  {user.name}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> {t.email}
                </label>
                <div className="mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> {t.role}
                </label>
                <div className="mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 capitalize">
                  {user.role === 'admin' ? 'Admin' : isEs ? 'Estudiante' : 'Student'}
                </div>
              </div>
            </div>
          </section>

          {/* Preferences section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0f766e]" />
              {t.preferences}
            </h2>

            <div className="space-y-4">
              {/* Language */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0f766e]/10 flex items-center justify-center text-[#0f766e]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{t.language}</div>
                  </div>
                </div>
                <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
                  <button
                    onClick={() => handleLocaleChange('es')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      locale === 'es' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t.spanish}
                  </button>
                  <button
                    onClick={() => handleLocaleChange('en')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      locale === 'en' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t.english}
                  </button>
                </div>
              </div>

              {/* Notifications (display only) */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{t.notifications}</div>
                    <div className="text-xs text-slate-400">{t.notifDesc}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> {isEs ? 'Activas' : 'On'}
                </span>
              </div>
            </div>
          </section>

          {/* Learning profile section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0f766e]" />
              {t.profile}
            </h2>

            {profile ? (
              <div className="space-y-3">
                {profile.goals?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1.5">{isEs ? 'Metas' : 'Goals'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.goals.map((g: string) => (
                        <span key={g} className="px-2.5 py-1 rounded-full bg-[#0f766e]/10 text-[#0f766e] text-xs font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.formats?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1.5">{isEs ? 'Formatos' : 'Formats'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.formats.map((f: string) => (
                        <span key={f} className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.sessionDuration && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isEs ? 'Sesiones de' : 'Sessions of'} <b>{profile.sessionDuration}</b> {isEs ? 'min' : 'min'}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">{t.noProfile}</p>
            )}

            <button
              onClick={() => router.push('/onboarding')}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#0d655e] transition"
            >
              <GraduationCap className="w-4 h-4" />
              {t.retakeOnboarding}
            </button>
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6">
            <h2 className="text-base font-bold text-rose-700 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t.danger}
            </h2>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-300 bg-white text-rose-600 text-sm font-semibold hover:bg-rose-100 transition"
            >
              <LogOut className="w-4 h-4" />
              {t.logout}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
