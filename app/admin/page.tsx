'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  FileText,
  MessageSquare,
  FolderHeart,
  GraduationCap,
  Activity,
  LogOut,
  Loader2,
  RefreshCw,
  Crown,
  CheckCircle2,
  Ban,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { Logo } from '@/components/mentora/Logo';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

interface AdminKpis {
  users: number;
  activeUsers: number;
  admins: number;
  studySpaces: number;
  documents: number;
  chatTurns: number;
  usageEvents: number;
  activeCourses: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState<'es' | 'en'>('es');

  const getSession = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem('mentora.session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const session = getSession();
      const res = await fetch('/api/admin/overview', {
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {}
      });
      if (res.status === 401 || res.status === 403) {
        setAuthorized(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load');
      }
      const data = await res.json();
      setKpis(data.kpis);
      setUsers(data.users || []);
      setAuthorized(true);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = locale === 'en' ? 'Admin | Mentora' : 'Admin | Mentora';
    (async () => {
      const session = getSession();
      if (!session?.token) {
        router.push('/auth/login');
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        if (data.user?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setAuthorized(true);
        setReady(true);
        await fetchOverview();
      } catch {
        router.push('/auth/login');
      }
    })();
  }, [router, fetchOverview]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('mentora.session');
    }
    router.push('/');
  };

  const patchUser = async (userId: string, patch: { role?: 'student' | 'admin'; status?: 'active' | 'disabled' }) => {
    setActionLoading(`${userId}-${JSON.stringify(patch)}`);
    const session = getSession();
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        await fetchOverview();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Action failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fdfb]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0f766e]" />
      </div>
    );
  }

  if (ready && !authorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fdfb] px-6">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            {locale === 'en' ? 'Admin access required' : 'Se requiere acceso de administrador'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {locale === 'en'
              ? 'Your account does not have permission to view this page.'
              : 'Tu cuenta no tiene permiso para ver esta página.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#0d655e]"
          >
            <ChevronLeft className="w-4 h-4" />
            {locale === 'en' ? 'Back to dashboard' : 'Volver al dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const isEs = locale === 'es';
  const t = {
    title: isEs ? 'Panel de Administración' : 'Admin Operations',
    subtitle: isEs ? 'Supervisión y control de la plataforma Mentora' : 'Mentora platform oversight and control',
    kpi: {
      users: isEs ? 'Usuarios' : 'Users',
      active: isEs ? 'Activos' : 'Active',
      admins: isEs ? 'Admins' : 'Admins',
      spaces: isEs ? 'Espacios' : 'Study Spaces',
      docs: isEs ? 'Documentos' : 'Documents',
      chats: isEs ? 'Mensajes IA' : 'AI Messages',
      usage: isEs ? 'Eventos de uso' : 'Usage Events',
      courses: isEs ? 'Cursos activos' : 'Active Courses'
    },
    usersTable: isEs ? 'Gestión de Usuarios' : 'User Management',
    name: isEs ? 'Nombre' : 'Name',
    email: isEs ? 'Correo' : 'Email',
    role: isEs ? 'Rol' : 'Role',
    status: isEs ? 'Estado' : 'Status',
    created: isEs ? 'Creado' : 'Created',
    lastLogin: isEs ? 'Último acceso' : 'Last login',
    actions: isEs ? 'Acciones' : 'Actions',
    promote: isEs ? 'Hacer admin' : 'Make admin',
    demote: isEs ? 'Quitar admin' : 'Remove admin',
    disable: isEs ? 'Desactivar' : 'Disable',
    enable: isEs ? 'Activar' : 'Enable',
    active: isEs ? 'Activo' : 'Active',
    disabled: isEs ? 'Desactivado' : 'Disabled',
    student: isEs ? 'Estudiante' : 'Student',
    refresh: isEs ? 'Actualizar' : 'Refresh',
    back: isEs ? 'Volver' : 'Back'
  };

  const kpiCards = [
    { label: t.kpi.users, value: kpis?.users ?? 0, icon: Users, color: '#0f766e' },
    { label: t.kpi.active, value: kpis?.activeUsers ?? 0, icon: Activity, color: '#10b981' },
    { label: t.kpi.admins, value: kpis?.admins ?? 0, icon: Crown, color: '#f59e0b' },
    { label: t.kpi.spaces, value: kpis?.studySpaces ?? 0, icon: FolderHeart, color: '#8b5cf6' },
    { label: t.kpi.docs, value: kpis?.documents ?? 0, icon: FileText, color: '#0e7490' },
    { label: t.kpi.chats, value: kpis?.chatTurns ?? 0, icon: MessageSquare, color: '#ec4899' },
    { label: t.kpi.usage, value: kpis?.usageEvents ?? 0, icon: Activity, color: '#6366f1' },
    { label: t.kpi.courses, value: kpis?.activeCourses ?? 0, icon: GraduationCap, color: '#ff6b5f' }
  ];

  const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(isEs ? 'es-PE' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fdfb] font-outfit">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0f766e] to-[#0e7490] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-none">{t.title}</h1>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-none">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t.back}
            </button>
            <button
              onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {locale}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isEs ? 'Salir' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">×</button>
          </div>
        )}

        {/* KPI grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">{isEs ? 'Métricas clave' : 'Key metrics'}</h2>
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0f766e] border border-[#0f766e]/20 hover:bg-[#e8f7f4] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {kpiCards.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${k.color}1a`, color: k.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-800 tabular-nums">{k.value}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Users table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">{t.usersTable}</h2>
            <span className="text-xs text-slate-400">{users.length} {isEs ? 'usuarios' : 'users'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3">{t.name}</th>
                  <th className="px-5 py-3">{t.role}</th>
                  <th className="px-5 py-3">{t.status}</th>
                  <th className="px-5 py-3">{t.created}</th>
                  <th className="px-5 py-3">{t.lastLogin}</th>
                  <th className="px-5 py-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                      {isEs ? 'No hay usuarios.' : 'No users.'}
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const rowKey = u.id;
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            <Crown className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                            {t.student}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> {t.active}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                            <Ban className="w-3 h-3" /> {t.disabled}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(u.createdAt)}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(u.lastLoginAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={actionLoading?.startsWith(rowKey)}
                            onClick={() => patchUser(u.id, { role: u.role === 'admin' ? 'student' : 'admin' })}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                            title={u.role === 'admin' ? t.demote : t.promote}
                          >
                            {u.role === 'admin' ? t.demote : t.promote}
                          </button>
                          <button
                            disabled={actionLoading?.startsWith(rowKey)}
                            onClick={() => patchUser(u.id, { status: u.status === 'active' ? 'disabled' : 'active' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border disabled:opacity-50 ${
                              u.status === 'active'
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'active' ? t.disable : t.enable}
                          >
                            {u.status === 'active' ? t.disable : t.enable}
                          </button>
                          {actionLoading?.startsWith(rowKey) && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
