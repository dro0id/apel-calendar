-- =============================================
-- SCHEMA SUPABASE POUR APEL CALENDAR (v2)
-- Clone Calendly complet
-- =============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)

-- Supprimer les anciennes tables si elles existent
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS event_types CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- =============================================
-- TABLE: settings (paramètres globaux)
-- =============================================
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    admin_password TEXT NOT NULL DEFAULT 'admin123',
    business_name TEXT DEFAULT 'Mon Entreprise',
    business_email TEXT DEFAULT '',
    business_phone TEXT DEFAULT '',
    business_logo TEXT DEFAULT '',
    welcome_message TEXT DEFAULT 'Bienvenue ! Choisissez un type de rendez-vous pour commencer.',
    timezone TEXT DEFAULT 'Europe/Paris',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les paramètres par défaut
INSERT INTO settings (admin_password, business_name) VALUES ('admin123', 'Mon Entreprise');

-- =============================================
-- TABLE: event_types (types d'événements)
-- =============================================
CREATE TABLE event_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    duration INTEGER NOT NULL DEFAULT 30,
    color TEXT DEFAULT '#3b82f6',
    location TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    max_bookings_per_day INTEGER DEFAULT NULL,
    buffer_before INTEGER DEFAULT 0,
    buffer_after INTEGER DEFAULT 0,
    min_notice_hours INTEGER DEFAULT 24,
    max_days_ahead INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer un type d'événement par défaut
INSERT INTO event_types (name, slug, description, duration, color) VALUES
    ('Consultation 30 min', 'consultation-30', 'Consultation standard de 30 minutes', 30, '#3b82f6'),
    ('Réunion 1 heure', 'reunion-1h', 'Réunion approfondie d''une heure', 60, '#10b981');

-- =============================================
-- TABLE: availability (disponibilités)
-- =============================================
CREATE TABLE availability (
    id BIGSERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les disponibilités par défaut (Lun-Ven, 9h-12h et 14h-18h)
INSERT INTO availability (day_of_week, start_time, end_time, is_active) VALUES
    (0, '09:00', '12:00', TRUE), (0, '14:00', '18:00', TRUE),
    (1, '09:00', '12:00', TRUE), (1, '14:00', '18:00', TRUE),
    (2, '09:00', '12:00', TRUE), (2, '14:00', '18:00', TRUE),
    (3, '09:00', '12:00', TRUE), (3, '14:00', '18:00', TRUE),
    (4, '09:00', '12:00', TRUE), (4, '14:00', '18:00', TRUE),
    (5, '09:00', '12:00', FALSE), (6, '09:00', '12:00', FALSE);

-- =============================================
-- TABLE: date_overrides (exceptions de dates)
-- =============================================
CREATE TABLE date_overrides (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    is_available BOOLEAN DEFAULT FALSE,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: bookings (réservations)
-- =============================================
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    event_type_id BIGINT REFERENCES event_types(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT DEFAULT '',
    guest_notes TEXT DEFAULT '',
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending', 'completed')),
    cancel_token TEXT DEFAULT NULL,
    cancelled_at TIMESTAMPTZ DEFAULT NULL,
    cancel_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEX pour les performances
-- =============================================
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_event_type ON bookings(event_type_id);
CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_availability_day ON availability(day_of_week);
CREATE INDEX idx_event_types_slug ON event_types(slug);
CREATE INDEX idx_event_types_active ON event_types(is_active);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public read event_types" ON event_types FOR SELECT USING (true);
CREATE POLICY "Public read availability" ON availability FOR SELECT USING (true);
CREATE POLICY "Public read date_overrides" ON date_overrides FOR SELECT USING (true);
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);

-- Politiques d'insertion publique
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Politiques de mise à jour publique (pour annulation)
CREATE POLICY "Public update bookings" ON bookings FOR UPDATE USING (true);

-- Politiques admin (toutes les opérations)
CREATE POLICY "Admin all settings" ON settings FOR ALL USING (true);
CREATE POLICY "Admin all event_types" ON event_types FOR ALL USING (true);
CREATE POLICY "Admin all availability" ON availability FOR ALL USING (true);
CREATE POLICY "Admin all date_overrides" ON date_overrides FOR ALL USING (true);
CREATE POLICY "Admin all bookings" ON bookings FOR ALL USING (true);

-- =============================================
-- FONCTION: Générer un token d'annulation unique
-- =============================================
CREATE OR REPLACE FUNCTION generate_cancel_token()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cancel_token := encode(gen_random_bytes(16), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cancel_token
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_cancel_token();

-- =============================================
-- FONCTION: Mise à jour automatique de updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_types_updated_at
    BEFORE UPDATE ON event_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
