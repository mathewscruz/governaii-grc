-- Adicionar coluna para ícone do sistema
ALTER TABLE sistemas_privilegiados 
ADD COLUMN icone TEXT DEFAULT 'server';