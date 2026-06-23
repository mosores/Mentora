'use client';

import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppSidebar } from '@/components/mentora/AppSidebar';
import { MaterialCard } from '@/components/mentora/MaterialCard';
import { ChatMessage } from '@/components/mentora/ChatMessage';
import { QuickToolButton } from '@/components/mentora/QuickToolButton';
import {
  GraduationCap,
  Upload,
  Loader2,
  Sparkles,
  Bot,
  Send,
  BookOpenCheck,
  Check,
  AlertCircle,
  FileText,
  Clock3,
  Bookmark,
  ChevronRight,
  X
} from 'lucide-react';

interface MentoraDocument {
  id: string;
  studySpaceId: string;
  name: string;
  mimeType: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  text: string;
  summary: string;
  chunks: Array<{ id: string; content: string; index: number; tokenEstimate: number }>;
  flashcards: any[];
  quiz: any[];
  createdAt: string;
  updatedAt: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  provider: 'openrouter' | 'mock';
  isFree: boolean;
  requiresLogin: boolean;
  priceLabel: string;
}

export default function StudySpacePage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = params?.spaceId as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studySpace, setStudySpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<'es' | 'en'>('es');

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('mock.study-tutor');
  const [asking, setAsking] = useState(false);

  // Practice State
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'apa' | 'notes'>('flashcards');
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [notesText, setNotesText] = useState('');

  // Tool loading state
  const [toolLoading, setToolLoading] = useState('');
  const [studyPlan, setStudyPlan] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch initial data
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

      // Get current Space
      const spaceRes = await fetch(`/api/study-spaces/${spaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!spaceRes.ok) {
        router.push('/dashboard');
        return;
      }

      const spaceData = await spaceRes.json();
      setStudySpace(spaceData.studySpace);
      setChatHistory(spaceData.studySpace?.chats || []);
    } catch (err) {
      console.error(err);
      window.localStorage.removeItem('mentora.session');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = locale === 'en' ? 'Study Space | Mentora' : 'Espacio de Estudio | Mentora';
    fetchData();

    // Fetch models list
    fetch('/api/ai/models', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const nextModels = data.models || [];
        setModels(nextModels);
        const freeModel = nextModels.find((m: any) => m.isFree)?.id;
        setSelectedModel(freeModel || 'mock.study-tutor');
      })
      .catch(() => {
        const fallback: ModelOption = {
          id: 'mock.study-tutor',
          name: 'Mentora Local Tutor',
          description: 'Local fallback model.',
          contextLength: 16000,
          provider: 'mock',
          isFree: true,
          requiresLogin: false,
          priceLabel: 'Free'
        };
        setModels([fallback]);
        setSelectedModel(fallback.id);
      });
  }, [spaceId, router]);

  // Auth header constructor
  const getAuthHeaders = (extra: HeadersInit = {}): HeadersInit => {
    const token = window.localStorage.getItem('mentora.session') ?? '';
    return {
      ...extra,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Upload Document
  const handleUploadMaterial = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !manualText.trim()) return;

    setUploading(true);
    setNotice(null);

    const formData = new FormData();
    formData.append('studySpaceId', spaceId);
    formData.append('language', locale);
    formData.append('manualText', manualText);
    if (uploadFile) {
      formData.append('file', uploadFile);
    }

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to index document');
      }

      setNotice({
        type: 'success',
        message: locale === 'en' ? 'Material processed and indexed.' : 'Material procesado e indexado.'
      });
      setUploadFile(null);
      setManualText('');
      await fetchData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error uploading file' });
    } finally {
      setUploading(false);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (docId: string) => {
    try {
      const response = await fetch(`/api/study-spaces/${spaceId}/documents/${docId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
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

  // Regenerate study tools (summary, flashcards, quiz)
  const handleRegenerateTool = async (tool: 'summary' | 'flashcards' | 'quiz') => {
    const activeDoc = studySpace?.documents?.[0];
    if (!activeDoc) return;

    setToolLoading(tool);
    setNotice(null);

    try {
      const response = await fetch(`/api/study-spaces/${spaceId}/tools`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ tool, documentId: activeDoc.id, language: locale })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate tool.');
      }

      setNotice({
        type: 'success',
        message: locale === 'en' ? 'Recall resource regenerated.' : 'Recurso de repaso regenerado.'
      });
      await fetchData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Regeneration failed.' });
    } finally {
      setToolLoading('');
    }
  };

  // Generate 7-day study plan
  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    setNotice(null);

    try {
      const response = await fetch('/api/ai/generate-study-plan', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ studySpaceId: spaceId, language: locale, days: 7 })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Plan generation failed');
      }

      setStudyPlan(data.plan);
      setNotice({
        type: 'success',
        message: locale === 'en' ? 'Study plan created.' : 'Plan de estudio creado.'
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error generating plan.' });
    } finally {
      setPlanLoading(false);
    }
  };

  // AI Tutor Ask
  const handleAskTutor = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: chatMessage,
      createdAt: new Date().toISOString()
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatMessage('');
    setAsking(true);
    setNotice(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          message: userMsg.content,
          language: locale,
          studySpaceId: spaceId,
          mode: 'source_strict',
          selectedModel: selectedModel === 'mock.study-tutor' ? undefined : selectedModel
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve response');
      }

      // Append assistant message
      const assistantMsg = {
        id: Math.random().toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        model: data.model || 'Mentora Core',
        createdAt: new Date().toISOString()
      };
      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Tutor could not answer.' });
    } finally {
      setAsking(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('mentora.session');
    router.push('/auth/login');
  };

  const handleCitationSelect = (cit: any) => {
    // Scroll or set visibility of citations context
    setNotice({
      type: 'success',
      message: `Fuente citada: ${cit.documentName} ${cit.pageNumber ? `(Pág. ${cit.pageNumber})` : ''}`
    });
  };

  // Derive cards/quiz details from first ready document
  const activeDocument: MentoraDocument | undefined = useMemo(() => {
    return studySpace?.documents?.find((doc: any) => doc.status === 'ready');
  }, [studySpace]);

  const flashcards = activeDocument?.flashcards || [];
  const quiz = activeDocument?.quiz || [];
  const currentCard = flashcards[selectedCardIdx % Math.max(flashcards.length, 1)];

  const quizScore = useMemo(() => {
    return quiz.filter((q) => quizAnswers[q.id] === q.answer).length;
  }, [quiz, quizAnswers]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#0f766e]" size={36} />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Abriendo Espacio...</p>
        </div>
      </main>
    );
  }

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
        currentPath="spaces"
        onNavigate={(path) => {
          if (path === 'dashboard') router.push('/dashboard');
          if (path === 'onboarding') router.push('/onboarding');
        }}
        onLogout={handleLogout}
        locale={locale}
        onLocaleChange={(lang) => setLocale(lang)}
        storageUsedMb={parseFloat(((studySpace?.documents?.length || 0) * 1.5).toFixed(1))}
        storageLimitMb={50}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Navigation Header */}
        <header className="p-6 border-b border-slate-200/60 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="cursor-pointer hover:text-[#0f766e]" onClick={() => router.push('/dashboard')}>
                Dashboard
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
              <span className="text-slate-600">{studySpace?.institution}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-1">
              {studySpace?.title} ({studySpace?.courseName})
            </h1>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading || !activeDocument}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-700 to-[#0f766e] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              {planLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock3 className="w-3.5 h-3.5" />}
              <span>Plan de Estudio</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              Cerrar Espacio
            </button>
          </div>
        </header>

        {notice && (
          <div className="mx-6 mt-4">
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

        {/* Study Action Toolbar */}
        <div className="mx-6 mt-4">
          <div className="flex flex-wrap gap-2">
            {([
              ['file-text', locale === 'en' ? 'Summarize' : 'Resumir', locale === 'en' ? 'Get essentials' : 'Obtén lo esencial'],
              ['bot', locale === 'en' ? 'Explain' : 'Explicar', locale === 'en' ? 'As if simple' : 'Como si fuera simple'],
              ['sparkles', locale === 'en' ? 'Key Ideas' : 'Ideas clave', locale === 'en' ? 'Important points' : 'Puntos importantes'],
              ['bookmark', locale === 'en' ? 'Generate APA' : 'Generar APA', locale === 'en' ? 'Cite this document' : 'Cita este documento'],
              ['book-open-check', locale === 'en' ? 'Flashcards' : 'Flashcards', locale === 'en' ? 'Study cards' : 'Tarjetas de estudio'],
              ['check', locale === 'en' ? 'Create Quiz' : 'Crear quiz', locale === 'en' ? 'Test yourself' : 'Evalúa tu comprensión']
            ] as const).map(([icon, label, sub], idx) => {
              const iconMap: Record<string, React.ReactNode> = {
                'file-text': <FileText className="w-4 h-4" />,
                'bot': <Bot className="w-4 h-4" />,
                'sparkles': <Sparkles className="w-4 h-4" />,
                'bookmark': <Bookmark className="w-4 h-4" />,
                'book-open-check': <BookOpenCheck className="w-4 h-4" />,
                'check': <Check className="w-4 h-4" />
              };
              return (
                <button
                  key={icon}
                  onClick={() => {
                    if (icon === 'book-open-check') setActiveTab('flashcards');
                    else if (icon === 'check') setActiveTab('quiz');
                    else if (icon === 'bookmark') setActiveTab('apa');
                    else setActiveTab('flashcards');
                    document.getElementById('recall-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={!activeDocument}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-[transform,border-color,background-color] duration-base ease-standard disabled:opacity-50 disabled:cursor-not-allowed"
                  title={sub}
                >
                  {iconMap[icon]}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Inner Workspace Grid: Ingestion and Recall Panel vs AI Chat Panel */}
        <div className="flex-1 p-6 grid gap-6 lg:grid-cols-12 min-h-0">
          {/* Main workspace section (Ingestion + Recall) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Ingestion block */}
            <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-3.5 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0f766e]" />
                  <span>Sube apuntes o diapositivas</span>
                </h2>

                <form onSubmit={handleUploadMaterial} className="grid gap-3">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                  />
                  {uploadFile && (
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-700 font-semibold">
                      Listo para procesar: {uploadFile.name}
                    </div>
                  )}

                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="O pega tus notas de clase directamente aquí..."
                    className="w-full h-24 p-3 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#0f766e] bg-white resize-none"
                  />

                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-[#0f766e] hover:bg-[#0e7490] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition self-end cursor-pointer disabled:opacity-75"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Indexar Material</span>
                  </button>
                </form>
              </div>

              {/* Documents List */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                  Documentos en este Espacio
                </span>

                {(!studySpace?.documents || studySpace.documents.length === 0) ? (
                  <p className="text-xs text-slate-400 font-medium italic">
                    Aún no hay archivos cargados. Sube uno arriba.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {studySpace.documents.map((doc: any) => (
                      <MaterialCard
                        key={doc.id}
                        id={doc.id}
                        name={doc.name}
                        mimeType={doc.mimeType}
                        status={doc.status}
                        pageCount={doc.chunks?.length ? Math.ceil(doc.chunks.length / 2) : 2}
                        summary={doc.summary}
                        locale={locale}
                        onDelete={handleDeleteMaterial}
                        onStudy={() => {}}
                        onViewSummary={(id) => {
                          setNotice({ type: 'success', message: `Resumen de IA: ${doc.summary}` });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Interactive Active Recall Panel (Flashcards, Quizzes, APA) */}
            <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex-1 flex flex-col min-h-[420px]">
              {/* Tab Selector Headers */}
              <div className="flex border-b border-slate-200/60 pb-2.5 gap-4">
                {[
                  { id: 'flashcards', label: locale === 'en' ? 'Flashcards' : 'Tarjetas' },
                  { id: 'quiz', label: locale === 'en' ? 'Quiz Assessment' : 'Evaluaciones' },
                  { id: 'apa', label: 'Cita APA' },
                  { id: 'notes', label: locale === 'en' ? 'Notes' : 'Notas' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`text-xs font-bold tracking-wide transition-[color,border-color] duration-base ease-standard pb-1 cursor-pointer border-b-2 ${
                      activeTab === tab.id
                        ? 'border-[#0f766e] text-[#0f766e]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content rendering */}
              <div className="flex-1 flex flex-col justify-between py-4">
                {activeTab === 'flashcards' && (
                  <div className="flex-grow flex flex-col justify-between h-full">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-3">
                      <span>TARJETA {flashcards.length > 0 ? `${(selectedCardIdx % flashcards.length) + 1} / ${flashcards.length}` : '0 / 0'}</span>
                      <button
                        onClick={() => handleRegenerateTool('flashcards')}
                        disabled={toolLoading === 'flashcards' || !activeDocument}
                        className="text-[#0f766e] hover:underline"
                      >
                        {toolLoading === 'flashcards' ? 'Regenerando...' : 'Re-generar Tarjetas'}
                      </button>
                    </div>

                    {flashcards.length === 0 ? (
                      <div className="p-8 border border-slate-100 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 font-medium flex-1 flex items-center justify-center">
                        Carga un documento para ver y repasar flashcards automáticas.
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="relative h-44 w-full cursor-pointer perspective-1000 my-auto"
                      >
                        <div className={`relative w-full h-full preserve-3d transition-transform duration-500 ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                          {/* Front */}
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white rounded-xl p-5 flex flex-col justify-between backface-hidden shadow-md">
                            <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase">{currentCard?.topic || 'Concepto'}</span>
                            <p className="text-sm font-semibold text-center my-auto px-2">{currentCard?.front}</p>
                            <span className="text-center text-[8px] text-slate-500 uppercase tracking-widest font-bold">Toca para voltear</span>
                          </div>
                          {/* Back */}
                          <div className="absolute inset-0 bg-white border border-slate-200 text-slate-800 rounded-xl p-5 flex flex-col justify-between backface-hidden rotate-y-180 shadow-md">
                            <span className="text-[9px] font-bold text-[#ff6b5f] tracking-wider uppercase">Explicación</span>
                            <p className="text-xs text-center my-auto text-slate-600 leading-relaxed max-h-[100px] overflow-y-auto px-2">{currentCard?.back}</p>
                            <span className="text-center text-[8px] text-slate-400 uppercase tracking-widest font-bold">Volver al frente</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsCardFlipped(false);
                          setTimeout(() => setSelectedCardIdx((prev) => prev + 1), 150);
                        }}
                        disabled={flashcards.length === 0}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Siguiente Tarjeta
                      </button>

                      {currentCard?.difficulty && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                          {currentCard.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'quiz' && (
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-3">
                      <span>EVALUACIÓN ({quizScore} / {quiz.length} Correctas)</span>
                      <button
                        onClick={() => handleRegenerateTool('quiz')}
                        disabled={toolLoading === 'quiz' || !activeDocument}
                        className="text-[#0f766e] hover:underline"
                      >
                        {toolLoading === 'quiz' ? 'Regenerando...' : 'Re-generar Quiz'}
                      </button>
                    </div>

                    {quiz.length === 0 ? (
                      <div className="p-8 border border-slate-100 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 font-medium flex-grow flex items-center justify-center">
                        Carga un documento para ver cuestionarios de opción múltiple.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                        {quiz.map((q, qidx) => (
                          <div key={q.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <span className="text-[9px] font-bold text-slate-400">PREGUNTA {qidx + 1}</span>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed mt-1 mb-2.5">{q.question}</p>

                            <div className="grid gap-2">
                              {q.options.map((opt: string) => {
                                const isSelected = quizAnswers[q.id] === opt;
                                const isCorrect = q.answer === opt;

                                let btnStyle = 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600';
                                if (isSelected) {
                                  btnStyle = isCorrect
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                    : 'bg-red-50 border-red-500 text-red-700';
                                }

                                return (
                                  <button
                                    key={opt}
                                    onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                    className={`w-full text-left p-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors duration-150 ${btnStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {isSelected && (isCorrect ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-600" />)}
                                  </button>
                                );
                              })}
                            </div>

                            {quizAnswers[q.id] && (
                              <p className="mt-2.5 p-2 bg-white rounded-lg border border-slate-150 text-[10px] text-slate-500 leading-relaxed">
                                💡 <span className="font-semibold text-slate-600">Explicación:</span> {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'apa' && (
                  <div className="flex-grow flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                      Cita APA del Material
                    </span>

                    {activeDocument ? (
                      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl my-auto">
                        <Bookmark className="w-5 h-5 text-[#0f766e] mb-2" />
                        <p className="text-xs font-mono font-semibold text-slate-800 bg-white p-3 border border-slate-200 rounded select-all">
                          {studySpace?.institution || 'Mentora'}. (2026). <span className="italic">{activeDocument.name}</span>. Copiloto de Estudio de Mentora IA. Recuperado de {typeof window !== 'undefined' ? window.location.origin : ''}/study/{spaceId}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          * Copia el texto anterior para agregarlo a la bibliografía de tu trabajo.
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 border border-slate-100 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 font-medium flex-grow flex items-center justify-center">
                        Carga un documento para formatear su referencia bibliográfica en norma APA.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="flex-grow flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                      {locale === 'en' ? 'Your Notes' : 'Tus Notas'}
                    </span>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder={locale === 'en' ? 'Write your study notes here...' : 'Escribe tus notas de estudio aquí...'}
                      className="flex-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none resize-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-2">
                      {locale === 'en' ? 'Notes are saved locally.' : 'Las notas se guardan localmente.'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: AI Tutor Chat */}
          <aside className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col h-[600px] lg:h-auto min-h-0">
            {/* Header info */}
            <div className="p-4 border-b border-slate-200/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e8f7f4] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Bot className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-800 leading-tight">Tutora IA Copiloto</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-none">
                    Respuestas sustentadas en tus fuentes cargadas
                  </p>
                </div>

                {/* Models selection */}
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-[10px] font-bold border border-slate-200 rounded px-2 py-1 outline-none text-slate-600 bg-white"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name.split('/')[1] || m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* OpenRouter badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                  <Sparkles className="w-3 h-3" />
                  OpenRouter
                </span>
                <span className="text-[9px] text-slate-400">
                  {locale === 'en' ? 'Multi-model AI' : 'IA multi-modelo'}
                </span>
              </div>

              {/* Explanation style chips */}
              <div className="flex flex-wrap gap-1.5">
                {([
                  ['Visual', '#0f766e'],
                  ['Paso a paso', '#8b5cf6'],
                  ['Breve', '#0e7490'],
                  ['Profundo', '#ff6b5f']
                ] as const).map(([label, color]) => (
                  <button
                    key={label}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition hover:opacity-80"
                    style={{
                      backgroundColor: `${color}0d`,
                      color: color,
                      borderColor: `${color}20`
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

          {/* Chat message listing */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-text">
              {chatHistory.length === 0 ? (
                <div className="my-auto text-center p-6">
                  <Sparkles className="w-8 h-8 text-[#0f766e] mx-auto mb-2 opacity-60 animate-bounce" />
                  <h4 className="text-xs font-bold text-slate-700">Comienza a conversar</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                    Pregunta sobre el material cargado. La tutora responderá referenciando fragmentos específicos.
                  </p>
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <ChatMessage
                    key={chat.id}
                    role={chat.role}
                    content={chat.content}
                    createdAt={chat.createdAt}
                    citations={
                      chat.citations?.map((c: any) =>
                        typeof c === 'string' ? { documentId: c, documentName: c } : c
                      ) || []
                    }
                    onCitationClick={handleCitationSelect}
                    locale={locale}
                  />
                ))
              )}
              {asking && <ChatMessage role="assistant" content="" isTyping={true} />}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleAskTutor} className="p-3 border-t border-slate-200/60 bg-slate-50 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Pregunta algo sobre tus apuntes..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#0f766e] shadow-inner"
              />
              <button
                type="submit"
                disabled={asking || !chatMessage.trim()}
                className="p-2 bg-[#0f766e] hover:bg-[#0e7490] text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
