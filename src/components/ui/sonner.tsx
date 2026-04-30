import { Toaster as Sonner, toast } from "sonner"
import { Icon } from "@/components/icons/Icon"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toaster Akuris — usa ícones proprietários (stroke 1.5) e cores semânticas
 * dos tokens (success/destructive/warning/info), em vez de cores Tailwind cruas.
 * Mantém glassmorphism e border-l-3 colorido por tipo.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      expand={false}
      richColors={false}
      duration={4000}
      gap={8}
      icons={{
        success: <Icon as={CheckCircle2} size="md" className="text-success" />,
        error: <Icon as={XCircle} size="md" className="text-destructive" />,
        warning: <Icon as={AlertTriangle} size="md" className="text-warning" />,
        info: <Icon as={Info} size="md" className="text-info" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.12)] group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:min-h-[56px] group-[.toaster]:animate-toast-slide-in",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-tight",
          description: "group-[.toast]:text-xs group-[.toast]:text-muted-foreground group-[.toast]:leading-relaxed group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground group-[.toast]:transition-colors",
          success:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-success group-[.toaster]:bg-success/5 group-[.toaster]:dark:bg-success/10",
          error:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-destructive group-[.toaster]:bg-destructive/5 group-[.toaster]:dark:bg-destructive/10",
          warning:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-warning group-[.toaster]:bg-warning/5 group-[.toaster]:dark:bg-warning/10",
          info:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-info group-[.toaster]:bg-info/5 group-[.toaster]:dark:bg-info/10",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
