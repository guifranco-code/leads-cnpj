export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- RADAR CNPJ & RAIO NO GOOGLE MAPS - SCRIPT SQL COMPLETO (COMPATÍVEL SUPABASE)
-- Cole este script no SQL Editor do seu projeto Supabase:
-- https://app.supabase.com/project/_/sql
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA: public.companies (Empresas Consultadas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  situacao_cadastral TEXT,
  cnae_fiscal TEXT,
  cnae_descricao TEXT,
  capital_social NUMERIC DEFAULT 0,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  municipio TEXT,
  uf VARCHAR(2),
  cep VARCHAR(10),
  telefone TEXT,
  email TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source TEXT DEFAULT 'brasilapi',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de busca rápida
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_cidade_uf ON public.companies(municipio, uf);
CREATE INDEX IF NOT EXISTS idx_companies_cnae ON public.companies(cnae_fiscal);

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. TABELA: public.radius_searches (Histórico de Buscas por Raio)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.radius_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_cnpj VARCHAR(18) REFERENCES public.companies(cnpj) ON DELETE CASCADE,
  radius_meters INTEGER NOT NULL,
  category_filter TEXT DEFAULT 'all',
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radius_searches_cnpj ON public.radius_searches(company_cnpj);

-- ==============================================================================
-- 4. TABELA: public.radius_leads (Empresas e Leads Encontrados no Raio)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.radius_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_cnpj VARCHAR(18) REFERENCES public.companies(cnpj) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  category TEXT,
  distance_meters NUMERIC,
  rating NUMERIC,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  place_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radius_leads_source_cnpj ON public.radius_leads(source_cnpj);
CREATE INDEX IF NOT EXISTS idx_radius_leads_distance ON public.radius_leads(distance_meters);

-- ==============================================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS DO USUÁRIO
-- ==============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radius_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radius_leads ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. POLÍTICAS DE ACESSO (RLS POLICIES) PARA AS TABELAS
-- ==============================================================================

-- Políticas para 'companies'
DROP POLICY IF EXISTS "Permitir leitura de empresas" ON public.companies;
CREATE POLICY "Permitir leitura de empresas"
  ON public.companies
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao e atualizacao de empresas" ON public.companies;
CREATE POLICY "Permitir insercao e atualizacao de empresas"
  ON public.companies
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para 'radius_searches'
DROP POLICY IF EXISTS "Permitir leitura de buscas em raio" ON public.radius_searches;
CREATE POLICY "Permitir leitura de buscas em raio"
  ON public.radius_searches
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Permitir criacao de buscas em raio" ON public.radius_searches;
CREATE POLICY "Permitir criacao de buscas em raio"
  ON public.radius_searches
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para 'radius_leads'
DROP POLICY IF EXISTS "Permitir leitura de leads do raio" ON public.radius_leads;
CREATE POLICY "Permitir leitura de leads do raio"
  ON public.radius_leads
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento de leads do raio" ON public.radius_leads;
CREATE POLICY "Permitir gerenciamento de leads do raio"
  ON public.radius_leads
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 7. (OPCIONAL) CRIAÇÃO DO BUCKET NO STORAGE (SEM ALTER TABLE EM OBJECTS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('radar-cnpj-exports', 'radar-cnpj-exports', true)
ON CONFLICT (id) DO UPDATE SET public = true;
`;
