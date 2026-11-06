SELECT
  c.id AS contador_id,
  e.name AS empresa,
  p.name AS produto,
  c.last_number,
  COALESCE(MAX(o.opportunity_number), 0) AS maior_numero_gravado,
  COUNT(o.id) AS oportunidades_numeradas
FROM opportunity_counters c
JOIN enterprises e ON e.id = c.enterprise_id
JOIN products p ON p.id = c.product_id
LEFT JOIN opportunities o ON o.counter_id = c.id
GROUP BY c.id, e.name, p.name, c.last_number
ORDER BY e.name, p.name;

SELECT COUNT(*) AS oportunidades_legadas_sem_numero
FROM opportunities
WHERE counter_id IS NULL AND opportunity_number IS NULL;

SELECT COUNT(*) AS inconsistencias
FROM opportunities
WHERE (counter_id IS NULL) <> (opportunity_number IS NULL);
