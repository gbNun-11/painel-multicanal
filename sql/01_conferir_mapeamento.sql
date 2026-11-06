WITH alvos (empresa, produto, ultimo_historico) AS (
  VALUES
    ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'BIKE', 12190::bigint),
    ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'PORTATEIS', 9127::bigint),
    ('INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA', 'AUTO', 8001::bigint),
    ('ICX CORRETORA LTDA', 'AUTO', 2040::bigint)
)
SELECT
  a.empresa,
  a.produto AS grupo_solicitado,
  a.ultimo_historico,
  e.id AS enterprise_id,
  encontrado.product_id,
  encontrado.produto_no_banco,
  encontrado.seguradora,
  encontrado.ultimo_numero_atual,
  encontrado.ultimo_numero_atual + 1 AS proximo_numero_atual
FROM alvos a
LEFT JOIN enterprises e
  ON upper(btrim(e.name)) = a.empresa
LEFT JOIN LATERAL (
  SELECT DISTINCT
    p.id AS product_id,
    p.name AS produto_no_banco,
    i.name AS seguradora,
    COALESCE(c.last_number, 0) AS ultimo_numero_atual
  FROM enterprise_insurers ei
  JOIN insurers i ON i.id = ei.insurer_id
  JOIN products p ON p.insurer_id = i.id
  LEFT JOIN opportunity_counters c
    ON c.enterprise_id = e.id AND c.product_id = p.id
  WHERE ei.enterprise_id = e.id
    AND (
      (a.produto = 'BIKE' AND upper(btrim(p.name)) = 'BIKE')
      OR (a.produto = 'PORTATEIS' AND upper(btrim(p.name)) IN ('PORTATEIS', 'PORTÁTEIS'))
      OR (a.produto = 'AUTO' AND upper(btrim(p.name)) IN ('AUTO', 'AUTOMOVEL', 'AUTOMÓVEL'))
    )
) AS encontrado ON TRUE
ORDER BY a.empresa, a.produto, encontrado.seguradora;
