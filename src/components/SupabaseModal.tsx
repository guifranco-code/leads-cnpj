import { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Loader2,
  Save,
  HelpCircle
} from 'lucide-react';
import { SupabaseSettings } from '../types/cnpj.ts';
import { testSupabaseConnection, saveStoredSupabaseSettings } from '../lib/supabase.ts';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchema.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SupabaseSettings;
  onSettingsUpdated: (updated: SupabaseSettings) => void;
}

export function SupabaseModal({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}: SupabaseModalProps) {
  const [url, setUrl] = useState(settings.url || '');
  const [anonKey, setAnonKey] = useState(settings.anonKey || '');
  const [syncEnabled, setSyncEnabled] = useState(settings.syncEnabled ?? true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection(url.trim(), anonKey.trim());
      setTestResult(result);
      if (result.success) {
        const updated: SupabaseSettings = {
          url: url.trim(),
          anonKey: anonKey.trim(),
          connected: true,
          lastTestMessage: result.message,
          syncEnabled,
        };
        saveStoredSupabaseSettings(updated);
        onSettingsUpdated(updated);
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Falha ao conectar com o Supabase.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const updated: SupabaseSettings = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      connected: testResult?.success || settings.connected,
      syncEnabled,
    };
    saveStoredSupabaseSettings(updated);
    onSettingsUpdated(updated);
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Configurar Banco de Dados Supabase</h3>
              <p className="text-xs text-slate-400">Persistência em nuvem para empresas, buscas e leads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Badge */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              settings.connected
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {settings.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>
                {settings.connected
                  ? 'Supabase conectado e pronto para sincronizar.'
                  : 'Supabase não conectado. Os dados estão sendo salvos no armazenamento local do navegador.'}
              </span>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] underline font-medium hover:text-white shrink-0 ml-2"
            >
              <span>Abrir Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project URL (URL do Projeto Supabase)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Disponível no painel do Supabase em Project Settings → API → Project URL
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Anon Public Key (Chave Pública Anon)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Disponível em Project Settings → API → Project API Keys (anon public)
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="syncToggle"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
              />
              <label htmlFor="syncToggle" className="text-xs text-slate-300 cursor-pointer">
                Sincronizar automaticamente consultas e leads com as tabelas do Supabase
              </label>
            </div>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-800 text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.success ? 'Sucesso!' : 'Atenção'}</p>
                <p className="text-[11px] mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* SQL Schema helper accordion */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
              >
                <Code2 className="w-4 h-4" />
                <span>Script SQL de criação das tabelas ({showSql ? 'Ocultar' : 'Exibir'})</span>
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            {showSql && (
              <div className="mt-2.5 bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-300 max-h-48">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={!url || !anonKey || isTesting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Testar Conexão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Configuração</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
