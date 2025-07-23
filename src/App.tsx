
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/AuthProvider';
import Layout from '@/components/Layout';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Ativos from '@/pages/Ativos';
import { Riscos } from '@/pages/Riscos';
import Controles from '@/pages/Controles';
import Contratos from '@/pages/Contratos';
import Auditorias from '@/pages/Auditorias';
import Documentos from '@/pages/Documentos';
import ContasPrivilegiadas from '@/pages/ContasPrivilegiadas';
import Incidentes from '@/pages/Incidentes';
import Configuracoes from '@/pages/Configuracoes';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/ativos" element={<Layout><Ativos /></Layout>} />
            <Route path="/riscos" element={<Layout><Riscos /></Layout>} />
            <Route path="/controles" element={<Layout><Controles /></Layout>} />
            <Route path="/auditorias" element={<Layout><Auditorias /></Layout>} />
            <Route path="/contratos" element={<Layout><Contratos /></Layout>} />
            <Route path="/documentos" element={<Layout><Documentos /></Layout>} />
            <Route path="/contas-privilegiadas" element={<Layout><ContasPrivilegiadas /></Layout>} />
            <Route path="/incidentes" element={<Layout><Incidentes /></Layout>} />
            <Route path="/dados" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Dados</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/due-diligence" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Due Diligence</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/denuncia" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Canal de Denúncia</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
