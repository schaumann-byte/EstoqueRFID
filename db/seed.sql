-- seed.sql
-- Popula as tabelas produtos e itens conforme o novo schema.sql
-- Quantidade de produtos é derivada automaticamente via view (vw_produtos_quantidade)

-- =====================================
-- 1️⃣ Inserindo Produtos
-- =====================================
INSERT INTO produtos (descricao, categoria, marca) VALUES
('Líquido de Arrefecimento Long Life 1L', 'Líquido de Arrefecimento', 'Mobil'),
('Óleo de Motor Sintético 5W30 1L', 'Óleo Lubrificante', 'Castrol'),
('Óleo de Motor Semissintético 15W40 1L', 'Óleo Lubrificante', 'Lubrax'),
('Líquido de Arrefecimento Orgânico 5L', 'Líquido de Arrefecimento', 'Shell'),
('Óleo para Transmissão 80W90 1L', 'Óleo Lubrificante', 'Ipiranga');

-- =====================================
-- 2️⃣ Inserindo Itens com RFID
-- =====================================
-- Produto 1 (2 unidades)
INSERT INTO itens (codigo_produto, etiqueta_rfid, timestamp_entrada, data_validade, timestamp_saida) VALUES
(1, 'RFID-0001-A1B2', '2025-10-10 09:42:15', '2027-10-10', NULL),
(1, 'RFID-0002-A1B2', '2025-10-10 09:43:10', '2027-10-10', NULL);

-- Produto 2 (5 unidades)
INSERT INTO itens (codigo_produto, etiqueta_rfid, timestamp_entrada, data_validade, timestamp_saida) VALUES
(2, 'RFID-0003-C3D4', '2025-10-11 14:25:03', '2027-04-11', NULL),
(2, 'RFID-0004-C3D4', '2025-10-11 14:25:55', '2027-04-11', NULL),
(2, 'RFID-0005-C3D4', '2025-10-11 14:26:31', '2027-04-11', NULL),
(2, 'RFID-0006-C3D4', '2025-10-11 14:27:09', '2027-04-11', NULL),
(2, 'RFID-0007-C3D4', '2025-10-11 14:27:44', '2027-04-11', NULL);

-- Produto 3 (6 unidades)
INSERT INTO itens (codigo_produto, etiqueta_rfid, timestamp_entrada, data_validade, timestamp_saida) VALUES
(3, 'RFID-0008-E5F6', '2025-10-12 08:12:44', '2026-12-12', NULL),
(3, 'RFID-0009-E5F6', '2025-10-12 08:13:27', '2026-12-12', NULL),
(3, 'RFID-0010-E5F6', '2025-10-12 08:13:52', '2026-12-12', NULL),
(3, 'RFID-0011-E5F6', '2025-10-12 08:14:10', '2026-12-12', NULL),
(3, 'RFID-0012-E5F6', '2025-10-12 08:14:55', '2026-12-12', NULL),
(3, 'RFID-0013-E5F6', '2025-10-12 08:15:30', '2026-12-12', NULL);

-- Produto 4 (4 unidades)
INSERT INTO itens (codigo_produto, etiqueta_rfid, timestamp_entrada, data_validade, timestamp_saida) VALUES
(4, 'RFID-0014-G7H8', '2025-10-13 11:21:09', '2026-08-13', NULL),
(4, 'RFID-0015-G7H8', '2025-10-13 11:22:02', '2026-08-13', NULL),
(4, 'RFID-0016-G7H8', '2025-10-13 11:22:58', '2026-08-13', NULL),
(4, 'RFID-0017-G7H8', '2025-10-13 11:23:21', '2026-08-13', NULL);

-- Produto 5 (3 unidades)
INSERT INTO itens (codigo_produto, etiqueta_rfid, timestamp_entrada, data_validade, timestamp_saida) VALUES
(5, 'RFID-0018-I9J0', '2025-10-14 07:05:44', '2026-05-14', NULL),
(5, 'RFID-0019-I9J0', '2025-10-14 07:06:20', '2026-05-14', NULL),
(5, 'RFID-0020-I9J0', '2025-10-14 07:07:01', '2026-05-14', NULL);



