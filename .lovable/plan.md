

# Plano: Transicoes Suaves, Varredura de Textos e Integrações Enriquecidas

## 1) Transicao mais suave entre telas

**Problema**: `PageTransition.tsx` usa `animate-fade-in` com 0.3s e translateY(10px), criando um efeito brusco.

**Correcao**:
- Alterar keyframe `fade-in` em `tailwind.config.ts`: reduzir translateY de 10px para 4px e aumentar duracao de 0.3s para 0.45s com ease `cubic-bezier(0.4, 0, 0.2, 1)`.
- Atualizar `PageTransition.tsx` para usar a classe de animacao atualizada.

**Arquivos**: `tailwind.config.ts`, `src/components/PageTransition.tsx`

---

## 2) Varredura de textos brutos (underscore sem formatacao)

**Problema**: Valores como `api_key`, `certificado_ssl`, `token_acesso`, `legitimo_interesse`, `execucao_contrato`, `servidor_local`, `tempo_real`, `formulario_web`, `revogacao_consentimento`, `pessoa_juridica`, `contrato_principal`, etc. sao gravados no banco com underscore. O `formatStatus()` ja resolve a maioria via replace de `_` por espaco + capitalize, mas falta cobertura no mapa `STATUS_LABELS` para garantir acentuacao correta.

**Correcao**: Adicionar ao `STATUS_LABELS` em `src/lib/text-utils.ts` todas as entradas compostas que precisam de acento/formatacao especial:
- `api_key` → `API Key`
- `certificado_ssl` → `Certificado SSL`
- `ssh_key` → `SSH Key`
- `token_acesso` → `Token de Acesso`
- `secret_key` → `Secret Key`
- `legitimo_interesse` → `Legítimo Interesse`
- `execucao_contrato` → `Execução de Contrato`
- `cumprimento_obrigacao` → `Cumprimento de Obrigação Legal`
- `protecao_vida` → `Proteção da Vida`
- `exercicio_direitos` → `Exercício de Direitos`
- `politicas_publicas` → `Políticas Públicas`
- `diretamente_titular` → `Diretamente do Titular`
- `nao_compartilha` → `Não Compartilha`
- `autorizacao_anpd` → `Autorização ANPD`
- `servidor_local` → `Servidor Local`
- `cloud_publica` → `Cloud Pública`
- `cloud_privada` → `Cloud Privada`
- `muito_grande` → `Muito Grande`
- `tempo_real` → `Tempo Real`
- `revogacao_consentimento` → `Revogação de Consentimento`
- `formulario_web` → `Formulário Web`
- `pessoa_juridica` → `Pessoa Jurídica`
- `pessoa_fisica` → `Pessoa Física`
- `contrato_principal` → `Contrato Principal`
- `licoes_aprendidas` → `Lições Aprendidas` (ja existe)
- `disponibilidade` → `Disponibilidade`
- `privacidade` → `Privacidade`

**Arquivo**: `src/lib/text-utils.ts`

---

## 3) Enriquecer payloads de integracao (Slack, Teams, Jira, Webhook)

**Problema**: Os payloads enviados pelo `integration-webhook-dispatcher` sao simplistas -- mostram `evento: "incidente_criado"` em texto bruto, sem contexto de modulo, sem dados estruturados, e a gravidade aparece como string crua (`alta`, `critica`).

**Correcoes no `integration-webhook-dispatcher/index.ts`**:

### Slack
- Adicionar secao de "facts" com campos: Modulo, Gravidade formatada, Responsavel (se disponivel em `dados`).
- Adicionar divider entre header e contexto.
- Formatar `evento` para legivel (ex: `incidente_criado` → `Incidente Criado`).

### Teams
- Adicionar mais `facts`: Modulo, Criticidade, ID do registro (se em `dados`).
- Incluir descricao como texto markdown formatado.
- Formatar `evento` e `gravidade` para texto legivel.

### Jira
- Enriquecer `description` com tabela ADF ou lista de campos.
- Adicionar labels ao ticket: `governaii`, `grc`, evento.

### Webhook generico
- Adicionar campo `modulo` extraido do evento (ex: `incidente_criado` → `Incidentes`).
- Adicionar campo `gravidade_label` formatada.
- Incluir `fonte: "GovernAII"` e `versao: "2.0"`.

**Arquivo**: `supabase/functions/integration-webhook-dispatcher/index.ts`

---

## Arquivos afetados
1. `tailwind.config.ts` — keyframe fade-in
2. `src/components/PageTransition.tsx` — classe de animacao
3. `src/lib/text-utils.ts` — STATUS_LABELS expandido
4. `supabase/functions/integration-webhook-dispatcher/index.ts` — payloads enriquecidos

