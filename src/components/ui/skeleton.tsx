import { cn } from "@/lib/utils";
import { AkurisPulse } from "./AkurisPulse";

/**
 * Skeleton — descontinuado como placeholder estrutural.
 *
 * Por decisão de design, todos os estados de carregamento usam o loader
 * oficial AkurisPulse. Este componente foi convertido em um wrapper que
 * preserva o tamanho/className original (para não quebrar layouts) mas
 * exibe o pulse centralizado ao invés da barra cinza pulsante.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md overflow-hidden",
        className
      )}
      role="status"
      aria-label="Carregando"
      {...props}
    >
      <AkurisPulse size={20} />
    </div>
  );
}

export { Skeleton };
