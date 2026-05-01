import { Toaster as Sonner, toast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toaster Akuris — identidade editorial centralizada.
 *
 * Anatomia (alinhada com a estrutura interna do Sonner):
 *   ┌─┬──────────────────────────────────┬──┐
 *   │ │ [chip] Title                     │X │
 *   │a│        Description (line-clamp)  │  │
 *   └─┴──────────────────────────────────┴──┘
 *     ↑ acento vertical 2px na cor do tom
 *
 * Nota técnica:
 * - Sonner expõe slots `icon`, `content`, `title`, `description` via classNames.
 *   Personalizamos esses slots para garantir alinhamento (sem o ícone
 *   "sobresair" sobre o texto) e largura consistente (360px).
 * - Toda estilização vive aqui — proibido recriar regras globais em CSS.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-right"
      expand={false}
      richColors={false}
      duration={4500}
      gap={12}
      offset={16}
      icons={{
        success: <CheckCircle2 className="h-[18px] w-[18px] text-success" strokeWidth={1.5} />,
        error: <XCircle className="h-[18px] w-[18px] text-destructive" strokeWidth={1.5} />,
        warning: <AlertTriangle className="h-[18px] w-[18px] text-warning" strokeWidth={1.5} />,
        info: <Info className="h-[18px] w-[18px] text-info" strokeWidth={1.5} />,
      }}
      toastOptions={{
        classNames: {
          // Container do toast: largura fixa, glass, acento 2px
          toast: [
            "group toast relative w-[360px] max-w-[92vw]",
            "bg-background/95 backdrop-blur-2xl",
            "text-foreground",
            "border border-border/60 rounded-xl",
            "shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.18)]",
            "!p-0 overflow-hidden",
            "animate-toast-slide-in",
            // Layout interno: alinhamento topo
            "!items-start !gap-0",
            // Acento vertical 2px (cor sobrescrita por success/error/warning/info abaixo)
            "before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3",
            "before:w-[2px] before:rounded-full before:bg-border",
            // Padding "real" via wrapper interno
            "[&>*]:pt-3 [&>*]:pb-3",
          ].join(" "),
          // Chip do ícone (32x32) — substitui o slot padrão do Sonner
          icon: [
            "!m-0 !mr-0 shrink-0",
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "bg-muted/40 ring-1 ring-border/50",
            "ml-4 mt-0",
          ].join(" "),
          // Bloco de texto — largura controlada para nunca colidir com o ícone/close
          content: "min-w-0 flex-1 px-3 pr-8",
          title: "text-[13px] font-semibold leading-tight tracking-tight text-foreground",
          description: "text-xs text-muted-foreground leading-relaxed mt-1 break-words",
          actionButton:
            "!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !font-semibold !px-3 !py-1.5 !rounded-md",
          cancelButton:
            "!bg-muted !text-muted-foreground hover:!bg-muted/80 !text-xs !px-3 !py-1.5 !rounded-md",
          closeButton: [
            "!bg-transparent !border-0 !text-muted-foreground/60 hover:!text-foreground",
            "!top-2 !right-2 !left-auto !translate-x-0 !translate-y-0",
            "!h-6 !w-6",
          ].join(" "),
          // Cores do acento por tom
          success: "before:!bg-success [&_[data-icon]]:!bg-success/10 [&_[data-icon]]:!ring-success/25",
          error: "before:!bg-destructive [&_[data-icon]]:!bg-destructive/10 [&_[data-icon]]:!ring-destructive/25",
          warning: "before:!bg-warning [&_[data-icon]]:!bg-warning/10 [&_[data-icon]]:!ring-warning/25",
          info: "before:!bg-info [&_[data-icon]]:!bg-info/10 [&_[data-icon]]:!ring-info/25",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
