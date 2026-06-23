'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/mentora/AppSidebar';
import { CourseCard } from '@/components/mentora/CourseCard';
import { MaterialCard } from '@/components/mentora/MaterialCard';
import { ProgressRing } from '@/components/mentora/ProgressRing';
import { QuickToolButton } from '@/components/mentora/QuickToolButton';
import {
  GraduationCap,
  Plus,
  Loader2,
  Sparkles,
  BookOpen,
  FolderHeart,
  TrendingUp,
  X,
  FileText,
  Clock3,
  Bot,
  Calendar,
  BookOpenCheck,
  Lightbulb,
  MessageSquare,
  ChevronRight,
  Upload,
  Link2,
  Video,
  File
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_DATA = [
  { name: 'Lun', horas: 1.2 },
  { name: 'Mar', horas: 2.4 },
  { name: 'Mié', horas: 0.8 },
  { name: 'Jue', horas: 3.1 },
  { name: 'Vie', horas: 1.5 },
  { name: 'Sáb', horas: 2.0 },
  { name: 'Dom', horas: 1.8 }
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studySpaces, setStudySpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<'es' | 'en'>('es');

  // Space creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSpace, setNewSpace] = useState({
    title: '',
    courseName: '',
    institution: ''
  });

  // Summary preview modal state
  const [viewingSummary, setViewingSummary] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  // Error/Success Notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch logged in user & study spaces
  const fetchData = async () => {
    const token = window.localStorage.getItem('mentora.session') ?? '';
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      // Get User
      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!userRes.ok) throw new Error('Auth failed');
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      // Get Study Spaces
      const spacesRes = await fetch('/api/study-spaces', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (spacesRes.ok) {
        const spacesData = await spacesRes.json();
        setStudySpaces(spacesData.studySpaces || []);
      }
    } catch (err) {
      console.error(err);
      window.localStorage.removeItem('mentora.session');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = locale === 'en' ? 'Dashboard | Mentora' : 'Dashboard | Mentora';
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    const token = window.localStorage.getItem('mentora.session') ?? '';
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => undefined);
    }
    window.localStorage.removeItem('mentora.session');
    router.push('/auth/login');
  };

  // Create Space Handler
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpace.title || !newSpace.courseName || !newSpace.institution) return;

    setCreating(true);
    setNotice(null);
    const token = window.localStorage.getItem('mentora.session') ?? '';

    try {
      const response = await fetch('/api/study-spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newSpace, language: locale })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create study space');
      }

      setNotice({
        type: 'success',
        message: locale === 'en' ? 'Study space created successfully.' : 'Espacio de estudio creado con éxito.'
      });

      // Reset & refresh
      setNewSpace({ title: '', courseName: '', institution: '' });
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message || 'Error creating space.' });
    } finally {
      setCreating(false);
    }
  };

  // Delete Material Handler
  const handleDeleteMaterial = async (docId: string) => {
    // Note: Delete logic can map to a backend delete endpoint if exists,
    // or we can show success message for demonstration. Let's look for studySpaceId containing it first
    const token = window.localStorage.getItem('mentora.session') ?? '';
    const parentSpace = studySpaces.find((space) =>
      space.documents.some((doc: any) => doc.id === docId)
    );

    if (!parentSpace) return;

    try {
      const response = await fetch(`/api/study-spaces/${parentSpace.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotice({
          type: 'success',
          message: locale === 'en' ? 'Document deleted.' : 'Documento eliminado.'
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Collect all documents across all study spaces
  const allDocuments = useMemo(() => {
    const docs: any[] = [];
    studySpaces.forEach((space) => {
      space.documents.forEach((doc: any) => {
        docs.push({
          ...doc,
          studySpaceTitle: space.title,
          studySpaceId: space.id
        });
      });
    });
    return docs;
  }, [studySpaces]);

  // Compute stats
  const totalChunks = useMemo(() => {
    return allDocuments.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0);
  }, [allDocuments]);

  const averageProgress = useMemo(() => {
    if (studySpaces.length === 0) return 0;
    // Calculate simple mock progress based on document upload counts and answers
    return Math.min(
      100,
      Math.round(
        (allDocuments.filter((d) => d.status === 'ready').length * 25 +
          studySpaces.reduce((acc, s) => acc + (s.chats?.length || 0) * 10, 0)) /
          studySpaces.length
      ) || 35
    );
  }, [studySpaces, allDocuments]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#0f766e]" size={36} />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sincronizando Dashboard...</p>
        </div>
      </main>
    );
  }

  // Sidebar user info
  const sidebarUser = {
    name: currentUser?.name || 'Estudiante',
    email: currentUser?.email || 'student@mentora.local',
    streak: 5
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-outfit">
      {/* App Sidebar */}
      <AppSidebar
        user={sidebarUser}
        currentPath="dashboard"
        onNavigate={(path) => {
          if (path === 'onboarding') router.push('/onboarding');
        }}
        onLogout={handleLogout}
        locale={locale}
        onLocaleChange={(lang) => setLocale(lang)}
        storageUsedMb={parseFloat((allDocuments.length * 1.4).toFixed(1))}
        storageLimitMb={50}
      />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Banner Welcome */}
        <header className="p-6 md:p-8 flex justify-between items-center border-b border-slate-200/60 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'en' ? 'CO-PILOT CONTEXT ACTIVE' : 'CONTEXTO DE COPILOTO ACTIVO'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 font-outfit">
              {locale === 'en' ? `Good afternoon, ${sidebarUser.name}` : `Buenas tardes, ${sidebarUser.name}`}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {locale === 'en'
                ? 'Your study week is taking shape. Upload files to start reasoning.'
                : 'Tu semana de estudio está tomando forma. Sube archivos para empezar a repasar.'}
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-[transform,box-shadow] duration-base ease-standard shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'en' ? 'New Space' : 'Nuevo Espacio'}</span>
          </button>
        </header>

        {notice && (
          <div className="mx-6 md:mx-8 mt-4">
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                  : 'bg-red-50 border-red-150 text-red-600'
              }`}
            >
              <span>{notice.message}</span>
              <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Smart Action Bar */}
        <div className="mx-6 md:mx-8 mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl bg-[#f8fdfb] border border-slate-100">
              <Sparkles className="w-4 h-4 text-[#0f766e] shrink-0" />
              <span className="text-sm text-slate-500">
                {locale === 'en'
                  ? 'Ask anything or upload new material to start studying...'
                  : 'Pregunta lo que quieras o sube nuevo material para empezar...'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f766e] text-white text-xs font-bold hover:bg-[#0d655e] transition"
              >
                <Upload className="w-3.5 h-3.5" />
                {locale === 'en' ? 'Upload' : 'Subir'}
              </button>
              <button
                onClick={() => {
                  if (studySpaces[0]) router.push(`/study/${studySpaces[0].id}`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {locale === 'en' ? 'Ask AI' : 'Preguntar'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid gap-6 lg:grid-cols-3">
          {/* Main left content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* KPI overview */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: locale === 'en' ? 'Spaces' : 'Espacios', value: studySpaces.length, icon: FolderHeart },
                { label: locale === 'en' ? 'Materials' : 'Materiales', value: allDocuments.length, icon: BookOpen },
                { label: locale === 'en' ? 'Index Chunks' : 'Chunks RAG', value: totalChunks, icon: FileText }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#e8f7f4] text-[#0f766e] shrink-0">
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {kpi.label}
                    </span>
                    <span className="text-lg font-black text-slate-800 font-outfit">
                      {kpi.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Study Spaces Section */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3.5 flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-[#0f766e]" />
                <span>{locale === 'en' ? 'Your Study Spaces' : 'Tus Espacios de Estudio'}</span>
              </h2>

              {studySpaces.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-xl">
                  <GraduationCap className="w-8 h-8 text-[#0f766e] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-500">
                    {locale === 'en'
                      ? 'No study spaces yet. Click "New Space" above to start.'
                      : 'Aún no tienes espacios de estudio. Haz clic en "Nuevo Espacio" arriba.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {studySpaces.map((space, idx) => {
                    const variants: Array<'teal' | 'coral' | 'sky' | 'indigo'> = ['teal', 'coral', 'sky', 'indigo'];
                    return (
                      <CourseCard
                        key={space.id}
                        code={space.courseName}
                        title={space.title}
                        institution={space.institution}
                        progress={Math.min(100, (space.documents?.length || 0) * 20 + 20)}
                        materialsCount={space.documents?.length || 0}
                        variant={variants[idx % variants.length]}
                        onClick={() => router.push(`/study/${space.id}`)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Tools Panel */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff6b5f]" />
                <span>{locale === 'en' ? 'Quick Copilot Tools' : 'Herramientas Rápidas'}</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickToolButton
                  label={locale === 'en' ? 'Summarize' : 'Resumir'}
                  description={locale === 'en' ? 'Summarize upload' : 'Resumen instantáneo'}
                  iconType="summary"
                  variant="teal"
                  onClick={() => {
                    if (studySpaces[0]) router.push(`/study/${studySpaces[0].id}`);
                  }}
                />
                <QuickToolButton
                  label={locale === 'en' ? 'Explain Concept' : 'Explicar'}
                  description={locale === 'en' ? 'Complex breakdown' : 'Concepto difícil'}
                  iconType="explain"
                  variant="coral"
                  onClick={() => {
                    if (studySpaces[0]) router.push(`/study/${studySpaces[0].id}`);
                  }}
                />
                <QuickToolButton
                  label={locale === 'en' ? 'APA Citation' : 'Cita APA'}
                  description={locale === 'en' ? 'Generate citation' : 'Referencia bibliográfica'}
                  iconType="citation"
                  variant="sky"
                  onClick={() => {
                    if (studySpaces[0]) router.push(`/study/${studySpaces[0].id}`);
                  }}
                />
                <QuickToolButton
                  label={locale === 'en' ? 'Study Plan' : 'Planificar'}
                  description={locale === 'en' ? '7-day roadmap' : 'Ruta de 7 días'}
                  iconType="guide"
                  variant="indigo"
                  onClick={() => {
                    if (studySpaces[0]) router.push(`/study/${studySpaces[0].id}`);
                  }}
                />
              </div>
            </div>

            {/* Upcoming Exams */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3.5 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#ff6b5f]" />
                <span>{locale === 'en' ? 'Upcoming Exams' : 'Próximos Exámenes'}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: locale === 'en' ? 'Cell Biology' : 'Biología Celular', days: 3, color: '#0f766e' },
                  { name: locale === 'en' ? 'Psychology of Learning' : 'Psicología del Aprendizaje', days: 6, color: '#8b5cf6' },
                  { name: locale === 'en' ? 'Corporate Finance' : 'Finanzas Corporativas', days: 10, color: '#0e7490' },
                  { name: locale === 'en' ? 'Latin American History' : 'Historia de América Latina', days: 16, color: '#ff6b5f' }
                ].map((exam, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-[transform,box-shadow] duration-base ease-standard hover:-translate-y-0.5"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-extrabold"
                      style={{ backgroundColor: exam.color }}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{exam.name}</div>
                      <div className="text-xs font-semibold" style={{ color: exam.color }}>
                        {locale === 'en' ? `In ${exam.days} days` : `En ${exam.days} días`}
                      </div>
                    </div>
                    <div className="ml-auto shrink-0">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: exam.color }}
                      >
                        {exam.days}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended for You */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3.5 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{locale === 'en' ? 'Recommended for You' : 'Recomendado para ti'}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ['BookOpenCheck', locale === 'en' ? 'Visual maps: Cell Cycle' : 'Mapas visuales: Ciclo celular', locale === 'en' ? 'Reinforce with visual learning' : 'Refuerza con aprendizaje visual'],
                  ['Sparkles', locale === 'en' ? 'Mini quiz: Learning Theories' : 'Mini quiz: Teorías del aprendizaje', locale === 'en' ? 'Test your understanding' : 'Prueba tu comprensión'],
                  ['Bot', locale === 'en' ? 'Video: Finance for non-finance' : 'Video: Finanzas para no financieros', locale === 'en' ? 'Practical examples' : 'Ejemplos prácticos']
                ] as const).map(([iconKey, title, desc], idx) => {
                  const recIconMap: Record<string, React.ReactNode> = {
                    BookOpenCheck: <BookOpenCheck className="w-4 h-4" />,
                    Sparkles: <Sparkles className="w-4 h-4" />,
                    Bot: <Bot className="w-4 h-4" />
                  };
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (studySpaces[idx]?.id) router.push(`/study/${studySpaces[idx].id}`);
                      }}
                      className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-base ease-standard"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                        {recIconMap[iconKey]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800">{title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1 ml-auto" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Materials */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0e7490]" />
                <span>{locale === 'en' ? 'Recent Materials' : 'Materiales Recientes'}</span>
              </h2>

              {allDocuments.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-500">
                    {locale === 'en'
                      ? 'Upload files inside your Study Spaces to view recent materials.'
                      : 'Sube archivos dentro de tus Espacios de Estudio para ver materiales recientes.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {allDocuments.slice(0, 4).map((doc) => (
                    <MaterialCard
                      key={doc.id}
                      id={doc.id}
                      name={doc.name}
                      mimeType={doc.mimeType}
                      status={doc.status}
                      pageCount={doc.chunks?.length ? Math.ceil(doc.chunks.length / 2) : 2}
                      summary={doc.summary}
                      createdAt={doc.createdAt}
                      locale={locale}
                      onDelete={handleDeleteMaterial}
                      onStudy={() => router.push(`/study/${doc.studySpaceId}`)}
                      onViewSummary={() => {
                        setViewingSummary(doc.summary);
                        setSummaryModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column details */}
          <div className="flex flex-col gap-6">
            {/* Progress / Retention Stats */}
            <section className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                {locale === 'en' ? 'Retention Forecast' : 'Pronóstico de Retención'}
              </h3>
              <div className="w-32 h-32 mb-4">
                <ProgressRing value={averageProgress} variant="teal" strokeWidth={10} showText={true} />
              </div>
              <h4 className="text-base font-extrabold text-slate-800">
                {locale === 'en' ? 'Active Recall Boost' : 'Eficiencia de Repaso'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                {locale === 'en'
                  ? 'Retain up to 92% of lecture notes with Mentora flashcards.'
                  : 'Retén hasta 92% de tus clases con las tarjetas de Mentora.'}
              </p>
            </section>

            {/* Weekly Study Time Line Chart */}
            <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {locale === 'en' ? 'Study Time (hours)' : 'Tiempo de Estudio (horas)'}
                </h3>
                <TrendingUp className="w-4 h-4 text-[#0f766e]" />
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="horas"
                      stroke="#0f766e"
                      fillOpacity={0.12}
                      fill="url(#colorStudyHours)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorStudyHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* AI Tutor Quick Tips */}
            <section className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-xl text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0e7490]/10 rounded-full blur-2xl" />
              <div className="flex items-start gap-3 relative z-10">
                <Bot className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {locale === 'en' ? 'AI Assistant suggestion' : 'Sugerencia de la Tutora'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                    {locale === 'en'
                      ? '“You have 3 materials pending review. Start with the biology flashcards to consolidate active recall before sleep.”'
                      : '“Tienes 3 materiales pendientes de revisión. Comienza con las flashcards de biología para consolidar tu retención.”'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Creation Study Space Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4.5 right-4.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-[#ff6b5f] uppercase tracking-wider">
                {locale === 'en' ? 'ADD COURSE WORKSPACE' : 'AGREGAR ESPACIO DE ESTUDIO'}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1 font-outfit">
                {locale === 'en' ? 'Create a Study Hub' : 'Nuevo Espacio de Estudio'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {locale === 'en'
                  ? 'Define a dedicated context to isolate class logs, flashcards and chats.'
                  : 'Define un contexto dedicado para organizar apuntes, flashcards y chats.'}
              </p>
            </div>

            <form onSubmit={handleCreateSpace} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nombre del Curso</label>
                <input
                  type="text"
                  required
                  value={newSpace.title}
                  onChange={(e) => setNewSpace({ ...newSpace, title: e.target.value })}
                  placeholder="Ej. Biología Celular"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs focus:border-[#0f766e] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Código de Asignatura</label>
                <input
                  type="text"
                  required
                  value={newSpace.courseName}
                  onChange={(e) => setNewSpace({ ...newSpace, courseName: e.target.value })}
                  placeholder="Ej. BIO-204"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs focus:border-[#0f766e] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Institución Educativa</label>
                <input
                  type="text"
                  required
                  value={newSpace.institution}
                  onChange={(e) => setNewSpace({ ...newSpace, institution: e.target.value })}
                  placeholder="Ej. UNMSM"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs focus:border-[#0f766e] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] text-white text-xs font-bold rounded-lg mt-2 flex items-center justify-center gap-1.5 transition-[transform,box-shadow] duration-base ease-standard shadow-md hover:shadow cursor-pointer"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{locale === 'en' ? 'Create Workspace' : 'Crear Espacio'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Summary View Modal */}
      {summaryModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                setViewingSummary(null);
                setSummaryModalOpen(false);
              }}
              className="absolute top-4.5 right-4.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ff6b5f]" />
                {locale === 'en' ? 'AI Grounded Summary' : 'Resumen de Lectura Generado por IA'}
              </span>
              <h3 className="text-base font-black text-slate-800 mt-1 font-outfit">
                {locale === 'en' ? 'Core Concepts Overview' : 'Detalles de Conceptos Clave'}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
              {viewingSummary || (locale === 'en' ? 'No summary generated yet.' : 'Aún no se ha generado un resumen.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
