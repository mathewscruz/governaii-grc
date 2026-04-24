import { Sparkles, AlertTriangle, ShieldCheck, FileText, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickPrompt {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}

const PROMPTS_BY_ROUTE: Record<string, QuickPrompt[]> = {
  "/dashboard": [
    { icon: BarChart3, label: "Resumo executivo", prompt: "Me dê um resumo executivo da postura de GRC da empresa hoje." },
    { icon: AlertTriangle, label: "Riscos críticos", prompt: "Quais são meus riscos críticos e o que devo priorizar?" },
    { icon: ShieldCheck, label: "Maturidade compliance", prompt: "Como está a maturidade de compliance dos meus frameworks?" },
    { icon: Zap, label: "Top 3 ações", prompt: "Quais as 3 ações mais urgentes que devo tomar esta semana?" },
  ],
  "/riscos": [
    { icon: AlertTriangle, label: "Riscos sem tratamento", prompt: "Liste os riscos identificados sem plano de tratamento." },
    { icon: BarChart3, label: "Distribuição por nível", prompt: "Como está a distribuição dos meus riscos por nível?" },
    { icon: Sparkles, label: "Sugerir tratamentos", prompt: "Sugira tratamentos para meus riscos altos e críticos." },
    { icon: Zap, label: "Criar novo risco", prompt: "Quero registrar um novo risco. Me ajude a estruturar." },
  ],
  "/incidentes": [
    { icon: AlertTriangle, label: "Incidentes abertos", prompt: "Quais incidentes estão abertos e qual a criticidade?" },
    { icon: BarChart3, label: "Tendências", prompt: "Há tendência de aumento em algum tipo de incidente?" },
    { icon: Zap, label: "Registrar incidente", prompt: "Quero registrar um novo incidente." },
    { icon: ShieldCheck, label: "Lições aprendidas", prompt: "Quais lições posso extrair dos incidentes resolvidos?" },
  ],
  "/governanca": [
    { icon: ShieldCheck, label: "Controles vencendo", prompt: "Quais controles têm avaliação vencendo nos próximos 30 dias?" },
    { icon: BarChart3, label: "Eficácia dos controles", prompt: "Como está a eficácia dos meus controles?" },
    { icon: AlertTriangle, label: "Auditorias pendentes", prompt: "Quais auditorias estão em andamento e qual o status?" },
  ],
  "/documentos": [
    { icon: FileText, label: "Documentos vencidos", prompt: "Quais documentos estão vencidos ou vencendo em 30 dias?" },
    { icon: Sparkles, label: "Cobertura documental", prompt: "Tenho cobertura documental adequada para meus frameworks?" },
  ],
  "/contratos": [
    { icon: FileText, label: "Contratos vencendo", prompt: "Quais contratos estão vencendo nos próximos 30 dias?" },
    { icon: BarChart3, label: "Valor contratado", prompt: "Qual o valor total contratado e a distribuição por status?" },
  ],
  "/planos-acao": [
    { icon: Zap, label: "Atrasados", prompt: "Quais planos de ação estão atrasados?" },
    { icon: AlertTriangle, label: "Prioridade alta", prompt: "Liste os planos de ação de prioridade alta em andamento." },
  ],
};

const FALLBACK: QuickPrompt[] = PROMPTS_BY_ROUTE["/dashboard"];

interface Props {
  route: string;
  onPick: (prompt: string) => void;
}

export function AkurIAQuickPrompts({ route, onPick }: Props) {
  // Match por prefixo (ex: /riscos/123 → /riscos)
  const matched = Object.keys(PROMPTS_BY_ROUTE).find((key) => route.startsWith(key));
  const prompts = matched ? PROMPTS_BY_ROUTE[matched] : FALLBACK;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
      {prompts.map((p, i) => {
        const Icon = p.icon;
        return (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => onPick(p.prompt)}
            className="h-auto py-2 px-3 justify-start text-left whitespace-normal hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <Icon className="h-3.5 w-3.5 text-primary shrink-0 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs leading-tight text-foreground">{p.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
