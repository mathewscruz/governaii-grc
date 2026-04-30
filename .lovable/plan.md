## Causa do 404

A rota `/ativos/endpoints` está no menu lateral mas **não foi registrada em `src/App.tsx`** — por isso cai no NotFound. A página `src/pages/AtivosEndpoints.tsx` já existe e funciona; só falta plugá-la no router.

## O que vou fazer

### 1. Corrigir o roteamento (resolve o 404)
- Em `src/App.tsx`: importar `AtivosEndpoints` (lazy) e adicionar a `<Route path="/ativos/endpoints">` dentro do mesmo `<Layout>` + `<ProtectedRoute moduleName="ativos">` usado pelas outras telas de Ativos.

### 2. Entregar um instalador "1-clique" para Windows

O problema hoje: o usuário precisaria compilar o `agent/` em Go, abrir PowerShell como Admin, digitar comando com `--token`. Vou simplificar tudo:

**a) Compilar o agente (uma única vez, manual, fora do sandbox)**

O sandbox da Lovable não tem toolchain Go nem Windows, então a compilação do `.exe` precisa ser feita por você (ou CI) com `agent\build.ps1`. Vou deixar o `build.ps1` e o `README` do `agent/` revisados para que isso seja literalmente:

```powershell
cd agent
.\build.ps1     # gera dist\akuris-agent.exe
```

**b) Empacotar instalador `.bat` que faz tudo sozinho**

Para o usuário final não precisar abrir PowerShell nem digitar nada, vou gerar dinamicamente, no painel, um **arquivo `instalar-akuris.bat`** já com o token embutido. O fluxo do admin vira:

1. Clica em **"Gerar token e baixar instalador"** no painel.
2. Recebe um `.zip` (ou os 2 arquivos lado a lado) contendo:
   - `akuris-agent.exe` (binário público no bucket).
   - `instalar-akuris.bat` (gerado on-the-fly, contém o token e o servidor).
3. Na máquina-alvo, **clique direito → "Executar como administrador"** no `.bat`. Pronto: ele copia o `.exe` para `C:\Program Files\Akuris\`, roda `install --token ... --server ...`, sobe o serviço Windows e fecha.

O `.bat` será gerado pelo frontend (template string) e baixado via `Blob` — sem nova edge function. Conteúdo:

```bat
@echo off
net session >nul 2>&1 || (echo Execute como Administrador & pause & exit /b 1)
if not exist "C:\Program Files\Akuris" mkdir "C:\Program Files\Akuris"
copy /Y "%~dp0akuris-agent.exe" "C:\Program Files\Akuris\akuris-agent.exe"
"C:\Program Files\Akuris\akuris-agent.exe" install ^
  --token AKE-xxxxxxxxxxxx ^
  --server https://lnlkahtugwmkznasapfd.supabase.co
echo Instalacao concluida.
pause
```

**c) Botões na página Endpoints**

Header já tem **"Baixar agente (.exe)"** apontando para o bucket público. Vou adicionar:
- Botão **"Baixar instalador (.bat)"** após gerar o token (download direto do `.bat` pronto).
- Mensagem clara: *"1) Baixe os dois arquivos. 2) Coloque-os na mesma pasta. 3) Clique direito no .bat → Executar como administrador."*

**d) Subir o binário no bucket (passo único, manual)**

Depois que você compilar o `.exe` localmente, subir uma vez em **Supabase → Storage → endpoint-agent-binaries → upload `akuris-agent.exe`**. A partir daí, qualquer admin baixa direto pelo painel.

### 3. Limpeza

- Remover URL do Supabase hardcoded no Go (`agent/cmd/akuris-agent/main.go`) — manter `--server` obrigatório vindo do `.bat`. Isso evita ter que recompilar se a URL mudar.

## Limites técnicos honestos

- **Não consigo compilar o `.exe` para você no sandbox da Lovable** (sem Go, sem Windows, sem assinatura de código). A compilação é um passo único do seu lado.
- **Não consigo empacotar `.zip` automaticamente no clique** sem JSZip — para evitar dependência nova, vou fazer download de 2 arquivos separados (.exe do bucket + .bat gerado). Se preferir um único `.zip`, me avisa e adiciono `jszip` (~40 KB).
- **Sem assinatura de código (signtool)**, o Windows SmartScreen vai mostrar aviso "Editor desconhecido" na primeira execução. Para remover isso é necessário um certificado EV de code signing (~US$ 200–400/ano) — fica para fase 3.

## Arquivos afetados

- `src/App.tsx` — adicionar import + rota `/ativos/endpoints`.
- `src/pages/AtivosEndpoints.tsx` — botão "Baixar instalador (.bat)" e instruções.
- `agent/cmd/akuris-agent/main.go` — tornar `--server` obrigatório (sem default hardcoded).
- `agent/README.md` e `docs/endpoint-agent.md` — atualizar com o fluxo do `.bat`.

Posso prosseguir?