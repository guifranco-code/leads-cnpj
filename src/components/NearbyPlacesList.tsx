import { useState } from 'react';
import {
  Building2,
  Navigation,
  Star,
  Download,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Database
} from 'lucide-react';
import { RadiusLead } from '../types/cnpj.ts';

interface NearbyPlacesListProps {
  leads: RadiusLead[];
  onSaveLead: (lead: RadiusLead) => void;
  onSaveAllLeads: () => void;
  isSavingAll: boolean;
  radiusMeters: number;
  companyName: string;
}

export function NearbyPlacesList({
  leads,
  onSaveLead,
  onSaveAllLeads,
  isSavingAll,
  radiusMeters,
  companyName,
}: NearbyPlacesListProps) {
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedLeads = leads
    .filter((l) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        l.name.toLowerCase().includes(term) ||
        l.address.toLowerCase().includes(term) ||
        l.category.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distanceMeters - b.distanceMeters;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return a.name.localeCompare(b.name);
    });

  const exportCSV = () => {
    if (leads.length === 0) return;
    const header = ['Nome', 'Categoria', 'Distancia_Metros', 'Endereco', 'Avaliacao', 'Latitude', 'Longitude'];
    const rows = leads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.category.replace(/"/g, '""')}"`,
      l.distanceMeters,
      `"${l.address.replace(/"/g, '""')}"`,
      l.rating || '',
      l.lat,
      l.lng,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_raio_${radiusMeters}m_${companyName.slice(0, 15).replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (leads.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leads, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `leads_raio_${radiusMeters}m_${companyName.slice(0, 15).replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col h-full max-h-[700px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>Empresas no Raio ({leads.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estabelecimentos em até {(radiusMeters / 1000).toFixed(1)} km do CNPJ consultado
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportCSV}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Exportar como planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={exportJSON}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Exportar como JSON"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>
          <button
            type="button"
            onClick={onSaveAllLeads}
            disabled={leads.length === 0 || isSavingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/40 transition-all disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            {isSavingAll ? 'Salvando...' : 'Salvar Todos no Supabase'}
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex items-center gap-2 py-3 border-b border-slate-700/60">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome ou categoria..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/90 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 px-2 py-1.5 focus:outline-none"
          >
            <option value="distance">Mais próximos</option>
            <option value="rating">Melhor avaliação</option>
            <option value="name">Ordem alfabética</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
        {filteredAndSortedLeads.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhuma empresa encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredAndSortedLeads.map((lead) => {
            const distanceStr =
              lead.distanceMeters >= 1000
                ? `${(lead.distanceMeters / 1000).toFixed(2)} km`
                : `${lead.distanceMeters} m`;

            return (
              <div
                key={lead.id}
                className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-white truncate max-w-xs group-hover:text-blue-300 transition-colors">
                      {lead.name}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {lead.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1" title={lead.address}>
                    {lead.address}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] pt-0.5">
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-400" />
                      {distanceStr}
                    </span>

                    {lead.rating && (
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {lead.rating}
                      </span>
                    )}

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${lead.name} ${lead.address}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-blue-400 flex items-center gap-0.5 ml-auto text-[10px] transition-colors"
                    >
                      <span>Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSaveLead(lead)}
                  disabled={lead.savedToSupabase}
                  className={`p-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    lead.savedToSupabase
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 cursor-default'
                      : 'bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700 hover:border-blue-500/50'
                  }`}
                  title={lead.savedToSupabase ? 'Salvo no Supabase' : 'Salvar no Supabase'}
                >
                  {lead.savedToSupabase ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
