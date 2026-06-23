'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/mentora/Logo';
import { GraduationCap, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('student@mentora.local');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      window.localStorage.setItem('mentora.session', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-white to-[#f7fbfa] relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#ff6b5f]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#0f766e]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-8 left-8">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Form Container */}
        <form
          onSubmit={handleLogin}
          className="glass p-8 rounded-xl relative overflow-hidden flex flex-col gap-5 border border-slate-200/90"
        >
          {/* Decorative Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff6b5f] via-[#f5c542] to-[#0f766e]" />

          <div className="text-center mb-2">
            <div className="inline-flex p-2.5 bg-[#e8f7f4] border border-[#0f766e]/10 rounded-xl text-[#0f766e] mb-3">
              <GraduationCap className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold font-outfit text-slate-800">
              Bienvenido de nuevo
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Inicia sesión en tu copiloto de estudio Mentora
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@universidad.edu"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] outline-none transition-[border-color,box-shadow] duration-base ease-standard bg-white"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#ff6b5f] to-[#0f766e] text-white font-bold rounded-lg text-sm transition-[transform,box-shadow] duration-base ease-standard shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed border-none font-outfit"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-white" />
            )}
            <span>Ingresar</span>
          </button>

          <div className="text-center mt-2 border-t border-slate-100 pt-4 flex flex-col gap-2.5">
            <p className="text-xs text-slate-500 font-medium">
              ¿No tienes una cuenta?{' '}
              <a href="/auth/register" className="text-[#0e7490] hover:text-[#0f766e] font-bold transition-colors">
                Regístrate gratis
              </a>
            </p>
            
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-[10px] text-slate-500 text-left space-y-1">
              <span className="font-bold text-slate-600">Cuentas demo disponibles:</span>
              <div>• Estudiante: <span className="font-semibold text-slate-700">student@mentora.local</span></div>
              <div>• Admin: <span className="font-semibold text-slate-700">admin@mentora.local</span></div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
