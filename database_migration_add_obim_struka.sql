-- SQL skripta za dodavanje kolona obimStruka u tabele users i measurements
-- Ova skripta je sigurna za izvršavanje - proverava da li kolone već postoje

-- Dodaj obimStruka u tabelu users (ako ne postoji)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'obim_struka'
    ) THEN
        ALTER TABLE users ADD COLUMN obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona obim_struka je dodata u tabelu users';
    ELSE
        RAISE NOTICE 'Kolona obim_struka već postoji u tabeli users';
    END IF;
END $$;

-- Dodaj obimStruka u tabelu measurements (ako ne postoji)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'measurements' 
        AND column_name = 'obim_struka'
    ) THEN
        ALTER TABLE measurements ADD COLUMN obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona obim_struka je dodata u tabelu measurements';
    ELSE
        RAISE NOTICE 'Kolona obim_struka već postoji u tabeli measurements';
    END IF;
END $$;

-- Dodaj promenaObimStruka u tabelu measurements (ako ne postoji)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'measurements' 
        AND column_name = 'promena_obim_struka'
    ) THEN
        ALTER TABLE measurements ADD COLUMN promena_obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona promena_obim_struka je dodata u tabelu measurements';
    ELSE
        RAISE NOTICE 'Kolona promena_obim_struka već postoji u tabeli measurements';
    END IF;
END $$;

-- Proveri da li su sve kolone dodate
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE (table_name = 'users' AND column_name = 'obim_struka')
   OR (table_name = 'measurements' AND column_name IN ('obim_struka', 'promena_obim_struka'))
ORDER BY table_name, column_name;

