import { History, X, Building, ArrowRight, Trash2, Calendar, MapPin } from 'lucide-react';
import { SearchHistoryItem } from '../types/cnpj.ts';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectCnpj: (cnpj: string) => void;
  onClearHistory: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectCnpj,
  onClearHistory,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Histórico de Consultas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Nenhuma consulta recente no histórico.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectCnpj(item.cnpj);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <h4 className="font-semibold text-xs text-white truncate group-hover:text-blue-300">
                      {item.companyName}
                    </h4>
                  </div>
                  <p className="font-mono text-[11px] text-slate-400">{item.cnpj}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.municipio}/{item.uf}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(item.searchedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-600 text-slate-400 group-hover:text-white transition-colors shrink-0 mt-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-3 rounded-lg hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
