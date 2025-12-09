// Funções utilitárias para formatação de texto

export const capitalizeText = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Formata status dinâmicos: substitui underscores, capitaliza cada palavra
export const formatStatus = (status: string): string => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// ============= FUNÇÕES PADRONIZADAS DE CORES DE STATUS =============

/**
 * Cores para criticidade/prioridade (Crítico, Alto, Médio, Baixo)
 * Usado em: Controles, Incidentes, Sistemas, Chaves, Licenças, Denúncias, etc.
 */
export const getCriticidadeColor = (criticidade: string): string => {
  const value = criticidade?.toLowerCase() || '';
  switch (value) {
    case 'critico':
    case 'critica':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'alto':
    case 'alta':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medio':
    case 'media':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'baixo':
    case 'baixa':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para status de workflow (Concluído, Em Andamento, Pendente, Cancelado)
 * Usado em: Auditorias, Revisão de Acessos, Incidentes, Due Diligence, etc.
 */
export const getWorkflowStatusColor = (status: string): string => {
  const value = status?.toLowerCase() || '';
  switch (value) {
    case 'concluido':
    case 'concluida':
    case 'resolvido':
    case 'fechado':
    case 'atendida':
    case 'aprovado':
    case 'aprovada':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'em_andamento':
    case 'investigacao':
    case 'em_analise':
    case 'contido':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pendente':
    case 'planejamento':
    case 'rascunho':
    case 'nova':
    case 'pendente_aprovacao':
    case 'aberto':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelado':
    case 'cancelada':
    case 'rejeitado':
    case 'rejeitada':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para status de item (Ativo, Inativo, Vencido, Expirado)
 * Usado em: Ativos, Licenças, Chaves, Contas Privilegiadas, etc.
 */
export const getItemStatusColor = (status: string): string => {
  const value = status?.toLowerCase() || '';
  switch (value) {
    case 'ativo':
    case 'ativa':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'inativo':
    case 'inativa':
    case 'arquivado':
    case 'descontinuado':
    case 'revogado':
    case 'revogada':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'vencido':
    case 'vencida':
    case 'expirado':
    case 'expirada':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'a_vencer':
    case 'em_renovacao':
    case 'em_rotacao':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para status de contratos (Ativo, Negociação, Aprovação, Suspenso, Encerrado)
 * Usado em: Contratos
 */
export const getContratoStatusColor = (status: string): string => {
  const value = status?.toLowerCase() || '';
  switch (value) {
    case 'ativo':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'negociacao':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'aprovacao':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'suspenso':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'encerrado':
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'rascunho':
    case 'inativo':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para tipos de controle (Preventivo, Detectivo, Corretivo)
 * Usado em: Controles
 */
export const getControleTipoColor = (tipo: string): string => {
  const value = tipo?.toLowerCase() || '';
  switch (value) {
    case 'preventivo':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'detectivo':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'corretivo':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para tipos de documentos
 * Usado em: Documentos
 */
export const getTipoColor = (tipo: string): string => {
  const value = tipo?.toLowerCase() || '';
  switch (value) {
    case 'documento':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'politica':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'procedimento':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'instrucao':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'formulario':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'certificado':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'contrato':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'relatorio':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para classificação de documentos (Confidencial, Restrita, Interna, Pública)
 * Usado em: Documentos
 */
export const getClassificacaoColor = (classificacao: string): string => {
  const value = classificacao?.toLowerCase() || '';
  switch (value) {
    case 'confidencial':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'restrita':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'interna':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'publica':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para status de auditoria
 * Usado em: Auditorias
 */
export const getAuditoriaStatusColor = (status: string): string => {
  const value = status?.toLowerCase() || '';
  switch (value) {
    case 'planejamento':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'em_andamento':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'concluida':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelada':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para tipos de auditoria
 * Usado em: Auditorias
 */
export const getAuditoriaTipoColor = (tipo: string): string => {
  const value = tipo?.toLowerCase() || '';
  switch (value) {
    case 'interna':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'externa':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'compliance':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'operacional':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'ti':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Cores para prioridade de auditoria
 * Usado em: Auditorias
 */
export const getAuditoriaPrioridadeColor = (prioridade: string): string => {
  const value = prioridade?.toLowerCase() || '';
  switch (value) {
    case 'baixa':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'media':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'alta':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critica':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};