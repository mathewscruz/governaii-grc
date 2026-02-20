import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusBlocksProps {
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_aplicavel: number;
  nao_avaliado: number;
  className?: string;
  blockSize?: 'sm' | 'md';
}

const STATUS_COLORS = {
  conforme: 'bg-emerald-500',
  parcial: 'bg-amber-400',
  nao_conforme: 'bg-red-500',
  nao_aplicavel: 'bg-blue-400',
  nao_avaliado: 'bg-muted-foreground/20',
} as const;

const STATUS_LABELS: Record<string, string> = {
  conforme: 'Conforme',
  parcial: 'Parcial',
  nao_conforme: 'Não Conforme',
  nao_aplicavel: 'N/A',
  nao_avaliado: 'Não Avaliado',
};

export const StatusBlocks: React.FC<StatusBlocksProps> = ({
  conforme,
  parcial,
  nao_conforme,
  nao_aplicavel,
  nao_avaliado,
  className = '',
  blockSize = 'sm',
}) => {
  const blocks: { status: string; color: string }[] = [];

  const addBlocks = (count: number, status: string, color: string) => {
    for (let i = 0; i < count; i++) {
      blocks.push({ status, color });
    }
  };

  addBlocks(conforme, 'conforme', STATUS_COLORS.conforme);
  addBlocks(parcial, 'parcial', STATUS_COLORS.parcial);
  addBlocks(nao_conforme, 'nao_conforme', STATUS_COLORS.nao_conforme);
  addBlocks(nao_aplicavel, 'nao_aplicavel', STATUS_COLORS.nao_aplicavel);
  addBlocks(nao_avaliado, 'nao_avaliado', STATUS_COLORS.nao_avaliado);

  const total = blocks.length;
  if (total === 0) return null;

  const size = blockSize === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-[3px]">
        {blocks.map((block, i) => (
          <div
            key={i}
            className={`${size} rounded-[2px] ${block.color}`}
            title={STATUS_LABELS[block.status]}
          />
        ))}
      </div>
    </div>
  );
};

interface StatusBlocksLegendProps {
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_aplicavel: number;
  nao_avaliado: number;
}

export const StatusBlocksLegend: React.FC<StatusBlocksLegendProps> = (props) => {
  const items = [
    { label: 'Conforme', count: props.conforme, color: STATUS_COLORS.conforme },
    { label: 'Parcial', count: props.parcial, color: STATUS_COLORS.parcial },
    { label: 'Não Conforme', count: props.nao_conforme, color: STATUS_COLORS.nao_conforme },
    { label: 'N/A', count: props.nao_aplicavel, color: STATUS_COLORS.nao_aplicavel },
    { label: 'Pendente', count: props.nao_avaliado, color: STATUS_COLORS.nao_avaliado },
  ].filter(i => i.count > 0);

  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-[2px] ${item.color}`} />
          <span>{item.label}: {item.count}</span>
        </div>
      ))}
    </div>
  );
};
