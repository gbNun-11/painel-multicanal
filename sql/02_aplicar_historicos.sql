-- INRI V2 - SEED DOS CONTADORES PILOTO NO POSTGRESQL DA APP01
-- Execute somente APOS a migration, com importacoes pausadas, e
-- depois de rodar 01_conferir_mapeamento.sql.
-- Transacao unica: erro de mapeamento em QUALQUER produto cancela os 4 ajustes.
-- Nao renumera oportunidades antigas.
-- Nao reduz um contador que eventualmente ja esteja acima do historico informado.
BEGIN;
DO $historicos$
DECLARE
  alvo record;
  empresa_ids uuid[];
  produto_ids uuid[];
  numero_gravado bigint;
BEGIN
  FOR alvo IN
    SELECT * FROM (VALUES
      ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'BIKE', 12190::bigint),
      ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'PORTATEIS', 9127::bigint),
      ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'AUTO', 8001::bigint),
      ('ICX CORRETORA LTDA', 'AUTO', 2040::bigint)
    ) AS v(empresa, produto, ultimo_historico)
  LOOP
    SELECT array_agg(DISTINCT e.id), array_agg(DISTINCT p.id)
      INTO empresa_ids, produto_ids
    FROM enterprises e
    JOIN enterprise_insurers ei ON ei.enterprise_id = e.id
    JOIN products p ON p.insurer_id = ei.insurer_id
    WHERE upper(btrim(e.name)) = alvo.empresa
      AND (
        (alvo.produto = 'BIKE' AND upper(btrim(p.name)) = 'BIKE')
        OR (alvo.produto = 'PORTATEIS' AND upper(btrim(p.name)) IN ('PORTATEIS', 'PORTÁTEIS'))
        OR (alvo.produto = 'AUTO' AND upper(btrim(p.name)) IN ('AUTO', 'AUTOMOVEL', 'AUTOMÓVEL'))
      );

    IF COALESCE(cardinality(empresa_ids), 0) <> 1 THEN
      RAISE EXCEPTION 'Empresa nao identificada de modo unico: % (ids: %)',
        alvo.empresa, empresa_ids;
    END IF;
    IF COALESCE(cardinality(produto_ids), 0) <> 1 THEN
      RAISE EXCEPTION
        'Produto nao identificado de modo unico: % / % (ids: %). Verifique seguradoras e IDs; nao copie numeros para produtos homonimos.',
        alvo.empresa, alvo.produto, produto_ids;
    END IF;

    INSERT INTO opportunity_counters (
      enterprise_id, product_id, last_number
    ) VALUES (
      empresa_ids[1], produto_ids[1], alvo.ultimo_historico
    )
    ON CONFLICT (enterprise_id, product_id)
    DO UPDATE SET
      last_number = GREATEST(
        opportunity_counters.last_number,
        EXCLUDED.last_number
      ),
      updated_at = now()
    RETURNING last_number INTO numero_gravado;

    RAISE NOTICE '% / % | ultimo=% | proximo=%',
      alvo.empresa, alvo.produto, numero_gravado, numero_gravado + 1;
  END LOOP;
END
$historicos$;
COMMIT;

-- Confirmar os 4 numeros, por empresa + produto logico efetivo:
SELECT
  e.name AS empresa,
  p.name AS produto,
  i.name AS seguradora,
  c.last_number AS ultimo_numero,
  c.last_number + 1 AS proximo_numero
FROM opportunity_counters c
JOIN enterprises e ON e.id = c.enterprise_id
JOIN products p ON p.id = c.product_id
JOIN insurers i ON i.id = p.insurer_id
WHERE (upper(btrim(e.name)), upper(btrim(p.name))) IN (
  ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'BIKE'),
  ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'PORTATEIS'),
  ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'PORTÁTEIS'),
  ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'AUTOMOVEL'),
  ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'AUTOMÓVEL'),
  ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'AUTO'),
  ('ICX CORRETORA LTDA', 'AUTOMOVEL'),
  ('ICX CORRETORA LTDA', 'AUTOMÓVEL'),
  ('ICX CORRETORA LTDA', 'AUTO')
)
ORDER BY e.name, p.name, i.name;
