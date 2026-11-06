SELECT
  e.name AS empresa,
  p.name AS produto,
  c.last_number AS ultimo_numero,
  c.last_number + 1 AS proximo_numero
FROM opportunity_counters c
JOIN enterprises e ON e.id = c.enterprise_id
JOIN products p ON p.id = c.product_id
ORDER BY e.name, p.name;
