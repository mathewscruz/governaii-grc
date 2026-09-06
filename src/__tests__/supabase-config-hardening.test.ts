import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20260906010000_supabase_config_hardening.sql', 'utf8');
const riskMigration = readFileSync('supabase/migrations/20260904120000_riscos_governanca_integridade.sql', 'utf8');

describe('hosted Supabase configuration hardening', () => {
  it('keeps the risk matrix helper internal without changing its implementation', () => {
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.risco_avaliar_na_matriz\(uuid, smallint, smallint\)\s+FROM PUBLIC, anon, authenticated/);
    expect(migration).not.toMatch(/CREATE OR REPLACE FUNCTION|GRANT EXECUTE/);
    for (const caller of ['tg_risco_historico_calcular', 'riscos_recalcular_empresa']) {
      const body = riskMigration.split(`CREATE OR REPLACE FUNCTION public.${caller}(`)[1].split('$$;')[0];
      expect(body).toContain('SECURITY DEFINER');
      expect(body).toContain('public.risco_avaliar_na_matriz(');
    }
  });

  it('adds MFA as a restrictive authenticated guard without replacing tenant policies', () => {
    expect(migration).toContain('AS RESTRICTIVE FOR ALL TO authenticated');
    expect(migration).toContain('USING (public.has_valid_mfa_session()) WITH CHECK (public.has_valid_mfa_session())');
    expect(migration).not.toMatch(/DROP POLICY|DISABLE ROW LEVEL SECURITY/);
    for (const table of ['contratos_templates', 'dados_solicitacao_anexos', 'dados_solicitacao_eventos', 'privacidade_auditoria', 'privacidade_avaliacoes', 'privacidade_consentimentos', 'privacidade_incidente_detalhes', 'privacidade_portais', 'privacidade_retencoes', 'privacidade_terceiros']) {
      expect(migration).toContain(`'${table}'`);
    }
  });

  it('preserves bootstrap and public flows', () => {
    expect(migration).not.toMatch(/ON public\.(profiles|mfa_codes|mfa_sessions)|ALTER ROLE|DELETE FROM|TRUNCATE|cron\.schedule/);
    expect(migration).not.toMatch(/REVOKE.*(get_empresa_publica|portal_privacidade_publico|get_canal_config_publica)/);
  });

  it('enforces existing upload caps without deleting files or widening restrictions', () => {
    expect(migration).toContain('LEAST(COALESCE(file_size_limit, 5242880), 5242880)');
    expect(migration).toContain('LEAST(COALESCE(file_size_limit, 2097152), 2097152)');
    expect(migration).toContain('COALESCE(allowed_mime_types, ARRAY[');
    expect(migration).not.toContain('UPDATE storage.objects');
    expect(migration).not.toMatch(/public\s*=\s*true/);
  });
});
