-- =====================================
-- seed.sql (Lubrificantes e Arrefecimento) – compatível com schema3
-- Popula OMs, produtos, itens e pedidos com vínculos RFID reais
-- Estados finais:
--   1) Pedido 1: aberto parcial (vinculado parcialmente)
--   2) Pedido 2: entregue completo (autoentrega por vínculos)
--   3) Pedido 3: cancelado sem atendimento (linhas removidas por trigger)
--   4) Pedido 4: aberto sem atendimento
-- =====================================

BEGIN;

-- ================================
-- ORGANIZAÇÕES MILITARES (OMs)
-- ================================
INSERT INTO oms (sigla, nome)
VALUES
  ('1BLog', '1º Batalhão Logístico'),
  ('CTEx',  'Centro Tecnológico do Exército'),
  ('IME',   'Instituto Militar de Engenharia'),
  ('AGSP',  'Arsenal de Guerra de São Paulo')
ON CONFLICT (sigla) DO NOTHING;

-- ================================
-- PRODUTOS (7)
-- ================================
INSERT INTO produtos (descricao, categoria, marca)
VALUES
  ('Óleo de Motor 5W-30 Sintético',           'Lubrificante Motor',     'Lubrax'),
  ('Óleo de Motor 15W-40 Mineral',            'Lubrificante Motor',     'Shell'),
  ('Fluido de Freio DOT 4',                   'Fluido de Freio',        'Bosch'),
  ('Fluido ATF Dexron VI',                    'Transmissão ATF',        'ACDelco'),
  ('Graxa Multiuso NLGI-2',                   'Graxa',                  'Mobil'),
  ('Coolant Concentrado (Etilenoglicol 50%)', 'Arrefecimento',          'Havoline'),
  ('Coolant Pronto Uso -36°C',                'Arrefecimento',          'Castrol')
ON CONFLICT DO NOTHING;

-- ================================
-- ITENS (35)
-- Observações:
--  - Não forçamos “13 fora de estoque” aqui.
--  - Itens vinculados sairão do estoque pelos triggers do schema3.
-- ================================
INSERT INTO itens (
  codigo_produto, etiqueta_rfid, timestamp_entrada, data_validade, ultima_verificacao, origem_ultima_verificacao
) VALUES
  -- Produto 1: Óleo 5W-30 (8)
  (1, 'RFID-LUB-0001', NOW() - INTERVAL '40 days', '2028-12-31', NOW() - INTERVAL '1 day',  'LEITOR_A01'),
  (1, 'RFID-LUB-0002', NOW() - INTERVAL '40 days', '2028-12-31', NOW() - INTERVAL '5 days', 'LEITOR_A01'),
  (1, 'RFID-LUB-0003', NOW() - INTERVAL '40 days', '2028-12-31', NOW(),                     'LEITOR_A02'),
  (1, 'RFID-LUB-0004', NOW() - INTERVAL '40 days', '2028-12-31', NOW() - INTERVAL '1 day',  'LEITOR_A02'),
  (1, 'RFID-LUB-0005', NOW() - INTERVAL '40 days', '2028-12-31', NOW() - INTERVAL '2 days', 'LEITOR_A01'),
  (1, 'RFID-LUB-0006', NOW() - INTERVAL '40 days', '2028-12-31', NOW() - INTERVAL '3 days', 'LEITOR_A01'),
  (1, 'RFID-LUB-0007', NOW() - INTERVAL '40 days', '2028-12-31', NOW() - INTERVAL '2 days', 'LEITOR_A03'),
  (1, 'RFID-LUB-0008', NOW() - INTERVAL '40 days', '2028-12-31', NOW(),                     'LEITOR_A03'),

  -- Produto 2: Óleo 15W-40 (6)
  (2, 'RFID-LUB-0101', NOW() - INTERVAL '40 days', '2027-06-30', NOW(),                      'LEITOR_A01'),
  (2, 'RFID-LUB-0102', NOW() - INTERVAL '40 days', '2027-06-30', NOW() - INTERVAL '1 day',   'LEITOR_A02'),
  (2, 'RFID-LUB-0103', NOW() - INTERVAL '40 days', '2027-06-30', NOW() - INTERVAL '8 days',  'LEITOR_A02'),
  (2, 'RFID-LUB-0104', NOW() - INTERVAL '40 days', '2027-06-30', NOW() - INTERVAL '12 hours','LEITOR_A03'),
  (2, 'RFID-LUB-0105', NOW() - INTERVAL '40 days', '2027-06-30', NOW() - INTERVAL '4 days',  'LEITOR_A01'),
  (2, 'RFID-LUB-0106', NOW() - INTERVAL '40 days', '2027-06-30', NOW(),                      'LEITOR_A03'),

  -- Produto 3: DOT4 (5)
  (3, 'RFID-FRE-0201', NOW() - INTERVAL '40 days', '2029-03-31', NOW(),                      'LEITOR_B01'),
  (3, 'RFID-FRE-0202', NOW() - INTERVAL '40 days', '2029-03-31', NOW() - INTERVAL '2 days',  'LEITOR_B01'),
  (3, 'RFID-FRE-0203', NOW() - INTERVAL '40 days', '2029-03-31', NOW() - INTERVAL '6 days',  'LEITOR_B02'),
  (3, 'RFID-FRE-0204', NOW() - INTERVAL '40 days', '2029-03-31', NOW(),                      'LEITOR_B02'),
  (3, 'RFID-FRE-0205', NOW() - INTERVAL '40 days', '2029-03-31', NOW() - INTERVAL '1 day',   'LEITOR_B01'),

  -- Produto 4: ATF (5)
  (4, 'RFID-ATF-0301', NOW() - INTERVAL '40 days', '2030-09-30', NOW() - INTERVAL '3 days',  'LEITOR_B01'),
  (4, 'RFID-ATF-0302', NOW() - INTERVAL '40 days', '2030-09-30', NOW(),                      'LEITOR_B02'),
  (4, 'RFID-ATF-0303', NOW() - INTERVAL '40 days', '2030-09-30', NOW() - INTERVAL '9 hours', 'LEITOR_B02'),
  (4, 'RFID-ATF-0304', NOW() - INTERVAL '40 days', '2030-09-30', NOW() - INTERVAL '2 days',  'LEITOR_B03'),
  (4, 'RFID-ATF-0305', NOW() - INTERVAL '40 days', '2030-09-30', NOW(),                      'LEITOR_B03'),

  -- Produto 5: Graxa (4)
  (5, 'RFID-GRX-0401', NOW() - INTERVAL '40 days', '2028-08-31', NOW(),                      'LEITOR_C01'),
  (5, 'RFID-GRX-0402', NOW() - INTERVAL '40 days', '2028-08-31', NOW() - INTERVAL '1 day',   'LEITOR_C01'),
  (5, 'RFID-GRX-0403', NOW() - INTERVAL '40 days', '2028-08-31', NOW() - INTERVAL '2 days',  'LEITOR_C02'),
  (5, 'RFID-GRX-0404', NOW() - INTERVAL '40 days', '2028-08-31', NOW(),                      'LEITOR_C02'),

  -- Produto 6: Coolant Concentrado (4)
  (6, 'RFID-COO-0501', NOW() - INTERVAL '40 days', '2031-01-31', NOW(),                      'LEITOR_C01'),
  (6, 'RFID-COO-0502', NOW() - INTERVAL '40 days', '2031-01-31', NOW() - INTERVAL '2 days',  'LEITOR_C02'),
  (6, 'RFID-COO-0503', NOW() - INTERVAL '40 days', '2031-01-31', NOW() - INTERVAL '5 days',  'LEITOR_C01'),
  (6, 'RFID-COO-0504', NOW() - INTERVAL '40 days', '2031-01-31', NOW(),                      'LEITOR_C02'),

  -- Produto 7: Coolant Pronto Uso (3)
  (7, 'RFID-COO-0601', NOW() - INTERVAL '40 days', '2030-05-31', NOW(),                      'LEITOR_C01'),
  (7, 'RFID-COO-0602', NOW() - INTERVAL '40 days', '2030-05-31', NOW() - INTERVAL '12 hours','LEITOR_C01'),
  (7, 'RFID-COO-0603', NOW() - INTERVAL '40 days', '2030-05-31', NOW() - INTERVAL '1 day',   'LEITOR_C02')
ON CONFLICT DO NOTHING;

-- ================================
-- PEDIDOS (4) – criar todos como 'aberto' (exceto o 3 que cancelaremos depois)
-- Deixe o Pedido 2 'aberto': os vínculos irão marcá-lo 'entregue'
-- ================================
INSERT INTO pedidos (om_id, status, data_pedido, observacoes)
VALUES
  (1, 'aberto',   NOW() - INTERVAL '7 days',  'Reposição de óleo e fluido de freio.'),   -- Pedido 1
  (2, 'aberto',   NOW() - INTERVAL '20 days', 'Entrega completa de ATF e graxa.'),       -- Pedido 2 (será entregue via vínculos)
  (3, 'aberto',   NOW() - INTERVAL '10 days', 'Solicitação cancelada por replanejamento.'), -- Pedido 3 (será cancelado sem atendimento)
  (4, 'aberto',   NOW() - INTERVAL '3 days',  'Programa de manutenção preventiva.');     -- Pedido 4

-- ================================
-- ITENS DOS PEDIDOS
--  - quantidade_atendida inicia 0; triggers atualizam via vínculos
-- ================================
-- Pedido 1 (aberto parcial): solicitados > estoque disponível (ok)
INSERT INTO pedido_itens (pedido_id, codigo_produto, quantidade_solicitada, quantidade_atendida)
VALUES
  (1, 1, 12, 0),  -- Óleo 5W-30: 12 solicitados (vincularemos 7)
  (1, 3,  6, 0),  -- DOT4: 6 solicitados (vincularemos 2)
  (1, 6,  4, 0);  -- Coolant concentrado: 4 solicitados (0 vínculos por ora)

-- Pedido 2 (entregue completo): ajustar às quantidades EXISTENTES (5 ATF, 4 Graxa)
INSERT INTO pedido_itens (pedido_id, codigo_produto, quantidade_solicitada, quantidade_atendida)
VALUES
  (2, 4, 5, 0),   -- ATF: 5 solicitados (5 existentes)
  (2, 5, 4, 0);   -- Graxa: 4 solicitados (4 existentes)

-- Pedido 3 (será cancelado sem atendimento)
INSERT INTO pedido_itens (pedido_id, codigo_produto, quantidade_solicitada, quantidade_atendida)
VALUES
  (3, 2, 10, 0),  -- Óleo 15W-40, zero atendimento
  (3, 7,  5, 0);  -- Coolant pronto uso, zero atendimento

-- Pedido 4 (aberto, sem atendimento)
INSERT INTO pedido_itens (pedido_id, codigo_produto, quantidade_solicitada, quantidade_atendida)
VALUES
  (4, 1, 5, 0),
  (4, 3, 4, 0),
  (4, 6, 3, 0);

-- ================================
-- VÍNCULOS RFID (usar sp do schema3) – geram baixa de estoque e autoentrega
-- ================================
-- Pedido 1: Óleo 5W-30 (7 peças)
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0001', 'Cb Goulart', 'LEITOR_A01');
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0002', 'Cb Goulart', 'LEITOR_A01');
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0003', 'Cb Goulart', 'LEITOR_A02');
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0004', 'Cb Goulart', 'LEITOR_A02');
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0005', 'Cb Goulart', 'LEITOR_A01');
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0006', 'Cb Goulart', 'LEITOR_A01');
SELECT sp_vincular_item_por_rfid(1, 1, 'RFID-LUB-0007', 'Cb Goulart', 'LEITOR_A03');

-- Pedido 1: DOT4 (2 peças)
SELECT sp_vincular_item_por_rfid(1, 3, 'RFID-FRE-0201', 'Cb Goulart', 'LEITOR_B01');
SELECT sp_vincular_item_por_rfid(1, 3, 'RFID-FRE-0204', 'Cb Goulart', 'LEITOR_B02');

-- Pedido 2: ATF (5 peças)
SELECT sp_vincular_item_por_rfid(2, 4, 'RFID-ATF-0301', 'Sd Azevedo', 'LEITOR_B01');
SELECT sp_vincular_item_por_rfid(2, 4, 'RFID-ATF-0302', 'Sd Azevedo', 'LEITOR_B02');
SELECT sp_vincular_item_por_rfid(2, 4, 'RFID-ATF-0303', 'Sd Azevedo', 'LEITOR_B02');
SELECT sp_vincular_item_por_rfid(2, 4, 'RFID-ATF-0304', 'Sd Azevedo', 'LEITOR_B03');
SELECT sp_vincular_item_por_rfid(2, 4, 'RFID-ATF-0305', 'Sd Azevedo', 'LEITOR_B03');

-- Pedido 2: Graxa (4 peças)
SELECT sp_vincular_item_por_rfid(2, 5, 'RFID-GRX-0401', 'Sd Azevedo', 'LEITOR_C01');
SELECT sp_vincular_item_por_rfid(2, 5, 'RFID-GRX-0402', 'Sd Azevedo', 'LEITOR_C01');
SELECT sp_vincular_item_por_rfid(2, 5, 'RFID-GRX-0403', 'Sd Azevedo', 'LEITOR_C02');
SELECT sp_vincular_item_por_rfid(2, 5, 'RFID-GRX-0404', 'Sd Azevedo', 'LEITOR_C02');

-- Após os vínculos acima, os triggers:
--   - atualizam quantidade_atendida das linhas
--   - marcam 'timestamp_saida' dos itens
--   - marcam Pedido 2 como 'entregue' e setam 'data_entrega'

-- ================================
-- Cancelar Pedido 3 (sem atendimento)
--   - triggers impedem cancelamento com atendimento > 0
--   - triggers apagam as linhas do pedido ao mudar para 'cancelado'
-- ================================
UPDATE pedidos
   SET status = 'cancelado', data_entrega = NULL
 WHERE id = 3;

COMMIT;

-- ================================
-- CONSULTAS DE VALIDAÇÃO RÁPIDA
-- ================================
-- Verificar OMs
SELECT * FROM oms ORDER BY id;

-- Verificar produtos e quantidades (quantidade_em_estoque cai conforme vínculos)
SELECT * FROM vw_produtos_quantidade ORDER BY codigo;

-- Conferir itens em estoque vs. fora (fora = qtd de vínculos acima)
SELECT
  COUNT(*) FILTER (WHERE timestamp_saida IS NULL)     AS itens_em_estoque,
  COUNT(*) FILTER (WHERE timestamp_saida IS NOT NULL) AS itens_fora_estoque,
  COUNT(*) AS total_itens
FROM itens;

-- Pedidos abertos e percentuais de atendimento
SELECT * FROM vw_pedidos_abertos;

-- Backorders
SELECT * FROM vw_backorder;

-- Resumo geral
SELECT * FROM vw_pedidos_overview;

-- Histórico detalhado de entregas (com RFIDs e responsáveis)
SELECT * FROM vw_pedidos_entregues_detalhe;


