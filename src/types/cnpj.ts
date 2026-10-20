export interface Socio {
  nome_socio: string;
  qualificacao_socio: string;
  faixa_etaria?: string;
  data_entrada_sociedade?: string;
}

export interface CnaeSecundario {
  codigo: number | string;
  descricao: string;
}

export interface CompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  cnaes_secundarios?: CnaeSecundario[];
  natureza_juridica?: string;
  capital_social: number;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone?: string;
  email?: string;
  qsa?: Socio[];
  latitude: number | null;
  longitude: number | null;
  source: 'apibrasil' | 'brasilapi' | 'receitaws' | 'manual';
  fetchedAt: string;
}

export interface RadiusLead {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  category: string;
  rating?: number;
  userRatingsTotal?: number;
  isOpen?: boolean;
  placeId?: string;
  savedToSupabase?: boolean;
}

export interface SearchHistoryItem {
  id: string;
  cnpj: string;
  companyName: string;
  cnaeDescription?: string;
  municipio: string;
  uf: string;
  searchedAt: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
}

export interface SupabaseSettings {
  url: string;
  anonKey: string;
  connected: boolean;
  lastTestMessage?: string;
  syncEnabled: boolean;
}
