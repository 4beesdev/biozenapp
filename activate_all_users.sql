-- Aktiviraj sve korisnike u produkcijskoj bazi
-- Ovo će postaviti is_active na true za sve korisnike gde je NULL ili false

UPDATE users 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Proveri rezultat
SELECT 
    id, 
    email, 
    role, 
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;

