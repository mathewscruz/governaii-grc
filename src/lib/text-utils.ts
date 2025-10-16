// Funções utilitárias para formatação de texto

export const capitalizeText = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'ativo':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'inativo':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    case 'arquivado':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'vencido':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'pendente_aprovacao':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'aprovado':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'rejeitado':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getTipoColor = (tipo: string): string => {
  switch (tipo.toLowerCase()) {
    case 'documento':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'politica':
      return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'procedimento':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'instrucao':
      return 'text-teal-700 bg-teal-50 border-teal-200';
    case 'formulario':
      return 'text-pink-700 bg-pink-50 border-pink-200';
    case 'certificado':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'contrato':
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'relatorio':
      return 'text-cyan-700 bg-cyan-50 border-cyan-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getClassificacaoColor = (classificacao: string): string => {
  switch (classificacao.toLowerCase()) {
    case 'confidencial':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'restrita':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'interna':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'publica':
      return 'text-green-700 bg-green-50 border-green-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getCriticidadeColor = (criticidade: string): string => {
  switch (criticidade.toLowerCase()) {
    case 'critico':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'alto':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medio':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'baixo':
      return 'text-green-700 bg-green-50 border-green-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getControleStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'ativo':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'inativo':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    case 'em_revisao':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'descontinuado':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getControleTipoColor = (tipo: string): string => {
  switch (tipo.toLowerCase()) {
    case 'preventivo':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'detectivo':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'corretivo':
      return 'text-green-700 bg-green-50 border-green-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};