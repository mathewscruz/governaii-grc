import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FrameworkLogo } from "./FrameworkLogos";

interface FrameworkCardProps {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  requirementCount: number;
  onClick: () => void;
}

export const FrameworkCard: React.FC<FrameworkCardProps> = ({
  nome,
  versao,
  descricao,
  onClick,
}) => {
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      {/* Logo centralizado */}
      <div className="flex justify-center pt-8 pb-4">
        <FrameworkLogo nome={nome} className="h-16 w-16" />
      </div>
      
      {/* Nome e versão */}
      <div className="text-center px-4 pb-2">
        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
          {nome}
        </h3>
        <span className="text-xs text-muted-foreground">{versao}</span>
      </div>
      
      {/* Descrição */}
      <div className="flex-1 px-4 py-2">
        <p className="text-sm text-muted-foreground text-center line-clamp-2">
          {descricao || 'Framework de conformidade para avaliação organizacional'}
        </p>
      </div>
      
      {/* Botão apenas seta */}
      <div className="flex justify-end p-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};
