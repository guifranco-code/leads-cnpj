import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CompanyData, RadiusLead, SearchHistoryItem, SupabaseSettings } from '../types/cnpj.ts';

const SETTINGS_KEY = 'radar_cnpj_supabase_config_v1';
const LOCAL_COMPANIES_KEY = 'radar_cnpj_local_companies';
const LOCAL_HISTORY_KEY = 'radar_cnpj_local_history';
const LOCAL_LEADS_KEY = 'radar_cnpj_local_leads';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getStoredSupabaseSettings(): SupabaseSettings {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        connected: Boolean(parsed.connected),
        lastTestMessage: parsed.lastTestMessage,
        syncEnabled: parsed.syncEnabled ?? true,
      };
    }
  } catch (e) {
    console.warn('Falha ao ler configurações do Supabase:', e);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    connected: false,
    syncEnabled: true,
  };
}

export function saveStoredSupabaseSettings(settings: SupabaseSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    cachedClient = null; // Invalidate client cache on save
  } catch (e) {
    console.error('Erro ao salvar configurações do Supabase:', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseSettings();
  if (!config.url || !config.anonKey) {
    return null;
  }

  // Validate format
  if (!config.url.startsWith('https://') && !config.url.startsWith('http://')) {
    return null;
  }

  if (cachedClient && currentUrl === config.url && currentKey === config.anonKey) {
    return cachedClient;
  }

  try {
    currentUrl = config.url;
    currentKey = config.anonKey;
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Falha ao instanciar cliente Supabase:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Chave Anon são obrigatórios.' };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // Check if table companies exists or query version
    const { error } = await testClient.from('companies').select('cnpj').limit(1);

    if (error) {
      // If table doesn't exist yet, it is still a valid Supabase connection, but needs the SQL schema
      if (error.code === '42P01' || error.message?.includes('relation "public.companies" does not exist')) {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! Execute o script SQL para criar as tabelas.',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message} (Código: ${error.code || 'Desconhecido'})`,
      };
    }

    return {
      success: true,
      message: 'Conexão e tabelas verificadas com sucesso no Supabase!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Erro de rede ou formato de URL inválido: ${errorMsg}`,
    };
  }
}

// Persist Company Data
export async function persistCompany(company: CompanyData): Promise<{ syncedToSupabase: boolean }> {
  // Always update local cache
  try {
    const localRaw = localStorage.getItem(LOCAL_COMPANIES_KEY);
    const list: CompanyData[] = localRaw ? JSON.parse(localRaw) : [];
    const filtered = list.filter((item) => item.cnpj !== company.cnpj);
    filtered.unshift(company);
    localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (err) {
    console.warn('Erro ao salvar empresa localmente:', err);
  }

  const client = getSupabaseClient();
  const settings = getStoredSupabaseSettings();
  if (!client || !settings.syncEnabled) {
    return { syncedToSupabase: false };
  }

  try {
    const { error } = await client.from('companies').upsert(
      {
        cnpj: company.cnpj,
        razao_social: company.razao_social,
        nome_fantasia: company.nome_fantasia || null,
        situacao_cadastral: company.situacao_cadastral,
        cnae_fiscal: company.cnae_fiscal,
        cnae_descricao: company.cnae_fiscal_descricao,
        capital_social: company.capital_social || 0,
        logradouro: company.logradouro,
        numero: company.numero,
        bairro: company.bairro,
        municipio: company.municipio,
        uf: company.uf,
        cep: company.cep,
        telefone: company.telefone || null,
        email: company.email || null,
        latitude: company.latitude,
        longitude: company.longitude,
        source: company.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cnpj' }
    );

    if (error) {
      console.warn('Supabase upsert company warning:', error.message);
      return { syncedToSupabase: false };
    }
    return { syncedToSupabase: true };
  } catch (err) {
    console.error('Falha ao persistir empresa no Supabase:', err);
    return { syncedToSupabase: false };
  }
}

// Persist Search Event
export async function persistRadiusSearch(
  companyCnpj: string,
  radiusMeters: number,
  categoryFilter: string,
  leadsCount: number
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('radius_searches').insert({
      company_cnpj: companyCnpj,
      radius_meters: radiusMeters,
      category_filter: categoryFilter,
      leads_count: leadsCount,
    });
  } catch (err) {
    console.warn('Erro ao registrar histórico no Supabase:', err);
  }
}

// Persist Saved Lead
export async function persistRadiusLead(
  companyCnpj: string,
  lead: RadiusLead
): Promise<{ success: boolean }> {
  // Save local
  try {
    const raw = localStorage.getItem(LOCAL_LEADS_KEY);
    const leads: (RadiusLead & { companyCnpj: string })[] = raw ? JSON.parse(raw) : [];
    leads.unshift({ ...lead, companyCnpj });
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads.slice(0, 100)));
  } catch (err) {
    console.warn('Erro ao salvar lead localmente:', err);
  }

  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const { error } = await client.from('radius_leads').insert({
      source_cnpj: companyCnpj,
      name: lead.name,
      address: lead.address,
      category: lead.category,
      distance_meters: Math.round(lead.distanceMeters),
      rating: lead.rating || null,
      latitude: lead.lat,
      longitude: lead.lng,
      place_id: lead.placeId || null,
    });

    if (error) {
      console.warn('Erro ao salvar lead no Supabase:', error.message);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error('Falha ao salvar lead no Supabase:', err);
    return { success: false };
  }
}

// Get Search History
export function getLocalSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalSearchHistory(item: SearchHistoryItem): void {
  try {
    const list = getLocalSearchHistory();
    const updated = [item, ...list.filter((x) => x.cnpj !== item.cnpj)].slice(0, 20);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar histórico local:', err);
  }
}
