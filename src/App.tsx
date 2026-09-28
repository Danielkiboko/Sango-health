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
              email,
              uid: session.user.id  // ← UUID Supabase Auth pour les RLS
            });
            // Important : Nous gardons la vue par défaut sur 'home' (Accueil)
            // L'administrateur peut accéder au panel à tout moment via le bouton dédié dans le menu.
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
              email,
              uid: session.user.id  // ← UUID Supabase Auth pour les RLS
            });
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

  // Synchronisation et routage URL direct (/loginns, /logins, /cpanel, /saas_admin, /search, etc.)
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const searchParams = new URLSearchParams(window.location.search);
      const roleParam = searchParams.get('role') || searchParams.get('portal');

      if (path === '/loginns' || path === '/logins' || path === '/login' || path === '/connexion') {
        if (roleParam === 'doctor' || roleParam === 'medecin') {
          setAuthModalRole('doctor');
        } else if (roleParam === 'admin' || roleParam === 'saas') {
          setAuthModalRole('admin');
        } else {
          setAuthModalRole('patient');
        }
        setIsAuthModalOpen(true);
      } else {
        if (path === '/saas_admin' || path === '/cpanel' || path === '/admin') {
          setCurrentView('saas_admin');
        } else if (path === '/doctor_portal' || path === '/cabinet') {
          setCurrentView('doctor_portal');
        } else if (path === '/dashboard' || path === '/dossier') {
          setCurrentView('dashboard');
        } else if (path === '/search' || path === '/recherche') {
          setCurrentView('search');
        } else if (path === '' || path === '/') {
          setCurrentView('home');
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  // Chargement initial des praticiens et rendez-vous depuis Supabase
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const [fetchedDocs, fetchedApps] = await Promise.all([
        dataService.getDoctors(),
        dataService.getAppointments()
      ]);

      if (isMounted) {
        if (fetchedDocs && fetchedDocs.length > 0) setDoctors(fetchedDocs);
        if (fetchedApps && fetchedApps.length > 0) setAppointments(fetchedApps);
      }
    };

    loadData();

    // Abonnement aux changements temps réel Supabase
    const unsubAppointments = dataService.subscribeToTable('appointments', () => {
      dataService.getAppointments().then(apps => {
        if (isMounted && apps && apps.length > 0) setAppointments(apps);
      });
    });

    const unsubPrescriptions = dataService.subscribeToTable('prescriptions', () => {
      dataService.getAppointments().then(apps => {
        if (isMounted && apps && apps.length > 0) setAppointments(apps);
      });
    });

    const unsubDoctors = dataService.subscribeToTable('doctors', () => {
      dataService.getDoctors().then(docs => {
        if (isMounted && docs && docs.length > 0) setDoctors(docs);
      });
    });

    return () => {
      isMounted = false;
      unsubAppointments();
      unsubPrescriptions();
      unsubDoctors();
    };
  }, [currentUser?.uid]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('search');
  };

  const handleBookSlot = async (doctor: Doctor, date: string, time: string, type: string) => {
    const tempId = Date.now();
    const newAppointment: Appointment = {
      id: tempId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: date || "2026-06-12",
      time: time || "10:00",
      type: type || "Cabinet",
      status: "Confirmé",
      patientName: currentUser ? currentUser.name : "Patient Invité"
    };

    setAppointments(prev => [newAppointment, ...prev]);
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
    showNotification(`Rendez-vous confirmé avec ${doctor.name} !`);
    setCurrentView('dashboard');

    const realId = await dataService.createAppointment(newAppointment);
    if (realId && realId !== tempId) {
      setAppointments(prev => prev.map(a => a.id === tempId ? { ...a, id: realId } : a));
    }
  };

  const cancelAppointment = async (id: number) => {
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: "Annulé" } : app));
    await dataService.updateAppointmentStatus(id, "Annulé");
    showNotification("Le rendez-vous a été annulé avec succès.", "info");
  };

  const handleSavePrescription = async (appointmentId: number, prescription: any) => {
    setAppointments(prev => prev.map(app => 
      app.id === appointmentId ? { ...app, prescription } : app
    ));
    await dataService.savePrescription(prescription);
    showNotification(`Ordonnance ${prescription.id} générée et transmise au patient !`, "success");
  };

  const handleDispensePrescription = async (prescriptionId: string, pharmacyName: string) => {
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
    await dataService.dispensePrescription(prescriptionId, pharmacyName);
    showNotification(`Ordonnance ${prescriptionId} validée et servie par ${pharmacyName}`, 'success');
  };

  const handleUpdateDoctorSchedule = async (doctorId: number, schedule: DoctorScheduleDay[], slots: string[]) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === doctorId) {
        return { ...doc, schedule, slots };
      }
      return doc;
    }));
    await dataService.updateDoctorSchedule(doctorId, schedule, slots);
    showNotification("Disponibilités praticien enregistrées et synchronisées !", 'success');
  };

  // Admin SaaS Handlers
  const handleAddDoctorFromSaaS = async (newDoctor: Doctor) => {
    setDoctors(prev => [newDoctor, ...prev]);
    await dataService.addDoctor(newDoctor);
    showNotification(`Nouveau cabinet activé : ${newDoctor.name}`, 'success');
  };

  const handleUpdateDoctorStatus = async (id: number, status: 'Actif' | 'Suspendu' | 'Expiré') => {
    setDoctors(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status,
          subscriptionStatus: status === 'Suspendu' ? 'Suspendu' : d.subscriptionStatus
        };
      }
      return d;
    }));
    if (status === 'Suspendu' || status === 'Expiré') {
      showNotification('Compte médecin désactivé du répertoire public.', 'info');
    } else {
      showNotification('Compte médecin réactivé avec succès sur SangO Health.', 'success');
    }
    await dataService.updateDoctorStatus(id, status);
  };

  const handleUpdateDoctorSubscription = async (doctorId: number, updates: {
    plan?: 'Starter' | 'Pro Cabinet' | 'Clinique Pro';
    subscriptionExpiresAt?: string;
    subscriptionStatus?: 'Actif' | 'Expiré' | 'Suspendu';
    status?: 'Actif' | 'Suspendu' | 'Expiré';
    monthlyFeeUSD?: number;
  }) => {
    setDoctors(prev => prev.map(d => {
      if (d.id === doctorId) {
        return { ...d, ...updates };
      }
      return d;
    }));
    await dataService.updateDoctorSubscription(doctorId, updates);
    showNotification("Abonnement praticien et statut mis à jour avec succès !", 'success');
  };

  const handleOpenAuth = (portal?: 'patient' | 'doctor' | 'admin') => {
    const role = portal || 'patient';
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
    try {
      window.history.pushState({ authModal: true }, '', '/loginns');
    } catch {
      // ignore
    }
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
    try {
      if (window.location.pathname.toLowerCase().includes('login')) {
        const targetPath = currentView === 'home' ? '/' : `/${currentView}`;
        window.history.replaceState({}, '', targetPath);
      }
    } catch {
      // ignore
    }
  };

  const handleLogin = (user: UserProfile) => {
    // Enrichir le profil avec l'UID Supabase Auth pour les politiques RLS
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUser({ ...user, uid: session?.user?.id });
      });
    } else {
      setCurrentUser(user);
    }
    setIsAuthModalOpen(false);
    if (user.role === 'admin') {
      window.history.replaceState({}, '', '/saas_admin');
      setCurrentView('saas_admin');
    } else if (user.role === 'doctor') {
      window.history.replaceState({}, '', '/doctor_portal');
      setCurrentView('doctor_portal');
    } else if (user.role === 'pharmacy') {
      window.history.replaceState({}, '', '/pharmacy_portal');
      setCurrentView('pharmacy_portal');
    } else {
      window.history.replaceState({}, '', '/dashboard');
      setCurrentView('dashboard');
    }
    showNotification(`Bienvenue, ${user.name} !`);
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Erreur déconnexion supabase:', err);
    }
    setCurrentUser(null);
    setCurrentView('home');
    window.history.replaceState({}, '', '/');
    showNotification("Déconnecté avec succès", "info");
  };

  const handleSelectDoctor = (doc: Doctor) => {
    if (currentUser?.role === 'admin') {
      showNotification("ℹ️ Vous êtes connecté en tant qu'Administrateur. La prise de rendez-vous est réservée aux patients. Rendez-vous sur le C-Panel pour superviser les praticiens.", "info");
      return;
    }
    if (currentUser?.role === 'doctor') {
      showNotification("ℹ️ Vous êtes connecté avec un compte Médecin. La prise de rendez-vous en ligne est réservée aux comptes patients.", "info");
      return;
    }
    setSelectedDoctor(doc);
    setIsBookingModalOpen(true);
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

      {/* Header - Masqué sur le SaaS Admin et l'Espace Patient (qui ont leur propre barre latérale gauche) */}
      {currentView !== 'saas_admin' && currentView !== 'dashboard' && (
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuth}
          onLogout={handleLogout}
        />
      )}

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
            onSelectDoctor={handleSelectDoctor}
            onNavigateSearch={() => setCurrentView('search')}
            currentUser={currentUser}
            onNavigateAdmin={() => setCurrentView('saas_admin')}
          />
        )}

        {currentView === 'search' && (
          <SearchView 
            doctors={doctors}
            initialSpecialty={searchSpecialty}
            initialLocation={searchLocation}
            onSelectDoctor={handleSelectDoctor}
            onBack={() => setCurrentView('home')}
            currentUser={currentUser}
            onNavigateAdmin={() => setCurrentView('saas_admin')}
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
            currentUser={currentUser}
            onReturnHome={() => setCurrentView('home')}
            onLogout={handleLogout}
          />
        )}

        {/* Doctor Domain */}
        {currentView === 'doctor_portal' && (
          <DoctorPortal 
            appointments={appointments} 
            doctors={doctors} 
            currentUser={currentUser}
            onSavePrescription={handleSavePrescription}
            onUpdateSchedule={handleUpdateDoctorSchedule}
            onUpdateStatus={async (id, status) => {
              setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
              await dataService.updateAppointmentStatus(id, status);
              showNotification(`Statut consultation mis à jour : ${status}`, 'success');
            }}
            onCancelAppointment={cancelAppointment}
          />
        )}

        {/* Pharmacy Domain */}
        {currentView === 'pharmacy_portal' && (
          <PharmacyPortal
            appointments={appointments}
            onDispensePrescription={handleDispensePrescription}
          />
        )}

        {/* Admin Domain (SaaS Control Panel) - Protégé strictement */}
        {currentView === 'saas_admin' && (
          currentUser?.role === 'admin' ? (
            <SaaSControlPanel 
              doctors={doctors}
              appointments={appointments}
              onAddDoctor={handleAddDoctorFromSaaS}
              onUpdateDoctorStatus={handleUpdateDoctorStatus}
              onUpdateDoctorSubscription={handleUpdateDoctorSubscription}
              onReturnHome={() => setCurrentView('home')}
              currentUser={currentUser}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-xl">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-inner">
                🔒
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Accès Administrateur Restreint</h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Cet espace est strictement réservé aux Super Administrateurs autorisés (KIBOKO Daniel & KIBONGE François).
              </p>
              <button 
                onClick={() => setCurrentView('home')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition"
              >
                Retourner à l'Accueil
              </button>
            </div>
          )
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
          onClose={handleCloseAuth}
          onLogin={handleLogin}
          initialPortal={authModalRole as any}
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

      {/* Clean Footer - Masqué sur le SaaS Control Panel et l'Espace Patient */}
      {currentView !== 'saas_admin' && currentView !== 'dashboard' && (
        <Footer
          setCurrentView={setCurrentView}
          onOpenAuthForDoctor={() => handleOpenAuth('doctor')}
        />
      )}
    </div>
  );
}
