import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import akurisLogo from "@/assets/akuris-logo.png";

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar ao site</span>
            </Link>
            <img
              src={akurisLogo}
              alt="Akuris"
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 mb-6">
              <Shield className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Política de Privacidade
            </h1>
            <p className="text-gray-400">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-10 text-gray-300">
            {/* Introdução */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Introdução</h2>
              <p className="leading-relaxed">
                A Akuris ("nós", "nosso" ou "Empresa") está comprometida em proteger a privacidade e os dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma de gestão de governança, riscos e conformidade.
              </p>
              <p className="leading-relaxed mt-4">
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD) e demais legislações aplicáveis.
              </p>
            </section>

            {/* Controlador */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Controlador dos Dados</h2>
              <p className="leading-relaxed mb-4">
                A Akuris é a controladora dos dados pessoais coletados através de sua plataforma. Para questões relacionadas ao tratamento de dados pessoais, você pode entrar em contato através dos canais abaixo:
              </p>
              <div className="bg-white/5 rounded-xl p-6 space-y-3 border border-white/10">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>privacidade@governaii.com.br</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span>Brasil</span>
                </div>
              </div>
            </section>

            {/* Dados Coletados */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Dados Pessoais Coletados</h2>
              <p className="leading-relaxed mb-4">
                Coletamos diferentes tipos de dados pessoais dependendo da sua interação com nossa plataforma:
              </p>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">Dados de Cadastro</h3>
                  <p className="text-sm">Nome completo, endereço de e-mail, telefone, cargo, nome da empresa.</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">Dados de Uso</h3>
                  <p className="text-sm">Logs de acesso, endereço IP, navegador utilizado, páginas acessadas, tempo de sessão.</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">Dados de Comunicação</h3>
                  <p className="text-sm">Mensagens enviadas pelo formulário de contato, e-mails trocados com nossa equipe.</p>
                </div>
              </div>
            </section>

            {/* Finalidades */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Finalidades do Tratamento</h2>
              <p className="leading-relaxed mb-4">
                Utilizamos seus dados pessoais para as seguintes finalidades:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Prestação dos serviços contratados na plataforma</li>
                <li>Autenticação e controle de acesso</li>
                <li>Comunicação sobre atualizações e novidades do sistema</li>
                <li>Suporte técnico e atendimento ao cliente</li>
                <li>Análise de uso para melhoria contínua da plataforma</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
                <li>Segurança e prevenção de fraudes</li>
              </ul>
            </section>

            {/* Base Legal */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Base Legal para Tratamento</h2>
              <p className="leading-relaxed mb-4">
                O tratamento dos dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Execução de contrato:</strong> para prestação dos serviços contratados</li>
                <li><strong className="text-white">Legítimo interesse:</strong> para melhoria dos serviços e segurança</li>
                <li><strong className="text-white">Consentimento:</strong> para comunicações de marketing (quando aplicável)</li>
                <li><strong className="text-white">Cumprimento de obrigação legal:</strong> para atender requisitos regulatórios</li>
              </ul>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Compartilhamento de Dados</h2>
              <p className="leading-relaxed mb-4">
                Seus dados pessoais podem ser compartilhados com:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Prestadores de serviços:</strong> empresas que nos auxiliam na operação da plataforma (hospedagem, e-mail, etc.)</li>
                <li><strong className="text-white">Autoridades públicas:</strong> quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Não vendemos ou alugamos seus dados pessoais a terceiros. Os dados de cada empresa cliente são isolados e nunca são acessados ou compartilhados com outras empresas usuárias da plataforma.
              </p>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Segurança dos Dados</h2>
              <p className="leading-relaxed mb-4">
                Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Isolamento completo de dados entre empresas clientes</li>
                <li>Controle de acesso baseado em funções (RBAC)</li>
                <li>Logs de auditoria de todas as ações na plataforma</li>
                <li>Backups regulares e plano de recuperação de desastres</li>
                <li>Infraestrutura hospedada em data centers no Brasil</li>
              </ul>
            </section>

            {/* Retenção */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Retenção de Dados</h2>
              <p className="leading-relaxed">
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades para as quais foram coletados, incluindo obrigações legais, contratuais, de prestação de contas ou requisição de autoridades competentes. Após o término do contrato ou solicitação de exclusão, os dados serão eliminados ou anonimizados, respeitados os prazos legais de retenção.
              </p>
            </section>

            {/* Direitos do Titular */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Direitos do Titular</h2>
              <p className="leading-relaxed mb-4">
                Como titular de dados pessoais, você tem os seguintes direitos garantidos pela LGPD:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Confirmação da existência de tratamento</li>
                <li>Acesso aos dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Portabilidade dos dados a outro fornecedor</li>
                <li>Eliminação dos dados tratados com consentimento</li>
                <li>Informação sobre compartilhamento de dados</li>
                <li>Revogação do consentimento</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato através do e-mail: <span className="text-blue-400">privacidade@governaii.com.br</span>
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Cookies e Tecnologias Similares</h2>
              <p className="leading-relaxed mb-4">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter sua sessão ativa enquanto utiliza a plataforma</li>
                <li>Lembrar suas preferências de uso</li>
                <li>Analisar métricas de uso para melhorar nossos serviços</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Você pode configurar seu navegador para recusar cookies, porém isso pode afetar a funcionalidade da plataforma.
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Alterações nesta Política</h2>
              <p className="leading-relaxed">
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou em requisitos legais. Notificaremos você sobre alterações significativas através da plataforma ou por e-mail. Recomendamos a revisão periódica desta política.
              </p>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Contato</h2>
              <p className="leading-relaxed mb-4">
                Se você tiver dúvidas, comentários ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
              </p>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p className="font-semibold text-white mb-2">Encarregado de Proteção de Dados (DPO)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <span>dpo@governaii.com.br</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Back button */}
          <div className="mt-12 text-center">
            <Link to="/">
              <Button variant="outline" className="border-blue-400/60 text-blue-400 hover:bg-blue-500/20 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao site
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Akuris. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PoliticaPrivacidade;
