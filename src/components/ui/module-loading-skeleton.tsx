import { Skeleton } from "@/components/ui/skeleton"

interface ModuleLoadingSkeletonProps {
  /** Number of stat cards to show (default 4) */
  statCards?: number
  /** Whether to show table skeleton (default true) */
  showTable?: boolean
  /** Number of table rows (default 5) */
  tableRows?: number
}

export function ModuleLoadingSkeleton({ 
  statCards = 4, 
  showTable = true, 
  tableRows = 5 
}: ModuleLoadingSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stat cards skeleton */}
      {statCards > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: statCards }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table skeleton */}
      {showTable && (
        <div className="rounded-xl border border-border bg-card">
          {/* Filter bar */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
          
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          
          {/* Table rows */}
          {Array.from({ length: tableRows }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-border last:border-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
