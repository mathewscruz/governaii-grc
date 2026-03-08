

## Correção do estilo de autofill nos campos de login

### Problema
Quando o navegador preenche automaticamente (autofill) os campos de e-mail e senha, o fundo fica branco e o texto fica distante das bordas — quebrando o visual escuro da tela de login.

### Causa
Navegadores (Chrome/Edge) aplicam `background-color: white` e `color: black` via pseudo-elemento `:-webkit-autofill`, ignorando os estilos CSS definidos.

### Solução
Adicionar regras CSS globais em `src/index.css` para forçar o estilo escuro nos campos com autofill:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px hsl(230, 25%, 10%) inset !important;
  -webkit-text-fill-color: white !important;
  caret-color: white !important;
  transition: background-color 5000s ease-in-out 0s;
}
```

Isso faz o campo preenchido ficar com fundo levemente mais escuro e texto branco, mantendo a identidade visual.

### Arquivo modificado
- `src/index.css` — adicionar regras de autofill

