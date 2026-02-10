interface HealthScoreGaugeProps {
  score: number;
}

export function HealthScoreGauge({ score }: HealthScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--success))';
    if (s >= 60) return 'hsl(var(--primary))';
    if (s >= 40) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excelente';
    if (s >= 60) return 'Bom';
    if (s >= 40) return 'Atenção';
    return 'Crítico';
  };

  const color = getColor(score);
  const label = getLabel(score);
  
  // SVG gauge arc
  const radius = 70;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeWidth = 12;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        {/* Background arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 150 90"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 150 90"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-1000"
        />
        {/* Score text */}
        <text x="80" y="72" textAnchor="middle" className="fill-foreground" fontSize="28" fontWeight="bold">
          {score}
        </text>
        <text x="80" y="92" textAnchor="middle" className="fill-muted-foreground" fontSize="11">
          {label}
        </text>
      </svg>
      <p className="text-xs text-muted-foreground mt-1">Saúde Organizacional</p>
    </div>
  );
}
