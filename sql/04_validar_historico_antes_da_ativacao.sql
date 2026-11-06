SELECT
  e.id AS enterprise_id,
  e.name AS empresa,
  p.id AS product_id,
  p.name AS produto,
  COUNT(*) AS oportunidades_existentes_no_v2
FROM opportunities o
JOIN enterprise_insurers ei ON ei.id = o.enterprise_insurer_id
JOIN enterprises e ON e.id = ei.enterprise_id
JOIN insurer_product_codes pc ON pc.id = o.product_code_id
JOIN products p ON p.id = pc.product_id
LEFT JOIN opportunity_counters c
  ON c.enterprise_id = e.id AND c.product_id = p.id
WHERE c.id IS NULL
GROUP BY e.id, e.name, p.id, p.name
ORDER BY e.name, p.name;
