-- Migracija blog_posts kolona
-- Promena excerpt sa VARCHAR(500) na TEXT
ALTER TABLE blog_posts ALTER COLUMN excerpt TYPE TEXT;

-- Promena featured_image sa VARCHAR(255) na VARCHAR(1000)
ALTER TABLE blog_posts ALTER COLUMN featured_image TYPE VARCHAR(1000);

-- Provera
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('excerpt', 'featured_image');

