-- Promena role korisnika office@biozen.rs u ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'office@biozen.rs';

-- Provera
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'office@biozen.rs';

