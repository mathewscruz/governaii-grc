

# Plano: Padronizar visual e configuração de todos os 21 frameworks

## Diagnóstico

Após analisar o banco de dados e o código, identifiquei as seguintes inconsistências:

### 1. Configurações de Framework (`framework-configs.ts`)
- Apenas **ISO 27001** e **NIST CSF** possuem configurações completas (com `sections` e `domains`)
- Os outros 19 frameworks usam configs genéricas criadas dinamicamente sem `sections`/`domains`, resultando em dashboards sem os cards de domínio/seção que a ISO 27001 tem
- **CIS Controls** está configurado como `scale_0_5` mas deveria ser `percentage` (é um framework de controles, não de maturidade NIST)

### 2. Score e Cálculo
- NIST CSF usa escala 0-5 (correto — é maturidade)
- Todos os demais deveriam usar percentual (conforme/parcial/não conforme)
- A lógica de cálculo no `useFrameworkScore.tsx` está correta — o problema é apenas o config

### 3. Onboarding (`FrameworkOnboarding.tsx`)
- Apenas ISO 27001, NIST e LGPD possuem conteúdo específico de onboarding
- Os outros 18 frameworks caem no conteúdo genérico

### 4. Estrutura de dados real no banco

| Framework | Requisitos | Categorias | Observação |
|-----------|-----------|------------|------------|
| ISO/IEC 27001 | 117 | 11 | Tem seções SGSI + Anexo A com 4 domínios |
| NIST CSF | 116 | 22 | 6 pilares (GV, ID, PR, DE, RS, RC) |
| PCI DSS | 100 | 9 | 12 requisitos agrupados em 9 categorias |
| CIS Controls | 100 | 9 | 18 controles em categorias |
| HIPAA | 100 | 8 | Administrative/Physical/Technical safeguards |
| GDPR | 99 | 11 | Capítulos I-XI |
| SOC 2 | 74 | 13 | TSC (Security, Availability, etc.) |
| LGPD | 65 | 9 | Artigos agrupados por tema |
| ISO 9001 | 50 | 7 | Cláusulas 4-10 |
| ISO 27701 | 49 | 24 | Extensão ISO 27001 |
| NIS2 | 45 | 9 | Artigos da diretiva |
| ISO 14001 | 45 | 8 | Cláusulas PDCA |
| ISO 37301 | 40 | 8 | Compliance management |
| COBIT | 40 | 5 | Domínios COBIT |
| ISO 20000 | 40 | 9 | Service management |
| ITIL | 34 | 3 | Práticas ITIL |
| SOX | 30 | 4 | Controles financeiros |
| ISO 31000 | 22 | 3 | Gestão de riscos |
| CCPA | 20 | 7 | Privacidade consumidor |
| COSO ERM | 20 | 5 | Componentes ERM |
| COSO IC | 17 | 5 | Controles internos |

## Mudanças planejadas

### Arquivo 1: `src/lib/framework-configs.ts`

Adicionar configurações específicas com `sections` e/ou `domains` para os frameworks principais:

- **PCI DSS**: sections por domínio (Network Security, Data Protection, etc.) + `scoreLabels` específicos
- **SOC 2**: sections por Trust Services Criteria (Security, Availability, Confidentiality, Privacy, Processing Integrity)
- **LGPD**: sections por capítulo (Disposições, Tratamento, Direitos, Sanções, etc.)
- **GDPR**: sections por capítulo (Principles, Rights, Controller, Transfers, etc.)
- **HIPAA**: sections por safeguard type (Administrative, Physical, Technical)
- **CIS Controls**: corrigir de `scale_0_5` para `percentage`
- **COBIT**: sections por domínio (EDM, APO, BAI, DSS, MEA)
- **SOX**: sections por seção (302, 404, etc.)
- **NIS2**: sections por artigo
- **ISOs de gestão** (9001, 14001, 37301, 20000): sections por cláusula PDCA

Manter `scoreLabels` consistentes:
- Frameworks de segurança/compliance: Conforme/Parcialmente/Em Implementação/Não Conforme/Crítico
- NIST CSF: manter escala 0-5 (único)

### Arquivo 2: `src/components/gap-analysis/FrameworkOnboarding.tsx`

Adicionar conteúdo de onboarding específico para:
- PCI DSS, SOC 2, GDPR, HIPAA, COBIT, SOX, NIS2, CIS Controls, ISO 27701

Cada um com: `description`, `timeEstimate`, `steps[]`, `quickTips[]`, `audience`, `benefits[]`.

### Arquivo 3: `src/pages/GapAnalysisFrameworkDetail.tsx`

Adicionar mais descrições no `FRAMEWORK_DESCRIPTIONS` para cobrir todos os 21 frameworks.

### Arquivo 4: `src/components/gap-analysis/GenericScoreDashboard.tsx`

Ajustar o label "Aderência por Domínio do Anexo A" para ser dinâmico baseado no framework (ex: "Trust Services Criteria" para SOC 2, "Capítulos" para LGPD).

## Impacto

- Todos os 21 frameworks terão o mesmo nível de detalhamento visual
- O cálculo de score permanece inalterado (já está correto), apenas os configs alimentam sections/domains para exibição
- Nenhuma alteração de banco de dados necessária

