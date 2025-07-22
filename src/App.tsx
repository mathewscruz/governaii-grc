
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/AuthProvider';
import Layout from '@/components/Layout';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Ativos from '@/pages/Ativos';
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
            <Route path="/riscos" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Gestão de Riscos</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/auditorias" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Auditorias</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/contratos" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Contratos</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/documentos" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Documentos</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/contas-privilegiadas" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Contas Privilegiadas</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
            <Route path="/incidentes" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Incidentes</h1><p className="text-muted-foreground">Módulo em desenvolvimento</p></div></Layout>} />
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
