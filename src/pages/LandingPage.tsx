import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });

      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GovernAII</span>
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
      <section className="py-20 px-4 text-center bg-gradient-to-br from-background via-background/50 to-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            Plataforma de Governança Corporativa
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Transforme a 
            <span className="text-primary"> Governança</span> da sua Empresa
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Plataforma completa para gestão de riscos, controles internos, auditorias e conformidade regulatória. 
            Mantenha sua organização segura e em compliance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="gap-2" asChild>
              <Link to="#contato">
                Solicitar Demonstração
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">
                Acessar Plataforma
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Módulos Integrados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma solução completa que cobre todos os aspectos da governança corporativa
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-3">
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Por que escolher o GovernAII?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Automação Inteligente</h3>
                    <p className="text-muted-foreground">Reduza o trabalho manual com processos automatizados e integrações nativas.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Dashboards Analíticos</h3>
                    <p className="text-muted-foreground">Visualize métricas em tempo real e tome decisões baseadas em dados.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Award className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Conformidade Garantida</h3>
                    <p className="text-muted-foreground">Mantenha-se sempre em compliance com regulamentações nacionais e internacionais.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Zap className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Implementação Rápida</h3>
                    <p className="text-muted-foreground">Setup completo em poucos dias com migração assistida dos seus dados.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Segurança Enterprise
                </h3>
                <p className="text-muted-foreground mb-6">
                  Seus dados protegidos com criptografia de ponta, backup automático e compliance com padrões internacionais de segurança.
                </p>
                <Badge variant="secondary" className="text-sm">
                  ISO 27001 • LGPD • SOC 2
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Entre em Contato
            </h2>
            <p className="text-lg text-muted-foreground">
              Agende uma demonstração personalizada e veja como o GovernAII pode transformar sua governança
            </p>
          </div>
          
          <Card className="border-border">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-mail *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Empresa
                    </label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefone
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mensagem *
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Conte-nos sobre suas necessidades de governança..."
                    rows={4}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Solicitar Contato
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GovernAII</span>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Transformando a governança corporativa através da tecnologia
          </p>
          
          <p className="text-sm text-muted-foreground">
            © 2024 GovernAII. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}