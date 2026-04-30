import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * TabsList responsivo:
 * - rolagem horizontal embutida (overflow-x-auto + scrollbar-hide)
 * - borda inferior contínua mesmo com scroll
 * - máscara de fade nas laterais quando há overflow real (data-overflow="left|right|both")
 * - triggers nunca são comprimidos (shrink-0)
 *
 * Aceita as mesmas props da primitiva Radix. Para variantes em grid (ex.: 2 colunas
 * fixas em diálogos), basta passar className com `grid grid-cols-2` — o wrapper
 * preserva o comportamento.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)

  // Combina ref externa com a interna
  const setInnerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [ref],
  )

  React.useEffect(() => {
    const el = innerRef.current
    const wrapper = wrapperRef.current
    if (!el || !wrapper) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      const hasLeft = scrollLeft > 2
      const hasRight = scrollLeft + clientWidth < scrollWidth - 2
      const value = hasLeft && hasRight ? "both" : hasLeft ? "left" : hasRight ? "right" : "none"
      wrapper.dataset.overflow = value
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      data-overflow="none"
      className={cn(
        "relative w-full border-b border-border",
        // máscara de fade lateral conforme overflow detectado
        "data-[overflow=right]:[mask-image:linear-gradient(to_right,black_85%,transparent_100%)]",
        "data-[overflow=left]:[mask-image:linear-gradient(to_left,black_85%,transparent_100%)]",
        "data-[overflow=both]:[mask-image:linear-gradient(to_right,transparent_0%,black_5%,black_95%,transparent_100%)]",
      )}
    >
      <TabsPrimitive.List
        ref={setInnerRef}
        className={cn(
          "inline-flex h-auto items-center justify-start w-full text-muted-foreground bg-transparent",
          "overflow-x-auto scrollbar-hide whitespace-nowrap",
          className,
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    </div>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex shrink-0 items-center justify-center whitespace-nowrap px-4 sm:px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-t-sm",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
