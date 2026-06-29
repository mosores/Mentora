"use client";

import { Search, X } from "lucide-react";

type MaterialSearchProps = {
  onChange: (value: string) => void;
  value: string;
};

export function MaterialSearch({ onChange, value }: MaterialSearchProps) {
  return (
    <label className="notebook-source-search group flex min-h-14 items-center gap-2 rounded-[18px] border px-3 text-sm transition">
      <Search className="shrink-0 transition" size={17} />
      <input
        aria-label="Buscar material"
        className="min-w-0 flex-1 bg-transparent font-medium text-[var(--nb-text)] outline-none placeholder:text-[var(--nb-muted)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search saved sources"
        value={value}
      />
      {value && (
        <button
          aria-label="Limpiar busqueda"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)]"
          onClick={() => onChange("")}
          type="button"
        >
          <X size={15} />
        </button>
      )}
    </label>
  );
}
