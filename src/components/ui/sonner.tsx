import { Toaster as Sonner, toast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

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
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
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
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-emerald-500 group-[.toaster]:bg-emerald-50/90 group-[.toaster]:dark:bg-emerald-950/30 group-[.toaster]:backdrop-blur-xl",
          error:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-red-500 group-[.toaster]:bg-red-50/90 group-[.toaster]:dark:bg-red-950/30 group-[.toaster]:backdrop-blur-xl",
          warning:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-amber-500 group-[.toaster]:bg-amber-50/90 group-[.toaster]:dark:bg-amber-950/30 group-[.toaster]:backdrop-blur-xl",
          info:
            "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-blue-500 group-[.toaster]:bg-blue-50/90 group-[.toaster]:dark:bg-blue-950/30 group-[.toaster]:backdrop-blur-xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
