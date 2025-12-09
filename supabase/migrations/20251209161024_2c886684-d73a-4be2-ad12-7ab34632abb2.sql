-- Limpar registros de senhas temporárias muito antigos (mais de 30 dias expirados)
-- que ainda estão marcados como is_temporary = true
-- Isso limpa dados órfãos e melhora a performance das consultas

UPDATE public.temporary_passwords 
SET is_temporary = false 
WHERE is_temporary = true 
AND expires_at < NOW() - INTERVAL '30 days';

-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.temporary_passwords IS 'Armazena senhas temporárias para primeiro acesso. is_temporary=true indica que o usuário ainda precisa trocar a senha.';