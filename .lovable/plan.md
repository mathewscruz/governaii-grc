## Causa raiz

O erro "Rendered fewer hooks than expected" acontece porque, ao implementar a correção do MFA, o `useRef(false)` foi adicionado em `src/pages/Auth.tsx` **depois** dos `if`-returns iniciais (linhas 85, 89 e 93). Quando o componente passa de uma fase com `return` antecipado para a fase normal, a quantidade de hooks executados muda — violando as Rules of Hooks. É isso que dispara o `ErrorBoundary` (tela "Algo deu errado") logo após digitar credenciais.

O fluxo lógico (AuthProvider, Edge Functions, MFAVerification) está correto — o problema é puramente a posição do hook.

## Correção

Mover `useRef` para o topo do componente, antes de qualquer `return` condicional. A função auxiliar `setMfaPendingFlag` (que não é hook) também sobe junto, por proximidade.

Em `src/pages/Auth.tsx`:

1. Logo após `const [mfaPassword, setMfaPassword] = useState('')` (linha 44), adicionar:
   - `const mfaInProgressRef = useRef(false);`
   - `const setMfaPendingFlag = (pending: boolean) => { ... }`

2. Remover o bloco duplicado dessas mesmas declarações que hoje aparece nas linhas 104-115 (depois dos `if`-returns).

Nenhuma outra alteração é necessária — o restante do fluxo MFA (flag `MFA_PENDING_KEY` no `AuthProvider`, edge functions `send-mfa-code` / `verify-mfa-code`, `MFAVerification`) já está correto.

## Validação após o fix

1. Login fora das 24h: credenciais → tela MFA → código por e-mail → dashboard.
2. Login dentro das 24h: credenciais → dashboard direto (sem flash).
3. Cancelar MFA: volta ao login limpo, sem sessão residual.
4. Recarregar `/auth` durante MFA: limpa a flag e permite novo login.

## Arquivos alterados

- `src/pages/Auth.tsx` (única mudança: reposicionar `useRef`).