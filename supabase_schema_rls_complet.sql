-- ================================================================
-- 🔐 SANGO HEALTH — SCRIPT COMPLET : SCHÉMA + RLS SÉCURISÉ
-- À exécuter EN ENTIER dans le SQL Editor de Supabase
-- ⚡ Idempotent : peut être relancé sans risque
-- ================================================================


-- ================================================================
-- PARTIE 1 — CRÉATION DES TABLES (si elles n'existent pas encore)
-- ================================================================

CREATE TABLE IF NOT EXISTS doctors (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    specialty        VARCHAR(255) NOT NULL,
    address          TEXT NOT NULL,
    rating           NUMERIC(2, 1) DEFAULT 5.0,
    reviews_count    INT DEFAULT 0,
    fee              VARCHAR(100) DEFAULT '30 000 CDF',
    next_slot        VARCHAR(100) DEFAULT 'Aujourd''hui à 15:00',
    image            TEXT,
    consultation_type VARCHAR(100) DEFAULT 'Cabinet & Vidéo',
    bio              TEXT,
    slots            JSONB DEFAULT '["09:00","10:30","14:00","15:30","16:30"]'::jsonb,
    schedule         JSONB DEFAULT '[]'::jsonb,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id               BIGSERIAL PRIMARY KEY,
    doctor_name      VARCHAR(255) NOT NULL,
    specialty        VARCHAR(255) NOT NULL,
    date             VARCHAR(100) NOT NULL,
    time             VARCHAR(50)  NOT NULL,
    type             VARCHAR(100) NOT NULL,
    status           VARCHAR(50)  DEFAULT 'Confirmé',
    patient_name     VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id                   VARCHAR(100) PRIMARY KEY,
    appointment_id       BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_name          VARCHAR(255) NOT NULL,
    patient_name         VARCHAR(255) NOT NULL,
    date                 VARCHAR(100) NOT NULL,
    medications          JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes                TEXT,
    qr_code_token        VARCHAR(255),
    signature_stamp      TEXT,
    is_dispensed         BOOLEAN DEFAULT FALSE,
    dispensed_at         TIMESTAMP WITH TIME ZONE,
    dispensed_by_pharmacy VARCHAR(255),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_accounts (
    id                   BIGSERIAL PRIMARY KEY,
    name                 VARCHAR(255) NOT NULL,
    specialty            VARCHAR(255),
    clinic_name          VARCHAR(255) NOT NULL,
    address              TEXT,
    phone                VARCHAR(100),
    email                VARCHAR(255) UNIQUE NOT NULL,
    plan                 VARCHAR(50)  NOT NULL DEFAULT 'Pro Cabinet',
    monthly_fee_usd      INT DEFAULT 59,
    status               VARCHAR(50)  DEFAULT 'Actif',
    joined_date          VARCHAR(100) DEFAULT 'Aujourd''hui',
    total_consultations  INT DEFAULT 0,
    video_hours_used     INT DEFAULT 0,
    image                TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_invoices (
    id               VARCHAR(100) PRIMARY KEY,
    account_name     VARCHAR(255) NOT NULL,
    clinic_name      VARCHAR(255),
    plan             VARCHAR(50)  NOT NULL,
    amount_usd       INT NOT NULL,
    amount_cdf       INT NOT NULL,
    date             VARCHAR(100) NOT NULL,
    payment_method   VARCHAR(100) NOT NULL,
    phone_number     VARCHAR(100),
    status           VARCHAR(50)  DEFAULT 'Payé',
    transaction_ref  VARCHAR(255),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS super_admins (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    role       VARCHAR(50)  DEFAULT 'SUPER_ADMIN',
    status     VARCHAR(50)  DEFAULT 'Actif',
    phone      VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ================================================================
-- PARTIE 2 — COLONNES user_id (lien entre données et auth.users)
-- ================================================================

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS patient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE prescriptions
    ADD COLUMN IF NOT EXISTS doctor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE saas_accounts
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- ================================================================
-- PARTIE 3 — TABLE user_roles (pivot central des rôles)
-- ================================================================

CREATE TABLE IF NOT EXISTS user_roles (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('patient', 'medecin', 'pharmacie', 'admin')),
    doctor_id  BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);


-- ================================================================
-- PARTIE 4 — SUPPRESSION DES ANCIENNES POLITIQUES PERMISSIVES
-- ================================================================

DROP POLICY IF EXISTS "Public read doctors"       ON doctors;
DROP POLICY IF EXISTS "Public insert doctors"     ON doctors;
DROP POLICY IF EXISTS "Public update doctors"     ON doctors;
DROP POLICY IF EXISTS "Public all appointments"   ON appointments;
DROP POLICY IF EXISTS "Public all prescriptions"  ON prescriptions;
DROP POLICY IF EXISTS "Public all saas_accounts"  ON saas_accounts;
DROP POLICY IF EXISTS "Public all saas_invoices"  ON saas_invoices;
DROP POLICY IF EXISTS "Public all super_admins"   ON super_admins;

-- Suppression des nouvelles policies si elles existent déjà (idempotence)
DROP POLICY IF EXISTS "user_roles: lecture propre rôle"       ON user_roles;
DROP POLICY IF EXISTS "user_roles: admin peut tout gérer"     ON user_roles;
DROP POLICY IF EXISTS "doctors: lecture publique"             ON doctors;
DROP POLICY IF EXISTS "doctors: insertion admin"              ON doctors;
DROP POLICY IF EXISTS "doctors: modification médecin ou admin" ON doctors;
DROP POLICY IF EXISTS "doctors: suppression admin"            ON doctors;
DROP POLICY IF EXISTS "appointments: lecture patient médecin admin pharmacie" ON appointments;
DROP POLICY IF EXISTS "appointments: insertion patient ou admin"              ON appointments;
DROP POLICY IF EXISTS "appointments: modification patient médecin admin"      ON appointments;
DROP POLICY IF EXISTS "appointments: suppression admin"                       ON appointments;
DROP POLICY IF EXISTS "prescriptions: lecture médecin pharmacie admin patient" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions: insertion médecin ou admin"              ON prescriptions;
DROP POLICY IF EXISTS "prescriptions: modification médecin pharmacie admin"    ON prescriptions;
DROP POLICY IF EXISTS "prescriptions: suppression admin"                       ON prescriptions;
DROP POLICY IF EXISTS "saas_accounts: lecture propriétaire ou admin" ON saas_accounts;
DROP POLICY IF EXISTS "saas_accounts: insertion admin"               ON saas_accounts;
DROP POLICY IF EXISTS "saas_accounts: modification admin"            ON saas_accounts;
DROP POLICY IF EXISTS "saas_accounts: suppression admin"             ON saas_accounts;
DROP POLICY IF EXISTS "saas_invoices: lecture admin"   ON saas_invoices;
DROP POLICY IF EXISTS "saas_invoices: insertion admin" ON saas_invoices;
DROP POLICY IF EXISTS "super_admins: admin uniquement" ON super_admins;


-- ================================================================
-- PARTIE 5 — ACTIVATION RLS SUR TOUTES LES TABLES
-- ================================================================

ALTER TABLE doctors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles    ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- PARTIE 6 — FONCTIONS HELPER (évaluées côté serveur, SECURITY DEFINER)
-- ================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION is_medecin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'medecin'
    );
$$;

CREATE OR REPLACE FUNCTION get_my_doctor_id()
RETURNS BIGINT LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT doctor_id FROM user_roles
    WHERE user_id = auth.uid() AND role = 'medecin' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_pharmacie()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'pharmacie'
    );
$$;


-- ================================================================
-- PARTIE 7 — POLITIQUES RLS SÉCURISÉES
-- ================================================================

-- ── user_roles ──────────────────────────────────────────────────
CREATE POLICY "user_roles: lecture propre rôle"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "user_roles: admin peut tout gérer"
    ON user_roles FOR ALL
    USING (is_admin());

-- ── doctors (annuaire public, écriture restreinte) ───────────────
CREATE POLICY "doctors: lecture publique"
    ON doctors FOR SELECT USING (true);

CREATE POLICY "doctors: insertion admin"
    ON doctors FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "doctors: modification médecin ou admin"
    ON doctors FOR UPDATE
    USING (is_admin() OR id = get_my_doctor_id());

CREATE POLICY "doctors: suppression admin"
    ON doctors FOR DELETE USING (is_admin());

-- ── appointments ─────────────────────────────────────────────────
CREATE POLICY "appointments: lecture patient médecin admin pharmacie"
    ON appointments FOR SELECT
    USING (
        patient_user_id = auth.uid()
        OR is_medecin()
        OR is_admin()
        OR is_pharmacie()
    );

CREATE POLICY "appointments: insertion patient ou admin"
    ON appointments FOR INSERT
    WITH CHECK (patient_user_id = auth.uid() OR is_admin());

CREATE POLICY "appointments: modification patient médecin admin"
    ON appointments FOR UPDATE
    USING (
        patient_user_id = auth.uid()
        OR is_medecin()
        OR is_admin()
    );

CREATE POLICY "appointments: suppression admin"
    ON appointments FOR DELETE USING (is_admin());

-- ── prescriptions ────────────────────────────────────────────────
CREATE POLICY "prescriptions: lecture médecin pharmacie admin patient"
    ON prescriptions FOR SELECT
    USING (
        doctor_user_id = auth.uid()
        OR is_pharmacie()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.patient_user_id = auth.uid()
              AND a.doctor_name = prescriptions.doctor_name
        )
    );

CREATE POLICY "prescriptions: insertion médecin ou admin"
    ON prescriptions FOR INSERT
    WITH CHECK (is_medecin() OR is_admin());

CREATE POLICY "prescriptions: modification médecin pharmacie admin"
    ON prescriptions FOR UPDATE
    USING (
        doctor_user_id = auth.uid()
        OR is_pharmacie()
        OR is_admin()
    );

CREATE POLICY "prescriptions: suppression admin"
    ON prescriptions FOR DELETE USING (is_admin());

-- ── saas_accounts (données B2B sensibles) ────────────────────────
CREATE POLICY "saas_accounts: lecture propriétaire ou admin"
    ON saas_accounts FOR SELECT
    USING (owner_user_id = auth.uid() OR is_admin());

CREATE POLICY "saas_accounts: insertion admin"
    ON saas_accounts FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "saas_accounts: modification admin"
    ON saas_accounts FOR UPDATE USING (is_admin());

CREATE POLICY "saas_accounts: suppression admin"
    ON saas_accounts FOR DELETE USING (is_admin());

-- ── saas_invoices (audit trail immuable) ─────────────────────────
CREATE POLICY "saas_invoices: lecture admin"
    ON saas_invoices FOR SELECT USING (is_admin());

CREATE POLICY "saas_invoices: insertion admin"
    ON saas_invoices FOR INSERT WITH CHECK (is_admin());
-- Pas de UPDATE ni DELETE → les factures sont immuables

-- ── super_admins (ultra-sensible) ────────────────────────────────
CREATE POLICY "super_admins: admin uniquement"
    ON super_admins FOR ALL USING (is_admin());


-- ================================================================
-- PARTIE 8 — TRIGGER : rôle automatique à l'inscription
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
    IF NEW.email IN ('danielkiboko218@gmail.com', 'kibongef15@gmail.com') THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        INSERT INTO user_roles (user_id, role)
        VALUES (NEW.id, 'patient')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();


-- ================================================================
-- PARTIE 9 — DONNÉES INITIALES
-- ================================================================

INSERT INTO doctors (name, specialty, address, fee, image, bio)
VALUES (
    'Dr. Marie Laurent',
    'Généraliste',
    '12 Avenue des Martyrs, Gombe, Kinshasa',
    '30 000 CDF',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    'Spécialiste en médecine générale et suivi familial.'
) ON CONFLICT DO NOTHING;

INSERT INTO super_admins (name, email, role, status)
VALUES
    ('KIBOKO Daniel',    'danielkiboko218@gmail.com', 'SUPER_ADMIN', 'Actif'),
    ('KIBONGE François', 'kibongef15@gmail.com',      'SUPER_ADMIN', 'Actif')
ON CONFLICT (email) DO UPDATE SET
    name   = EXCLUDED.name,
    role   = EXCLUDED.role,
    status = EXCLUDED.status;


-- ================================================================
-- PARTIE 10 — ASSIGNATION DU RÔLE ADMIN AUX COMPTES EXISTANTS
-- (À exécuter après que les comptes aient été créés dans Auth)
-- Trouvez vos UUID via : SELECT id, email FROM auth.users;
-- Décommentez et remplacez les UUID :
-- ================================================================

-- INSERT INTO user_roles (user_id, role)
-- VALUES
--     ('<UUID-KIBOKO-Daniel>',    'admin'),
--     ('<UUID-KIBONGE-François>', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;


-- ================================================================
-- ✅ VÉRIFICATION FINALE — Décommenter pour vérifier
-- ================================================================

-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
