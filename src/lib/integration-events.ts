/**
 * Fonte única de verdade para todos os eventos de integração do sistema.
 * Importado por: SlackConfigDialog, TeamsConfigDialog, WebhooksConfigDialog, useIntegrationNotify
 */

export interface IntegrationEvent {
  id: string;
  label: string;
  modulo: string;
}

export const INTEGRATION_EVENTS: IntegrationEvent[] = [
  // Incidentes
  { id: 'incidente_criado', label: 'Incidente criado', modulo: 'Incidentes' },
  { id: 'incidente_atualizado', label: 'Incidente atualizado', modulo: 'Incidentes' },
  { id: 'incidente_resolvido', label: 'Incidente resolvido', modulo: 'Incidentes' },
  { id: 'incidente_critico', label: 'Incidente crítico detectado', modulo: 'Incidentes' },

  // Riscos
  { id: 'risco_identificado', label: 'Risco identificado', modulo: 'Riscos' },
  { id: 'risco_atualizado', label: 'Risco atualizado', modulo: 'Riscos' },
  { id: 'risco_nivel_alterado', label: 'Nível de risco alterado', modulo: 'Riscos' },

  // Controles
  { id: 'controle_criado', label: 'Controle criado', modulo: 'Controles' },
  { id: 'controle_atualizado', label: 'Controle atualizado', modulo: 'Controles' },
  { id: 'controle_vencendo', label: 'Controle próximo do vencimento', modulo: 'Controles' },

  // Documentos
  { id: 'documento_criado', label: 'Documento criado', modulo: 'Documentos' },
  { id: 'documento_aprovado', label: 'Documento aprovado', modulo: 'Documentos' },
  { id: 'documento_rejeitado', label: 'Documento rejeitado', modulo: 'Documentos' },

  // Auditorias
  { id: 'auditoria_criada', label: 'Auditoria criada', modulo: 'Auditorias' },
  { id: 'auditoria_item_atribuido', label: 'Item de auditoria atribuído', modulo: 'Auditorias' },

  // Denúncias
  { id: 'denuncia_recebida', label: 'Denúncia recebida', modulo: 'Denúncias' },

  // Contratos
  { id: 'contrato_criado', label: 'Contrato criado', modulo: 'Contratos' },
  { id: 'contrato_vencendo', label: 'Contrato próximo do vencimento', modulo: 'Contratos' },

  // Ativos
  { id: 'ativo_criado', label: 'Ativo cadastrado', modulo: 'Ativos' },
  { id: 'ativo_atualizado', label: 'Ativo atualizado', modulo: 'Ativos' },
  { id: 'endpoint_enrollado', label: 'Endpoint enrollado', modulo: 'Ativos' },
  { id: 'endpoint_offline', label: 'Endpoint offline', modulo: 'Ativos' },
  { id: 'endpoint_postura_critica', label: 'Endpoint com postura crítica', modulo: 'Ativos' },

  // Políticas
  { id: 'politica_criada', label: 'Política criada', modulo: 'Políticas' },
  { id: 'politica_atualizada', label: 'Política atualizada', modulo: 'Políticas' },

  // Planos de Ação
  { id: 'plano_acao_criado', label: 'Plano de ação criado', modulo: 'Planos de Ação' },
  { id: 'plano_acao_vencido', label: 'Plano de ação vencido', modulo: 'Planos de Ação' },
];

/** Tipo union de todos os IDs de eventos */
export type IntegrationEventType = typeof INTEGRATION_EVENTS[number]['id'];

/** Retorna a lista de eventos formatada para checkboxes nos dialogs de configuração */
export function getEventosDisponiveis() {
  return INTEGRATION_EVENTS;
}
