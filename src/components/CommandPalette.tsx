import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  HardDrive,
  AlertTriangle,
  Shield,
  FileText,
  Bug,
  Eye,
  Users,
  FileCheck,
  Scale,
  Target,
  BarChart3,
  Settings,
  Megaphone,
  ClipboardList,
  Key,
  ScrollText,
  Search,
  Keyboard,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const MODULES = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, keywords: ['inicio', 'home', 'painel'] },
  { name: 'Gestão de Riscos', path: '/riscos', icon: AlertTriangle, keywords: ['risco', 'ameaca', 'vulnerabilidade'] },
  { name: 'Governança', path: '/governanca', icon: Shield, keywords: ['controle', 'auditoria', 'compliance'] },
  { name: 'Gap Analysis', path: '/gap-analysis', icon: Target, keywords: ['framework', 'conformidade', 'iso', 'nist', 'lgpd'] },
  { name: 'Frameworks', path: '/gap-analysis/frameworks', icon: Target, keywords: ['iso 27001', 'nist', 'lgpd', 'sox'] },
  { name: 'Ativos', path: '/ativos', icon: HardDrive, keywords: ['ativo', 'dispositivo', 'hardware', 'software'] },
  { name: 'Licenças', path: '/ativos/licencas', icon: Key, keywords: ['licenca', 'software', 'renovacao'] },
  { name: 'Chaves Criptográficas', path: '/ativos/chaves', icon: Key, keywords: ['chave', 'criptografia', 'certificado'] },
  { name: 'Documentos', path: '/documentos', icon: FileText, keywords: ['documento', 'politica', 'procedimento'] },
  { name: 'Contratos', path: '/contratos', icon: Scale, keywords: ['contrato', 'fornecedor', 'sla'] },
  { name: 'Incidentes', path: '/incidentes', icon: Bug, keywords: ['incidente', 'seguranca', 'breach'] },
  { name: 'Privacidade (LGPD)', path: '/privacidade', icon: Eye, keywords: ['lgpd', 'dados', 'ropa', 'titular'] },
  { name: 'Contas Privilegiadas', path: '/contas-privilegiadas', icon: Users, keywords: ['conta', 'privilegio', 'admin', 'acesso'] },
  { name: 'Revisão de Acessos', path: '/revisao-acessos', icon: FileCheck, keywords: ['revisao', 'acesso', 'review'] },
  { name: 'Due Diligence', path: '/due-diligence', icon: ClipboardList, keywords: ['due diligence', 'fornecedor', 'terceiro'] },
  { name: 'Canal de Denúncias', path: '/denuncia', icon: Megaphone, keywords: ['denuncia', 'canal', 'ouvidoria'] },
  { name: 'Políticas', path: '/politicas', icon: ScrollText, keywords: ['politica', 'norma', 'regulamento'] },
  { name: 'Planos de Ação', path: '/planos-acao', icon: ClipboardList, keywords: ['plano', 'acao', 'tarefa'] },
  { name: 'Relatórios', path: '/relatorios', icon: BarChart3, keywords: ['relatorio', 'report', 'exportar'] },
  { name: 'Configurações', path: '/configuracoes', icon: Settings, keywords: ['config', 'empresa', 'usuario', 'integracao'] },
];

export function CommandPaletteButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 px-3 w-48 justify-start"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Buscar...</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>
      <CommandPaletteDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function CommandPaletteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSelect = useCallback((path: string) => {
    onOpenChange(false);
    navigate(path);
  }, [navigate, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t('common.search') + '...'} />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Módulos">
          {MODULES.map((module) => (
            <CommandItem
              key={module.path}
              value={`${module.name} ${module.keywords.join(' ')}`}
              onSelect={() => handleSelect(module.path)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <module.icon className="h-4 w-4 text-muted-foreground" />
              <span>{module.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Atalhos de Teclado">
          <CommandItem className="flex items-center justify-between cursor-default" value="atalho busca cmd k">
            <div className="flex items-center gap-3">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <span>Busca Rápida</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd>
          </CommandItem>
          <CommandItem className="flex items-center justify-between cursor-default" value="atalho sidebar ctrl b">
            <div className="flex items-center gap-3">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <span>Abrir/Fechar Menu</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Ctrl+B</kbd>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return <CommandPaletteDialog open={open} onOpenChange={setOpen} />;
}
