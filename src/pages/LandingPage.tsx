import { useState, useEffect } from "react";
import akurisLogo from "@/assets/akuris-logo.png";
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
  
  ChevronRight,
  Target,
  Settings,
  BarChart3,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll-triggered fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".lp-fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
    } catch {
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

  // 4 feature cards for the 2x2 grid (Ferramentas Inteligentes)
  const smartTools = [
    {
      icon: AlertTriangle,
      title: "Análise de Riscos em Tempo Real",
      description: "Identifique, avalie e monitore riscos com dashboards interativos, matriz de calor e sugestões de tratamento com IA.",
      gradient: "from-orange-500/20 to-red-500/20",
      border: "border-orange-500/30",
      iconColor: "text-orange-400",
    },
    {
      icon: FileCheck,
      title: "Controles Internos Categorizados",
      description: "Organize controles por área, criticidade e frequência. Acompanhe testes, evidências e vincule a auditorias automaticamente.",
      gradient: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
      iconColor: "text-green-400",
    },
    {
      icon: BarChart3,
      title: "Score de Conformidade",
      description: "Avalie aderência a mais de 20 frameworks com scoring automático, gráficos radar e relatórios executivos em PDF.",
      gradient: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      icon: FileText,
      title: "Gestão de Documentos",
      description: "Repositório centralizado com versionamento, workflow de aprovação, geração com IA e controle de validade.",
      gradient: "from-purple-500/20 to-indigo-500/20",
      border: "border-purple-500/30",
      iconColor: "text-purple-400",
    },
  ];

  const frameworks = [
    "NIST CSF 2.0", "ISO 27001", "ISO 27701", "ISO 9001", "ISO 14001",
    "ISO 31000", "ISO 37301", "ISO/IEC 20000", "LGPD", "GDPR",
    "CCPA", "HIPAA", "PCI DSS 4.0", "SOC 2 Type II", "SOX",
    "COBIT 2019", "COSO ERM", "COSO IC", "CIS Controls v8", "ITIL v4",
  ];

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

  const testimonials = [
    {
      text: "Conseguimos reduzir o tempo de auditoria em mais de 60% e finalmente temos visibilidade real dos nossos riscos operacionais.",
      name: "Ana C.",
      role: "CISO",
      company: "Empresa do setor financeiro",
    },
    {
      text: "Antes usávamos 5 ferramentas diferentes. Centralizar tudo numa única plataforma mudou completamente nossa eficiência em compliance.",
      name: "Ricardo O.",
      role: "Diretor de Compliance",
      company: "Empresa do setor de tecnologia",
    },
    {
      text: "A avaliação automatizada nos ajudou a identificar gaps que não tínhamos visibilidade antes. O retorno sobre o investimento foi rápido.",
      name: "Mariana C.",
      role: "DPO",
      company: "Empresa do setor de saúde",
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white overflow-x-hidden">
      {/* Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md">
        Pular para o conteúdo principal
      </a>


      {/* ===== HEADER ===== */}
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/5 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <img
              src={akurisLogo}
              alt="Akuris - Plataforma de Governança, Riscos e Conformidade"
              className="h-12 sm:h-16 md:h-20 w-auto"
              loading="eager"
            />

            <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Navegação principal">
              <button onClick={() => scrollToSection("ferramentas")} className="text-sm text-gray-300 hover:text-white transition-colors">Ferramentas</button>
              <button onClick={() => scrollToSection("como-funciona")} className="text-sm text-gray-300 hover:text-white transition-colors">Como Funciona</button>
              <button onClick={() => scrollToSection("modulos")} className="text-sm text-gray-300 hover:text-white transition-colors">Módulos</button>
              <button onClick={() => scrollToSection("contato")} className="text-sm text-gray-300 hover:text-white transition-colors">Contato</button>
              <Link to="/auth">
                <button className="h-10 px-5 rounded-lg text-sm font-medium border border-blue-400/60 bg-transparent text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all">
                  Acessar Plataforma
                </button>
              </Link>
            </nav>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-3">
              <button onClick={() => scrollToSection("ferramentas")} className="block w-full text-left text-gray-300 hover:text-white py-2">Ferramentas</button>
              <button onClick={() => scrollToSection("como-funciona")} className="block w-full text-left text-gray-300 hover:text-white py-2">Como Funciona</button>
              <button onClick={() => scrollToSection("modulos")} className="block w-full text-left text-gray-300 hover:text-white py-2">Módulos</button>
              <button onClick={() => scrollToSection("contato")} className="block w-full text-left text-gray-300 hover:text-white py-2">Contato</button>
              <Link to="/auth" className="block">
                <button className="w-full h-10 px-4 rounded-lg text-sm font-medium border border-blue-400/60 bg-transparent text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all">
                  Acessar Plataforma
                </button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" role="main">

        {/* ===== 1. HERO — Centralizado ===== */}
        <section className="relative min-h-[90vh] flex items-center pt-24 pb-12" aria-labelledby="hero-title">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            <h1 id="hero-title" className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 lp-fade-up lp-visible">
              Gestão de{" "}
              <span className="landing-gradient-text">Riscos</span>,{" "}
              <span className="landing-gradient-text">Compliance</span>{" "}
              e <span className="landing-gradient-text">Governança</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 lp-fade-up lp-visible leading-relaxed">
              Centralize toda a gestão de governança, riscos e conformidade em uma única plataforma.
              Automatize processos, avalie aderência a frameworks e tome decisões baseadas em dados.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 lp-fade-up lp-visible">
              <Button
                size="lg"
                onClick={() => scrollToSection("contato")}
                className="bg-blue-600 hover:bg-blue-700 text-white group text-base px-8 h-12"
              >
                Solicitar Demonstração
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/auth">
                <button className="h-12 px-8 rounded-lg text-base font-medium border-2 border-blue-400 bg-transparent text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all w-full sm:w-auto">
                  Acessar Plataforma
                </button>
              </Link>
            </div>

            {/* Dashboard Mockup — Centralizado */}
            <div className="relative max-w-4xl mx-auto lp-fade-up lp-visible">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-3xl -z-10" />
              <div className="relative bg-white rounded-2xl p-4 sm:p-6 shadow-2xl shadow-blue-500/10">
                <div className="space-y-4">
                  {/* Window chrome */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <img src={akurisLogo} alt="Akuris" className="h-5 object-contain" />
                  </div>

                  {/* Score Cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: "87%", label: "Conformidade", color: "text-green-600" },
                      { value: "4.2", label: "Score NIST", color: "text-blue-600" },
                      { value: "12", label: "Riscos Ativos", color: "text-orange-600" },
                      { value: "98%", label: "Controles OK", color: "text-cyan-600" },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className={`text-lg sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="h-20 sm:h-28 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-around px-4 pb-3">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60].map((h, i) => (
                      <div key={i} className="w-3 sm:w-5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 2. FRAMEWORKS STRIP ===== */}
        <section className="relative py-8 border-y border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 mb-6">
              Frameworks e regulamentações suportados
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#0A1628] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#0A1628] to-transparent z-10 pointer-events-none" />
            <div className="flex animate-scroll-left">
              {[0, 1].map((set) => (
                <div key={set} className="flex gap-4 sm:gap-6 shrink-0 px-4">
                  {frameworks.map((fw, i) => (
                    <div key={`${set}-${i}`} className="shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all text-xs sm:text-sm font-medium whitespace-nowrap">
                      {fw}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 3. FERRAMENTAS INTELIGENTES — Grid 2x2 ===== */}
        <section id="ferramentas" className="relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 lp-fade-up">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Ferramentas <span className="landing-gradient-text">Inteligentes</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Tudo o que você precisa para gerenciar governança, riscos e conformidade em um só lugar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lp-fade-up">
              {smartTools.map((tool, index) => (
                <div
                  key={index}
                  className={`group relative rounded-2xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br ${tool.gradient} backdrop-blur-sm border ${tool.border} transition-all duration-300`}
                >
                  <div className={`inline-flex p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 sm:mb-6 group-hover:scale-110 transition-transform`}>
                    <tool.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${tool.iconColor}`} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{tool.title}</h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ===== 4. COMO FUNCIONA — 3 cards ===== */}
        <section id="como-funciona" className="relative py-16 sm:py-20 lg:py-28 bg-[#0F2340]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 lp-fade-up">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Como o <span className="landing-gradient-text">Akuris</span> Funciona?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Em três passos simples, transforme sua gestão de governança e compliance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lp-fade-up">
              {howItWorks.map((item, index) => (
                <div key={index} className="relative">
                  <div className="relative bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-300 text-center">
                    {/* Step badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                      {item.step}
                    </div>
                    <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6 mt-3">
                      <item.icon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ===== MÓDULOS COMPLETOS ===== */}
        <section id="modulos" className="relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 lp-fade-up">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Módulos <span className="landing-gradient-text">Integrados</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Uma plataforma completa para gestão de governança, riscos e conformidade
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lp-fade-up">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-white/[0.03] backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-300"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                  <button
                    onClick={() => setSelectedFeature(index)}
                    className="mt-4 flex items-center text-blue-400 text-xs sm:text-sm font-medium sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-blue-300"
                  >
                    Saiba mais <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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
                      {(() => { const Icon = features[selectedFeature].icon; return <Icon className="h-5 w-5 text-white" />; })()}
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


        {/* ===== 5. TESTIMONIALS ===== */}
        <section className="relative py-16 sm:py-20 lg:py-28 bg-[#0F2340]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 lp-fade-up">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                O que dizem nossos <span className="landing-gradient-text">clientes</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Empresas de diversos segmentos confiam no Akuris para transformar sua governança
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lp-fade-up">
              {testimonials.map((t, index) => (
                <div
                  key={index}
                  className="relative bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-blue-500/20 transition-all duration-300"
                >
                  <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.role} • {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ===== 6. CTA BANNER ===== */}
        <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-600/20" />
          <div className="absolute inset-0 bg-[#0A1628]/60" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center lp-fade-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Veja o Akuris em <span className="landing-gradient-text">Ação</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Comece a gerenciar riscos, compliance e governança de forma inteligente. Solicite uma demonstração personalizada.
            </p>
            <Button
              size="lg"
              onClick={() => scrollToSection("contato")}
              className="bg-blue-600 hover:bg-blue-700 text-white group text-base px-10 h-12"
            >
              Solicitar Demonstração
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>

        

        {/* ===== 7. CONTATO ===== */}
        <section id="contato" className="relative py-16 sm:py-20 lg:py-28 bg-[#0F2340]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
              <div className="w-full lg:flex-1 space-y-6 sm:space-y-8 lp-fade-up">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  Pronto para transformar sua{" "}
                  <span className="landing-gradient-text">Governança</span>?
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  Entre em contato com nossa equipe e descubra como o Akuris pode
                  ajudar sua empresa a atingir excelência em compliance e gestão de riscos.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: CheckCircle2, text: "Demonstração personalizada da plataforma" },
                    { icon: CheckCircle2, text: "Consultoria inicial gratuita" },
                    { icon: CheckCircle2, text: "Implantação assistida por especialistas" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-gray-300">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="text-sm sm:text-base">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-20 w-full lg:flex-1 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 lp-fade-up">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                      <Input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Seu nome" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                      <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="seu@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Empresa</label>
                      <Input name="company" value={formData.company} onChange={handleInputChange} placeholder="Nome da empresa" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                      <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem *</label>
                    <Textarea name="message" value={formData.message} onChange={handleInputChange} required placeholder="Como podemos ajudar sua empresa?" rows={4} className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 resize-none" />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== 8. FOOTER — 4 colunas ===== */}
      <footer className="relative py-12 sm:py-16 border-t border-white/5" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10">
            {/* Col 1 - Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <img src={akurisLogo} alt="Akuris" className="h-12 w-auto mb-4" />
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Plataforma completa para gestão de governança, riscos e conformidade. Tudo em um só lugar.
              </p>
              <div className="flex gap-3 mt-5">
                <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-all" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-all" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-all" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Col 2 - Produto */}
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => scrollToSection("ferramentas")} className="text-gray-400 hover:text-white text-sm transition-colors">Ferramentas</button></li>
                <li><button onClick={() => scrollToSection("modulos")} className="text-gray-400 hover:text-white text-sm transition-colors">Módulos</button></li>
                <li><button onClick={() => scrollToSection("como-funciona")} className="text-gray-400 hover:text-white text-sm transition-colors">Como Funciona</button></li>
              </ul>
            </div>

            {/* Col 3 - Recursos */}
            <div>
              <h4 className="font-semibold text-white mb-4">Recursos</h4>
              <ul className="space-y-2.5">
                <li><Link to="/politica-privacidade" className="text-gray-400 hover:text-white text-sm transition-colors">Política de Privacidade</Link></li>
                <li><button onClick={() => scrollToSection("contato")} className="text-gray-400 hover:text-white text-sm transition-colors">Suporte</button></li>
              </ul>
            </div>

            {/* Col 4 - Localização */}
            <div>
              <h4 className="font-semibold text-white mb-4">Localização</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-base shrink-0">🇧🇷</span>
                  São Paulo - Brazil
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-base shrink-0">🇵🇹</span>
                  Porto - PT
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs sm:text-sm">
              © {new Date().getFullYear()} Akuris. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <Link to="/politica-privacidade" className="text-gray-500 hover:text-gray-300 text-xs sm:text-sm transition-colors">Privacidade</Link>
              <Link to="/auth" className="text-gray-500 hover:text-gray-300 text-xs sm:text-sm transition-colors">Acessar Plataforma</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
        .lp-fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .lp-fade-up.lp-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
