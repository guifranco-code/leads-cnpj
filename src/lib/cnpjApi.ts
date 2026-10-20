import { CompanyData } from '../types/cnpj.ts';

export function cleanCnpj(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

export function formatCnpj(value: string): string {
  const digits = cleanCnpj(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function isValidCnpj(cnpj: string): boolean {
  const clean = cleanCnpj(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Validate check digits
  let length = 12;
  let numbers = clean.substring(0, length);
  let digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  length = 13;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === Number(digits.charAt(1));
}

// Municipal coordinates fallback for Brazilian states
const BRAZIL_CAPITAL_COORDS: Record<string, { lat: number; lng: number }> = {
  'SP-SAO PAULO': { lat: -23.5505, lng: -46.6333 },
  'RJ-RIO DE JANEIRO': { lat: -22.9068, lng: -43.1729 },
  'MG-BELO HORIZONTE': { lat: -19.9167, lng: -43.9345 },
  'DF-BRASILIA': { lat: -15.7975, lng: -47.8919 },
  'PR-CURITIBA': { lat: -25.4284, lng: -49.2733 },
  'RS-PORTO ALEGRE': { lat: -30.0346, lng: -51.2177 },
  'BA-SALVADOR': { lat: -12.9777, lng: -38.5016 },
  'CE-FORTALEZA': { lat: -3.7172, lng: -38.5433 },
  'PE-RECIFE': { lat: -8.0476, lng: -34.877 },
  'SC-FLORIANOPOLIS': { lat: -27.5954, lng: -48.548 },
  'GO-GOIANIA': { lat: -16.6869, lng: -49.2648 },
  'PA-BELEM': { lat: -1.4558, lng: -48.5039 },
  'AM-MANAUS': { lat: -3.119, lng: -60.0217 },
  'ES-VITORIA': { lat: -20.3155, lng: -40.3128 },
};

// Geocode address via open web standard
export async function geocodeAddress(
  logradouro: string,
  numero: string,
  bairro: string,
  municipio: string,
  uf: string,
  cep: string
): Promise<{ lat: number; lng: number } | null> {
  // Query Nominatim public open geocoding
  try {
    const addressQuery = encodeURIComponent(`${logradouro || ''} ${numero || ''}, ${bairro || ''}, ${municipio}, ${uf}, Brasil`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${addressQuery}&format=json&limit=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RadarCNPJ/1.0',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }
  } catch (e) {
    console.warn('Geocodificação por endereço completo não retornou:', e);
  }

  // City fallback
  try {
    const cityQuery = encodeURIComponent(`${municipio}, ${uf}, Brasil`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityQuery}&format=json&limit=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RadarCNPJ/1.0',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }
  } catch (e) {
    console.warn('Geocodificação por cidade não retornou:', e);
  }

  const key = `${uf?.toUpperCase()}-${municipio?.toUpperCase()}`;
  if (BRAZIL_CAPITAL_COORDS[key]) {
    return BRAZIL_CAPITAL_COORDS[key];
  }

  return { lat: -23.5505, lng: -46.6333 };
}

// Consulta pública de CNPJ padrão da web (BrasilAPI / Dados Públicos Abertos)
export async function queryCompanyByCnpj(inputCnpj: string): Promise<CompanyData> {
  const clean = cleanCnpj(inputCnpj);
  if (clean.length !== 14) {
    throw new Error('O CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  // 1. Chamada direta ao endpoint público padrão da web
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
    if (res.ok) {
      const data = await res.json();
      const coords = await geocodeAddress(
        data.logradouro || '',
        data.numero || '',
        data.bairro || '',
        data.municipio || '',
        data.uf || '',
        data.cep || ''
      );

      return {
        cnpj: formatCnpj(clean),
        razao_social: data.razao_social || data.nome_fantasia || 'Razão Social não informada',
        nome_fantasia: data.nome_fantasia || '',
        situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || 'ATIVA',
        data_inicio_atividade: data.data_inicio_atividade || '',
        cnae_fiscal: String(data.cnae_fiscal || ''),
        cnae_fiscal_descricao: data.cnae_fiscal_descricao || 'Atividade principal',
        cnaes_secundarios: Array.isArray(data.cnaes_secundarios)
          ? data.cnaes_secundarios.map((c: any) => ({
              codigo: c.codigo,
              descricao: c.descricao,
            }))
          : [],
        natureza_juridica: data.natureza_juridica || '',
        capital_social: Number(data.capital_social) || 0,
        logradouro: data.logradouro || '',
        numero: data.numero || 'S/N',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep ? data.cep.replace(/^(\d{5})(\d{3})/, '$1-$2') : '',
        telefone: data.ddd_telefone_1 || data.telefone || '',
        email: data.email || '',
        qsa: Array.isArray(data.qsa)
          ? data.qsa.map((s: any) => ({
              nome_socio: s.nome_socio || s.nome,
              qualificacao_socio: s.qualificacao_socio || s.qualificacao,
              faixa_etaria: s.faixa_etaria,
              data_entrada_sociedade: s.data_entrada_sociedade,
            }))
          : [],
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        source: 'brasilapi',
        fetchedAt: new Date().toISOString(),
      };
    } else if (res.status === 404) {
      throw new Error(`CNPJ ${formatCnpj(clean)} não foi encontrado na base pública da Receita Federal.`);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('não foi encontrado')) {
      throw err;
    }
    console.warn('Tentando fallback público alternativo...');
  }

  // 2. Fallback público alternativo (Minha Receita / Base pública aberta)
  try {
    const resFallback = await fetch(`https://minhareceita.org/${clean}`);
    if (resFallback.ok) {
      const data = await resFallback.json();
      const coords = await geocodeAddress(
        data.logradouro || '',
        data.numero || '',
        data.bairro || '',
        data.municipio || '',
        data.uf || '',
        data.cep || ''
      );

      return {
        cnpj: formatCnpj(clean),
        razao_social: data.razao_social || data.nome_fantasia || 'Razão Social não informada',
        nome_fantasia: data.nome_fantasia || '',
        situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
        data_inicio_atividade: data.data_inicio_atividade || '',
        cnae_fiscal: String(data.cnae_fiscal || ''),
        cnae_fiscal_descricao: data.cnae_fiscal_descricao || 'Atividade principal',
        capital_social: Number(data.capital_social) || 0,
        logradouro: data.logradouro || '',
        numero: data.numero || 'S/N',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        telefone: data.ddd_telefone_1 || '',
        email: data.email || '',
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        source: 'brasilapi',
        fetchedAt: new Date().toISOString(),
      };
    }
  } catch (e2) {
    console.warn('Falha no fallback:', e2);
  }

  throw new Error(`Não foi possível consultar o CNPJ ${formatCnpj(clean)}. Verifique o número digitado ou sua conexão.`);
}

// Exemplos de demonstração para teste com 1 clique
export const SHOWCASE_COMPANIES = [
  {
    name: 'Nubank (Nu Pagamentos)',
    cnpj: '18.236.120/0001-58',
    city: 'São Paulo, SP',
    cnae: 'Serviços Financeiros / Bancos Virtuais',
  },
  {
    name: 'Petrobras S.A.',
    cnpj: '33.000.167/0001-01',
    city: 'Rio de Janeiro, RJ',
    cnae: 'Extração de Petróleo e Gás',
  },
  {
    name: 'Magazine Luiza',
    cnpj: '47.960.950/0001-21',
    city: 'Franca, SP',
    cnae: 'Comércio Varejista Multicanal',
  },
  {
    name: 'Mercado Livre Brasil',
    cnpj: '03.007.331/0001-41',
    city: 'Osasco, SP',
    cnae: 'E-commerce e Intermediação',
  },
  {
    name: 'TOTVS S.A.',
    cnpj: '53.113.791/0001-22',
    city: 'São Paulo, SP',
    cnae: 'Desenvolvimento de Softwares',
  },
  {
    name: 'WEG Equipamentos',
    cnpj: '84.583.872/0001-36',
    city: 'Jaraguá do Sul, SC',
    cnae: 'Motores, Geradores e Energia',
  },
];
