-- Postavi rolu USER svim korisnicima koji nisu admin
-- Ovo će postaviti role na 'USER' za sve korisnike gde je role NULL ili nije 'ADMIN'

UPDATE users 
SET role = 'USER' 
WHERE role IS NULL OR (role != 'ADMIN' AND role != 'admin');

-- Proveri rezultat
SELECT 
    id, 
    email, 
    role, 
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;

