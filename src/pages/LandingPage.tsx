import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import governanceBadge from "@/assets/governance-security-badge.png";
import {
  Shield,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Lock,
  Zap,
  Award,
  ArrowRight,
  Mail,
  Phone,
  Building,
  User,
  MessageSquare,
  LogIn
} from "lucide-react";

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) throw error;

      toast.success("Mensagem enviada! Entraremos em contato em breve.");

      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      toast.error("Erro ao enviar. Tente novamente em alguns instantes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Gestão de Riscos",
      description: "Identificação, avaliação e monitoramento contínuo de riscos corporativos com metodologias avançadas."
    },
    {
      icon: FileText,
      title: "Controles Internos",
      description: "Implementação e acompanhamento de controles eficazes com testes automatizados e evidências."
    },
    {
      icon: Users,
      title: "Auditorias",
      description: "Planejamento e execução de auditorias internas com gestão completa de achados e recomendações."
    },
    {
      icon: Lock,
      title: "Proteção de Dados",
      description: "Conformidade com LGPD incluindo mapeamento, ROPA e gestão de direitos dos titulares."
    },
    {
      icon: AlertTriangle,
      title: "Gestão de Incidentes",
      description: "Registro, investigação e tratamento de incidentes com comunicação automática aos reguladores."
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Central de documentos com controle de versão, aprovações e gestão de ciclo de vida."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(20).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDIwKS5wbmciLCJpYXQiOjE3NTY4MjA3MzIsImV4cCI6MTc4ODM1NjczMn0.lPzbjAHL4z4wjBU8WTAL-IvS3D6W-MjCU47clsRo1t0" 
              alt="GovernAII" 
              className="h-12 w-auto"
            />
          </div>
          
          <Link to="/auth">
            <Button variant="outline" className="gap-2">
              <LogIn className="w-4 h-4" />
              Fazer Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-28 px-4 text-center bg-gradient-to-br from-background via-primary/5 to-muted/40 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-rgb),0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(var(--primary-rgb),0.03),transparent_50%)]" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="mb-8 flex justify-center">
            <img 
              src={governanceBadge} 
              alt="Governança e Segurança" 
              className="h-20 w-auto opacity-90"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-8 leading-[1.1] tracking-tight">
            Transforme a 
            <span className="text-primary"> Governança</span> da sua Empresa
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
            Plataforma completa para gestão de riscos, controles internos, auditorias e conformidade regulatória. 
            Mantenha sua organização segura e em compliance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="gap-2 text-base font-semibold px-8 py-6 shadow-lg hover:shadow-xl transition-all" 
              onClick={() => {
                document.getElementById('contato')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Solicitar Demonstração
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button variant="outline" size="lg" className="text-base font-semibold px-8 py-6" asChild>
              <Link to="/auth">
                Acessar Plataforma
              </Link>
            </Button>
          </div>
          
          {/* Frameworks */}
          <div className="mt-16 pt-12 border-t border-border/50">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Frameworks do GovernAII
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 opacity-70">
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 27001</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 27701</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ITIL</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">COBIT</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">HIPAA</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">LGPD</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">GDPR</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">SOC 2</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 31000</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 9001</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 14001</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">NIST</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">PCI DSS</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">CIS Controls</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">CMMI</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 22301</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 20000</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">COSO</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">FISMA</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">FedRAMP</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 27017</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 27018</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">SAMA</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">NCA ECC</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">SWIFT CSP</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ISO 45001</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">TISAX</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">ENS</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">CSA STAR</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">HITRUST</Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 font-semibold">CCPA</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 px-4 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
              Módulos Integrados
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
              Uma solução completa que cobre todos os aspectos da governança corporativa
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 border-border/60 hover:border-primary/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-28 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-10 tracking-tight">
                Por que escolher o GovernAII?
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Automação Inteligente</h3>
                    <p className="text-muted-foreground leading-relaxed">Reduza o trabalho manual com processos automatizados e integrações nativas.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Dashboards Analíticos</h3>
                    <p className="text-muted-foreground leading-relaxed">Visualize métricas em tempo real e tome decisões baseadas em dados.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Conformidade Garantida</h3>
                    <p className="text-muted-foreground leading-relaxed">Mantenha-se sempre em compliance com regulamentações nacionais e internacionais.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Implementação Rápida</h3>
                    <p className="text-muted-foreground leading-relaxed">Setup completo em poucos dias com migração assistida dos seus dados.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-3xl p-10 border-2 border-primary/30 shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-8 shadow-xl">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-3xl font-extrabold text-foreground mb-5 tracking-tight">
                  Segurança Enterprise
                </h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Seus dados protegidos com criptografia de ponta, backup automático e compliance com padrões internacionais de segurança.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge variant="secondary" className="text-sm font-bold px-4 py-2">ISO 27001</Badge>
                  <Badge variant="secondary" className="text-sm font-bold px-4 py-2">LGPD</Badge>
                  <Badge variant="secondary" className="text-sm font-bold px-4 py-2">SOC 2</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-28 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
              Entre em Contato
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-medium">
              Agende uma demonstração personalizada e veja como o GovernAII pode transformar sua governança
            </p>
          </div>
          
          <Card className="border-2 border-border/60 shadow-2xl backdrop-blur-sm bg-card/80">
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                      className="border-2 focus:border-primary h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-mail *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      className="border-2 focus:border-primary h-12"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Empresa
                    </label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Nome da empresa"
                      className="border-2 focus:border-primary h-12"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefone
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                      className="border-2 focus:border-primary h-12"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mensagem *
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Conte-nos sobre suas necessidades de governança..."
                    rows={5}
                    className="border-2 focus:border-primary resize-none"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Solicitar Contato
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t-2 border-border py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-4">
              <img 
                src="https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(20).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDIwKS5wbmciLCJpYXQiOjE3NTY4MjA3MzIsImV4cCI6MTc4ODM1NjczMn0.lPzbjAHL4z4wjBU8WTAL-IvS3D6W-MjCU47clsRo1t0" 
                alt="GovernAII" 
                className="h-10 w-auto"
              />
              <p className="text-muted-foreground leading-relaxed">
                Transformando a governança corporativa através da tecnologia
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4 text-lg">Plataforma</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Módulos</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Integrações</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Segurança</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Preços</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4 text-lg">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#contato" className="text-muted-foreground hover:text-primary transition-colors">Contato</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground font-medium">
              © 2025 GovernAII. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}