import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, BookMarked, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export interface Citation {
  documentId: string;
  documentName: string;
  pageNumber?: number | null;
  textSegment?: string | null;
}

interface ChatMessageProps {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date | string;
  citations?: any; // Can be JSON array of Citation
  isTyping?: boolean;
  onCitationClick?: (citation: Citation) => void;
  locale?: 'en' | 'es';
}

interface ChartConfig {
  type: 'bar' | 'line' | 'area';
  data: Array<Record<string, any>>;
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string | string[];
  colors?: string[];
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  citations,
  isTyping = false,
  onCitationClick,
  locale = 'es',
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  // Format creation time
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString(locale === 'es' ? 'es-PE' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Parse citations safely
  const parsedCitations: Citation[] = React.useMemo(() => {
    if (!citations) return [];
    if (typeof citations === 'string') {
      try {
        return JSON.parse(citations);
      } catch {
        return [];
      }
    }
    if (Array.isArray(citations)) {
      return citations;
    }
    return [];
  }, [citations]);

  // Markdown component overrides matching premium Mentora styling
  const markdownComponents = {
    table: ({ ...props }) => (
      <div className="overflow-x-auto my-4 max-w-full rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left" {...props} />
      </div>
    ),
    thead: ({ ...props }) => <thead className="bg-slate-50" {...props} />,
    tbody: ({ ...props }) => <tbody className="divide-y divide-slate-100 bg-white" {...props} />,
    tr: ({ ...props }) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
    th: ({ ...props }) => <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
    td: ({ ...props }) => <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-normal" {...props} />,
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      return isInline ? (
        <code className="bg-slate-100 text-[#0e7490] px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props}>
          {children}
        </code>
      ) : (
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-3 text-xs font-mono border border-slate-800">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    a: ({ ...props }) => <a className="text-[#0e7490] hover:text-[#0f766e] underline font-semibold transition-colors" {...props} target="_blank" rel="noopener noreferrer" />,
    p: ({ ...props }) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-700" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 text-slate-700 space-y-1.5" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 text-slate-700 space-y-1.5" {...props} />,
    li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
    blockquote: ({ ...props }) => (
      <blockquote className="border-l-4 border-[#0f766e] pl-4 py-1.5 my-3 text-slate-600 italic bg-[#e8f7f4]/20 rounded-r-lg" {...props} />
    ),
  };

  // Render content parsing inline charts if present
  const renderMessageContent = () => {
    if (isTyping) {
      return (
        <div className="flex items-center gap-1.5 py-2">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      );
    }

    // Regex to split by the chart block, keeping the block in the resulting array
    const segments = content.split(/(```(?:chart|json:chart)[\s\S]*?```)/g);

    return segments.map((segment, index) => {
      // Even index: regular markdown text
      if (index % 2 === 0) {
        if (!segment.trim()) return null;
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {segment}
          </ReactMarkdown>
        );
      }

      // Odd index: chart block
      try {
        const jsonStr = segment
          .replace(/```(?:chart|json:chart)/, '')
          .replace(/```$/, '')
          .trim();
        const chartConfig = JSON.parse(jsonStr) as ChartConfig;

        if (
          chartConfig &&
          (chartConfig.type === 'bar' || chartConfig.type === 'line' || chartConfig.type === 'area') &&
          Array.isArray(chartConfig.data)
        ) {
          return (
            <MentoraChart key={index} config={chartConfig} />
          );
        }
      } catch (err) {
        console.error('Failed to parse inline chart config:', err);
      }

      // Fallback: render as code block if parsing failed
      return (
        <pre key={index} className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-3 text-xs font-mono border border-slate-800">
          <code>{segment}</code>
        </pre>
      );
    });
  };

  if (isSystem) {
    return (
      <div className="w-full text-center py-2.5 my-2">
        <span className="text-xs text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-6 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff6b5f] to-[#0f766e] flex items-center justify-center shrink-0 shadow-md relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ff6b5f] to-[#0f766e] opacity-40 blur-sm rounded-xl" />
          <Sparkles className="w-5 h-5 text-white relative z-10" />
        </div>
      )}

      {/* Message Body */}
      <div className={`flex flex-col max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`px-4 py-3 rounded-xl border text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-[#0f766e] to-[#0e7490] text-white border-transparent shadow-sm'
              : 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
          }`}
        >
          {renderMessageContent()}
        </div>

        {/* Citations and Time */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-medium select-none">
          {formattedTime && <span>{formattedTime}</span>}
          
          {/* Render Cites */}
          {parsedCitations.length > 0 && !isUser && (
            <div className="flex flex-wrap items-center gap-1.5 ml-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                {locale === 'es' ? 'FUENTES:' : 'SOURCES:'}
              </span>
              {parsedCitations.map((citation, i) => (
                <button
                  key={i}
                  onClick={() => onCitationClick && onCitationClick(citation)}
                  disabled={!onCitationClick}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 transition-colors max-w-[160px] cursor-pointer truncate"
                  title={citation.documentName}
                >
                  <BookMarked className="w-3 h-3 text-[#0f766e] shrink-0" />
                  <span className="truncate">{citation.documentName}</span>
                  {citation.pageNumber && (
                    <span className="text-[9px] font-bold text-[#0e7490]">
                      p.{citation.pageNumber}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          <User className="w-5 h-5 text-slate-600" />
        </div>
      )}
    </div>
  );
};

// Recharts Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-lg text-xs leading-normal select-none">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <p key={index} className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.stroke || item.fill || '#0f766e' }} />
              <span className="font-medium">{item.name}:</span>
              <span className="font-bold text-slate-900">{item.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Recharts Inline Chart Renderer
const MentoraChart: React.FC<{ config: ChartConfig }> = ({ config }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl my-3 animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const {
    type,
    data,
    title,
    xAxisKey = 'name',
    yAxisKey = 'value',
    colors = ['teal']
  } = config;

  const keys = Array.isArray(yAxisKey) ? yAxisKey : [yAxisKey];

  // Map theme colors
  const themeGradients = {
    teal: { id: 'grad-teal', start: '#0f766e', end: '#2dd4bf' },
    coral: { id: 'grad-coral', start: '#ff6b5f', end: '#f5c542' },
    sky: { id: 'grad-sky', start: '#0e7490', end: '#67e8f9' },
    indigo: { id: 'grad-indigo', start: '#6366f1', end: '#a5b4fc' },
  };

  return (
    <div className="w-full bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl my-4 text-slate-800 shadow-inner">
      {title && (
        <h5 className="text-xs font-bold text-slate-700 mb-3 font-outfit uppercase tracking-wider text-center">
          {title}
        </h5>
      )}
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                {keys.map((key, i) => {
                  const colorKey = (colors[i % colors.length] || 'teal') as keyof typeof themeGradients;
                  const theme = themeGradients[colorKey] || themeGradients.teal;
                  return (
                    <linearGradient key={key} id={`${theme.id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.start} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={theme.end} stopOpacity={0.3} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(23, 32, 42, 0.05)" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(23, 32, 42, 0.02)' }} />
              {keys.length > 1 && <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />}
              {keys.map((key, i) => {
                const colorKey = (colors[i % colors.length] || 'teal') as keyof typeof themeGradients;
                const theme = themeGradients[colorKey] || themeGradients.teal;
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={`url(#${theme.id}-${key})`}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                );
              })}
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                {keys.map((key, i) => {
                  const colorKey = (colors[i % colors.length] || 'teal') as keyof typeof themeGradients;
                  const theme = themeGradients[colorKey] || themeGradients.teal;
                  return (
                    <linearGradient key={key} id={`${theme.id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.start} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={theme.end} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(23, 32, 42, 0.05)" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {keys.length > 1 && <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />}
              {keys.map((key, i) => {
                const colorKey = (colors[i % colors.length] || 'teal') as keyof typeof themeGradients;
                const theme = themeGradients[colorKey] || themeGradients.teal;
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={theme.start}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${theme.id}-${key})`}
                  />
                );
              })}
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(23, 32, 42, 0.05)" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {keys.length > 1 && <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />}
              {keys.map((key, i) => {
                const colorKey = (colors[i % colors.length] || 'teal') as keyof typeof themeGradients;
                const theme = themeGradients[colorKey] || themeGradients.teal;
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={theme.start}
                    strokeWidth={2.5}
                    dot={{ fill: theme.start, r: 3.5, strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, strokeWidth: 2, fill: theme.start, stroke: '#ffffff' }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
