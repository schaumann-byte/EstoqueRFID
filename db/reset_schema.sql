-- reset_schema.sql
-- ⚠️ CUIDADO: Este script apaga tudo no banco atual (tabelas, views, funções, etc.)
-- Use apenas em ambiente de desenvolvimento!

-- 1️⃣ Apaga completamente o schema 'public' (onde ficam suas tabelas)
DROP SCHEMA IF EXISTS public CASCADE;

-- 2️⃣ Recria o schema limpo
CREATE SCHEMA public;

-- 3️⃣ Restaura permissões padrão
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
    