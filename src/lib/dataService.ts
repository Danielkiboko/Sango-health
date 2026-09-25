import { supabase, isSupabaseConfigured } from './supabase';
import { Doctor, Appointment, Prescription, SaaSDoctorAccount, SaaSSubscriptionInvoice } from '../types';
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
  }
};
