# Lembretes, expurgo e marca padrão — 05/09/2026

Escopo autorizado: corrigir somente as rotinas de lembretes/expurgo e remover os logotipos personalizados atuais das empresas. Outras recomendações da revisão do Supabase não foram ativadas.

## Aplicado em produção

- `lembretes-diarios`: diariamente às 09:00 UTC (06:00 em São Paulo).
- `expurgar-denuncias`: diariamente às 04:30 UTC (01:30 em São Paulo).
- Horários preservados das definições anteriores. Cron utiliza GMT/UTC.
- Credenciais próprias por rotina, com resolução no Vault durante a execução, sem chave de serviço interpolada em `cron.job`. O procedimento segue o [modelo de agendamento com Vault do Supabase](https://supabase.com/docs/guides/functions/schedule-functions).
- A tabela interna `rotinas_agendadas_execucoes` registra o resultado efetivo, não apenas o disparo HTTP. RLS habilitado, sem acesso de anon/authenticated.
- Uma execução concluída não se repete no mesmo dia UTC; reservas concorrentes são recusadas. Falhas podem ser reprocessadas, e reservas interrompidas expiram após 15 minutos.
- Modos `dry_run` autenticados verificam os candidatos sem enviar mensagens nem apagar dados.

## Lembretes

O processador considera apenas empresas com lembretes habilitados. Convites respeitam validade do acesso temporário, perfil ativo, intervalos e limite da empresa. A consulta foi corrigida: `temporary_passwords` referencia `auth.users`, não um relacionamento direto do PostgREST com `profiles`.

Due diligence respeita também seu interruptor específico, a janela configurada e `ultimo_lembrete_enviado`. A falha de convites não impede a verificação das outras rotinas da empresa. Notificações de Gap Analysis são deduplicadas pelo identificador da avaliação, destinatário e dia, em vez de procurar apenas o título.

Os lembretes enviados por e-mail usam chave de idempotência no provedor. A garantia do provedor vale por 24 horas e complementa o histórico e a reserva diária; não deve ser descrita como garantia transacional ilimitada entre banco e e-mail. Ver [idempotência no Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).

Erros de envio ou de persistência não são mais tratados como sucesso. As mensagens existentes e os limites comerciais não foram reformulados.

## Expurgo

A seleção de denúncias não foi ampliada: somente casos resolvidos/arquivados, com data de conclusão, cujo prazo de conservação da empresa já terminou. Os prazos configurados não foram alterados.

O worker preserva a fila durável de anexos e usa a API de Storage, não exclusão direta de `storage.objects`. Processa até mil itens por execução; pendências, erros de confirmação e arquivos que esgotaram tentativas permanecem visíveis como falha, sem afirmar conclusão indevida.

## Marca

Os quatro vínculos de logotipos personalizados existentes foram removidos. As sete empresas passam a usar o fallback Akuris. O portal público usa o arquivo já aprovado com texto preto, inclusive no cabeçalho e rodapé.

Os 27 objetos do bucket de logos de empresas foram preservados; há cópia privada dos quatro vínculos antigos para recuperação. Documentos já gerados não foram reescritos. Esta é uma reposição dos logotipos atuais, não a remoção da capacidade futura de personalizar a marca.

## Validação

- Migração das rotinas ensaiada em transação com ROLLBACK: reserva, recusa de duplicidade, retry de falha e proteção de acesso aprovados.
- Simulações de ambas as rotinas em produção: HTTP 200, zero elegíveis e zero erros.
- Primeira execução real de ambas: HTTP 200 e estado `concluida`, com zero e-mails enviados, denúncias apagadas ou arquivos removidos.
- Chamadas sem autorização: HTTP 401 nos dois endpoints.
- Logotipo padrão conferido visualmente no portal público da Nexure e mediante inspeção dos vínculos de todas as empresas.
- 947 testes em 173 arquivos aprovados; lint e TypeScript aprovados.
- As cinco Edge Functions alteradas passaram pela checagem Deno com tipos React 18 dos templates e foram publicadas. Nenhum frontend separado é necessário para a reposição dos logos, pois o fallback já estava no produto.

Migrações: `20260906020000_rotinas_lembretes_expurgo` e `20260906021000_repor_logotipos_padrao_akuris`.

## Consulta operacional

Somente operadores autorizados do banco/serviço devem consultar:

```sql
SELECT rotina, dia, status, tentativas, iniciado_em, concluido_em, resumo
FROM public.rotinas_agendadas_execucoes
ORDER BY dia DESC, rotina;
```

Para pausar uma rotina, desative seu job pelo nome exato; não remova as regras de retenção nem esvazie a fila de arquivos. Não publique valores de `vault.decrypted_secrets` em logs, tickets ou commits. Simulação e execução manual exigem a credencial específica da rotina ou o serviço autorizado.
