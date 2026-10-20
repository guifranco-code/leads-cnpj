import { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import {
  Building2,
  Compass,
  Database,
  History,
  Key,
  ShieldCheck,
  Sparkles,
  MapPin,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search
} from 'lucide-react';
import { CompanyData, RadiusLead, SearchHistoryItem, SupabaseSettings } from './types/cnpj.ts';
import { queryCompanyByCnpj } from './lib/cnpjApi.ts';
import {
  getStoredSupabaseSettings,
  persistCompany,
  persistRadiusLead,
  persistRadiusSearch,
  getLocalSearchHistory,
  addLocalSearchHistory,
} from './lib/supabase.ts';
import { CompanySearch } from './components/CompanySearch.tsx';
import { CompanyCard } from './components/CompanyCard.tsx';
import { RadiusMap } from './components/RadiusMap.tsx';
import { NearbyPlacesList } from './components/NearbyPlacesList.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyCtZ_6Hae23S4pC_5UugMJcJkBFF1MFgBg';

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(2000);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [leads, setLeads] = useState<RadiusLead[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const [supabaseSettings, setSupabaseSettings] = useState<SupabaseSettings>(getStoredSupabaseSettings());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Listen to Google Maps quota exceeded event
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Load initial search history
  useEffect(() => {
    setHistory(getLocalSearchHistory());
  }, []);

  // Show auto-dismissing toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Perform CNPJ lookup
  const handleSearchCompany = async (cnpjToQuery: string) => {
    setIsLoadingCompany(true);
    setToastMessage(null);

    try {
      const data = await queryCompanyByCnpj(cnpjToQuery);
      setCompany(data);
      setLeads([]);

      // Persist to local & Supabase
      const persistRes = await persistCompany(data);

      // Add to search history
      const historyItem: SearchHistoryItem = {
        id: `${data.cnpj}-${Date.now()}`,
        cnpj: data.cnpj,
        companyName: data.razao_social,
        cnaeDescription: data.cnae_fiscal_descricao,
        municipio: data.municipio,
        uf: data.uf,
        searchedAt: new Date().toISOString(),
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters,
      };
      addLocalSearchHistory(historyItem);
      setHistory(getLocalSearchHistory());

      if (persistRes.syncedToSupabase) {
        showToast(`Empresa encontrada e sincronizada com o Supabase com sucesso!`, 'success');
      } else {
        showToast(`Empresa localizada via ${data.source.toUpperCase()}!`, 'success');
      }
    } catch (err: any) {
      console.error('Falha na busca:', err);
      showToast(err.message || 'Erro ao consultar CNPJ. Verifique o número digitado.', 'error');
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Save single lead
  const handleSaveLead = async (lead: RadiusLead) => {
    if (!company) return;

    try {
      const res = await persistRadiusLead(company.cnpj, lead);
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, savedToSupabase: true } : l))
      );
      if (res.success) {
        showToast(`Lead "${lead.name}" salvo no Supabase!`, 'success');
      } else {
        showToast(`Lead "${lead.name}" armazenado localmente!`, 'info');
      }
    } catch {
      showToast('Falha ao salvar lead.', 'error');
    }
  };

  // Batch save all leads
  const handleSaveAllLeads = async () => {
    if (!company || leads.length === 0) return;
    setIsSavingAll(true);

    try {
      let savedCount = 0;
      for (const lead of leads) {
        await persistRadiusLead(company.cnpj, lead);
        savedCount++;
      }
      setLeads((prev) => prev.map((l) => ({ ...l, savedToSupabase: true })));

      await persistRadiusSearch(company.cnpj, radiusMeters, selectedCategory, leads.length);

      showToast(
        `${savedCount} empresas do raio foram salvas com sucesso${
          supabaseSettings.connected ? ' no Supabase' : ' localmente'
        }!`,
        'success'
      );
    } catch {
      showToast('Erro ao salvar lote de leads.', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleFocusMap = () => {
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem('radar_cnpj_local_history');
    setHistory([]);
    showToast('Histórico limpo.', 'info');
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="pt-BR" region="BR">
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Tier 1 Quota Exceeded Sticky Notice (Mandatory by skill) */}
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Global Navigation Header */}
        <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/50">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-base lg:text-lg tracking-tight">
                  Radar CNPJ
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800/60">
                  Maps & Raio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Consulta pública de CNPJ com mapeamento em raio e persistência no Supabase
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Supabase Status Button */}
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                supabaseSettings.connected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
              title="Configurar Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">
                {supabaseSettings.connected ? 'Supabase Conectado' : 'Conectar Supabase'}
              </span>
              <span className="md:hidden">Supabase</span>
            </button>

            {/* Base Pública Oficial (Padrão Aberto - Sem Chave) */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Base Pública Oficial • Sem Chave</span>
            </div>

            {/* History Drawer Button */}
            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all relative"
              title="Histórico de consultas"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Histórico</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Toast Alert Message */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div
              className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-950 border-rose-700 text-rose-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* CNPJ Search Section */}
          <CompanySearch
            onSearch={handleSearchCompany}
            isLoading={isLoadingCompany}
            currentCnpj={company?.cnpj}
          />

          {/* Active Company & Map View */}
          {company ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Company Card & Nearby Leads List */}
                <div className="lg:col-span-5 space-y-6 flex flex-col">
                  <CompanyCard
                    company={company}
                    onFocusMap={handleFocusMap}
                    syncedToSupabase={supabaseSettings.connected}
                  />

                  <NearbyPlacesList
                    leads={leads}
                    onSaveLead={handleSaveLead}
                    onSaveAllLeads={handleSaveAllLeads}
                    isSavingAll={isSavingAll}
                    radiusMeters={radiusMeters}
                    companyName={company.razao_social}
                  />
                </div>

                {/* Right Column: Interactive Google Maps with Radius */}
                <div ref={mapContainerRef} className="lg:col-span-7 h-[700px] sticky top-20">
                  <RadiusMap
                    company={company}
                    radiusMeters={radiusMeters}
                    onRadiusChange={setRadiusMeters}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    leads={leads}
                    onLeadsFound={setLeads}
                    onSaveLead={handleSaveLead}
                    isSearchingLeads={isSearchingLeads}
                    setIsSearchingLeads={setIsSearchingLeads}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Hero Guide */
            <div className="py-12 sm:py-16 text-center space-y-8 max-w-3xl mx-auto">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Inteligência de Mercado & Prospecção Georreferenciada</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Descubra empresas e mapeie ecossistemas em raio no Google Maps
                </h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Digite um CNPJ para obter dados cadastrais oficiais da Receita Federal e visualizar
                  concorrentes, clientes e parceiros dentro de um raio geográfico personalizado.
                </p>
              </div>

              {/* 4 Steps Showcase Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-800/80">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-white">Busca por CNPJ</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Consulte qualquer CNPJ com máscara automática e validação instantânea de dígitos verificadores.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-800/80">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-white">Dados Oficiais</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Razão Social, CNAE principal, Capital Social, Sócios (QSA) e endereço completo da base pública.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-800/80">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-white">Raio no Maps</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ajuste o raio de 500m até 20km e filtre por segmento, bancos, transportes, farmácias ou alimentação.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-800/80">
                    4
                  </div>
                  <h4 className="font-bold text-sm text-white">Banco Supabase</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Persista empresas consultadas e leads salvos diretamente no seu banco de dados Supabase na nuvem.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Global Modals & Drawers */}
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          settings={supabaseSettings}
          onSettingsUpdated={setSupabaseSettings}
        />

        <HistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          history={history}
          onSelectCnpj={handleSearchCompany}
          onClearHistory={handleClearHistory}
        />
      </div>
    </APIProvider>
  );
}
