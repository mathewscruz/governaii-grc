import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const statCardVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "",
        success: "governaii-accent-bar before:!bg-gradient-to-b before:!from-success before:!to-success/70",
        warning: "governaii-accent-bar before:!bg-gradient-to-b before:!from-warning before:!to-warning/70",
        destructive: "governaii-accent-bar before:!bg-gradient-to-b before:!from-destructive before:!to-destructive/70",
        info: "governaii-accent-bar before:!bg-gradient-to-b before:!from-info before:!to-info/70",
        primary: "governaii-accent-bar",
      },
      interactive: {
        true: "cursor-pointer governaii-card-hover",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      interactive: false,
    },
  }
)

interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
    period?: string
    direction?: 'up' | 'down' | 'neutral'
  }
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "soft"
  }
  actions?: React.ReactNode
  loading?: boolean
}

export function StatCard({
  className,
  variant,
  interactive,
  title,
  value,
  description,
  icon,
  trend,
  badge,
  actions,
  loading = false,
  onClick,
  ...props
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    const dir = trend.direction ?? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral')
    if (dir === 'up') return <TrendingUp className="h-3.5 w-3.5" />
    if (dir === 'down') return <TrendingDown className="h-3.5 w-3.5" />
    return <Minus className="h-3.5 w-3.5" />
  }

  const getTrendColor = () => {
    if (!trend) return ""
    const dir = trend.direction ?? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral')
    if (dir === 'up') return "text-success"
    if (dir === 'down') return "text-destructive"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <Card className={cn("p-5", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
        </div>
      </Card>
    )
  }

  return (
    <Card 
      variant="elevated"
      interactive={interactive || !!onClick}
      className={cn(statCardVariants({ variant, interactive: interactive || !!onClick }), className)} 
      onClick={onClick}
      {...props}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1 flex-1 min-w-0 pl-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </CardTitle>
            {badge && (
              <Badge variant={badge.variant || 'soft'} size="sm">
                {badge.label}
              </Badge>
            )}
          </div>
        </div>
        
        {icon && (
          <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pl-7">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {actions && <div className="ml-auto">{actions}</div>}
        </div>

        {(description || trend) && (
          <div className="mt-2 flex items-center gap-3 text-sm">
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 font-medium", getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                  {trend.label && ` ${trend.label}`}
                </span>
                {trend.period && (
                  <span className="text-muted-foreground font-normal ml-1">
                    vs {trend.period}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard