import { BookOpen, Languages, Lock, ShieldCheck } from "lucide-react";

const highlights = [
  ["Source grounded", ShieldCheck],
  ["Bilingual flow", Languages],
  ["Private spaces", Lock]
] as const;

export function LoginHero() {
  return (
    <div className="flex flex-col justify-between px-6 py-7 sm:px-10 lg:px-14">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-600 text-white">
          <BookOpen size={21} aria-hidden="true" />
        </span>
        Mentora
      </div>

      <div className="max-w-2xl py-16 sm:py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Peru-first study workspace
        </p>
        <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl lg:text-7xl">
          Mentora
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          Upload course material, build practice tools, and ask a tutor that answers from your own
          sources in English or Spanish.
        </p>

        <div className="mt-10 grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
          {highlights.map(([label, Icon]) => (
            <div key={label} className="flex items-center gap-3 border-l border-teal-200 pl-4">
              <Icon size={18} className="text-teal-700" aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">Demo student: student@mentora.local / mentora123</p>
    </div>
  );
}
