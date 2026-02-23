import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Target, Lightbulb, ArrowRight, Shield, Scale, Lock } from 'lucide-react';

interface FrameworkOnboardingProps {
  frameworkNome: string;
  frameworkVersao: string;
  frameworkTipo: string;
  totalRequirements: number;
  onStart: () => void;
}

interface FrameworkInfo {
  icon: React.ReactNode;
  description: string;
  timeEstimate: string;
  steps: string[];
  quickTips: string[];
}

function getFrameworkInfo(nome: string, tipo: string, total: number): FrameworkInfo {
  const lowerName = nome.toLowerCase();

  if (lowerName.includes('iso') && nome.includes('27001')) {
    return {
      icon: <Shield className="h-8 w-8 text-primary" />,
      description: 'A ISO/IEC 27001 é o padrão internacional para Sistemas de Gestão de Segurança da Informação (SGSI). Ela define requisitos para estabelecer, implementar, manter e melhorar continuamente a segurança da informação.',
      timeEstimate: '3 a 6 meses para primeira avaliação completa',
      steps: [
        'Comece pelos requisitos do SGSI (Cláusulas 4 a 10) — são a base obrigatória',
        'Em seguida, avalie os controles do Anexo A aplicáveis ao seu contexto',
        'Foque primeiro nos controles organizacionais (A.5) pois são documentais',
        'Deixe controles tecnológicos (A.8) por último pois exigem evidências técnicas',
      ],
      quickTips: [
        'Se você já tem uma política de segurança, vários requisitos do capítulo 5 provavelmente já são "Parcial"',
        'Requisitos marcados como "Não Aplicável" precisam de justificativa formal (SoA)',
        'Comece documentando o que já existe antes de criar novos processos',
      ],
    };
  }

  if (lowerName.includes('nist')) {
    return {
      icon: <Target className="h-8 w-8 text-primary" />,
      description: 'O NIST Cybersecurity Framework (CSF) organiza práticas de segurança em 6 funções: Governar, Identificar, Proteger, Detectar, Responder e Recuperar. É flexível e baseado em maturidade.',
      timeEstimate: '2 a 4 meses para avaliação inicial',
      steps: [
        'Inicie pelo pilar "GOVERN" — é a base de governança e direcionamento',
        'Avalie "IDENTIFY" para mapear ativos e riscos conhecidos',
        'Depois avance para "PROTECT" e "DETECT" em paralelo',
        '"RESPOND" e "RECOVER" geralmente dependem dos anteriores',
      ],
      quickTips: [
        'O NIST usa escala de maturidade (0-5), não binário conforme/não conforme',
        'Nível 2-3 já é considerado adequado para maioria das organizações',
        'Foque em ter processos documentados e repetíveis para subir de nível',
      ],
    };
  }

  if (lowerName.includes('lgpd')) {
    return {
      icon: <Scale className="h-8 w-8 text-primary" />,
      description: 'A LGPD (Lei Geral de Proteção de Dados) regulamenta o tratamento de dados pessoais no Brasil. A conformidade é obrigatória para todas as empresas que tratam dados de pessoas físicas.',
      timeEstimate: '2 a 3 meses para avaliação completa',
      steps: [
        'Comece mapeando as bases legais de tratamento (Art. 7)',
        'Avalie os direitos dos titulares (Art. 18) — são os mais cobrados pela ANPD',
        'Verifique medidas de segurança (Art. 46) e governança (Art. 50)',
        'Documente o processo de notificação de incidentes (Art. 48)',
      ],
      quickTips: [
        'Se você já tem um DPO/Encarregado nomeado, vários itens já são "Parcial"',
        'Política de Privacidade publicada cobre múltiplos requisitos',
        'Mapeamento de dados (ROPA) é evidência para diversos artigos',
      ],
    };
  }

  // Generic
  return {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    description: `Este framework contém ${total} requisitos para avaliação de conformidade. Avalie cada requisito conforme a situação atual da sua organização.`,
    timeEstimate: `${Math.ceil(total / 10)} a ${Math.ceil(total / 5)} semanas estimadas`,
    steps: [
      'Faça uma primeira passagem rápida marcando os itens que claramente você já atende',
      'Depois revise os itens parciais — muitos podem ser resolvidos com documentação',
      'Foque nos itens de maior peso/criticidade para maximizar o score',
      'Use a IA para obter orientação específica nos itens que geram dúvida',
    ],
    quickTips: [
      'Não tente avaliar tudo de uma vez — divida por categorias',
      'Marque como "Não Aplicável" apenas quando realmente não se aplica ao seu contexto',
      'Evidências são fundamentais — anexe documentos, prints e registros sempre que possível',
    ],
  };
}

export function FrameworkOnboarding({ frameworkNome, frameworkVersao, frameworkTipo, totalRequirements, onStart }: FrameworkOnboardingProps) {
  const info = getFrameworkInfo(frameworkNome, frameworkTipo, totalRequirements);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            {info.icon}
          </div>
          <h2 className="text-2xl font-bold mb-2">{frameworkNome} {frameworkVersao}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{info.description}</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" /> {totalRequirements} requisitos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> {info.timeEstimate}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Roteiro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Roteiro Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Dicas de Quem Já Passou Por Isso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {info.quickTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center pb-4">
        <Button size="lg" onClick={onStart} className="gap-2">
          Começar Avaliação <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Você pode usar a IA a qualquer momento para tirar dúvidas sobre cada requisito
        </p>
      </div>
    </div>
  );
}
