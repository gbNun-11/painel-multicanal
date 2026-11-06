SELECT DISTINCT
    e.id AS enterprise_id,
    e.name AS empresa,
    p.id AS product_id,
    p.name AS produto,
    i.name AS seguradora,
    COALESCE(c.last_number, 0) AS ultimo_numero_no_contador,
    COALESCE(c.last_number, 0) + 1 AS proximo_numero
FROM enterprises e
JOIN enterprise_insurers ei ON ei.enterprise_id = e.id
JOIN insurers i ON i.id = ei.insurer_id
JOIN products p ON p.insurer_id = i.id
LEFT JOIN opportunity_counters c
    ON c.enterprise_id = e.id AND c.product_id = p.id
ORDER BY e.name, p.name, i.name;
