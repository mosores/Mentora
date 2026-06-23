import React from 'react';
import { Logo } from './Logo';
import { 
  Home, 
  FolderHeart, 
  Settings, 
  Flame, 
  HardDrive, 
  Gift, 
  LogOut,
  Globe,
  Sliders
} from 'lucide-react';

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    streak?: number;
  };
  currentPath: 'dashboard' | 'spaces' | 'settings' | 'onboarding';
  onNavigate: (path: 'dashboard' | 'spaces' | 'settings' | 'onboarding') => void;
  onLogout?: () => void;
  locale?: 'en' | 'es';
  onLocaleChange?: (lang: 'en' | 'es') => void;
  storageUsedMb?: number;
  storageLimitMb?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  user = { name: 'Valeria', email: 'valeria@mentora.edu.pe', streak: 4 },
  currentPath,
  onNavigate,
  onLogout,
  locale = 'es',
  onLocaleChange,
  storageUsedMb = 7.2,
  storageLimitMb = 50,
}) => {
  const isEs = locale === 'es';

  // Translations
  const t = {
    nav: {
      home: isEs ? 'Inicio' : 'Dashboard',
      spaces: isEs ? 'Espacios' : 'Study Spaces',
      onboarding: isEs ? 'Perfil de Aprendizaje' : 'Learning Style',
      settings: isEs ? 'Configuración' : 'Settings',
    },
    streak: {
      title: isEs ? 'Racha de estudio' : 'Study Streak',
      body: (days: number) => isEs ? `¡${days} días seguidos!` : `${days} day streak!`,
      sub: isEs ? '¡Sigue así!' : 'Keep it up!',
    },
    storage: {
      title: isEs ? 'Almacenamiento de IA' : 'AI Storage',
      used: (used: number, limit: number) => isEs ? `${used} MB de ${limit} MB` : `${used} MB of ${limit} MB`,
    },
    invite: {
      title: isEs ? 'Gana créditos gratis' : 'Get free credits',
      body: isEs ? 'Invita amigos y gana créditos de IA gratis para tus resúmenes.' : 'Invite friends and earn free AI credits for summaries.',
      btn: isEs ? 'Invitar' : 'Invite',
    },
    logout: isEs ? 'Cerrar sesión' : 'Log out',
  };

  const navItems = [
    { id: 'dashboard' as const, label: t.nav.home, icon: Home },
    { id: 'spaces' as const, label: t.nav.spaces, icon: FolderHeart },
    { id: 'onboarding' as const, label: t.nav.onboarding, icon: Sliders },
    { id: 'settings' as const, label: t.nav.settings, icon: Settings },
  ];

  const storagePercentage = Math.min(100, Math.round((storageUsedMb / storageLimitMb) * 100));

  return (
    <div className="w-64 h-full border-r border-slate-200/90 flex flex-col p-5 select-none bg-gradient-to-b from-white to-[#f8fdfb] shrink-0 font-outfit overflow-y-auto">
      {/* Upper Brand & Profile */}
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          {/* Locale switcher */}
          {onLocaleChange && (
            <button
              onClick={() => onLocaleChange(locale === 'es' ? 'en' : 'es')}
              className="min-w-[40px] min-h-[40px] px-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-[background-color,color] duration-base ease-standard flex items-center gap-1 cursor-pointer border border-slate-100 bg-white"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{locale}</span>
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="p-3 bg-white border border-slate-200/95 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0f766e] to-[#0e7490] flex items-center justify-center font-bold text-white text-base shadow-inner shrink-0 uppercase">
            {user.name.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">
              {user.name}
            </h4>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium leading-none">
              {user.email}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow,border-color] duration-base ease-standard w-full text-left cursor-pointer border ${
                  isActive
                    ? 'bg-[#e8f7f4] text-[#0f3f3a] border-[#0f766e]/14 shadow-sm font-bold'
                    : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0f766e]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Lower Cards & Logout */}
      <div className="flex flex-col gap-4 mt-6">
        {/* Streak card */}
        {user.streak !== undefined && user.streak > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-[#ff6b5f]/5 to-[#ff6b5f]/10 border border-[#ff6b5f]/15 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#fff0ee] border border-[#ff6b5f]/15 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-[#ff6b5f] fill-[#ff6b5f]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {t.streak.title}
              </span>
              <p className="text-xs font-extrabold text-slate-800 leading-tight">
                {t.streak.body(user.streak)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {t.streak.sub}
              </p>
            </div>
          </div>
        )}

        </div>  {/* end upper section */}

        {/* Bottom section — pushed to bottom via mt-auto while upper content scrolls */}
        <div className="mt-auto flex flex-col gap-3 shrink-0 pt-6">

        {/* Storage card */}
        <div className="p-3 bg-white border border-slate-200/90 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-bold">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              {t.storage.title}
            </span>
            <span className="text-slate-700 tabular-nums">
              {t.storage.used(storageUsedMb, storageLimitMb)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-gradient-to-r from-[#0f766e] to-[#0e7490] rounded-full transition-[width] duration-slow ease-standard"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>

        {/* Promo card */}
        <div className="p-3 bg-gradient-to-br from-[#0f766e] to-[#0e7490] rounded-xl text-white shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white/10 rounded-full blur-md" />
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-[#ff9f80]" />
            <span className="text-xs font-bold font-outfit text-white">
              {t.invite.title}
            </span>
          </div>
          <p className="text-[10px] text-teal-50 font-normal leading-normal">
            {t.invite.body}
          </p>
          <button className="w-full py-1 min-h-[36px] text-center bg-white text-[#0f3f3a] text-xs font-bold rounded-md hover:bg-teal-50 transition-colors duration-base ease-standard shadow-sm cursor-pointer mt-1 border-none">
            {t.invite.btn}
          </button>
        </div>

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 py-2 min-h-[40px] text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-[background-color,color,border-color] duration-base ease-standard cursor-pointer border border-transparent hover:border-red-100 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        )}
      </div>
    </div>
  );
};
