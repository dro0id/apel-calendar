-- =============================================
-- MIGRATION: Dates spécifiques par événement
-- =============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)
-- Cette migration NE supprime PAS les données existantes.

-- 1. Ajouter la colonne use_specific_dates à event_types
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS use_specific_dates BOOLEAN DEFAULT FALSE;

-- 2. Créer la table event_type_dates
CREATE TABLE IF NOT EXISTS event_type_dates (
    id BIGSERIAL PRIMARY KEY,
    event_type_id BIGINT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_type_id, date)
);

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_event_type_dates_event ON event_type_dates(event_type_id);
CREATE INDEX IF NOT EXISTS idx_event_type_dates_date ON event_type_dates(date);

-- 4. Row Level Security
ALTER TABLE event_type_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event_type_dates" ON event_type_dates FOR SELECT USING (true);
CREATE POLICY "Admin all event_type_dates" ON event_type_dates FOR ALL USING (true);
