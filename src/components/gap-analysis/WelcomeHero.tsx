import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FrameworkLogo } from './FrameworkLogos';
import { ArrowRight } from 'lucide-react';

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

export function WelcomeHero({ onFrameworkClick, onShowCatalog, suggestedFrameworks }: WelcomeHeroProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Comece aqui</Badge>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          Comece sua jornada de compliance
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xl">
          Escolha um framework abaixo para iniciar a avaliação. Recomendamos começar pelo padrão mais relevante para o seu negócio.
        </p>

        {/* Frameworks recomendados — destaque principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {suggestedFrameworks.slice(0, 3).map((fw) => (
            <Card
              key={fw.id}
              className="group p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all bg-background"
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
