import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Ativos from '@/pages/Ativos';
import AtivosLicencas from '@/pages/AtivosLicencas';
import AtivosChaves from '@/pages/AtivosChaves';
import { Riscos } from '@/pages/Riscos';
import GapAnalysis from '@/pages/GapAnalysis';
import GapAnalysisFrameworks from '@/pages/GapAnalysisFrameworks';
import GapAnalysisFrameworkDetail from '@/pages/GapAnalysisFrameworkDetail';
import GapAnalysisAderencia from '@/pages/GapAnalysisAderencia';

import Contratos from '@/pages/Contratos';
import Governanca from '@/pages/Governanca';
import Sistemas from '@/pages/Sistemas';
import Documentos from '@/pages/Documentos';
import ContasPrivilegiadas from '@/pages/ContasPrivilegiadas';
import Incidentes from '@/pages/Incidentes';
import Privacidade from '@/pages/Privacidade';
import DueDiligence from '@/pages/DueDiligence';
import Assessment from '@/pages/Assessment';
import RevisaoAcessos from '@/pages/RevisaoAcessos';
import ReviewExterna from '@/pages/ReviewExterna';
import Denuncia from '@/pages/Denuncia';
import DenunciaExternaRedirect from '@/pages/DenunciaExternaRedirect';
import DenunciaMenu from '@/pages/DenunciaMenu';
import DenunciaFormulario from '@/pages/DenunciaFormulario';
import DenunciaConsulta from '@/pages/DenunciaConsulta';
import Configuracoes from '@/pages/Configuracoes';
import NotFound from '@/pages/NotFound';
import LandingPage from '@/pages/LandingPage';
import PoliticaPrivacidade from '@/pages/PoliticaPrivacidade';
import PlanosAcao from '@/pages/PlanosAcao';
import Relatorios from '@/pages/Relatorios';
import Politicas from '@/pages/Politicas';
import Planos from '@/pages/Planos';
import Registro from '@/pages/Registro';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import DefinirSenha from '@/pages/DefinirSenha';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/definir-senha" element={<DefinirSenha />} />
            <Route path="/assessment/:token" element={<Assessment />} />
            {/* Rotas antigas para compatibilidade */}
            <Route path="/denuncia/externa/:token" element={<DenunciaExternaRedirect />} />
            {/* Novas rotas amigáveis para canal de denúncias */}
            <Route path="/:empresa/denuncia" element={<DenunciaMenu />} />
            <Route path="/:empresa/denuncia/registrar" element={<DenunciaFormulario />} />
            <Route path="/:empresa/denuncia/consulta" element={<DenunciaConsulta />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/dashboard" element={
              <Layout>
                <ProtectedRoute moduleName="dashboard" fallbackToRoleCheck={false}>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/planos-acao" element={
              <Layout>
                <ProtectedRoute moduleName="planos-acao">
                  <PlanosAcao />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/relatorios" element={
              <Layout>
                <ProtectedRoute moduleName="relatorios" fallbackToRoleCheck={false}>
                  <Relatorios />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/politicas" element={
              <Layout>
                <ProtectedRoute moduleName="politicas" fallbackToRoleCheck={false}>
                  <Politicas />
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
            <Route path="/ativos/licencas" element={
              <Layout>
                <ProtectedRoute moduleName="ativos" fallbackToRoleCheck={false}>
                  <AtivosLicencas />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/ativos/chaves" element={
              <Layout>
                <ProtectedRoute moduleName="ativos" fallbackToRoleCheck={false}>
                  <AtivosChaves />
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
            <Route path="/gap-analysis/framework/:frameworkId" element={
              <Layout>
                <ProtectedRoute moduleName="gap-analysis" fallbackToRoleCheck={false}>
                  <GapAnalysisFrameworkDetail />
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
            <Route path="/governanca" element={
              <Layout>
                <ProtectedRoute moduleName="controles" fallbackToRoleCheck={false}>
                  <Governanca />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/sistemas" element={
              <Layout>
                <ProtectedRoute moduleName="controles" fallbackToRoleCheck={false}>
                  <Sistemas />
                </ProtectedRoute>
              </Layout>
            } />
            {/* Redirects para rotas antigas */}
            <Route path="/controles" element={<Navigate to="/governanca?tab=controles" replace />} />
            <Route path="/auditorias" element={<Navigate to="/governanca?tab=auditorias" replace />} />
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
            <Route path="/privacidade" element={
              <Layout>
                <ProtectedRoute moduleName="dados" fallbackToRoleCheck={false}>
                  <Privacidade />
                </ProtectedRoute>
              </Layout>
            } />
            {/* Redirect antigo /dados para /privacidade */}
            <Route path="/dados" element={<Navigate to="/privacidade" replace />} />
            <Route path="/due-diligence" element={
              <Layout>
                <ProtectedRoute moduleName="due-diligence" fallbackToRoleCheck={false}>
                  <DueDiligence />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/review/:token" element={<ReviewExterna />} />
            <Route path="/revisao-acessos" element={
              <Layout>
                <ProtectedRoute moduleName="contas-privilegiadas" fallbackToRoleCheck={false}>
                  <RevisaoAcessos />
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
            <Route path="/planos" element={
              <Layout>
                <Planos />
              </Layout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
