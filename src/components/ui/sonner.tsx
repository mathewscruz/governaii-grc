import { Toaster as Sonner, toast } from "sonner"
import { Icon } from "@/components/icons/Icon"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toaster Akuris — identidade editorial:
 * - Acento vertical 2px à esquerda na cor do tom (success/warning/destructive/info)
 * - Chip 32x32 com ícone proprietário (stroke 1.5) e tom semântico
 * - Glassmorphism + sombra densa primary; cantos rounded-xl
 * - Tipografia: title 13px semibold; description 12px muted
 *
 * Mantém compatibilidade total com `toast.success(...)`, `toast.error(...)`, etc.
 * Para toasts com eyebrow + módulo proprietário, use `akurisToast` (src/lib/akuris-toast.tsx).
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
      gap={10}
      offset={16}
      icons={{
        success: (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 ring-1 ring-success/20 text-success">
            <Icon as={CheckCircle2} size="sm" />
          </span>
        ),
        error: (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 ring-1 ring-destructive/20 text-destructive">
            <Icon as={XCircle} size="sm" />
          </span>
        ),
        warning: (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 ring-1 ring-warning/20 text-warning">
            <Icon as={AlertTriangle} size="sm" />
          </span>
        ),
        info: (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 ring-1 ring-info/20 text-info">
            <Icon as={Info} size="sm" />
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast relative overflow-hidden group-[.toaster]:w-[360px] group-[.toaster]:max-w-[92vw] group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.18)] group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:pl-5 group-[.toaster]:min-h-[60px] group-[.toaster]:gap-3 group-[.toaster]:animate-toast-slide-in before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-full before:bg-border",
          title:
            "group-[.toast]:text-[13px] group-[.toast]:font-semibold group-[.toast]:leading-tight group-[.toast]:tracking-tight",
          description:
            "group-[.toast]:text-xs group-[.toast]:text-muted-foreground group-[.toast]:leading-relaxed group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-muted-foreground/60 group-[.toast]:hover:text-foreground group-[.toast]:transition-colors",
          success:
            "group-[.toaster]:before:bg-success",
          error:
            "group-[.toaster]:before:bg-destructive",
          warning:
            "group-[.toaster]:before:bg-warning",
          info:
            "group-[.toaster]:before:bg-info",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
