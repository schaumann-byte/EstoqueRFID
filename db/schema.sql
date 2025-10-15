-- schema.sql
-- Produtos e Itens com RFID


-- =====================================
-- Tabela: produtos
-- =====================================
CREATE TABLE produtos (
    codigo SERIAL PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL
);

-- =====================================
-- Tabela: itens (unidades físicas com RFID)
-- =====================================
CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    codigo_produto INT NOT NULL,
    etiqueta_rfid VARCHAR(50) UNIQUE NOT NULL,
    timestamp_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_validade DATE,
    timestamp_saida TIMESTAMP, -- NULL => ainda em estoque

    CONSTRAINT fk_itens_produtos
        FOREIGN KEY (codigo_produto)
        REFERENCES produtos (codigo)
        ON DELETE CASCADE
);

-- Índices úteis para performance nas contagens e consultas
CREATE INDEX idx_itens_codigo_produto ON itens (codigo_produto);
-- Parcial: acelera contagem de itens em estoque
CREATE INDEX idx_itens_em_estoque ON itens (codigo_produto) WHERE timestamp_saida IS NULL;

-- =====================================
-- VIEW: produtos com quantidade derivada
-- =====================================
CREATE OR REPLACE VIEW vw_produtos_quantidade AS
SELECT
    p.codigo,
    p.descricao,
    p.categoria,
    p.marca,
    -- Itens ainda no estoque (timestamp_saida IS NULL)
    COUNT(i.*) FILTER (WHERE i.timestamp_saida IS NULL) AS quantidade_em_estoque,
    -- Itens totais (inclui já saídos)
    COUNT(i.*) AS quantidade_total
FROM produtos p
LEFT JOIN itens i ON i.codigo_produto = p.codigo
GROUP BY p.codigo, p.descricao, p.categoria, p.marca;



