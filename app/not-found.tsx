import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { Logo } from '@/components/mentora/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fdfb] to-white font-outfit flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0f766e] to-[#0e7490] flex items-center justify-center text-white shadow-lg shadow-[#0f766e]/20">
            <Compass className="w-12 h-12" />
          </div>
          <span className="absolute -top-2 -right-3 px-2.5 py-0.5 rounded-full bg-[#ff6b5f] text-white text-xs font-bold shadow">
            404
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-800 mb-3">
          Página no encontrada
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          La página que buscas no existe o fue movida. Vuelve al inicio para seguir
          estudiando con Mentora.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#0d655e] transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Mi dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
