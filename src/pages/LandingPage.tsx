import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  Globe,
  Award,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      description: "Identifique, avalie e mitigue riscos com matriz de calor e planos de tratamento inteligentes.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Gap Analysis",
      description: "Avalie conformidade com NIST, ISO 27001, LGPD e outros frameworks com scoring automático.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: FileCheck,
      title: "Controles Internos",
      description: "Gerencie controles, auditorias e evidências em um único lugar com fluxos automatizados.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Contas Privilegiadas",
      description: "Controle acessos críticos com workflow de aprovação e revisão periódica de acessos.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Database,
      title: "Proteção de Dados",
      description: "Mapeie dados pessoais, gerencie ROPA e atenda solicitações de titulares com agilidade.",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Centralize políticas e procedimentos com versionamento, aprovação e distribuição.",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Garantido", icon: Zap },
    { value: "50%", label: "Redução de Tempo", icon: Clock },
    { value: "100%", label: "Conformidade LGPD", icon: Target },
    { value: "24/7", label: "Suporte Disponível", icon: Globe },
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
      icon: Sparkles,
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
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
            <div className="flex items-center gap-3">
              <img
                src="/governaii-logo.png"
                alt="GovernAII"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold tracking-tight">GovernAII</span>
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
                onClick={() => scrollToSection("beneficios")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("seguranca")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Segurança
              </button>
              <button
                onClick={() => scrollToSection("contato")}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Contato
              </button>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="border-blue-500/50 text-white hover:bg-blue-500/10 hover:border-blue-400"
                >
                  Fazer Login
                </Button>
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
                onClick={() => scrollToSection("beneficios")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("seguranca")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Segurança
              </button>
              <button
                onClick={() => scrollToSection("contato")}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                Contato
              </button>
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full border-blue-500/50 text-white">
                  Fazer Login
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="landing-fade-in-up landing-stagger-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Plataforma GRC Completa
                </span>
              </div>

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
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/5 w-full sm:w-auto"
                  >
                    Acessar Plataforma
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 landing-fade-in-up landing-stagger-5">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
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

      {/* Social Proof */}
      <section className="relative py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">
            Frameworks e regulamentações suportados
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {["NIST CSF 2.0", "ISO 27001", "LGPD", "GDPR", "SOC 2", "PCI DSS", "COBIT"].map(
              (framework, index) => (
                <div
                  key={index}
                  className="text-gray-500 hover:text-white transition-colors text-sm md:text-base font-medium"
                >
                  {framework}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="modulos" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Módulos <span className="landing-gradient-text">Integrados</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Uma plataforma completa para gestão de governança, riscos e conformidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group landing-glass-light rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 landing-card-glow"
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Saiba mais <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="relative py-24 bg-[#0F2340]/50">
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
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="text-center p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
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

      {/* Security Section */}
      <section id="seguranca" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="landing-glass rounded-3xl p-8 md:p-12 landing-border-gradient text-center">
            <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 mb-6">
              <Lock className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Segurança de <span className="landing-gradient-text">Nível Empresarial</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Seus dados protegidos com as melhores práticas de segurança do mercado.
              Isolamento completo entre empresas, criptografia e logs de auditoria.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {["Criptografia AES-256", "Isolamento de Dados", "Backup Automático", "MFA Disponível", "Logs de Auditoria"].map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    {item}
                  </div>
                )
              )}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="flex items-center gap-2 text-gray-400">
                <Award className="h-5 w-5" />
                <span className="text-sm">Em conformidade com LGPD</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="h-5 w-5" />
                <span className="text-sm">SOC 2 Type II Ready</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Globe className="h-5 w-5" />
                <span className="text-sm">Infraestrutura no Brasil</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="relative py-24 bg-[#0F2340]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            <div className="landing-glass rounded-2xl p-8 landing-border-gradient">
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
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
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
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
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
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
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
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 resize-none"
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
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/governaii-logo.png"
                  alt="GovernAII"
                  className="h-8 w-auto"
                />
                <span className="text-lg font-bold">GovernAII</span>
              </div>
              <p className="text-gray-400 text-sm max-w-sm">
                Plataforma completa para gestão de governança, riscos e conformidade.
                Desenvolvida no Brasil para atender às necessidades do mercado nacional.
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
                    onClick={() => scrollToSection("beneficios")}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Benefícios
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("seguranca")}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Segurança
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
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} GovernAII. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Globe className="h-4 w-4" />
              <span>Feito no Brasil 🇧🇷</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
