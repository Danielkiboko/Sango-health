import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import SetPasswordModal from './components/SetPasswordModal';

// Domain Folders
import SaaSControlPanel from './admin/SaaSControlPanel';
import DoctorPortal from './doctor/DoctorPortal';
import PatientDashboard from './patient/PatientDashboard';
import BookingModal from './patient/BookingModal';
import PharmacyPortal from './pharmacy/PharmacyPortal';
import HomeView from './public-views/HomeView';
import SearchView from './public-views/SearchView';

// Mock Data & Types
import { INITIAL_DOCTORS } from './data/doctors';
import { INITIAL_APPOINTMENTS } from './data/appointments';
import { Doctor, Appointment, UserProfile, UserRole, DoctorScheduleDay } from './types';
import { dataService } from './lib/dataService';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export default function SangoHealthApp() {
  const [currentView, setCurrentView] = useState<string>('home'); // 'home', 'search', 'dashboard', 'doctor_portal', 'saas_admin'
  const [searchSpecialty, setSearchSpecialty] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('patient');

  // Currently logged in user (null by default so login buttons are clearly visible)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = (message: string, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Synchronisation et écoute de la session Supabase Auth (Invitations & Liens Magiques)
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          if (email === 'danielkiboko218@gmail.com' || email === 'kibongef15@gmail.com') {
            setCurrentUser({
              name: email.includes('daniel') ? 'KIBOKO Daniel' : 'KIBONGE François',
              role: 'admin',
              email
            });
            setCurrentView('saas_admin');
            showNotification(`Session Super Admin validée : ${email}`, 'success');
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          if (email === 'danielkiboko218@gmail.com' || email === 'kibongef15@gmail.com') {
            setCurrentUser({
              name: email.includes('daniel') ? 'KIBOKO Daniel' : 'KIBONGE François',
              role: 'admin',
              email
            });
            setCurrentView('saas_admin');
          }
          if (event === 'PASSWORD_RECOVERY') {
            setIsSetPasswordModalOpen(true);
            showNotification('Veuillez définir votre nouveau mot de passe administrateur.', 'info');
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('search');
  };

  const handleBookSlot = (doctor: Doctor, date: string, time: string, type: string) => {
    const newAppointment: Appointment = {
      id: Date.now(),
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: date || "2026-06-12",
      time: time || "10:00",
      type: type || "Cabinet",
      status: "Confirmé",
      patientName: currentUser ? currentUser.name : "Patient Invité"
    };

    setAppointments([newAppointment, ...appointments]);
    dataService.createAppointment(newAppointment);
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
    showNotification(`Rendez-vous confirmé avec ${doctor.name} !`);
    setCurrentView('dashboard');
  };

  const cancelAppointment = (id: number) => {
    setAppointments(appointments.map(app => app.id === id ? { ...app, status: "Annulé" } : app));
    showNotification("Le rendez-vous a été annulé avec succès.", "info");
  };

  const handleSavePrescription = (appointmentId: number, prescription: any) => {
    setAppointments(prev => prev.map(app => 
      app.id === appointmentId ? { ...app, prescription } : app
    ));
    dataService.savePrescription(prescription);
    showNotification(`Ordonnance ${prescription.id} générée et transmise au patient !`, "success");
  };

  const handleDispensePrescription = (prescriptionId: string, pharmacyName: string) => {
    setAppointments(prev => prev.map(app => {
      if (app.prescription && app.prescription.id === prescriptionId) {
        return {
          ...app,
          prescription: {
            ...app.prescription,
            isDispensed: true,
            dispensedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            dispensedByPharmacy: pharmacyName
          }
        };
      }
      return app;
    }));
    showNotification(`Ordonnance ${prescriptionId} validée et servie par ${pharmacyName}`, 'success');
  };

  const handleUpdateDoctorSchedule = (doctorId: number, schedule: DoctorScheduleDay[], slots: string[]) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === doctorId) {
        return { ...doc, schedule, slots };
      }
      return doc;
    }));
    showNotification("Disponibilités praticien enregistrées et synchronisées !", 'success');
  };

  // Admin SaaS Handlers
  const handleAddDoctorFromSaaS = (newDoctor: Doctor) => {
    setDoctors(prev => [newDoctor, ...prev]);
    showNotification(`Nouveau cabinet activé : ${newDoctor.name}`, 'success');
  };

  const handleUpdateDoctorStatus = (id: number, status: string) => {
    if (status === 'Suspendu') {
      setDoctors(prev => prev.filter(d => d.id !== id));
      showNotification('Compte médecin suspendu sur le répertoire public.', 'info');
    } else {
      showNotification('Compte médecin réactivé avec succès.', 'success');
    }
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (user.role === 'admin') {
      setCurrentView('saas_admin');
    } else if (user.role === 'doctor') {
      setCurrentView('doctor_portal');
    } else if (user.role === 'pharmacy') {
      setCurrentView('pharmacy_portal');
    } else {
      setCurrentView('dashboard');
    }
    showNotification(`Bienvenue, ${user.name} !`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    showNotification("Déconnecté avec succès", "info");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition transform animate-in slide-in-from-top duration-300 flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header - Clean, Uncluttered, with single unified 'Se connecter' button */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Routed Content */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView 
            searchSpecialty={searchSpecialty}
            setSearchSpecialty={setSearchSpecialty}
            searchLocation={searchLocation}
            setSearchLocation={setSearchLocation}
            onSearchSubmit={handleSearchSubmit}
            doctors={doctors}
            onSelectDoctor={(doc) => { setSelectedDoctor(doc); setIsBookingModalOpen(true); }}
            onNavigateSearch={() => setCurrentView('search')}
          />
        )}

        {currentView === 'search' && (
          <SearchView 
            doctors={doctors}
            initialSpecialty={searchSpecialty}
            initialLocation={searchLocation}
            onSelectDoctor={(doc) => { setSelectedDoctor(doc); setIsBookingModalOpen(true); }}
            onBack={() => setCurrentView('home')}
          />
        )}

        {/* Patient Domain */}
        {currentView === 'dashboard' && (
          <PatientDashboard 
            appointments={appointments} 
            doctors={doctors}
            onCancel={cancelAppointment}
            onNewBooking={() => setCurrentView('search')}
            onSavePrescription={handleSavePrescription}
          />
        )}

        {/* Doctor Domain */}
        {currentView === 'doctor_portal' && (
          <DoctorPortal 
            appointments={appointments} 
            doctors={doctors} 
            onSavePrescription={handleSavePrescription}
            onUpdateSchedule={handleUpdateDoctorSchedule}
          />
        )}

        {/* Pharmacy Domain */}
        {currentView === 'pharmacy_portal' && (
          <PharmacyPortal
            appointments={appointments}
            onDispensePrescription={handleDispensePrescription}
          />
        )}

        {/* Admin Domain (SaaS Control Panel) */}
        {currentView === 'saas_admin' && (
          <SaaSControlPanel 
            doctors={doctors}
            onAddDoctor={handleAddDoctorFromSaaS}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
          />
        )}
      </main>

      {/* Patient Booking Modal */}
      {isBookingModalOpen && selectedDoctor && (
        <BookingModal 
          doctor={selectedDoctor}
          onClose={() => setIsBookingModalOpen(false)}
          onConfirmBooking={handleBookSlot}
        />
      )}

      {/* Auth Modal with Patient, Doctor, and Admin SaaS options */}
      {/* Auth Modal with automatic role detection */}
      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLogin}
        />
      )}

      {/* Set Password Modal for Admin / Recovery */}
      {isSetPasswordModalOpen && (
        <SetPasswordModal
          userEmail={currentUser?.email}
          onClose={() => setIsSetPasswordModalOpen(false)}
          onSuccess={() => {
            showNotification('Votre mot de passe a été défini avec succès !', 'success');
          }}
        />
      )}

      {/* Clean Footer */}
      <Footer
        setCurrentView={setCurrentView}
        onOpenAuthForDoctor={() => { setAuthModalRole('doctor'); setIsAuthModalOpen(true); }}
      />
    </div>
  );
}
