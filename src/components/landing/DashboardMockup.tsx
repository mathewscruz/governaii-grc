import { Shield, AlertTriangle, Activity, FileText, BarChart3, Settings, Home, Users } from 'lucide-react';

export function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-[540px] mx-auto"
      style={{
        perspective: '1200px',
      }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl border border-[#1E2D45]"
        style={{
          transform: 'rotateY(-6deg) rotateX(2deg)',
          transformOrigin: 'center center',
          background: '#0D1424',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0A1120] border-b border-[#1E2D45]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] text-gray-500 ml-2 font-mono">app.akuris.com.br</span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-10 bg-[#080E1A] border-r border-[#1E2D45] py-3 flex flex-col items-center gap-3 shrink-0">
            <div className="w-5 h-5 rounded bg-blue-600/30 flex items-center justify-center">
              <Home className="w-3 h-3 text-blue-400" />
            </div>
            <Shield className="w-3.5 h-3.5 text-gray-600" />
            <AlertTriangle className="w-3.5 h-3.5 text-gray-600" />
            <FileText className="w-3.5 h-3.5 text-gray-600" />
            <Activity className="w-3.5 h-3.5 text-gray-600" />
            <Users className="w-3.5 h-3.5 text-gray-600" />
            <BarChart3 className="w-3.5 h-3.5 text-gray-600" />
            <div className="mt-auto">
              <Settings className="w-3.5 h-3.5 text-gray-600" />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 space-y-3 min-h-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500">Command Center</div>
                <div className="text-xs font-semibold text-gray-200">Dashboard</div>
              </div>
              <div className="text-[9px] text-gray-600 bg-[#111B2E] px-2 py-1 rounded">14:32</div>
            </div>

            {/* Health Score + Metrics row */}
            <div className="flex gap-2.5">
              {/* Gauge */}
              <div className="bg-[#111B2E] rounded-lg p-2.5 flex flex-col items-center justify-center border border-[#1E2D45]/50 w-[90px] shrink-0">
                <svg width="60" height="38" viewBox="0 0 80 50">
                  <path d="M 8 45 A 35 35 0 0 1 72 45" fill="none" stroke="#1E2D45" strokeWidth="5" strokeLinecap="round" />
                  <path d="M 8 45 A 35 35 0 0 1 72 45" fill="none" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" strokeDasharray="82.5 110" />
                  <text x="40" y="38" textAnchor="middle" fill="#E2E8F0" fontSize="14" fontWeight="bold">75</text>
                </svg>
                <span className="text-[8px] text-gray-500 mt-0.5">Health Score</span>
              </div>

              {/* KPI cards */}
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Riscos', value: '24', color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Controles', value: '156', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Incidentes', value: '3', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                  { label: 'Compliance', value: '87%', color: 'text-green-400', bg: 'bg-green-500/10' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[#111B2E] rounded-md p-2 border border-[#1E2D45]/50">
                    <div className="text-[8px] text-gray-500">{kpi.label}</div>
                    <div className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="flex gap-2">
              {/* Bar chart */}
              <div className="flex-1 bg-[#111B2E] rounded-lg p-2.5 border border-[#1E2D45]/50">
                <div className="text-[8px] text-gray-500 mb-2">Risk Timeline</div>
                <div className="flex items-end gap-1 h-[50px]">
                  {[35, 50, 30, 65, 45, 55, 40, 60, 38, 52, 42, 48].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        background: h > 55 ? '#EF4444' : h > 40 ? '#3B82F6' : '#1E2D45',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Radar mini */}
              <div className="w-[100px] bg-[#111B2E] rounded-lg p-2.5 border border-[#1E2D45]/50 flex flex-col items-center">
                <div className="text-[8px] text-gray-500 mb-1 self-start">Radar GRC</div>
                <svg width="65" height="55" viewBox="0 0 100 90">
                  {/* Pentagon guides */}
                  <polygon points="50,10 90,35 78,75 22,75 10,35" fill="none" stroke="#1E2D45" strokeWidth="1" />
                  <polygon points="50,25 75,40 68,65 32,65 25,40" fill="none" stroke="#1E2D45" strokeWidth="0.5" />
                  {/* Data shape */}
                  <polygon points="50,18 82,38 70,70 28,68 18,38" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="1.5" />
                  {/* Dots */}
                  {[[50,18],[82,38],[70,70],[28,68],[18,38]].map(([cx,cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="2" fill="#3B82F6" />
                  ))}
                </svg>
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-[#111B2E] rounded-lg p-2.5 border border-[#1E2D45]/50">
              <div className="text-[8px] text-gray-500 mb-1.5">Atividades Recentes</div>
              {[
                { text: 'Controle ISO 27001 A.8 atualizado', time: '2min' },
                { text: 'Novo risco identificado — Phishing', time: '15min' },
                { text: 'Documento LGPD aprovado', time: '1h' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-[#1E2D45]/30 last:border-0">
                  <span className="text-[8px] text-gray-400 truncate max-w-[75%]">{item.text}</span>
                  <span className="text-[7px] text-gray-600 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Glow effect behind */}
      <div className="absolute -inset-4 bg-blue-500/5 rounded-2xl blur-2xl -z-10" />
    </div>
  );
}
