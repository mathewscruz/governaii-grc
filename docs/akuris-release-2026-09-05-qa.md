# Akuris — publicação de QA e visão executiva

Status: **Publicado em produção** em 05/09/2026, com verificação final às 21:35 (UTC−03).

## Versão e escopo

- Aplicação: https://akuris.pt
- Commit publicado: `59d26d374638b90a41a64cd048cc59665b4ddd38` — `fix: harden QA flows and refine executive visual summaries`.
- 74 arquivos: correções de QA documentadas em `akuris-qa-2026-09-05.md`, apresentação executiva do dashboard/frameworks e roteiro de planos de ação. Não inclui MITRE nem novas métricas de exposição cibernética.
- Repositório `mathewscruz/akuris-grc`, branch `main`; sincronização existente com o projeto Lovable `e64d00f7-1631-421a-bcc8-86aa27d8fb2a`.
- Lovable confirmou **“Seu site foi atualizado”**. O histórico recebeu o commit desta entrega.
- Entrada pública mudou de `/assets/index-DgtnKQ5k.js` para **`/assets/index-DAfaKPR7.js`**. O bundle referencia o Supabase de produção, sem `127.0.0.1:54321`, e inclui `executive-summary-sDzFr3Yh.js`.

## Validações

- Suíte local final da rodada de QA: **930 testes / 170 arquivos aprovados**, typecheck e lint sem erros.
- Build repetido com variáveis públicas do Supabase de produção no processo, sem alterar `.env.local`: aprovado, 4.903 módulos. O artefato local não foi enviado como publicação; Lovable realizou seu próprio build. Permanece o aviso de chunks acima de 500 kB.
- [CI do commit publicado](https://github.com/mathewscruz/akuris-grc/actions/runs/34001358649): **success**. Typecheck, testes e varredura de segredos aprovados. Lint e auditoria de dependências são informativos no workflow existente; sucesso do job não significa ausência de todos os avisos ou vulnerabilidades.
- `git diff --check`: aprovado antes do commit.

### Smoke tests reais em produção

- Landing page carregou; a entrada do site respondeu HTTP 200 com o novo bundle.
- “Acessar plataforma” aproveitou a sessão de produção existente e redirecionou ao dashboard, sem alterar login, senha ou MFA.
- Dashboard apresentou índice operacional, leitura executiva e cartões de domínio da nova versão.
- Configurações carregou a tabela de usuários e informações de último acesso. Duas respostas observadas do endpoint `get-user-access-info` retornaram HTTP 200 na sessão existente.
- Contratos: busca `tecnico` encontrou `Suporte Técnico`; campo limpo após o teste. Rodapé e seletor de linhas permaneceram visíveis.
- ISO/IEC 27001: situação do framework, fila de prioridades, aderência por categoria e requisitos carregaram. Busca `contexto` encontrou o requisito 4.1 e preservou o foco; campo limpo após o teste.
- Planos de Ação: roteiro de execução carregou as prioridades conforme prazos registrados.
- Canal público de acompanhamento Nexure carregou protocolo, código mascarado e orientações de acesso.
- Não foram criados, editados ou excluídos registros de negócio. Não foram enviados e-mails, denúncias, redefinições de senha ou solicitações de IA.

O console da navegação em Planos de Ação apresentou mensagens de fechamento de canal de listener assíncrono, compatíveis com mensageria de extensão do navegador; não foi estabelecida a origem exata. O roteiro carregou normalmente. Isso não é apresentado como uma varredura de console sem qualquer mensagem.

## Backend e reversão

- Supabase de produção: `lnlkahtugwmkznasapfd` (Akuris).
- Publicada somente a Edge Function `get-user-access-info` pelo CLI. A sincronização do Lovable também pode incrementar a versão; a versão final conferida foi **310**, status **ACTIVE**, `verify_jwt = true`.
- A fonte da função publicada, `_shared/auth.ts` e `_shared/requested-auth-users.ts` foram baixadas após o deploy e seus hashes conferidos: idênticos aos arquivos desta entrega.
- Chamada sem Authorization retornou **HTTP 401**, sem informação de usuários. Autorização, MFA e limites de empresa foram preservados.
- Nenhuma migração de banco, configuração de Auth ou política de acesso foi alterada nesta publicação.
- Cópia anterior da função (versão 308) e dependências guardada fora do repositório em `C:/Users/mathe/.claude/projects/C--Users-mathe-dev-akuris/tmp/release-qa-20260905/supabase/functions/`. Cópia publicada em `release-qa-20260905/published/`.
- Para reversão, restaurar a versão frontend anterior pelo fluxo do Lovable/Git e republicar a cópia anterior da função, preservando a configuração JWT. Reversão não foi necessária nem executada.

## Limites

O erro HTTP 500 do runtime local não se reproduziu na consulta autenticada de acesso em produção. Isso não corrige a infraestrutura local. Login com nova sessão, MFA, recuperação de senha, questionário com token válido, entrega de e-mails, anexos, carga e matriz completa de perfis não foram reexecutados ponta a ponta nesta publicação. O smoke de produção complementa a suíte automatizada e não equivale a certificação de ausência de bugs.

Este registro complementa o relatório de QA, que descreve corretamente o estado local anterior à autorização para publicar.
