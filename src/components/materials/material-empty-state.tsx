"use client";

import { FileText } from "lucide-react";

export function MaterialEmptyState() {
  return (
    <section className="notebook-empty-state grid min-h-[25rem] place-items-center px-6 text-center">
      <div className="grid max-w-[17rem] justify-items-center gap-2">
        <FileText size={22} strokeWidth={1.8} aria-hidden="true" />
        <p className="text-[14px] font-semibold">Saved sources will appear here</p>
        <p className="text-[13px] font-medium leading-6">
          Click Add sources to add PDFs, websites, text, images, or notes.
        </p>
      </div>
    </section>
  );
}
