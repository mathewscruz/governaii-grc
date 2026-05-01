import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FrameworkLogo } from './FrameworkLogos';
import { ArrowRight, Sparkles, Search, Brain, BarChart3 } from 'lucide-react';

interface SuggestedFramework {
  id: string;
  nome: string;
  versao: string;
  descricao?: string;
  tipo_framework: string;
}

interface WelcomeHeroProps {
  onFrameworkClick: (id: string) => void;
  onShowCatalog: () => void;
  suggestedFrameworks: SuggestedFramework[];
}

const FRAMEWORK_AUDIENCES: Record<string, string> = {
  'ISO 27001': 'Para empresas que precisam certificar seu sistema de gestão de segurança da informação',
  'LGPD': 'Para empresas que processam dados pessoais no Brasil',
  'NIST CSF 2.0': 'Para organizações que buscam maturidade em cibersegurança',
  'ISO 27701': 'Para empresas que precisam de gestão de privacidade integrada à ISO 27001',
  'PCI DSS': 'Para empresas que processam dados de cartões de pagamento',
  'SOC 2': 'Para empresas de tecnologia que precisam demonstrar controles de segurança',
  'NIST SP 800-82': 'Para indústrias e utilities com sistemas de controle industrial (OT/ICS)',
  'DORA': 'Para entidades financeiras europeias com requisitos de resiliência operacional digital',
  'ISO/IEC 62443': 'Para operadores e fornecedores de sistemas de automação industrial (IACS)',
};

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: 'Escolha um framework',
    description: 'Selecione o padrão mais relevante para o seu negócio',
  },
  {
    icon: Brain,
    title: 'Avalie com ajuda da IA',
    description: 'A IA explica cada requisito e sugere o status adequado',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe e trate gaps',
    description: 'Monitore seu score e crie planos de ação para evoluir',
  },
];

export function WelcomeHero({ onFrameworkClick, onShowCatalog, suggestedFrameworks }: WelcomeHeroProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="p-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.5}/>
          <Badge variant="secondary" className="text-xs">Novo</Badge>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Comece sua jornada de compliance
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl">
          Escolha um framework para começar sua avaliação de conformidade. 
          Recomendamos iniciar pelo que mais se aplica ao seu negócio.
        </p>

        {/* Como funciona? */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{`${i + 1}. ${step.title}`}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Frameworks sugeridos */}
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Frameworks recomendados para começar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {suggestedFrameworks.slice(0, 3).map((fw) => (
            <Card
              key={fw.id}
              className="group p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              onClick={() => onFrameworkClick(fw.id)}
            >
              <div className="flex items-start gap-3">
                <FrameworkLogo nome={fw.nome} className="h-10 w-10 shrink-0 mt-0.5"/>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {fw.nome}
                  </h3>
                  <span className="text-xs text-muted-foreground">{fw.versao}</span>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {FRAMEWORK_AUDIENCES[fw.nome] || fw.descricao || 'Framework de conformidade organizacional'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" strokeWidth={1.5}/>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={onShowCatalog}>
          Ver todos os frameworks disponíveis
          <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5}/>
        </Button>
      </div>
    </Card>
  );
}
