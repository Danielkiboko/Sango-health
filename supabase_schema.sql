-- ==============================================================
-- Schema SQL Supabase pour SangO Health (RDC)
-- Exécutez ce script dans le SQL Editor de Supabase (https://supabase.com)
-- ==============================================================

-- 1. Table des Médecins & Praticiens
CREATE TABLE IF NOT EXISTS doctors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    fee VARCHAR(100) DEFAULT '30 000 CDF',
    next_slot VARCHAR(100) DEFAULT 'Aujourd''hui à 15:00',
    image TEXT,
    consultation_type VARCHAR(100) DEFAULT 'Cabinet & Vidéo',
    bio TEXT,
    slots JSONB DEFAULT '["09:00", "10:30", "14:00", "15:30", "16:30"]'::jsonb,
    schedule JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    time VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Confirmé',
    patient_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Ordonnances Médicales Électroniques
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(100) PRIMARY KEY,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_name VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    qr_code_token VARCHAR(255),
    signature_stamp TEXT,
    is_dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    dispensed_by_pharmacy VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Comptes SaaS B2B (Cabinets & Hôpitaux)
CREATE TABLE IF NOT EXISTS saas_accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    clinic_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'Pro Cabinet',
    monthly_fee_usd INT DEFAULT 59,
    status VARCHAR(50) DEFAULT 'Actif',
    joined_date VARCHAR(100) DEFAULT 'Aujourd''hui',
    total_consultations INT DEFAULT 0,
    video_hours_used INT DEFAULT 0,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des Factures SaaS & Règlements Mobile Money
CREATE TABLE IF NOT EXISTS saas_invoices (
    id VARCHAR(100) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    clinic_name VARCHAR(255),
    plan VARCHAR(50) NOT NULL,
    amount_usd INT NOT NULL,
    amount_cdf INT NOT NULL,
    date VARCHAR(100) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    phone_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Payé',
    transaction_ref VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Politiques de Sécurité RLS (Row Level Security) permissives pour démarrer
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public insert doctors" ON doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update doctors" ON doctors FOR UPDATE USING (true);

CREATE POLICY "Public all appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Public all prescriptions" ON prescriptions FOR ALL USING (true);
CREATE POLICY "Public all saas_accounts" ON saas_accounts FOR ALL USING (true);
CREATE POLICY "Public all saas_invoices" ON saas_invoices FOR ALL USING (true);

-- Données initiales de test
INSERT INTO doctors (name, specialty, address, fee, image, bio)
VALUES 
('Dr. Marie Laurent', 'Généraliste', '12 Avenue des Martyrs, Gombe, Kinshasa', '30 000 CDF', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300', 'Spécialiste en médecine générale et suivi familial.')
ON CONFLICT DO NOTHING;
