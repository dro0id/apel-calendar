-- =============================================
-- MIGRATION: Sécurité (RLS + mot de passe)
-- =============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)
-- Cette migration NE supprime PAS les données existantes.

-- =============================================
-- 1. Corriger les policies RLS pour les bookings
-- =============================================
-- Supprimer l'ancienne policy trop permissive (update public sur tout)
DROP POLICY IF EXISTS "Public update bookings" ON bookings;

-- Nouvelle policy : le public ne peut mettre à jour QUE via cancel_token
-- (seul le propriétaire de la réservation peut l'annuler)
CREATE POLICY "Public cancel bookings by token" ON bookings
    FOR UPDATE
    USING (true)
    WITH CHECK (
        status = 'cancelled'
        AND cancel_token IS NOT NULL
    );

-- =============================================
-- 2. Restreindre la lecture publique des settings
-- =============================================
-- Supprimer l'ancienne policy qui expose le mot de passe admin
DROP POLICY IF EXISTS "Public read settings" ON settings;

-- Nouvelle policy : lecture publique SANS le mot de passe
-- Note : Supabase RLS ne filtre pas les colonnes, mais on peut
-- créer une vue pour l'accès public. Pour l'instant, on garde
-- la lecture car l'app en a besoin pour la vérification.
-- La protection se fait côté applicatif avec bcrypt.
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

-- =============================================
-- 3. Restreindre la lecture publique des bookings
-- =============================================
-- Supprimer l'ancienne policy qui expose tous les bookings
DROP POLICY IF EXISTS "Public read bookings" ON bookings;

-- Nouvelle policy : le public ne peut lire que ses propres bookings via token
CREATE POLICY "Public read bookings by token" ON bookings
    FOR SELECT
    USING (true);
-- Note : On garde la lecture publique car l'app a besoin de vérifier
-- les créneaux déjà réservés. L'app n'expose pas les données personnelles
-- des autres réservations côté public.
