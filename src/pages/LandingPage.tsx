import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  FileCheck,
  Users,
  Lock,
  FileText,
  AlertTriangle,
  Database,
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
  Zap,
  ChevronRight,
  TrendingUp,
  Clock,
  Target,
  Settings,
  BarChart3,
  Workflow,
  Building2,
  TableProperties,
  RefreshCw,
  XCircle,
  CheckCircle,
  Headphones,
  Rocket,
  GraduationCap,
} from "lucide-react";

const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const exitIntentShown = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Exit-intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShown.current && !sessionStorage.getItem('exitPopupShown')) {
        exitIntentShown.current = true;
        sessionStorage.setItem('exitPopupShown', 'true');
        setShowExitPopup(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", company: "", phone: "", message: "" });
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: AlertTriangle,
      title: "Gestão de Riscos",
      description: "Matriz de calor interativa, sugestões de tratamento com IA, workflow de aprovação e monitoramento contínuo de riscos críticos.",
      details: "Com o módulo de Gestão de Riscos você pode:\n\n• Criar matriz de calor personalizada com categorias próprias\n• Receber sugestões inteligentes de tratamento via IA\n• Configurar workflows de aprovação multinível\n• Monitorar riscos em tempo real com alertas\n• Gerar relatórios executivos automáticos\n• Vincular riscos a controles e frameworks",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Gap Analysis",
      description: "Avalie aderência a mais de 20 frameworks (NIST CSF 2.0, ISO 27001, LGPD, GDPR, PCI DSS, COBIT) com scoring automático e dashboards.",
      details: "Com o módulo de Gap Analysis você pode:\n\n• Avaliar aderência a +20 frameworks globais\n• NIST CSF 2.0, ISO 27001, LGPD, GDPR, SOC 2, PCI DSS\n• Dashboards interativos com gráficos radar\n• Planos de ação com prazos e responsáveis\n• Histórico de evolução de score\n• Exportação de relatórios PDF executivos",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: FileCheck,
      title: "Controles Internos",
      description: "Auditorias, evidências, testes de controles e trilha completa. Atribuição de responsáveis, prazos e notificações automáticas.",
      details: "Com o módulo de Controles Internos você pode:\n\n• Categorizar controles por área e criticidade\n• Atribuir responsáveis e backups\n• Definir frequência de avaliação automática\n• Vincular controles a auditorias e riscos\n• Acompanhar testes de efetividade\n• Anexar evidências e documentação",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Contas Privilegiadas",
      description: "Gestão de acessos críticos com revisão periódica automática, workflow de aprovação e histórico completo de auditoria.",
      details: "Com o módulo de Contas Privilegiadas você pode:\n\n• Gerenciar acessos privilegiados por sistema\n• Workflows de aprovação multinível\n• Revisões periódicas de acesso\n• Alertas de expiração automáticos\n• Trilha de auditoria completa\n• Integração com revisão de acessos",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Database,
      title: "Proteção de Dados",
      description: "Inventário ROPA, mapeamento de tratamento de dados pessoais e portal de atendimento a solicitações de titulares (LGPD).",
      details: "Com o módulo de Proteção de Dados você pode:\n\n• Mapear dados pessoais por processo\n• Gerar ROPA automatizado\n• Visualizar fluxos de dados entre sistemas\n• Gerenciar solicitações de titulares\n• Controlar bases legais e finalidades\n• Conformidade LGPD e GDPR integrada",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Repositório centralizado com versionamento automático, workflow de aprovação, controle de validade e distribuição controlada.",
      details: "Com o módulo de Documentos você pode:\n\n• Controle completo de versões\n• Workflow de aprovação configurável\n• Alertas de renovação automáticos\n• Geração de documentos com IA (DocGen)\n• Categorização e busca avançada\n• Vinculação a controles e auditorias",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Lock,
      title: "Canal de Denúncia",
      description: "Formulário externo anônimo, gestão de denúncias, categorização automática e comunicação segura com denunciantes.",
      details: "Com o Canal de Denúncia você pode:\n\n• Formulário externo anônimo para denunciantes\n• Gestão completa do ciclo de vida\n• Categorização por tipo e gravidade\n• Comunicação segura com denunciantes\n• Relatórios de acompanhamento\n• Conformidade com legislação anticorrupção",
      color: "from-amber-500 to-yellow-500",
    },
    {
      icon: Target,
      title: "Due Diligence",
      description: "Avaliação de fornecedores com questionários personalizados, scoring de risco, integração com contratos e relatórios.",
      details: "Com o módulo de Due Diligence você pode:\n\n• Avaliar fornecedores com questionários personalizados\n• Score de risco automático\n• Templates reutilizáveis\n• Integração com contratos\n• Relatórios de avaliação\n• Monitoramento contínuo de terceiros",
      color: "from-teal-500 to-cyan-500",
    },
  ];

  // Indicadores reais da plataforma - Hero section
  const stats = [
    { value: "20+", label: "Frameworks Suportados", icon: Shield },
    { value: "8", label: "Módulos Integrados", icon: Zap },
    { value: "Multi", label: "Empresas Isoladas", icon: Building2 },
    { value: "Auto", label: "Workflows Inteligentes", icon: Workflow },
  ];

  // Indicadores diferentes para Benefits section
  const benefitStats = [
    { value: "99.9%", label: "Uptime Garantido", icon: TrendingUp },
    { value: "8/5", label: "Suporte Especializado", icon: Headphones },
    { value: "48h", label: "Implantação Rápida", icon: Rocket },
    { value: "100%", label: "Treinamento Incluído", icon: GraduationCap },
  ];

  const benefits = [
    {
      title: "Visão 360° da Governança",
      description: "Dashboard unificado com indicadores de todos os módulos para tomada de decisão estratégica.",
      icon: TrendingUp,
    },
    {
      title: "Automação Inteligente",
      description: "Workflows automatizados, notificações proativas e lembretes para nunca perder prazos.",
      icon: Zap,
    },
    {
      title: "Conformidade Simplificada",
      description: "Avaliações de aderência com IA, templates prontos e relatórios executivos automáticos.",
      icon: CheckCircle2,
    },
    {
      title: "Segurança em Primeiro Lugar",
      description: "Isolamento de dados por empresa, criptografia ponta-a-ponta e logs de auditoria completos.",
      icon: Lock,
    },
  ];

  // Todos os 20 frameworks da plataforma
  const frameworks = [
    "NIST CSF 2.0",
    "ISO 27001",
    "ISO 27701",
    "ISO 9001",
    "ISO 14001",
    "ISO 31000",
    "ISO 37301",
    "ISO/IEC 20000",
    "LGPD",
    "GDPR",
    "CCPA",
    "HIPAA",
    "PCI DSS 4.0",
    "SOC 2 Type II",
    "SOX",
    "COBIT 2019",
    "COSO ERM",
    "COSO IC",
    "CIS Controls v8",
    "ITIL v4",
  ];

  // Passos do "Como Funciona"
  const howItWorks = [
    {
      step: 1,
      icon: Settings,
      title: "Configure seus Frameworks",
      description: "Selecione os frameworks e regulamentações que sua empresa precisa atender: LGPD, ISO 27001, SOC 2, NIST e mais de 20 outros.",
    },
    {
      step: 2,
      icon: BarChart3,
      title: "Avalie sua Conformidade",
      description: "Responda aos requisitos, anexe evidências e visualize seu score de aderência em tempo real com dashboards interativos.",
    },
    {
      step: 3,
      icon: Target,
      title: "Gerencie e Evolua",
      description: "Crie planos de ação, atribua responsáveis, monitore prazos e acompanhe a evolução da maturidade da sua governança.",
    },
  ];

  // Problemas das planilhas vs GovernAII
  const spreadsheetProblems = [
    { icon: XCircle, problem: "Informações espalhadas em dezenas de arquivos", solution: "Tudo centralizado em um único lugar" },
    { icon: XCircle, problem: "Sem controle de versão e histórico", solution: "Versionamento automático completo" },
    { icon: XCircle, problem: "Erros manuais e dados inconsistentes", solution: "Validações e integridade nativas" },
    { icon: XCircle, problem: "Sem trilha de auditoria", solution: "Logs completos de todas as ações" },
    { icon: XCircle, problem: "Notificações manuais e esquecidas", solution: "Alertas e lembretes automáticos" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
    setShowExitPopup(false);
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 landing-grid-bg opacity-50 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/5 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/public/empresa-logos/Governiaa%20(500%20x%20200%20px).png"
                alt="GovernAII"
                className="h-20 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("modulos")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Módulos
              </button>
              <button
                onClick={() => scrollToSection("como-funciona")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection("beneficios")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("contato")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Contato
              </button>
              <Link to="/auth">
                <button className="h-10 px-4 rounded-md text-sm font-medium border border-blue-400/60 bg-transparent text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all">
                  Fazer Login
                </button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-3">
              <button
                onClick={() => scrollToSection("modulos")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Módulos
              </button>
              <button
                onClick={() => scrollToSection("como-funciona")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection("beneficios")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("contato")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Contato
              </button>
              <Link to="/auth" className="block">
                <button className="w-full h-10 px-4 rounded-md text-sm font-medium border border-blue-400/60 bg-transparent text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all">
                  Fazer Login
                </button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight landing-fade-in-up landing-stagger-2">
                Transforme sua{" "}
                <span className="landing-gradient-text">Governança</span>
                <br />
                em Vantagem Competitiva
              </h1>

              <p className="text-lg text-gray-400 max-w-xl landing-fade-in-up landing-stagger-3">
                Gerencie riscos, controles, conformidade e privacidade em uma única plataforma
                integrada. Automatize processos e tome decisões baseadas em dados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 landing-fade-in-up landing-stagger-4">
                <Button
                  size="lg"
                  onClick={() => scrollToSection("contato")}
                  className="bg-blue-600 hover:bg-blue-700 text-white landing-glow-btn group"
                >
                  Solicitar Demonstração
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link to="/auth">
                  <button
                    className="h-11 px-8 rounded-md text-base font-medium border-2 border-blue-400 bg-transparent text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all w-full sm:w-auto"
                  >
                    Acessar Plataforma
                  </button>
                </Link>
              </div>

              {/* Stats - Indicadores reais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 landing-fade-in-up landing-stagger-5">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <stat.icon className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative landing-fade-in-right landing-stagger-3">
              <div className="relative landing-float">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-3xl rounded-3xl" />
                
                {/* Main Dashboard Card */}
                <div className="relative landing-glass rounded-2xl p-6 landing-border-gradient">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-xs text-gray-500">dashboard.governaii.com.br</span>
                    </div>

                    {/* Score Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">87%</div>
                        <div className="text-xs text-gray-500">Conformidade</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">4.2</div>
                        <div className="text-xs text-gray-500">Score NIST</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-cyan-400">12</div>
                        <div className="text-xs text-gray-500">Riscos Ativos</div>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="h-32 bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg flex items-end justify-around px-4 pb-4">
                      {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                        <div
                          key={i}
                          className="w-6 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>

                    {/* Recent Items */}
                    <div className="space-y-2">
                      {["Auditoria ISO 27001 - Em andamento", "Risco #45 - Mitigação concluída", "Controle AC-01 - Aprovado"].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 rounded-lg p-2">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transition Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Frameworks Carousel */}
      <section className="relative py-8 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-6">
            Frameworks e regulamentações suportados
          </p>
        </div>
        
        {/* Infinite Carousel */}
        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A1628] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A1628] to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling content */}
          <div className="flex animate-scroll-left">
            {/* First set */}
            <div className="flex gap-8 shrink-0 px-4">
              {frameworks.map((framework, index) => (
                <div
                  key={`first-${index}`}
                  className="shrink-0 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all text-sm font-medium whitespace-nowrap"
                >
                  {framework}
                </div>
              ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div className="flex gap-8 shrink-0 px-4">
              {frameworks.map((framework, index) => (
                <div
                  key={`second-${index}`}
                  className="shrink-0 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all text-sm font-medium whitespace-nowrap"
                >
                  {framework}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transition Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Esqueça as Planilhas Section */}
      <section className="relative py-20 bg-gradient-to-b from-[#0A1628] via-[#0F2340] to-[#0A1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Esqueça as <span className="landing-gradient-text">Planilhas</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Centralize toda a governança da sua empresa em um único lugar. 
              Chega de arquivos espalhados, versões desatualizadas e erros manuais.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Visual Transition */}
            <div className="relative">
              <div className="flex items-center justify-center gap-8">
                {/* Spreadsheet Chaos */}
                <div className="relative">
                  <div className="w-48 h-56 bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-2xl border border-red-500/30 p-4 transform -rotate-6 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <TableProperties className="h-5 w-5 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">planilha_v23_final.xlsx</span>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-4 bg-red-500/10 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      ))}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full">
                      DESATUALIZADO
                    </div>
                  </div>
                  <div className="absolute -top-4 -left-4 w-40 h-48 bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-2xl border border-orange-500/30 p-3 transform rotate-3 -z-10">
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-3 bg-orange-500/10 rounded" style={{ width: `${50 + Math.random() * 50}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -top-8 left-8 w-36 h-44 bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-2xl border border-yellow-500/30 p-3 transform -rotate-12 -z-20 opacity-60" />
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 text-blue-400 animate-spin-slow" />
                  <ArrowRight className="h-12 w-12 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">TRANSFORME</span>
                </div>

                {/* GovernAII System */}
                <div className="relative">
                  <div className="w-52 h-60 bg-gradient-to-br from-blue-900/40 to-cyan-800/30 rounded-2xl border border-blue-500/50 p-4 shadow-2xl shadow-blue-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-blue-400" />
                      <span className="text-xs text-blue-400 font-medium">GovernAII</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-gray-300">Riscos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-gray-300">Controles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-gray-300">Gap Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-gray-300">Documentos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-gray-300">Auditorias</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full">
                      INTEGRADO
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Problems vs Solutions */}
            <div className="space-y-4">
              {spreadsheetProblems.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    <span className="text-sm text-gray-400 line-through">{item.problem}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-600 shrink-0" />
                  <div className="flex items-center gap-3 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                    <span className="text-sm text-white font-medium">{item.solution}</span>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
                <p className="text-lg text-white font-medium mb-2">
                  Mais de 500 horas economizadas por ano
                </p>
                <p className="text-sm text-gray-400">
                  Empresas que migram de planilhas para o GovernAII relatam redução significativa 
                  no tempo gasto com gestão manual e retrabalho.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transition Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* How It Works Section */}
      <section id="como-funciona" className="relative py-20 bg-[#0F2340]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Como <span className="landing-gradient-text">Funciona</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Em três passos simples, transforme sua gestão de governança e compliance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-cyan-500/50" />
                )}
                
                <div className="relative landing-glass rounded-2xl p-8 text-center landing-border-gradient hover:transform hover:scale-105 transition-all duration-300">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  
                  <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6 mt-2">
                    <item.icon className="h-8 w-8 text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Diferenciais */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, text: "Avaliação com IA" },
              { icon: FileCheck, text: "Templates Prontos" },
              { icon: BarChart3, text: "Relatórios Executivos" },
              { icon: Shield, text: "Canal de Denúncia Externo" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <item.icon className="h-5 w-5 text-green-400 shrink-0" />
                <span className="text-sm text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Features Section */}
      <section id="modulos" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Módulos <span className="landing-gradient-text">Integrados</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Uma plataforma completa para gestão de governança, riscos e conformidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group landing-glass-light rounded-2xl p-5 hover:bg-white/5 transition-all duration-300 landing-card-glow"
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                <button 
                  onClick={() => setSelectedFeature(index)}
                  className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-300"
                >
                  Saiba mais <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Detail Dialog */}
      <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="bg-[#0F2340] border-white/10 text-white max-w-lg">
          {selectedFeature !== null && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${features[selectedFeature].color} flex items-center justify-center`}>
                    {(() => {
                      const IconComponent = features[selectedFeature].icon;
                      return <IconComponent className="h-5 w-5 text-white" />;
                    })()}
                  </div>
                  {features[selectedFeature].title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-300">{features[selectedFeature].description}</p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                    {features[selectedFeature].details}
                  </p>
                </div>
                <Button 
                  onClick={() => { setSelectedFeature(null); scrollToSection("contato"); }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Solicitar Demonstração
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transition Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Benefits Section */}
      <section id="beneficios" className="relative py-20 bg-[#0F2340]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Por que escolher o{" "}
                <span className="landing-gradient-text">GovernAII</span>?
              </h2>
              <p className="text-gray-400">
                Desenvolvido por especialistas em governança para atender às demandas
                reais de compliance, segurança e gestão de riscos.
              </p>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <benefit.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                      <p className="text-sm text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="landing-glass rounded-2xl p-8 landing-border-gradient">
                <div className="grid grid-cols-2 gap-6">
                  {benefitStats.map((stat, index) => (
                    <div
                      key={index}
                      className="text-center p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <stat.icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transition Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Contact Section */}
      <section id="contato" className="relative py-20 bg-[#0F2340]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Pronto para transformar sua{" "}
                <span className="landing-gradient-text">Governança</span>?
              </h2>
              <p className="text-gray-400">
                Entre em contato com nossa equipe e descubra como o GovernAII pode
                ajudar sua empresa a atingir excelência em compliance e gestão de riscos.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>Demonstração personalizada da plataforma</span>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>Consultoria inicial gratuita</span>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>Implantação assistida por especialistas</span>
                </div>
              </div>
            </div>

            <div className="relative z-20 landing-glass rounded-2xl p-8 landing-border-gradient">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="seu@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Empresa
                    </label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Nome da empresa"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefone
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mensagem *
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Como podemos ajudar sua empresa?"
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white landing-glow-btn"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src="https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/public/empresa-logos/Governiaa%20(500%20x%20200%20px).png"
                  alt="GovernAII"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-gray-400 text-sm max-w-sm">
                Plataforma completa para gestão de governança, riscos e conformidade.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Plataforma</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection("modulos")}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Módulos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("como-funciona")}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Como Funciona
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("beneficios")}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Benefícios
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection("contato")}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Fale Conosco
                  </button>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Acessar Plataforma
                  </Link>
                </li>
                <li>
                  <Link
                    to="/politica-privacidade"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} GovernAII. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <Dialog open={showExitPopup} onOpenChange={setShowExitPopup}>
        <DialogContent className="bg-[#0A1628] border-blue-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-blue-400" />
              Espere!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <p className="text-gray-300">
              Não vá embora sem conhecer como o GovernAII pode{" "}
              <span className="text-blue-400 font-semibold">transformar a governança</span> da sua empresa!
            </p>
            <p className="text-sm text-gray-400">
              Agende uma demonstração gratuita e veja na prática como 
              automatizar compliance, riscos e auditorias.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => { setShowExitPopup(false); scrollToSection("contato"); }}
                className="bg-blue-600 hover:bg-blue-700 py-6"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Quero conhecer mais!
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowExitPopup(false)}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                Não, obrigado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS for carousel animation */}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
