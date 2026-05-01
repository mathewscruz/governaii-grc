/**
 * Compat shim — chamadas legadas `useToast()`/`toast({...})` agora rodam
 * pelo Sonner (Toaster Akuris). Mantém a API esperada pelos módulos antigos
 * (`{ title, description, variant }`) sem precisar refatorar dezenas de
 * arquivos. Toda estilização vive em `src/components/ui/sonner.tsx`.
 */
import * as React from "react"
import { toast as sonnerToast } from "sonner"

type Variant = "default" | "destructive" | "success" | "warning" | "info" | "error"

interface LegacyToastInput {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: Variant | string
  action?: React.ReactNode
  duration?: number
}

function detectVariantFromText(title?: React.ReactNode, variant?: string): Variant {
  if (variant === "destructive" || variant === "error") return "destructive"
  if (variant === "success" || variant === "warning" || variant === "info") return variant
  const text = typeof title === "string" ? title.toLowerCase() : ""
  if (/sucesso|criado|atualizado|exclu[ií]do|salvo/.test(text)) return "success"
  if (/erro|falha|falhou/.test(text)) return "destructive"
  if (/aten[cç][aã]o|aviso|cuidado/.test(text)) return "warning"
  return "default"
}

function nodeToString(node: React.ReactNode): string {
  if (node == null || node === false) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  return String(node)
}

function toast(props: LegacyToastInput) {
  const variant = detectVariantFromText(props.title, props.variant as string)
  const title = nodeToString(props.title) || nodeToString(props.description) || ""
  const description = props.title ? nodeToString(props.description) || undefined : undefined
  const opts = description ? { description, duration: props.duration } : { duration: props.duration }

  let id: string | number
  switch (variant) {
    case "destructive":
      id = sonnerToast.error(title, opts)
      break
    case "success":
      id = sonnerToast.success(title, opts)
      break
    case "warning":
      id = sonnerToast.warning(title, opts)
      break
    case "info":
      id = sonnerToast.info(title, opts)
      break
    default:
      id = sonnerToast(title, opts)
  }

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: LegacyToastInput) => {
      sonnerToast.dismiss(id)
      toast(next)
    },
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    toasts: [] as unknown[],
  }
}

export { useToast, toast }
