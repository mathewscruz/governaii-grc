

# Substituir Logotipo em Todo o Sistema

## Locais identificados com o logotipo atual

### Arquivos de imagem (serao substituidos pelo novo logo)
1. `src/assets/governaii-logo.png` - usado na LandingPage (mockup do dashboard)
2. `src/assets/governaii-logo-main.png` - usado na pagina de Login (Auth.tsx)
3. `src/assets/governaii-logo-mini.png` - usado no Sidebar quando esta recolhido
4. `public/governaii-logo.png` - usado na pagina de Revisao Externa e exportacao de PDF

### Componentes que referenciam logos
1. **AppSidebar.tsx** - importa `governaii-logo-mini.png` para sidebar recolhido; tambem usa URL do Supabase para sidebar expandido e como fallback
2. **Auth.tsx** - importa `governaii-logo-main.png` para pagina de login
3. **LandingPage.tsx** - importa `governaii-logo.png` para mockup; usa URL do Supabase Storage para navbar e footer
4. **ReviewExterna.tsx** - usa `/governaii-logo.png` do public
5. **ExportPDF.tsx** - usa `/governaii-logo.png` do public como fallback

### Edge Functions (fallback apenas)
Varias edge functions usam `https://governaii.com.br/governaii-logo.png` como fallback quando a empresa nao tem logo proprio. Esses nao serao alterados pois sao URLs externas do dominio de producao.

## Plano de execucao

### Passo 1: Copiar novo logo para o projeto
- Copiar `AKURIS_400_x_120_px_2.png` para `src/assets/akuris-logo.png`
- Copiar tambem para `public/akuris-logo.png`

### Passo 2: Atualizar imports e referencias nos componentes

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AppSidebar.tsx` | Trocar import de `governaii-logo-mini.png` para `akuris-logo.png`; atualizar URL do Supabase no fallback expandido |
| `src/pages/Auth.tsx` | Trocar import de `governaii-logo-main.png` para `akuris-logo.png` |
| `src/pages/LandingPage.tsx` | Trocar import de `governaii-logo.png` para `akuris-logo.png`; atualizar URLs do Supabase na navbar e footer |
| `src/pages/ReviewExterna.tsx` | Trocar src de `/governaii-logo.png` para `/akuris-logo.png` |
| `src/components/gap-analysis/adherence/ExportPDF.tsx` | Trocar fallback de `/governaii-logo.png` para `/akuris-logo.png` |

### Passo 3: Atualizar textos alt
Atualizar os atributos `alt` das imagens de "GovernAII" para "Akuris" onde aplicavel.

### Notas
- Os arquivos antigos de logo em `src/assets/` e `public/` nao serao deletados para evitar quebras em cache, mas nao serao mais referenciados
- As edge functions continuam usando a URL externa como fallback -- se desejar atualizar, sera necessario fazer deploy separado
- O novo logo sera usado em todas as dimensoes (sidebar mini, login, landing page, etc.) ajustando-se via CSS existente (`object-contain`, `h-8`, `h-20`, etc.)

