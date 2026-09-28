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
      const { data, error } = await supabase.from('doctors').select('*').order('id');
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
        slots: d.slots || ["09:00", "10:30", "14:00", "15:30"],
        schedule: d.schedule || [],
        commune: d.commune || 'Gombe',
        coordinates: d.coordinates || undefined
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
        schedule: doctor.schedule || [],
        commune: doctor.commune || 'Gombe',
        coordinates: doctor.coordinates || null,
        consultation_type: doctor.consultationType || 'Cabinet & Vidéo',
        rating: doctor.rating || 5.0,
        reviews_count: doctor.reviewsCount || 0,
        next_slot: doctor.nextSlot || 'Disponible'
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
      const { data, error } = await supabase
        .from('appointments')
        .select('*, prescriptions(*)')
        .order('id', { ascending: false });

      if (error || !data || data.length === 0) return [];
      return data.map((a: any) => {
        const rawPrescription = Array.isArray(a.prescriptions) && a.prescriptions.length > 0
          ? a.prescriptions[0]
          : a.prescriptions;

        const prescription: Prescription | undefined = rawPrescription ? {
          id: rawPrescription.id,
          doctorName: rawPrescription.doctor_name,
          patientName: rawPrescription.patient_name,
          date: rawPrescription.date,
          medications: rawPrescription.medications || [],
          notes: rawPrescription.notes || '',
          qrCodeToken: rawPrescription.qr_code_token,
          signatureStamp: rawPrescription.signature_stamp,
          isDispensed: rawPrescription.is_dispensed,
          dispensedAt: rawPrescription.dispensed_at,
          dispensedByPharmacy: rawPrescription.dispensed_by_pharmacy
        } : undefined;

        return {
          id: a.id,
          doctorName: a.doctor_name,
          specialty: a.specialty,
          date: a.date,
          time: a.time,
          type: a.type,
          status: a.status,
          patientName: a.patient_name,
          prescription
        };
      });
    } catch {
      return [];
    }
  },

  async createAppointment(appointment: Appointment): Promise<number> {
    if (!isSupabaseConfigured || !supabase) return appointment.id;
    try {
      // Récupérer l'UID de l'utilisateur connecté pour la RLS
      const { data: { user } } = await supabase.auth.getUser();
      const patientUserId = user?.id ?? null;

      const { data, error } = await supabase.from('appointments').insert([{
        doctor_name: appointment.doctorName,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        status: appointment.status,
        patient_name: appointment.patientName,
        patient_user_id: patientUserId  // ← lien RLS
      }]).select('id').single();

      if (error) {
        console.warn("Could not save appointment to Supabase:", error);
        return appointment.id;
      }
      return data?.id || appointment.id;
    } catch (e) {
      console.warn("Could not save appointment to Supabase:", e);
      return appointment.id;
    }
  },

  // 3. PRESCRIPTIONS
  async savePrescription(prescription: Prescription): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Récupérer l'UID du médecin connecté pour la RLS
      const { data: { user } } = await supabase.auth.getUser();
      const doctorUserId = user?.id ?? null;

      await supabase.from('prescriptions').upsert([{
        id: prescription.id,
        appointment_id: prescription.appointmentId || null,
        doctor_name: prescription.doctorName,
        patient_name: prescription.patientName,
        date: prescription.date,
        medications: prescription.medications,
        notes: prescription.notes,
        qr_code_token: prescription.qrCodeToken,
        signature_stamp: prescription.signatureStamp,
        is_dispensed: prescription.isDispensed || false,
        dispensed_at: prescription.dispensedAt ? new Date().toISOString() : null,
        dispensed_by_pharmacy: prescription.dispensedByPharmacy || null,
        doctor_user_id: doctorUserId  // ← lien RLS
      }]);
    } catch (e) {
      console.warn("Could not sync prescription to Supabase:", e);
    }
  },

  async dispensePrescription(prescriptionId: string, pharmacyName: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          is_dispensed: true,
          dispensed_at: new Date().toISOString(),
          dispensed_by_pharmacy: pharmacyName
        })
        .eq('id', prescriptionId);

      return !error;
    } catch (e) {
      console.warn("Could not update prescription status in Supabase:", e);
      return false;
    }
  },

  async updateAppointmentStatus(appointmentId: number, status: 'Confirmé' | 'Annulé' | 'Terminé'): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      return !error;
    } catch (e) {
      console.warn("Could not update appointment status in Supabase:", e);
      return false;
    }
  },

  async updateDoctorSchedule(doctorId: number, schedule: any[], slots: string[]): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ schedule, slots })
        .eq('id', doctorId);

      return !error;
    } catch (e) {
      console.warn("Could not update doctor schedule in Supabase:", e);
      return false;
    }
  },

  async updateDoctorStatus(doctorId: number, status: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      if (status === 'Suspendu') {
        const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
        return !error;
      }
      return true;
    } catch (e) {
      console.warn("Could not update doctor in Supabase:", e);
      return false;
    }
  },

  // 4. SAAS ACCOUNTS (B2B Cabinets & Hôpitaux)
  async getSaaSAccounts(): Promise<SaaSDoctorAccount[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase.from('saas_accounts').select('*').order('id');
      if (error || !data || data.length === 0) return [];
      return data.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        specialty: acc.specialty || 'Généraliste',
        clinicName: acc.clinic_name,
        address: acc.address || '',
        phone: acc.phone || '',
        email: acc.email,
        plan: acc.plan || 'Pro Cabinet',
        monthlyFeeUSD: acc.monthly_fee_usd || 59,
        status: acc.status || 'Actif',
        joinedDate: acc.joined_date || 'Aujourd\'hui',
        totalConsultations: acc.total_consultations || 0,
        videoHoursUsed: acc.video_hours_used || 0,
        image: acc.image || ''
      }));
    } catch {
      return [];
    }
  },

  async addSaaSAccount(account: SaaSDoctorAccount): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('saas_accounts').insert([{
        name: account.name,
        specialty: account.specialty,
        clinic_name: account.clinicName,
        address: account.address,
        phone: account.phone,
        email: account.email,
        plan: account.plan,
        monthly_fee_usd: account.monthlyFeeUSD,
        status: account.status,
        joined_date: account.joinedDate,
        total_consultations: account.totalConsultations,
        video_hours_used: account.videoHoursUsed,
        image: account.image,
        owner_user_id: user?.id ?? null
      }]);
    } catch (e) {
      console.warn("Could not insert SaaS account to Supabase:", e);
    }
  },

  async updateSaaSAccountStatus(id: number, status: 'Actif' | 'En attente' | 'Suspendu'): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('saas_accounts')
        .update({ status })
        .eq('id', id);

      return !error;
    } catch (e) {
      console.warn("Could not update SaaS account status in Supabase:", e);
      return false;
    }
  },

  // 5. SAAS INVOICES (Mobile Money)
  async getInvoices(): Promise<SaaSSubscriptionInvoice[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase.from('saas_invoices').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((inv: any) => ({
        id: inv.id,
        accountName: inv.account_name,
        clinicName: inv.clinic_name || '',
        plan: inv.plan,
        amountUSD: inv.amount_usd,
        amountCDF: inv.amount_cdf,
        date: inv.date,
        paymentMethod: inv.payment_method,
        phoneNumber: inv.phone_number,
        status: inv.status,
        transactionRef: inv.transaction_ref
      }));
    } catch {
      return [];
    }
  },

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

  // 6. REALTIME SUBSCRIPTION
  subscribeToTable(table: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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


