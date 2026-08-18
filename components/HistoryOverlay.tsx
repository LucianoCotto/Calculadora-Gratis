import React from 'react';
import { HistoryItem } from '../types.ts';
import { Trash2, X, Copy, Check, CornerDownLeft, Clock } from 'lucide-react';

interface HistoryOverlayProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
  onUseExpression?: (expr: string) => void;
}

const HistoryOverlay: React.FC<HistoryOverlayProps> = ({ 
  history, 
  isOpen, 
  onClose, 
  onClear,
  onSelect,
  onUseExpression
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.result);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDisplayExpr = (expr: string) => {
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/(?<![0-9)])-/g, ' - ')
      .replace(/\^/g, ' ^ ')
      .replace(/sqrt\(/g, '√(')
      .trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-200 dark:border-zinc-800 transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 id="history-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Historial de Cálculos
            </h2>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar historial"
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-600">
              <Clock className="w-12 h-12 mb-3 stroke-[1.2]" />
              <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">Sin operaciones previas</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Los cálculos que realices aparecerán aquí</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className="group relative p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50/50 dark:hover:bg-zinc-800 transition-all border border-zinc-100 dark:border-zinc-800/80 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
                  <span className="font-mono">{formatTime(item.timestamp)}</span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => handleCopy(e, item)}
                      title="Copiar resultado"
                      aria-label="Copiar resultado"
                      className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {onUseExpression && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseExpression(item.expression);
                        }}
                        title="Reutilizar fórmula"
                        aria-label="Reutilizar fórmula"
                        className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm text-zinc-600 dark:text-zinc-400 font-mono font-medium truncate mb-1 opacity-90">
                  {formatDisplayExpr(item.expression)}
                </div>

                <div className="text-xl font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span className="truncate">= {item.result}</span>
                  <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity font-sans">
                    Cargar
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 flex gap-3">
            <button
              onClick={onClear}
              className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Borrar historial ({history.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryOverlay;
