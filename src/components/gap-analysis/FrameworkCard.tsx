import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, FileText, Scale } from "lucide-react";

interface FrameworkCardProps {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  requirementCount: number;
  onClick: () => void;
}

const FRAMEWORK_ICONS: Record<string, any> = {
  'Segurança': Shield,
  'Privacidade': Lock,
  'Governança': FileText,
  'Compliance': Scale,
};

const FRAMEWORK_COLORS: Record<string, string> = {
  'Segurança': 'text-blue-600 dark:text-blue-400',
  'Privacidade': 'text-purple-600 dark:text-purple-400',
  'Governança': 'text-green-600 dark:text-green-400',
  'Compliance': 'text-orange-600 dark:text-orange-400',
};

export const FrameworkCard: React.FC<FrameworkCardProps> = ({
  id,
  nome,
  versao,
  tipo_framework,
  descricao,
  requirementCount,
  onClick,
}) => {
  const Icon = FRAMEWORK_ICONS[tipo_framework] || Shield;
  const iconColor = FRAMEWORK_COLORS[tipo_framework] || 'text-gray-600';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col" onClick={onClick}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-muted ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {versao}
          </Badge>
        </div>
        <div>
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {nome}
          </h3>
          <p className="text-sm text-muted-foreground">{tipo_framework}</p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {descricao || 'Framework de conformidade para avaliação organizacional'}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {requirementCount} requisitos
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="ghost" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Acessar Framework
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
