"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip } from "lucide-react";

interface ChatInputProps {
  disabled: boolean;
  loading: boolean;
  placeholder: string;
  buttonLabel: string;
  onSend: (message: string) => void;
  onUploadFile?: (file: File) => void;
}

export function ChatInput({
  disabled,
  loading,
  placeholder,
  buttonLabel,
  onSend,
  onUploadFile,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(200, textarea.scrollHeight)}px`;
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || disabled || loading) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-black/5 bg-white/40 backdrop-blur-xl p-3 sm:p-4"
    >
      <div className="relative flex items-end gap-2 rounded-2xl border border-black/10 bg-white/60 backdrop-blur-md p-1.5 shadow-sm focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-400/15 transition-all duration-200">
        {onUploadFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Adjuntar archivo"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-black/5 hover:text-slate-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Adjuntar archivo"
            >
              <Paperclip size={17} />
            </button>
          </>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[40px] max-h-[200px] w-full resize-none bg-transparent py-2.5 pl-3.5 pr-12 text-sm leading-relaxed text-slate-800 placeholder-slate-400 outline-none focus:ring-0 focus:outline-none disabled:opacity-55 font-sans"
          style={{ height: "auto" }}
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          className="absolute right-2.5 bottom-2.5 flex h-9 items-center justify-center rounded-xl bg-indigo-500 px-3.5 text-xs font-bold text-white transition-all hover:bg-indigo-400 active:scale-95 disabled:pointer-events-none disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-50"
          aria-label={buttonLabel}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <>
              <Send size={15} className="mr-1.5" />
              <span className="hidden sm:inline">{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}