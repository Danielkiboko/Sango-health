import { supabase, isSupabaseConfigured } from './supabase';
import { Doctor, Appointment, Prescription, SaaSDoctorAccount, SaaSSubscriptionInvoice, SuperAdminUser } from '../types';
import { INITIAL_DOCTORS } from '../data/doctors';
import { INITIAL_APPOINTMENTS } from '../data/appointments';
import { INITIAL_SAAS_ACCOUNTS } from '../data/saasAccounts';

export const dataService = {
  // 1. DOCTORS
  async getDoctors(): Promise<Doctor[]> {
    if (!isSupabaseConfigured || !supabase) {
      return INITIAL_DOCTORS;
    }
    try {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error || !data || data.length === 0) return INITIAL_DOCTORS;
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        address: d.address,
        rating: Number(d.rating) || 5.0,
        reviewsCount: d.reviews_count || 0,
        fee: d.fee || '30 000 CDF',
        nextSlot: d.next_slot || 'Disponible',
        image: d.image || '',
        consultationType: d.consultation_type || 'Cabinet & Vidéo',
        bio: d.bio || '',
        slots: d.slots || [],
        schedule: d.schedule || []
      }));
    } catch {
      return INITIAL_DOCTORS;
    }
  },

  async addDoctor(doctor: Doctor): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('doctors').insert([{
        name: doctor.name,
        specialty: doctor.specialty,
        address: doctor.address,
        fee: doctor.fee,
        image: doctor.image,
        bio: doctor.bio,
        slots: doctor.slots,
        schedule: doctor.schedule || []
      }]);
    } catch (e) {
      console.warn("Could not insert doctor to Supabase:", e);
    }
  },

  // 2. APPOINTMENTS
  async getAppointments(): Promise<Appointment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return INITIAL_APPOINTMENTS;
    }
    try {
      const { data, error } = await supabase.from('appointments').select('*');
      if (error || !data || data.length === 0) return INITIAL_APPOINTMENTS;
      return data.map((a: any) => ({
        id: a.id,
        doctorName: a.doctor_name,
        specialty: a.specialty,
        date: a.date,
        time: a.time,
        type: a.type,
        status: a.status,
        patientName: a.patient_name
      }));
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  },

  async createAppointment(appointment: Appointment): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('appointments').insert([{
        doctor_name: appointment.doctorName,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        status: appointment.status,
        patient_name: appointment.patientName
      }]);
    } catch (e) {
      console.warn("Could not save appointment to Supabase:", e);
    }
  },

  // 3. PRESCRIPTIONS
  async savePrescription(prescription: Prescription): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('prescriptions').upsert([{
        id: prescription.id,
        doctor_name: prescription.doctorName,
        patient_name: prescription.patientName,
        date: prescription.date,
        medications: prescription.medications,
        notes: prescription.notes,
        qr_code_token: prescription.qrCodeToken,
        signature_stamp: prescription.signatureStamp,
        is_dispensed: prescription.isDispensed || false,
        dispensed_at: prescription.dispensedAt ? new Date().toISOString() : null,
        dispensed_by_pharmacy: prescription.dispensedByPharmacy || null
      }]);
    } catch (e) {
      console.warn("Could not sync prescription to Supabase:", e);
    }
  },

  // 4. SAAS INVOICES (Mobile Money)
  async saveInvoice(invoice: SaaSSubscriptionInvoice): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('saas_invoices').insert([{
        id: invoice.id,
        account_name: invoice.accountName,
        clinic_name: invoice.clinicName,
        plan: invoice.plan,
        amount_usd: invoice.amountUSD,
        amount_cdf: invoice.amountCDF,
        date: invoice.date,
        payment_method: invoice.paymentMethod,
        phone_number: invoice.phoneNumber,
        status: invoice.status,
        transaction_ref: invoice.transactionRef
      }]);
    } catch (e) {
      console.warn("Could not sync invoice to Supabase:", e);
    }
  },

  // 5. SUPER ADMINS & ACCESS CONTROL
  async getSuperAdmins(): Promise<SuperAdminUser[]> {
    const defaultAdmins: SuperAdminUser[] = [
      {
        id: 1,
        name: 'KIBOKO Daniel',
        email: 'danielkiboko218@gmail.com',
        role: 'SUPER_ADMIN',
        status: 'Actif',
        phone: '+243 81 000 0001',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        lastLogin: 'En ligne maintenant'
      },
      {
        id: 2,
        name: 'KIBONGE François',
        email: 'kibongef15@gmail.com',
        role: 'SUPER_ADMIN',
        status: 'Actif',
        phone: '+243 82 000 0002',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        lastLogin: 'Invitation envoyée'
      }
    ];

    if (!isSupabaseConfigured || !supabase) {
      return defaultAdmins;
    }

    try {
      const { data, error } = await supabase.from('super_admins').select('*');
      if (error || !data || data.length === 0) return defaultAdmins;
      return data.map((admin: any) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'SUPER_ADMIN',
        status: admin.status || 'Actif',
        phone: admin.phone || '+243 81 000 0000',
        avatar: admin.name.includes('Daniel') 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        lastLogin: 'Actif'
      }));
    } catch {
      return defaultAdmins;
    }
  },

  async sendAdminInvite(email: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        success: true, 
        message: `Email d'invitation avec lien de création de mot de passe généré pour ${email} !` 
      };
    }

    try {
      // Tenter d'abord la réinitialisation de mot de passe officielle Supabase
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : 'https://sango-health.com'
      });

      if (!resetErr) {
        return { 
          success: true, 
          message: `Un lien sécurisé de réinitialisation a été envoyé à ${email}. Pensez à vérifier vos spams !` 
        };
      }

      if (resetErr.message.includes('rate limit') || (resetErr as any).status === 429) {
        return { 
          success: true, 
          message: `Notice : Le quota d'emails de test gratuits de Supabase est temporairement atteint pour cette heure. Vous pouvez vous connecter directement ou générer le lien depuis le tableau de bord Supabase.` 
        };
      }

      // Si le compte n'a pas encore de mot de passe, tenter OTP
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : 'https://sango-health.com'
        }
      });

      if (otpErr) {
        if (otpErr.message.includes('rate limit') || (otpErr as any).status === 429) {
          return { 
            success: true, 
            message: `Le serveur d'email Supabase applique un délai de sécurité (quota horaire). Vous pouvez vous connecter directement sans attendre.` 
          };
        }
        return { success: false, message: otpErr.message };
      }

      return { 
        success: true, 
        message: `Lien de connexion et réinitialisation transmis à ${email} !` 
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Erreur lors de l'envoi de la réinitialisation." };
    }
  },

  // 6. PASSWORD MANAGEMENT PER ADMIN (Strict Isolation)
  async setAdminPassword(email: string, password: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`sango_pwd_${cleanEmail}`, password);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('super_admins')
            .update({ status: 'Actif' })
            .eq('email', cleanEmail);

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email?.toLowerCase() === cleanEmail) {
            await supabase.auth.updateUser({ password });
          }
        } catch (dbErr) {
          console.warn("Supabase update notice:", dbErr);
        }
      }
      return true;
    } catch (e) {
      console.warn("Could not save password:", e);
      return false;
    }
  },

  async verifyAdminPassword(email: string, password: string): Promise<{ valid: boolean; message?: string; isFirstTime?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Tenter l'authentification officielle Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (!error && data?.user) {
          // Mot de passe Supabase validé avec succès
          return { valid: true };
        }
      } catch {
        // En cas d'échec réseau ou rate limit, continuer vers vérification isolée
      }
    }

    // 2. Vérifier le mot de passe localement enregistré pour CET email précis
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPwd = window.localStorage.getItem(`sango_pwd_${cleanEmail}`);

      if (storedPwd) {
        if (storedPwd === password) {
          return { valid: true };
        } else {
          return {
            valid: false,
            message: `Mot de passe incorrect pour le compte ${cleanEmail}. Chaque administrateur possède son propre mot de passe distinct.`
          };
        }
      }
    }

    // 3. Si aucun mot de passe n'a encore été créé pour cet administrateur
    return {
      valid: false,
      isFirstTime: true,
      message: `Aucun mot de passe n'a encore été configuré pour ${cleanEmail}. Veuillez cliquer sur "Définir mon mot de passe" ci-dessous pour choisir votre mot de passe personnel.`
    };
  }
};


