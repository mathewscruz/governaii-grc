/**
 * Akuris Icon Catalog
 * --------------------------------------------------------------------------
 * Catálogo semântico — uma única metáfora por conceito.
 *
 * REGRA: Para qualquer um dos conceitos abaixo, importe daqui em vez de
 *        `lucide-react` direto. Isso elimina inconsistências (ex.: Edit vs.
 *        Pencil vs. Edit2 espalhados em 246 arquivos).
 *
 * REGRA: Para módulos GRC, use os ícones proprietários em
 *        `@/components/icons/modules` (não Lucide).
 */

// === Wrapper de estilo Akuris ===
export { Icon, type IconSize, type IconProps } from './Icon';

// === Ícone proprietário do toggle de sidebar ===
export { AkurisSidebarIcon } from './AkurisSidebarIcon';

// === Ícones proprietários de módulos GRC ===
export { RiscosIcon } from './modules/RiscosIcon';
export { ControlesIcon } from './modules/ControlesIcon';
export { AtivosIcon } from './modules/AtivosIcon';
export { IncidentesIcon } from './modules/IncidentesIcon';
export { GapAnalysisIcon } from './modules/GapAnalysisIcon';
export { DueDiligenceIcon } from './modules/DueDiligenceIcon';
export { DocumentosIcon } from './modules/DocumentosIcon';
export { DenunciasIcon } from './modules/DenunciasIcon';

// === Catálogo semântico — ações genéricas (re-export Lucide unificado) ===
// Uma escolha por metáfora. Use estes nomes em vez das variantes Lucide.
export {
  Pencil as IconEdit,           // unifica Edit / Edit2 / Pencil / PencilLine
  Trash2 as IconDelete,         // unifica Trash / Trash2
  Plus as IconAdd,
  X as IconClose,
  Search as IconSearch,
  Filter as IconFilter,
  MoreHorizontal as IconMore,   // unifica MoreVertical / Ellipsis
  Download as IconDownload,
  Upload as IconUpload,
  Eye as IconView,
  ExternalLink as IconExternal,
  ChevronRight as IconChevron,
  RefreshCw as IconRefresh,
  Send as IconSend,

  // Status
  Check as IconCheck,           // checkmark inline (em listas, options)
  CheckCircle2 as IconSuccess,  // status de sucesso (em badges, alertas)
  AlertTriangle as IconWarning, // alerta de atenção (severidade média/alta)
  AlertCircle as IconInfo,      // informativo / aviso leve
  XCircle as IconError,         // erro / falha

  // Entidades
  User as IconUser,
  Users as IconUsers,
  Building2 as IconCompany,
  Calendar as IconCalendar,
  Clock as IconTime,
  Mail as IconMail,
  FileText as IconFile,
  Settings as IconSettings,
} from 'lucide-react';
