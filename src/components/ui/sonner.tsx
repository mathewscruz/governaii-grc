import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:p-4 group-[.toaster]:min-h-[64px]",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-tight group-[.toast]:mb-1",
          description: "group-[.toast]:text-xs group-[.toast]:text-gray-600 group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:hover:bg-gray-200 group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-gray-400 group-[.toast]:hover:text-gray-600 group-[.toast]:absolute group-[.toast]:top-2 group-[.toast]:right-2",
          success:
            "group-[.toaster]:bg-white group-[.toaster]:border-l-4 group-[.toaster]:border-l-green-500 group-[.toaster]:text-green-800 [&_[data-description]]:text-green-700",
          error:
            "group-[.toaster]:bg-white group-[.toaster]:border-l-4 group-[.toaster]:border-l-red-500 group-[.toaster]:text-red-800 [&_[data-description]]:text-red-700",
          warning:
            "group-[.toaster]:bg-white group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500 group-[.toaster]:text-amber-800 [&_[data-description]]:text-amber-700",
          info:
            "group-[.toaster]:bg-white group-[.toaster]:border-l-4 group-[.toaster]:border-l-blue-500 group-[.toaster]:text-blue-800 [&_[data-description]]:text-blue-700",
        },
        style: {
          background: '#ffffff',
          animation: 'slideInFromRight 0.3s ease-out forwards',
        }
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
