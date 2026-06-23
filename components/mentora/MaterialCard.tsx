import React from 'react';
import { FileText, File, Trash2, Loader2, Sparkles, AlertCircle, BookOpen, Eye, Image as ImageIcon } from 'lucide-react';

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

interface MaterialCardProps {
  id: string;
  name: string;
  mimeType: string;
  status: DocumentStatus;
  pageCount?: number | null;
  summary?: string | null;
  createdAt?: Date | string;
  onDelete?: (id: string) => void;
  onStudy?: (id: string) => void;
  onViewSummary?: (id: string) => void;
  locale?: 'en' | 'es';
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  id,
  name,
  mimeType,
  status,
  pageCount,
  summary,
  createdAt,
  onDelete,
  onStudy,
  onViewSummary,
  locale = 'es',
}) => {
  // Determine file icon and color base based on mimeType/extension
  const getFileInfo = (mime: string, fileName: string) => {
    const lowerMime = mime.toLowerCase();
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (lowerMime.includes('pdf') || ext === 'pdf') {
      return {
        icon: <FileText className="w-5 h-5 text-red-500" />,
        badgeText: 'PDF',
        badgeClass: 'bg-red-50 text-red-600 border-red-100',
      };
    }
    if (lowerMime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      return {
        icon: <ImageIcon className="w-5 h-5 text-emerald-500" />,
        badgeText: locale === 'es' ? 'IMAGEN' : 'IMAGE',
        badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      };
    }
    if (lowerMime.includes('text') || ext === 'txt') {
      return {
        icon: <File className="w-5 h-5 text-amber-500" />,
        badgeText: locale === 'es' ? 'TEXTO' : 'TXT',
        badgeClass: 'bg-amber-50 text-amber-600 border-amber-100',
      };
    }
    return {
      icon: <File className="w-5 h-5 text-sky-500" />,
      badgeText: locale === 'es' ? 'DOC' : 'DOC',
      badgeClass: 'bg-sky-50 text-sky-600 border-sky-100',
    };
  };

  const { icon, badgeText, badgeClass } = getFileInfo(mimeType, name);

  // Format created date
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(locale === 'es' ? 'es-PE' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  // Labels based on locale
  const labels = {
    es: {
      processing: 'Procesando con IA...',
      pending: 'En cola...',
      failed: 'Error de análisis',
      pages: 'págs.',
      viewSummary: 'Resumen',
      study: 'Estudiar',
      delete: 'Eliminar',
    },
    en: {
      processing: 'Processing with AI...',
      pending: 'Queued...',
      failed: 'Processing failed',
      pages: 'pages',
      viewSummary: 'Summary',
      study: 'Study',
      delete: 'Delete',
    },
  }[locale];

  return (
    <div className="glass group relative p-4 flex flex-col justify-between rounded-xl transition-[box-shadow,border-color] duration-base ease-standard hover:shadow-lg hover:border-slate-350">
      {/* File Info */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 w-full">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-md shrink-0">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className="text-sm font-semibold text-slate-800 truncate pr-2 group-hover:text-[#0f766e] transition-colors duration-base ease-standard"
                title={name}
              >
                {name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                  {badgeText}
                </span>
                {pageCount && (
                  <span className="tabular-nums">
                    • {pageCount} {labels.pages}
                  </span>
                )}
                {formattedDate && <span className="tabular-nums">• {formattedDate}</span>}
              </div>
            </div>
          </div>

          {/* Delete Action (always available) */}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="min-w-[40px] min-h-[40px] p-1.5 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-[background-color,color] duration-base ease-standard cursor-pointer shrink-0"
              title={labels.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {status === 'pending' && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              {labels.pending}
            </span>
          )}
          {status === 'processing' && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              {labels.processing}
            </span>
          )}
          {status === 'failed' && (
            <span className="flex items-center gap-1.5 text-red-600" title="Error">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              {labels.failed}
            </span>
          )}
          {status === 'ready' && (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
              LISTO
            </span>
          )}
        </div>

        {/* Action buttons if ready */}
        {status === 'ready' && (
          <div className="flex items-center gap-1.5">
            {summary && onViewSummary && (
              <button
                onClick={() => onViewSummary(id)}
                className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-[#0e7490] hover:bg-sky-50 rounded-md transition-colors duration-base ease-standard flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{labels.viewSummary}</span>
              </button>
            )}
            {onStudy && (
              <button
                onClick={() => onStudy(id)}
                className="min-h-[36px] px-3 py-1 text-xs font-semibold bg-[#0f766e] text-white hover:bg-[#0e7490] rounded-md transition-[background-color,box-shadow] duration-base ease-standard flex items-center gap-1 shadow-sm hover:shadow cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{labels.study}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
