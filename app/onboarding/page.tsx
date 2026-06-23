'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/mentora/Logo';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Brain,
  Clock3,
  BookOpenCheck,
  Zap,
  Sparkles,
  FileText,
  CheckCircle2,
  Check,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STEPS = [
  { id: 1, name: 'Perfil y Objetivos', desc: 'Cuéntanos de ti' },
  { id: 2, name: 'Formatos Clave', desc: 'Cómo prefieres aprender' },
  { id: 3, name: 'Ritmo y Tiempos', desc: 'Define tu pomodoro' },
  { id: 4, name: 'Hábitos de Estudio', desc: 'Tus superpoderes' },
  { id: 5, name: 'Tu Plan', desc: 'Previsualización de curva' }
];

const GOAL_OPTIONS = [
  { id: 'exams', label: 'Aprobar exámenes exigentes', icon: GraduationCap },
  { id: 'mastery', label: 'Dominar conceptos difíciles', icon: Brain },
  { id: 'research', label: 'Investigar y sintetizar papers', icon: FileText },
  { id: 'efficiency', label: 'Optimizar tiempo de estudio', icon: Zap }
];

const FORMAT_OPTIONS = [
  { id: 'summary', title: 'Resúmenes IA', desc: 'Síntesis ejecutivas de tus PDF y audios.', icon: FileText },
  { id: 'flashcards', title: 'Flashcards Activas', desc: 'Preguntas y respuestas con repetición espaciada.', icon: Sparkles },
  { id: 'quiz', title: 'Evaluaciones Inteligentes', desc: 'Simulacros de examen para medir tu avance.', icon: CheckCircle2 },
  { id: 'explanations', title: 'Explicaciones Detalladas', desc: 'Desgloses paso a paso de fórmulas o teorías.', icon: Brain }
];

const HABIT_CHIPS = [
  { id: 'night', label: 'Estudio Nocturno' },
  { id: 'morning', label: 'Estudio Matutino' },
  { id: 'visual', label: 'Aprendizaje Visual' },
  { id: 'auditory', label: 'Repasos de Audio' },
  { id: 'pomodoro', label: 'Bloques Cortos Pomodoro' },
  { id: 'deep', label: 'Sesiones de Foco Profundo' },
  { id: 'active', label: 'Autoevaluación Constante' }
];

// Recharts data for the active recall preview
const CHART_DATA = [
  { day: 'Día 1', tradicional: 100, mentora: 100 },
  { day: 'Día 2', tradicional: 60, mentora: 85 },
  { day: 'Día 3', tradicional: 40, mentora: 92 },
  { day: 'Día 4', tradicional: 30, mentora: 88 },
  { day: 'Día 5', tradicional: 22, mentora: 95 },
  { day: 'Día 6', tradicional: 18, mentora: 98 },
  { day: 'Día 7', tradicional: 15, mentora: 99 }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('exams');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['summary', 'flashcards']);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [pomodoroStyle, setPomodoroStyle] = useState('standard'); // sprint, standard, deep
  const [selectedHabits, setSelectedHabits] = useState<string[]>(['visual', 'active']);

  // Fetch logged in user to verify auth
  useEffect(() => {
    document.title = 'Tu perfil | Mentora';
    const token = window.localStorage.getItem('mentora.session') ?? '';
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session expired');
        const data = await res.json();
        setCurrentUser(data.user);
        setFullName(data.user.name || '');
        setAuthChecked(true);
      })
      .catch(() => {
        window.localStorage.removeItem('mentora.session');
        router.push('/auth/login');
      });
  }, [router]);

  const toggleFormat = (id: string) => {
    if (selectedFormats.includes(id)) {
      setSelectedFormats(selectedFormats.filter((f) => f !== id));
    } else {
      setSelectedFormats([...selectedFormats, id]);
    }
  };

  const toggleHabit = (id: string) => {
    if (selectedHabits.includes(id)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== id));
    } else {
      setSelectedHabits([...selectedHabits, id]);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    const token = window.localStorage.getItem('mentora.session') ?? '';

    try {
      // Persist learning profile so the tutor & settings can personalize.
      await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          goals: [selectedGoal],
          formats: selectedFormats,
          sessionDuration,
          pomodoroStyle,
          habits: selectedHabits
        })
      }).catch(() => {
        /* non-blocking: profile is optional */
      });

      // Create a default study space to welcome the student
      const response = await fetch('/api/study-spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Introducción al Aprendizaje',
          courseName: 'MENTORA-101',
          institution: institution || 'Universidad Mentora',
          language: 'es'
        })
      });

      if (response.ok) {
        // Save onboarding configuration locally or mark complete
        window.localStorage.setItem('mentora.onboarded', 'true');
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Failed to finish onboarding:', err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#0f766e]" size={36} />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Preparando Mentora...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-800">
      {/* Onboarding Sidebar */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-6 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
        <div>
          <div className="mb-8">
            <Logo size="sm" />
            <p className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase mt-1">Configuración Adaptativa</p>
          </div>

          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-none">
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3.5 p-3 rounded-xl transition-[background-color,border-color] duration-base ease-standard shrink-0 lg:shrink-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0f766e] to-[#ff6b5f]/40 text-white'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-white text-[#0f766e]'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </span>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold leading-none">{step.name}</p>
                    <p className="text-[10px] opacity-60 mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block pt-6 border-t border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Aislamiento de Privacidad
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
            Tus datos de ritmo y preferencias configuran el bot local y nunca se comparten externamente.
          </p>
        </div>
      </aside>

      {/* Onboarding Form Workspace */}
      <section className="flex-1 flex flex-col justify-between p-6 md:p-12 lg:p-16 max-w-4xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-[10px] font-bold text-[#ff6b5f] uppercase tracking-wider">
              Asistente de Adaptabilidad
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 font-outfit">
              {STEPS[currentStep - 1].name}
            </h1>
          </div>
          <span className="text-xs font-bold text-slate-400">Paso {currentStep} de 5</span>
        </div>

        {/* Dynamic Step Panels */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">¿Cómo te llamas?</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] outline-none transition-[border-color,box-shadow] duration-base ease-standard bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Universidad / Colegio</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Ej. UTEC, PUCP, UNMSM"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] outline-none transition-[border-color,box-shadow] duration-base ease-standard bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-600">¿Cuál es tu objetivo principal con Mentora?</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoal === goal.id;
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.id)}
                        className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-[background-color,border-color,box-shadow] duration-base ease-standard ${
                          isSelected
                            ? 'border-[#0f766e] bg-[#e8f7f4] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`p-2 rounded-lg ${
                            isSelected ? 'bg-[#0f766e] text-white' : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{goal.label}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Establece prioridades adaptativas.</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 mb-2">
                Selecciona los formatos interactivos que más utilizas (puedes elegir varios):
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {FORMAT_OPTIONS.map((fmt) => {
                  const isSelected = selectedFormats.includes(fmt.id);
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => toggleFormat(fmt.id)}
                      className={`p-4 rounded-xl border text-left flex gap-4 transition-[background-color,border-color,box-shadow] duration-base ease-standard relative ${
                        isSelected
                          ? 'border-[#0f766e] bg-[#e8f7f4]/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`p-3 rounded-lg shrink-0 self-start ${
                          isSelected ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">{fmt.title}</h3>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{fmt.desc}</p>
                      </div>
                      {isSelected && (
                        <span className="absolute top-3 right-3 w-4.5 h-4.5 rounded-full bg-[#0f766e] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Session Duration Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600">Duración típica de sesión de estudio</label>
                  <span className="text-sm font-black text-[#0f766e] font-outfit">{sessionDuration} minutos</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0f766e]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>15 min (Sesión Express)</span>
                  <span>45 min (Enfoque Regular)</span>
                  <span>90 min (Sesión Profunda)</span>
                </div>
              </div>

              {/* Pomodoro Selection */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-600">Modalidad de Temporizador Preferida</label>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { id: 'sprint', label: 'Pomodoro Sprint', desc: '15m estudio + 3m descanso', icon: Clock3 },
                    { id: 'standard', label: 'Pomodoro Clásico', desc: '25m estudio + 5m descanso', icon: Clock3 },
                    { id: 'deep', label: 'Enfoque Ultra', desc: '50m estudio + 10m descanso', icon: Clock3 }
                  ].map((style) => {
                    const isSelected = pomodoroStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setPomodoroStyle(style.id)}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-[background-color,border-color,box-shadow] duration-base ease-standard ${
                          isSelected
                            ? 'border-[#0f766e] bg-[#e8f7f4] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <style.icon className={`w-5 h-5 ${isSelected ? 'text-[#0f766e]' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{style.label}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{style.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 mb-2">
                Toca para activar tus hábitos y estilos de aprendizaje actuales:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {HABIT_CHIPS.map((habit) => {
                  const isSelected = selectedHabits.includes(habit.id);
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => toggleHabit(habit.id)}
                      className={`px-4 py-2.5 rounded-full border text-xs font-semibold tracking-wide transition-[background-color,border-color] duration-base ease-standard ${
                        isSelected
                          ? 'bg-[#ff6b5f] border-[#ff6b5f] text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {habit.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
                <Brain className="w-5 h-5 text-[#0f766e] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Motor Adaptativo Inteligente</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Mentora pre-procesa el prompt del LLM integrando tus hábitos seleccionados. Por ejemplo, priorizando resúmenes visuales para perfiles visuales.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="p-4 bg-[#e8f7f4] border border-[#0f766e]/20 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#0f766e] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0f766e]">¡Tu Plan Personalizado está listo!</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed mt-1">
                    Abajo puedes observar la proyección de retención de conocimientos usando la práctica de recall activo de Mentora frente a la curva de olvido tradicional.
                  </p>
                </div>
              </div>

              {/* Retention Projection Recharts Area Chart */}
              <div className="h-56 w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Retención de Conocimiento (%)
                </p>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="mentora"
                      stroke="#0f766e"
                      fillOpacity={0.15}
                      fill="url(#colorMentora)"
                      name="Con Mentora (Active Recall)"
                    />
                    <Area
                      type="monotone"
                      dataKey="tradicional"
                      stroke="#ff6b5f"
                      fillOpacity={0.05}
                      fill="url(#colorTradicional)"
                      name="Curva de Olvido Tradicional"
                    />
                    <defs>
                      <linearGradient id="colorMentora" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTradicional" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b5f" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ff6b5f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions Footer */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-6">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition shadow-sm hover:shadow cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creando Espacio...</span>
              </>
            ) : (
              <>
                <span>{currentStep === 5 ? 'Comenzar a Estudiar' : 'Siguiente'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}
