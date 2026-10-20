import { useState } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Phone,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Compass,
  Database,
  ExternalLink
} from 'lucide-react';
import { CompanyData } from '../types/cnpj.ts';

interface CompanyCardProps {
  company: CompanyData;
  onFocusMap?: () => void;
  syncedToSupabase?: boolean;
}

export function CompanyCard({ company, onFocusMap, syncedToSupabase }: CompanyCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQsa, setShowQsa] = useState(false);
  const [showCnaes, setShowCnaes] = useState(false);

  const handleCopyCnpj = () => {
    navigator.clipboard.writeText(company.cnpj);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedCapital = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(company.capital_social || 0);

  const isAtiva = company.situacao_cadastral.toUpperCase().includes('ATIVA');

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-700/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {company.razao_social}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isAtiva
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
              }`}
            >
              {company.situacao_cadastral}
            </span>
            {syncedToSupabase && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <Database className="w-3 h-3" /> Supabase
              </span>
            )}
          </div>
          {company.nome_fantasia && (
            <p className="text-sm font-medium text-blue-400">
              Nome Fantasia: <span className="text-slate-200">{company.nome_fantasia}</span>
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="font-mono text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              {company.cnpj}
            </span>
            <button
              onClick={handleCopyCnpj}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Copiar CNPJ"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[11px] text-slate-500">
              Fonte: Base Pública Oficial
            </span>
          </div>
        </div>

        {onFocusMap && company.latitude && company.longitude && (
          <button
            onClick={onFocusMap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-xs font-medium transition-all shrink-0 self-start"
          >
            <Compass className="w-3.5 h-3.5" />
            Centralizar no Mapa
          </button>
        )}
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Atividade Principal */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>CNAE Principal</span>
          </div>
          <p className="text-xs font-mono text-blue-300 font-medium">{company.cnae_fiscal}</p>
          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5" title={company.cnae_fiscal_descricao}>
            {company.cnae_fiscal_descricao}
          </p>
        </div>

        {/* Capital Social */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Capital Social</span>
          </div>
          <p className="text-sm font-semibold text-white font-mono">{formattedCapital}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {company.natureza_juridica || 'Natureza Jurídica não informada'}
          </p>
        </div>

        {/* Data de Fundação */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Início das Atividades</span>
          </div>
          <p className="text-sm font-medium text-white">
            {company.data_inicio_atividade || 'Não informada'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastrado na Receita Federal
          </p>
        </div>
      </div>

      {/* Endereço & Contato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        <div className="bg-slate-900/50 rounded-xl p-3.5 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-900/60 shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5 min-w-0">
            <span className="font-semibold text-slate-300 block">Endereço da Sede</span>
            <p className="text-slate-200">
              {company.logradouro}, {company.numero} {company.complemento ? `(${company.complemento})` : ''}
            </p>
            <p className="text-slate-400">
              {company.bairro} — {company.municipio}/{company.uf}
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-slate-400">
              <span>CEP: {company.cep}</span>
              {company.latitude && company.longitude && (
                <span className="text-emerald-400">
                  • Coord: {company.latitude.toFixed(4)}, {company.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-3.5 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-900/60 shrink-0 mt-0.5">
            <Phone className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1 min-w-0 flex-1">
            <span className="font-semibold text-slate-300 block">Canais de Contato</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{company.telefone || 'Telefone não divulgado'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{company.email || 'E-mail não divulgado'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections: QSA (Sócios) & CNAEs secundários */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        {company.qsa && company.qsa.length > 0 && (
          <button
            type="button"
            onClick={() => setShowQsa(!showQsa)}
            className="flex-1 inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Sócios e Administradores ({company.qsa.length})
            </span>
            {showQsa ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}

        {company.cnaes_secundarios && company.cnaes_secundarios.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCnaes(!showCnaes)}
            className="flex-1 inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              CNAEs Secundários ({company.cnaes_secundarios.length})
            </span>
            {showCnaes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* QSA List */}
      {showQsa && company.qsa && (
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quadro Societário</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {company.qsa.map((socio, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <p className="font-semibold text-slate-200">{socio.nome_socio}</p>
                <p className="text-blue-400 text-[11px]">{socio.qualificacao_socio}</p>
                {socio.faixa_etaria && (
                  <p className="text-slate-500 text-[10px]">Faixa etária: {socio.faixa_etaria}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CNAEs Secundários List */}
      {showCnaes && company.cnaes_secundarios && (
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atividades Secundárias</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {company.cnaes_secundarios.map((cnae, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="font-mono text-blue-400 font-semibold">{cnae.codigo}</span>
                <span className="text-slate-300 ml-2">{cnae.descricao}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
