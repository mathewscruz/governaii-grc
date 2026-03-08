

# Vincular DocGen ao Gap Analysis + Melhorias de Contexto

## Situação Atual

O DocGen **já funciona** e usa Anthropic Claude corretamente (ANTHROPIC_API_KEY configurada). O fluxo de chat conversacional, geração de documento, preview, export PDF/DOCX e salvamento no sistema estão operacionais.

**Problemas identificados:**
1. O DocGen só é acessível pela página de Documentos — usuários do Gap Analysis não descobrem a funcionalidade
2. Quando aberto, o DocGen não tem contexto sobre qual framework o usuário está trabalhando — começa do zero
3. O `RemediationTab` ainda usa `useEmpresaId()` (race condition residual não corrigida)

## Plano

### A. Adicionar botão DocGen no GapAnalysisFrameworkDetail

Adicionar um botão "Gerar Política" no header da página de detalhe do framework (ao lado dos botões Board e PDF Técnico). O botão abre o DocGenDialog passando contexto do framework.

**Arquivo:** `src/pages/GapAnalysisFrameworkDetail.tsx`
- Importar `DocGenDialog`
- Adicionar state `showDocGen`
- Adicionar botão com ícone `Brain` no `PageHeader.actions`
- Renderizar `<DocGenDialog>` com novas props de contexto

### B. Estender DocGenDialog para aceitar contexto de framework

Adicionar props opcionais ao `DocGenDialog`:
- `frameworkName?: string` — nome do framework (ex: "ISO 27001")
- `frameworkVersion?: string` — versão
- `frameworkId?: string` — para buscar requisitos não conformes

Quando essas props existirem:
- A mensagem inicial do chat muda para mencionar o framework
- O `doc_type_hint` é pré-preenchido
- A edge function recebe `framework_context` com dados dos gaps

**Arquivo:** `src/components/documentos/DocGenDialog.tsx`

### C. Enriquecer o prompt da edge function com dados de gap

Quando `framework_context` é enviado no body, a edge function:
1. Busca os requisitos não conformes do framework para a empresa
2. Inclui essa lista no system prompt para que a IA saiba quais gaps a política precisa endereçar

**Arquivo:** `supabase/functions/docgen-chat/index.ts`

### D. Corrigir `useEmpresaId` residual no RemediationTab

**Arquivo:** `src/components/gap-analysis/RemediationTab.tsx` — trocar `useEmpresaId()` por `useAuth().profile?.empresa_id`

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/documentos/DocGenDialog.tsx` | Adicionar props `frameworkName`, `frameworkVersion`, `frameworkId`; adaptar mensagem inicial e envio |
| `supabase/functions/docgen-chat/index.ts` | Receber `framework_context`, buscar gaps, enriquecer prompt |
| `src/pages/GapAnalysisFrameworkDetail.tsx` | Importar DocGenDialog, adicionar botão e state |
| `src/components/gap-analysis/RemediationTab.tsx` | `useEmpresaId()` → `useAuth()` |

