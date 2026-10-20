import React, { useState } from 'react';
import { Search, Building2, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { formatCnpj, isValidCnpj, SHOWCASE_COMPANIES } from '../lib/cnpjApi.ts';

interface CompanySearchProps {
  onSearch: (cnpj: string) => void;
  isLoading: boolean;
  currentCnpj?: string;
}

export function CompanySearch({ onSearch, isLoading, currentCnpj }: CompanySearchProps) {
  const [inputValue, setInputValue] = useState(currentCnpj || '');

  const cleanDigits = inputValue.replace(/\D/g, '');
  const isComplete = cleanDigits.length === 14;
  const valid = isComplete ? isValidCnpj(cleanDigits) : false;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    setInputValue(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid && !isLoading) {
      onSearch(cleanDigits);
    }
  };

  const handleSelectPreset = (cnpj: string) => {
    const formatted = formatCnpj(cnpj);
    setInputValue(formatted);
    onSearch(cnpj.replace(/\D/g, ''));
  };

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Digite o CNPJ (ex: 18.236.120/0001-58)"
              maxLength={18}
              className="w-full pl-11 pr-24 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 transition-all shadow-inner"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded-md"
                  title="Limpar campo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isComplete && (
                valid ? (
                  <span className="flex items-center text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Válido
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-rose-400 font-medium bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Inválido
                  </span>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!valid || isLoading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              valid && !isLoading
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 hover:shadow-blue-600/30 active:scale-[0.98]'
                : 'bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Consultar CNPJ</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Suggestions */}
      <div className="mt-4 pt-3.5 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Exemplos rápidos para teste:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SHOWCASE_COMPANIES.map((item) => (
            <button
              key={item.cnpj}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelectPreset(item.cnpj)}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-blue-950/60 border border-slate-700/70 hover:border-blue-600/50 text-xs text-slate-300 hover:text-white transition-all text-left"
            >
              <span className="font-medium text-slate-200 group-hover:text-blue-300">{item.name}</span>
              <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-400">({item.city})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
