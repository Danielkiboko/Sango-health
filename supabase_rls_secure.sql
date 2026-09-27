-- ==============================================================
-- 🔐 SÉCURISATION RLS — SangO Health
-- Exécutez ce script ENTIER dans le SQL Editor de Supabase
-- https://supabase.com → votre projet → SQL Editor
-- ==============================================================

-- ==============================================================
-- ÉTAPE 0 : Supprimer les anciennes politiques permissives
-- ==============================================================

DROP POLICY IF EXISTS "Public read doctors" ON doctors;
DROP POLICY IF EXISTS "Public insert doctors" ON doctors;
DROP POLICY IF EXISTS "Public update doctors" ON doctors;
DROP POLICY IF EXISTS "Public all appointments" ON appointments;
DROP POLICY IF EXISTS "Public all prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Public all saas_accounts" ON saas_accounts;
DROP POLICY IF EXISTS "Public all saas_invoices" ON saas_invoices;
DROP POLICY IF EXISTS "Public all super_admins" ON super_admins;


-- ==============================================================
-- ÉTAPE 1 : Table des rôles utilisateurs (pivot central)
-- Liée à auth.users de Supabase via user_id = auth.uid()
-- ==============================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('patient', 'medecin', 'pharmacie', 'admin')),
  doctor_id   BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles: lecture propre rôle"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles: admin peut tout gérer"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );


-- ==============================================================
-- ÉTAPE 2 : Fonctions helper réutilisées dans toutes les policies
-- ==============================================================

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


-- ==============================================================
-- ÉTAPE 3 : Ajouter colonnes user_id aux tables métier
-- ==============================================================

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS patient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS doctor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE saas_accounts
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- ==============================================================
-- ÉTAPE 4 : TABLE doctors — Annuaire public, écriture restreinte
-- ==============================================================

CREATE POLICY "doctors: lecture publique"
  ON doctors FOR SELECT USING (true);

CREATE POLICY "doctors: insertion admin"
  ON doctors FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "doctors: modification médecin ou admin"
  ON doctors FOR UPDATE
  USING (is_admin() OR id = get_my_doctor_id());

CREATE POLICY "doctors: suppression admin"
  ON doctors FOR DELETE USING (is_admin());


-- ==============================================================
-- ÉTAPE 5 : TABLE appointments
-- ==============================================================

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


-- ==============================================================
-- ÉTAPE 6 : TABLE prescriptions
-- ==============================================================

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


-- ==============================================================
-- ÉTAPE 7 : TABLE saas_accounts — Données B2B sensibles
-- ==============================================================

CREATE POLICY "saas_accounts: lecture propriétaire ou admin"
  ON saas_accounts FOR SELECT
  USING (owner_user_id = auth.uid() OR is_admin());

CREATE POLICY "saas_accounts: insertion admin"
  ON saas_accounts FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "saas_accounts: modification admin"
  ON saas_accounts FOR UPDATE USING (is_admin());

CREATE POLICY "saas_accounts: suppression admin"
  ON saas_accounts FOR DELETE USING (is_admin());


-- ==============================================================
-- ÉTAPE 8 : TABLE saas_invoices — Audit trail immuable
-- ==============================================================

CREATE POLICY "saas_invoices: lecture admin"
  ON saas_invoices FOR SELECT USING (is_admin());

CREATE POLICY "saas_invoices: insertion admin"
  ON saas_invoices FOR INSERT WITH CHECK (is_admin());

-- PAS de UPDATE ni DELETE → les factures sont immuables


-- ==============================================================
-- ÉTAPE 9 : TABLE super_admins — Accès admin uniquement
-- ==============================================================

CREATE POLICY "super_admins: admin uniquement"
  ON super_admins FOR ALL USING (is_admin());


-- ==============================================================
-- ÉTAPE 10 : Trigger — Rôle automatique à l'inscription
-- ==============================================================

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


-- ==============================================================
-- ÉTAPE 11 : Peupler user_roles pour les admins existants
-- Trouvez les UUID via : SELECT id, email FROM auth.users;
-- Puis décommentez et adaptez :
-- ==============================================================

-- INSERT INTO user_roles (user_id, role)
-- VALUES
--   ('<UUID-KIBOKO-Daniel>', 'admin'),
--   ('<UUID-KIBONGE-François>', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;


-- ==============================================================
-- VÉRIFICATION FINALE
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename;
-- ==============================================================
