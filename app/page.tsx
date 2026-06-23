'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/mentora/Logo';
import { copy, type Locale } from '@/lib/i18n';
import {
  GraduationCap,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Bot,
  BookOpenCheck,
  Globe2,
  Search,
  Brain,
  Zap,
  LockKeyhole,
  CheckCircle2,
  Languages,
  Upload
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('es');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    const token = window.localStorage.getItem('mentora.session');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <main className="min-h-screen text-slate-800 flex flex-col bg-[#f8fafc] font-outfit relative overflow-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Mentora",
            "url": "https://mentora.app",
            "description": "Plataforma de estudio con IA para estudiantes universitarios en LATAM. Sube tus PDFs, apuntes y videos para recibir tutoría personalizada.",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Organization",
              "name": "Mentora"
            }
          })
        }}
      />
      {/* Background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#ff6b5f]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#0f766e]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-3">
            <Logo size="md" />
          </a>

          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition"
              aria-label="Switch language"
            >
              <Languages size={15} className="text-[#0f766e]" />
              {locale}
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md transition duration-200 cursor-pointer border-none"
              >
                {locale === 'en' ? 'Launch App' : 'Abrir App'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition cursor-pointer bg-white"
                >
                  {locale === 'en' ? 'Login' : 'Ingresar'}
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="rounded-lg bg-[#0f766e] hover:bg-[#0e7490] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition cursor-pointer border-none"
                >
                  {locale === 'en' ? 'Register' : 'Registrarse'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-12 md:py-24 grid gap-12 lg:grid-cols-12 items-center flex-1">
        <div className="lg:col-span-7 flex flex-col justify-center text-left">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#0f766e]/20 bg-[#e8f7f4] px-4 py-1.5 text-xs font-semibold text-[#0f3f3a] shadow-sm">
            <Sparkles size={14} className="text-[#ff6b5f] animate-pulse" />
            <span>{locale === 'en' ? 'AI study companion' : 'Copiloto de estudio inteligente IA'}</span>
          </div>

          <h1 className="text-balance text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight font-outfit text-slate-900">
            {locale === 'en' ? 'Study Smarter with' : 'Aprende más rápido con'}{' '}
            <span className="bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] bg-clip-text text-transparent">
              Mentora.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-slate-500">
            {t.hero.body}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition duration-200 cursor-pointer border-none"
              >
                {locale === 'en' ? 'Go to Dashboard' : 'Ir al Panel de Control'}
                <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition duration-200 cursor-pointer border-none"
                >
                  {locale === 'en' ? 'Start Studying' : 'Comenzar a Estudiar'}
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-bold text-slate-600 transition cursor-pointer"
                >
                  {locale === 'en' ? 'Demo Access' : 'Acceso Demo'}
                </button>
              </>
            )}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {([
              [LockKeyhole, locale === 'en' ? 'Private Spaces' : 'Espacios Privados'],
              [Bot, locale === 'en' ? '24/7 AI Tutor' : 'Tutor IA 24/7'],
              [BookOpenCheck, 'Flashcards + Quiz'],
              [Globe2, locale === 'en' ? 'Bilingual Ready' : 'Español e Inglés']
            ] as const).map(([Icon, label], idx) => {
              const IconComp = Icon as any;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/60 bg-white p-4 text-xs font-bold text-slate-600 shadow-sm flex flex-col gap-2"
                >
                  <IconComp className="text-[#0f766e]" size={20} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero Interactive Workspace preview */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#0f766e]/5 rounded-full blur-2xl" />
            <div className="rounded-xl bg-slate-900 text-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
                    {locale === 'en' ? 'ACTIVE RECALL PIPELINE' : 'PIPELINE REPASO IA'}
                  </p>
                  <h2 className="text-lg font-black text-white">
                    {locale === 'en' ? 'Lecture Grounding' : 'Estudio Inteligente'}
                  </h2>
                </div>
                <span className="rounded-full bg-[#0f766e]/30 border border-[#0f766e]/50 px-2.5 py-0.5 text-[9px] font-extrabold text-[#2dd4bf]">
                  RAG
                </span>
              </div>
              <div className="grid gap-3">
                {([
                  [Upload, locale === 'en' ? 'Upload Class Notes & PDFs' : 'Sube apuntes y archivos PDF/TXT'],
                  [Brain, locale === 'en' ? 'Generate Interactive Material' : 'Autogenera resúmenes y flashcards'],
                  [Bot, locale === 'en' ? 'Ask Tutor with Citations' : 'Pregunta a la tutora con referencias']
                ] as const).map(([Icon, text], idx) => {
                  const IconComp = Icon as any;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-[#ff6b5f]/20 to-[#0f766e]/20 text-[#2dd4bf]">
                        <IconComp size={14} />
                      </span>
                      <span className="text-xs font-bold text-slate-300">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 grid gap-4 grid-cols-3">
              {[
                ['3', locale === 'en' ? 'Documents' : 'Documentos'],
                ['14', locale === 'en' ? 'Index Chunks' : 'Chunks RAG'],
                ['100%', locale === 'en' ? 'Private' : 'Privacidad']
              ].map(([value, label], idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-xl font-black text-slate-800">{value}</p>
                  <p className="mt-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold font-outfit text-white">
              {locale === 'en' ? 'High Impact Active Learning' : 'Estudio Adaptativo de Alto Impacto'}
            </h2>
            <p className="text-slate-400 text-xs mt-2">
              {locale === 'en'
                ? 'Mentora equips you with structured mechanisms to recall information and retain concepts.'
                : 'Mentora te provee herramientas estructuradas para consolidar conocimientos.'}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(([
              [Search, locale === 'en' ? 'Semantic Knowledge' : 'Búsqueda Semántica', locale === 'en' ? 'Your documents are indexed and sliced for pin-point semantic study answers.' : 'Tus apuntes se dividen en partes y se indexan para responder de manera exacta.'],
              [Brain, locale === 'en' ? 'Adaptive Tutoring AI' : 'Tutora IA Adaptativa', locale === 'en' ? 'Our chatbot aligns responses to your course material and specific learning preferences.' : 'Nuestra tutora IA adapta sus explicaciones a tu ritmo y perfil de aprendizaje.'],
              [Zap, locale === 'en' ? 'Instant Active Recall' : 'Práctica Interactiva', locale === 'en' ? 'Generate smart summaries, structured flashcards, and quizzes on demand.' : 'Genera resúmenes, flashcards 3D y quizzes de autoevaluación al instante.'],
              [ShieldCheck, locale === 'en' ? 'Institutional Privacy' : 'Garantía de Privacidad', locale === 'en' ? 'Rigorous multi-tenant sandboxing ensures your lectures are secure and never leaked.' : 'El aislamiento estricto garantiza que tus apuntes nunca salgan de tu cuenta.']
            ] as const)).map(([Icon, title, body], idx) => {
              const IconComp = Icon as any;
              return (
                <article
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 hover:bg-slate-800/40 transition duration-200"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#0f766e]/20 border border-[#0f766e]/30 flex items-center justify-center mb-5">
                    <IconComp className="text-[#0f766e]" size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wide font-outfit">{title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / University Logos */}
      <section className="py-14 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            {locale === 'en' ? 'Trusted by students at' : 'Usado por estudiantes en'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 px-4">
            {[
              { name: 'UNMSM', color: '#0f766e' },
              { name: 'PUCP', color: '#0e7490' },
              { name: 'U. de los Andes', color: '#8b5cf6' },
              { name: 'ITAM', color: '#ff6b5f' },
              { name: 'UCR', color: '#10b981' },
              { name: 'UTEC', color: '#f59e0b' }
            ].map((u) => (
              <div
                key={u.name}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-bold tracking-tight"
                style={{ color: u.color }}
              >
                <GraduationCap className="w-4 h-4" />
                {u.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-white to-[#f8fdfb]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
              {locale === 'en' ? 'How It Works' : 'Cómo funciona'}
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              {locale === 'en'
                ? 'Four simple steps to study smarter with AI.'
                : 'Cuatro pasos simples para estudiar mejor con IA.'}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {([
              ['upload', locale === 'en' ? 'Upload your material' : 'Sube tu material', locale === 'en' ? 'PDFs, slides, notes, or videos.' : 'Archivos PDF, diapositivas, apuntes o videos.'],
              ['search', locale === 'en' ? 'Discover your style' : 'Descubre tu estilo', locale === 'en' ? 'Tell us how you learn best.' : 'Cuéntanos cómo aprendes mejor.'],
              ['bot', locale === 'en' ? 'Study with AI Tutor' : 'Estudia con Tutor IA', locale === 'en' ? 'Ask questions, get source-grounded answers.' : 'Haz preguntas con respuestas basadas en tus fuentes.'],
              ['zap', locale === 'en' ? 'Boost your results' : 'Mejora tus resultados', locale === 'en' ? 'Flashcards, quizzes & progress tracking.' : 'Flashcards, quizzes y seguimiento de progreso.']
            ] as const).map(([iconKey, title, desc], idx) => {
              const iconMap: Record<string, React.ReactNode> = {
                upload: <Upload className="w-5 h-5" />,
                search: <Search className="w-5 h-5" />,
                bot: <Bot className="w-5 h-5" />,
                zap: <Zap className="w-5 h-5" />
              };
              return (
                <div
                  key={idx}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-[transform,box-shadow] duration-base ease-standard hover:-translate-y-1"
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-[#0f766e] text-white text-sm font-bold flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#0f766e]/10 flex items-center justify-center text-[#0f766e] mb-4 mt-1">
                    {iconMap[iconKey]}
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
              {locale === 'en' ? 'What Students Say' : 'Lo que dicen los estudiantes'}
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              {locale === 'en'
                ? 'Thousands of students are already learning better with Mentora.'
                : 'Miles de estudiantes ya están aprendiendo mejor con Mentora.'}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {([
              { name: 'Diego R.', uni: 'Ingeniería, ITAM', text: locale === 'en' ? 'Mentora helped me organize my notes and prepare for finals. The flashcards are a game changer.' : 'Mentora me ayudó a organizar mis apuntes y prepararme para los finales. Las flashcards son un gran avance.' },
              { name: 'Valentina M.', uni: 'Psicología, U. de los Andes', text: locale === 'en' ? 'The AI Tutor explains things like a real professor. I love that it uses my own materials.' : 'El Tutor IA explica como un profesor real. Me encanta que usa mis propios materiales.' },
              { name: 'Sebastián G.', uni: 'Administración, PUCP', text: locale === 'en' ? 'I went from barely passing to top of my class. The study plan feature is incredible.' : 'Pasé de apenas aprobar a ser el mejor de mi clase. La función de plan de estudio es increíble.' },
              { name: 'Camila T.', uni: 'Derecho, UCR', text: locale === 'en' ? 'Having everything in one place — summaries, quizzes, citations — saves me hours every week.' : 'Tener todo en un solo lugar — resúmenes, quizzes, citas — me ahorra horas cada semana.' }
            ]).map((t, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-[transform,box-shadow] duration-base ease-standard hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 mb-3 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.262 7.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049.927z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="text-sm font-bold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.uni}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#0f766e] via-[#0d655e] to-[#0e7490] text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {locale === 'en' ? 'Start studying better today' : 'Empieza a estudiar mejor hoy'}
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-lg mx-auto">
            {locale === 'en'
              ? 'Join thousands of LATAM students who are already learning smarter with Mentora.'
              : 'Únete a miles de estudiantes LATAM que ya están aprendiendo de forma más inteligente con Mentora.'}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/register')}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0f766e] px-7 py-3 font-bold shadow-lg hover:bg-slate-100 transition-[transform,background-color] duration-base ease-standard hover:-translate-y-0.5"
            >
              {locale === 'en' ? 'Create free account' : 'Crear cuenta gratis'}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 text-white px-7 py-3 font-semibold hover:bg-white/10 transition-[background-color] duration-base ease-standard"
            >
              {locale === 'en' ? 'Learn more' : 'Saber más'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#0f766e]" />
            <span className="text-xs font-bold text-slate-500">
              © {new Date().getFullYear()} Mentora Study OS. Creado en Latinoamérica.
            </span>
          </div>
          <div className="flex gap-4 text-xs font-bold text-slate-500">
            <a href="#" className="hover:text-slate-700">Términos</a>
            <a href="#" className="hover:text-slate-700">Privacidad</a>
            <a href="#" className="hover:text-slate-700">Soporte</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
