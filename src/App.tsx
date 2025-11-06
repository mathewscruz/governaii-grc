
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Ativos from '@/pages/Ativos';
import { Riscos } from '@/pages/Riscos';
import GapAnalysis from '@/pages/GapAnalysis';
import GapAnalysisFrameworks from '@/pages/GapAnalysisFrameworks';
import GapAnalysisAderencia from '@/pages/GapAnalysisAderencia';
import Controles from '@/pages/Controles';
import Contratos from '@/pages/Contratos';
import Auditorias from '@/pages/Auditorias';
import Documentos from '@/pages/Documentos';
import ContasPrivilegiadas from '@/pages/ContasPrivilegiadas';
import Incidentes from '@/pages/Incidentes';
import Dados from '@/pages/Dados';
import DueDiligence from '@/pages/DueDiligence';
import Assessment from '@/pages/Assessment';
import Denuncia from '@/pages/Denuncia';
import DenunciaExterna from '@/pages/DenunciaExterna';
import DenunciaExternaRedirect from '@/pages/DenunciaExternaRedirect';
import DenunciaMenu from '@/pages/DenunciaMenu';
import DenunciaFormulario from '@/pages/DenunciaFormulario';
import DenunciaConsulta from '@/pages/DenunciaConsulta';
import Configuracoes from '@/pages/Configuracoes';
import NotFound from '@/pages/NotFound';
import LandingPage from '@/pages/LandingPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/assessment/:token" element={<Assessment />} />
            {/* Rotas antigas para compatibilidade */}
            <Route path="/denuncia/externa/:token" element={<DenunciaExternaRedirect />} />
            {/* Novas rotas amigáveis para canal de denúncias */}
            <Route path="/:empresa/denuncia" element={<DenunciaMenu />} />
            <Route path="/:empresa/denuncia/registrar" element={<DenunciaFormulario />} />
            <Route path="/:empresa/denuncia/consulta" element={<DenunciaConsulta />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={
              <Layout>
                <ProtectedRoute moduleName="dashboard" fallbackToRoleCheck={false}>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/ativos" element={
              <Layout>
                <ProtectedRoute moduleName="ativos" fallbackToRoleCheck={false}>
                  <Ativos />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/riscos" element={
              <Layout>
                <ProtectedRoute moduleName="riscos" fallbackToRoleCheck={false}>
                  <Riscos />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/gap-analysis" element={
              <Layout>
                <ProtectedRoute moduleName="gap-analysis" fallbackToRoleCheck={false}>
                  <GapAnalysis />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/gap-analysis/frameworks" element={
              <Layout>
                <ProtectedRoute moduleName="gap-analysis" fallbackToRoleCheck={false}>
                  <GapAnalysisFrameworks />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/gap-analysis/avaliacao-aderencia" element={
              <Layout>
                <ProtectedRoute moduleName="gap-analysis" fallbackToRoleCheck={false}>
                  <GapAnalysisAderencia />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/controles" element={
              <Layout>
                <ProtectedRoute moduleName="controles" fallbackToRoleCheck={false}>
                  <Controles />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/auditorias" element={
              <Layout>
                <ProtectedRoute moduleName="auditorias" fallbackToRoleCheck={false}>
                  <Auditorias />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/contratos" element={
              <Layout>
                <ProtectedRoute moduleName="contratos" fallbackToRoleCheck={false}>
                  <Contratos />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/documentos" element={
              <Layout>
                <ProtectedRoute moduleName="documentos" fallbackToRoleCheck={false}>
                  <Documentos />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/contas-privilegiadas" element={
              <Layout>
                <ProtectedRoute moduleName="contas-privilegiadas" fallbackToRoleCheck={false}>
                  <ContasPrivilegiadas />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/incidentes" element={
              <Layout>
                <ProtectedRoute moduleName="incidentes" fallbackToRoleCheck={false}>
                  <Incidentes />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/dados" element={
              <Layout>
                <ProtectedRoute moduleName="dados" fallbackToRoleCheck={false}>
                  <Dados />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/due-diligence" element={
              <Layout>
                <ProtectedRoute moduleName="due-diligence" fallbackToRoleCheck={false}>
                  <DueDiligence />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/denuncia" element={
              <Layout>
                <ProtectedRoute moduleName="denuncia" fallbackToRoleCheck={false}>
                  <Denuncia />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/configuracoes" element={
              <Layout>
                <ProtectedRoute moduleName="configuracoes" fallbackToRoleCheck={false}>
                  <Configuracoes />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
