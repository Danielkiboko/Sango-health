export type Language = 'fr' | 'en' | 'ln' | 'sw' | 'kg' | 'ts';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', region: 'Officiel' },
  { code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', region: 'International' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', region: 'Kinshasa & Équateur' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇨🇩', region: 'Est & Grand Katanga' },
  { code: 'kg', name: 'Kikongo', nativeName: 'Kikôngo', flag: '🇨🇩', region: 'Kongo Central & Bandundu' },
  { code: 'ts', name: 'Tshiluba', nativeName: 'Tshilùba', flag: '🇨🇩', region: 'Grand Kasaï' }
];

export const translations = {
  fr: {
    // Navigation
    nav_home: "Accueil",
    nav_find_doctor: "Trouver un médecin",
    nav_my_records: "Mon Dossier Santé",
    nav_doctor_portal: "Espace Praticien",
    nav_pharmacy_portal: "Portail Pharmacie",
    nav_cpanel: "C-Panel",
    nav_signin: "Se connecter",
    nav_logout: "Déconnexion",

    // Hero Section
    hero_badge: "La santé simplifiée, disponible 24h/24 et 7j/7",
    hero_title_1: "Prenez rendez-vous chez votre médecin en ",
    hero_title_highlight: "quelques clics",
    hero_subtitle: "Trouvez un professionnel de santé près de chez vous, réservez instantanément et gérez vos consultations en toute sécurité.",
    search_placeholder_doctor: "Médecin, spécialité, établissement...",
    search_placeholder_location: "Ville, commune (Gombe, Lingwala...)",
    search_button: "Rechercher",

    // Specialties
    specialties_title: "Spécialités recherchées",
    specialties_subtitle: "Trouvez rapidement un spécialiste adapté à vos besoins",
    see_all: "Voir tout",
    spec_generalist: "Généraliste",
    spec_cardiologist: "Cardiologue",
    spec_pediatrician: "Pédiatre",
    spec_dentist: "Dentiste",
    practitioners: "praticiens",

    // Features Section
    features_title: "Pourquoi choisir SangO Health ?",
    features_subtitle: "La plateforme médicale tout-en-un conçue pour la République Démocratique du Congo",
    feat_1_title: "Téléconsultation Vidéo HD",
    feat_1_desc: "Consultez votre médecin à distance en haute définition sans vous déplacer.",
    feat_2_title: "Ordonnances Certifiées",
    feat_2_desc: "Recevez vos prescriptions signées électroniquement avec QR code pour les pharmacies.",
    feat_3_title: "Pharmacies de Garde 24h/24",
    feat_3_desc: "Localisez les pharmacies ouvertes la nuit et le week-end dans toutes les communes de Kinshasa.",
    feat_4_title: "100% Gratuit pour les Patients",
    feat_4_desc: "Aucun abonnement requis. Prenez vos rendez-vous et stockez votre dossier sans frais.",

    // Doctor Directory
    directory_title: "Répertoire Médical & Urgences",
    directory_subtitle: "professionnels de santé et pharmacies de garde disponibles à Kinshasa",
    view_list: "Vue Liste",
    view_map: "Carte Kinshasa & Garde",
    filter_all: "Tous",
    filter_cabinet: "Cabinet",
    filter_video: "Téléconsultation",
    book_appointment: "Prendre rendez-vous",
    next_slot: "Prochain RDV",
    fee: "Tarif",

    // Patient Dashboard
    patient_title: "Mon Dossier Santé Patient",
    patient_subtitle: "Consultez vos rendez-vous, ordonnances électroniques et bilans d'analyses en toute sécurité.",
    export_health_booklet: "Exporter Carnet Santé (PDF)",
    new_booking: "Nouveau Rendez-vous",
    tab_upcoming: "Rendez-vous à venir",
    tab_prescriptions: "Mes Ordonnances",
    tab_documents: "Mes Analyses & Radios",
    tab_past: "Historique",
    add_document: "Ajouter un document",

    // Auth Modal
    auth_title: "Connexion SangO Health",
    auth_tab_patient: "Dossier Patient",
    auth_tab_doctor: "Praticien",
    auth_tab_admin: "Super Admin",
    auth_email: "Adresse Email",
    auth_password: "Mot de passe",
    auth_forgot: "Mot de passe oublié ?",
    auth_set_pwd: "Définir mot de passe",
    auth_submit: "Se connecter"
  },

  en: {
    // Navigation
    nav_home: "Home",
    nav_find_doctor: "Find a doctor",
    nav_my_records: "My Health Record",
    nav_doctor_portal: "Doctor Portal",
    nav_pharmacy_portal: "Pharmacy Portal",
    nav_cpanel: "C-Panel",
    nav_signin: "Sign in",
    nav_logout: "Logout",

    // Hero Section
    hero_badge: "Healthcare made simple, available 24/7",
    hero_title_1: "Book an appointment with your doctor in ",
    hero_title_highlight: "a few clicks",
    hero_subtitle: "Find a verified healthcare professional near you, book instantly, and manage your consultations securely.",
    search_placeholder_doctor: "Doctor, specialty, clinic...",
    search_placeholder_location: "City, district (Gombe, Lingwala...)",
    search_button: "Search",

    // Specialties
    specialties_title: "Top Medical Specialties",
    specialties_subtitle: "Quickly find the right specialist for your needs",
    see_all: "See all",
    spec_generalist: "General Practitioner",
    spec_cardiologist: "Cardiologist",
    spec_pediatrician: "Pediatrician",
    spec_dentist: "Dentist",
    practitioners: "doctors",

    // Features Section
    features_title: "Why choose SangO Health?",
    features_subtitle: "The all-in-one healthcare platform built for the Democratic Republic of Congo",
    feat_1_title: "HD Video Consultation",
    feat_1_desc: "Consult your doctor remotely in high definition without leaving home.",
    feat_2_title: "Certified Digital Prescriptions",
    feat_2_desc: "Receive electronically signed prescriptions with QR codes for pharmacies.",
    feat_3_title: "24/7 On-duty Pharmacies",
    feat_3_desc: "Locate pharmacies open at night and on weekends across all districts of Kinshasa.",
    feat_4_title: "100% Free for Patients",
    feat_4_desc: "No subscription required. Book appointments and store your health records at no cost.",

    // Doctor Directory
    directory_title: "Medical Directory & Urgent Care",
    directory_subtitle: "healthcare professionals and 24/7 pharmacies on duty in Kinshasa",
    view_list: "List View",
    view_map: "Kinshasa Interactive Map",
    filter_all: "All",
    filter_cabinet: "In-Clinic",
    filter_video: "Teleconsultation",
    book_appointment: "Book appointment",
    next_slot: "Next Available Slot",
    fee: "Fee",

    // Patient Dashboard
    patient_title: "My Patient Health Record",
    patient_subtitle: "Review your appointments, electronic prescriptions, lab tests, and x-rays securely.",
    export_health_booklet: "Export Health Booklet (PDF)",
    new_booking: "New Appointment",
    tab_upcoming: "Upcoming Appointments",
    tab_prescriptions: "My Prescriptions",
    tab_documents: "My Lab Tests & Scans",
    tab_past: "Past History",
    add_document: "Upload document",

    // Auth Modal
    auth_title: "SangO Health Login",
    auth_tab_patient: "Patient Record",
    auth_tab_doctor: "Doctor Portal",
    auth_tab_admin: "Super Admin",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_forgot: "Forgot password?",
    auth_set_pwd: "Set password",
    auth_submit: "Sign in"
  },

  ln: {
    // Navigation (Lingala)
    nav_home: "Ndako",
    nav_find_doctor: "Luka monganga",
    nav_my_records: "Buku ya kolɔ́ngɔ́nú",
    nav_doctor_portal: "Esika ya Monganga",
    nav_pharmacy_portal: "Famasi",
    nav_cpanel: "C-Panel",
    nav_signin: "Kota",
    nav_logout: "Bima",

    // Hero Section
    hero_badge: "Bokolongono ya malamu, butu na moyi 24h/24",
    hero_title_1: "Zwa rendez-vous na monganga na yo na ",
    hero_title_highlight: "ba clics muke",
    hero_subtitle: "Luka monganga ya malamu pene na yo, zwa esika na mbala moko mpe batela bokolongono na yo na bokengi mobimba.",
    search_placeholder_doctor: "Kombo ya monganga, mayele na ye, lopitalo...",
    search_placeholder_location: "Engumba, commune (Gombe, Lingwala...)",
    search_button: "Luka sikoyo",

    // Specialties
    specialties_title: "Bamonganga bapanzeli",
    specialties_subtitle: "Luka noki monganga oyo abongi mpo na bokono na yo",
    see_all: "Mona banso",
    spec_generalist: "Monganga ya mikolo nionso",
    spec_cardiologist: "Monganga ya motema",
    spec_pediatrician: "Monganga ya bana mike",
    spec_dentist: "Monganga ya mino",
    practitioners: "bamonganga",

    // Features Section
    features_title: "Mpo na nini kopona SangO Health ?",
    features_subtitle: "Ebongiseli ya sika mpo na bokolongono ya ekolo République Démocratique du Congo",
    feat_1_title: "Kosolola na video HD",
    feat_1_desc: "Solola na monganga na yo na video ya polele kozanga obima na ndako.",
    feat_2_title: "Mokanda ya nkisi ya sekele",
    feat_2_desc: "Zwa ordonnance oyo monganga atié maboko na QR code mpo na kozwa nkisi na famasi.",
    feat_3_title: "Bifamasi ya garde butu na moyi",
    feat_3_desc: "Mona bifamasi oyo ezali kofungola na butu na ba communes nionso ya Kinshasa.",
    feat_4_title: "Ofélé mpo na babeli 100%",
    feat_4_desc: "Okozala na futa eloko te. Zwa esika na yo ya kosalisa nzoto ofele.",

    // Doctor Directory
    directory_title: "Luku ya Bamonganga & Urgences",
    directory_subtitle: "bamonganga mpe bifamasi ya garde oyo ezali pene na yo na Kinshasa",
    view_list: "Molongo",
    view_map: "Karte ya Kinshasa & Garde",
    filter_all: "Banso",
    filter_cabinet: "Na Lopitalo",
    filter_video: "Na Video",
    book_appointment: "Zwa rendez-vous",
    next_slot: "Mbala ya sika",
    fee: "Talo",

    // Patient Dashboard
    patient_title: "Buku ya Kolɔ́ngɔ́nú na ngai",
    patient_subtitle: "Tala ba rendez-vous na yo, mikanda ya nkisi mpe ba examens ya lopitalo na bokengi.",
    export_health_booklet: "Bimisa Buku ya Kolɔ́ngɔ́nú (PDF)",
    new_booking: "Rendez-vous ya sika",
    tab_upcoming: "Rendez-vous ezali koya",
    tab_prescriptions: "Mikanda ya nkisi na ngai",
    tab_documents: "Ba analyses & Radios na ngai",
    tab_past: "Oyo esili koleka",
    add_document: "Bakisa mokanda ya lopitalo",

    // Auth Modal
    auth_title: "Kokota na SangO Health",
    auth_tab_patient: "Dossier ya Mbeli",
    auth_tab_doctor: "Monganga",
    auth_tab_admin: "Super Admin",
    auth_email: "Adresse Email",
    auth_password: "Mot de passe ya sekele",
    auth_forgot: "Obosani mot de passe ?",
    auth_set_pwd: "Bongisa mot de passe",
    auth_submit: "Kota sikoyo"
  },

  sw: {
    // Navigation (Kiswahili)
    nav_home: "Mwanzo",
    nav_find_doctor: "Tafuta daktari",
    nav_my_records: "Rekodi ya Afya",
    nav_doctor_portal: "Sehemu ya Daktari",
    nav_pharmacy_portal: "Duka la Dawa",
    nav_cpanel: "C-Panel",
    nav_signin: "Ingia",
    nav_logout: "Toka",

    // Hero Section
    hero_badge: "Huduma rahisi ya afya, inapatikana saa 24/7",
    hero_title_1: "Pata miadi na daktari wako kwa ",
    hero_title_highlight: "mibofyo michache",
    hero_subtitle: "Tafuta mtaalamu wa afya aliye karibu nawe, weka nafasi papo hapo na udhibiti miadi yako kwa usalama wa hali ya juu.",
    search_placeholder_doctor: "Daktari, utaalamu, zahanati...",
    search_placeholder_location: "Mji, mtaa (Gombe, Lingwala...)",
    search_button: "Tafuta sasa",

    // Specialties
    specialties_title: "Taaluma Maalum za Afya",
    specialties_subtitle: "Pata daktari bingwa anayefaa mahitaji yako haraka",
    see_all: "Ona yote",
    spec_generalist: "Daktari Mkuu",
    spec_cardiologist: "Daktari wa Moyo",
    spec_pediatrician: "Daktari wa Watoto",
    spec_dentist: "Daktari wa Meno",
    practitioners: "madaktari",

    // Features Section
    features_title: "Kwa nini uchague SangO Health?",
    features_subtitle: "Mfumo wa kisasa wa afya ulioundwa kwa Jamhuri ya Kidemokrasia ya Kongo",
    feat_1_title: "Mashauriano ya Video ya HD",
    feat_1_desc: "Wasiliana na daktari wako kwa video ya ubora wa juu bila kutoka nyumbani.",
    feat_2_title: "Vyeti vya Dawa vya Kielektroniki",
    feat_2_desc: "Pokea cheti chenye sahihi ya kidijitali na QR code kwa matumizi kwenye maduka ya dawa.",
    feat_3_title: "Maduka ya Dawa ya Zamu Saa 24",
    feat_3_desc: "Tafuta maduka ya dawa yaliyofunguliwa usiku na mwishoni mwa juma katika mitaa yote ya Kinshasa.",
    feat_4_title: "Bure Kabisa kwa Wagonjwa",
    feat_4_desc: "Hakuna ada ya kujiunga. Weka miadi na hifadhi faili zako za matibabu bila malipo.",

    // Doctor Directory
    directory_title: "Orodha ya Madaktari na Dharura",
    directory_subtitle: "wataalamu wa afya na maduka ya dawa ya zamu Kinshasa",
    view_list: "Orodha",
    view_map: "Ramani ya Kinshasa & Zamu",
    filter_all: "Wote",
    filter_cabinet: "Zahanati",
    filter_video: "Kwa Video",
    book_appointment: "Weka miadi",
    next_slot: "Nafasi ijayo",
    fee: "Gharama",

    // Patient Dashboard
    patient_title: "Faili Yangu ya Afya ya Mgonjwa",
    patient_subtitle: "Angalia miadi yako, maagizo ya dawa na vipimo vya maabara kwa usalama.",
    export_health_booklet: "Toa Kitabu cha Afya (PDF)",
    new_booking: "Miadi Mpya",
    tab_upcoming: "Miadi Inayokuja",
    tab_prescriptions: "Maagizo Yangu ya Dawa",
    tab_documents: "Vipimo vya Maabara na X-Ray",
    tab_past: "Historia Iliyopita",
    add_document: "Weka hati ya matibabu",

    // Auth Modal
    auth_title: "Kuingia SangO Health",
    auth_tab_patient: "Faili ya Mgonjwa",
    auth_tab_doctor: "Daktari",
    auth_tab_admin: "Super Admin",
    auth_email: "Barua Pepe",
    auth_password: "Nenosiri",
    auth_forgot: "Umesahau nenosiri?",
    auth_set_pwd: "Weka nenosiri",
    auth_submit: "Ingia sasa"
  },

  kg: {
    // Navigation (Kikongo / Kituba)
    nav_home: "Luyantiku",
    nav_find_doctor: "Sosa munganga",
    nav_my_records: "Mukanda ya mavimpi",
    nav_doctor_portal: "Kisika ya Munganga",
    nav_pharmacy_portal: "Famasí",
    nav_cpanel: "C-Panel",
    nav_signin: "Kota",
    nav_logout: "Basika",

    // Hero Section
    hero_badge: "Mavimpi ya mbote, mpimpa ti mwini 24h/24",
    hero_title_1: "Baka kintwadi na munganga na nge na ",
    hero_title_highlight: "mbala mosi",
    hero_subtitle: "Sosa munganga ya mbote penepene na nge, baka kisika na nswalu mpe tanina mavimpi na nge na lutaninu ya ngolo.",
    search_placeholder_doctor: "Kumbu ya munganga, mayele, nzo-nkisi...",
    search_placeholder_location: "Bwala, commune (Gombe, Lingwala...)",
    search_button: "Sosa ntangu yai",

    // Specialties
    specialties_title: "Baminganga ya lukumu",
    specialties_subtitle: "Sosa nswalu munganga yina me fwana samu na maladi na nge",
    see_all: "Tala yonso",
    spec_generalist: "Munganga ya maladi nionso",
    spec_cardiologist: "Munganga ya ntima",
    spec_pediatrician: "Munganga ya bana fioti",
    spec_dentist: "Munganga ya meno",
    practitioners: "baminganga",

    // Features Section
    features_title: "Samu na nki kupona SangO Health ?",
    features_subtitle: "Nzila ya sika ya mavimpi samu na nsi ya République Démocratique du Congo",
    feat_1_title: "Kusolula na video HD",
    feat_1_desc: "Solula ti munganga na nge na video ya pwelele kukonda kubasika na nzo.",
    feat_2_title: "Mukanda ya bilongo ya kieleka",
    feat_2_desc: "Baka ordonnance yina munganga me tula kidimbu ti QR code samu na kusumba bilongo na famasi.",
    feat_3_title: "Bafamasí ya garde mpimpa ti mwini",
    feat_3_desc: "Mona bafamasí yina ke kangula na mpimpa na ba communes yonso ya Kinshasa.",
    feat_4_title: "Ofélé samu na bambewi 100%",
    feat_4_desc: "Kufuta kima ve. Baka kintwadi na nge mpe tula mikanda na nge ya mavimpi ofele.",

    // Doctor Directory
    directory_title: "Mukanda ya Baminganga & Kisika ya nswalu",
    directory_subtitle: "baminganga ti bafamasí ya garde yina kele penepene na nge na Kinshasa",
    view_list: "Mulongo",
    view_map: "Karte ya Kinshasa & Garde",
    filter_all: "Yonso",
    filter_cabinet: "Na Nzo-nkisi",
    filter_video: "Na Video",
    book_appointment: "Baka kintwadi",
    next_slot: "Mbala ya nswalu",
    fee: "Ntalu",

    // Patient Dashboard
    patient_title: "Mukanda ya Mavimpi na munu",
    patient_subtitle: "Tala mikanda ya kintwadi, ya bilongo mpe ya ba examens na nge na lutaninu.",
    export_health_booklet: "Bimisa Mukanda ya Mavimpi (PDF)",
    new_booking: "Kintwadi ya sika",
    tab_upcoming: "Bintwadi ke kwiza",
    tab_prescriptions: "Mikanda ya bilongo",
    tab_documents: "Ba analyses & Ba radios",
    tab_past: "Yina me luta",
    add_document: "Kudisa mukanda ya mavimpi",

    // Auth Modal
    auth_title: "Kukota na SangO Health",
    auth_tab_patient: "Mukanda ya Mbevo",
    auth_tab_doctor: "Munganga",
    auth_tab_admin: "Super Admin",
    auth_email: "Adresi ya Email",
    auth_password: "Mpemba ya lutaninu",
    auth_forgot: "Me vilakana mot de passe ?",
    auth_set_pwd: "Bongisa mot de passe",
    auth_submit: "Kota ntangu yai"
  },

  ts: {
    // Navigation (Tshiluba)
    nav_home: "Tshibangidilu",
    nav_find_doctor: "Kukeba munganga",
    nav_my_records: "Mukanda wa makanda",
    nav_doctor_portal: "Muaba wa Munganga",
    nav_pharmacy_portal: "Nzubu wa manga",
    nav_cpanel: "C-Panel",
    nav_signin: "Kubuela",
    nav_logout: "Kupatuka",

    // Hero Section
    hero_badge: "Makanda a mubidi bimpe, butuku ne munya 24h/24",
    hero_title_1: "Angata tshikondo ne munganga webe mu ",
    hero_title_highlight: "matuku makese",
    hero_subtitle: "Keba munganga muimpe pabuipi nebe, angata muaba lukasa ne lama makanda ebe a mubidi mu bukubi bunene.",
    search_placeholder_doctor: "Dina dia munganga, mudimu wende, lupitadi...",
    search_placeholder_location: "Tshimenga, commune (Gombe, Lingwala...)",
    search_button: "Keba mpindieu",

    // Specialties
    specialties_title: "Baminganga badibu batamba kukeba",
    specialties_subtitle: "Keba lukasa munganga udi muakanyine bua disama diebe",
    see_all: "Mona bionso",
    spec_generalist: "Munganga wa masama onso",
    spec_cardiologist: "Munganga wa muoyo",
    spec_pediatrician: "Munganga wa bana bakese",
    spec_dentist: "Munganga wa menu",
    practitioners: "baminganga",

    // Features Section
    features_title: "Bua tshinyi kusungula SangO Health ?",
    features_subtitle: "Tshiamu tshia bukole bua makanda a mubidi mu ditunga dia République Démocratique du Congo",
    feat_1_title: "Kuyukila ku video HD",
    feat_1_desc: "Yukila ne munganga webe ku video kumpala ne kumpala kayi mupatuke kumbelu to.",
    feat_2_title: "Mabalu a manga a bushuwa",
    feat_2_desc: "Peta ordonnance mufunda kudi munganga ne tshimanyinu tshia QR code bua kupeta manga mu famasi.",
    feat_3_title: "Bafamasi ya garde butuku ne munya",
    feat_3_desc: "Mona bafamasi badi bakangule butuku ne ku ndekelu kua lumingu mu bimenga bionso bia Kinshasa.",
    feat_4_title: "Tshianana bua babedi 100%",
    feat_4_desc: "Kakuena difuta kantu to. Angata tshikondo ne lama mukanda webe wa makanda tshianana.",

    // Doctor Directory
    directory_title: "Mukanda wa Baminganga ne Luya lukasa",
    directory_subtitle: "baminganga ne bafamasi ya garde badi pabuipi nebe mu Kinshasa",
    view_list: "Mulongo",
    view_map: "Karte ka Kinshasa & Garde",
    filter_all: "Bionso",
    filter_cabinet: "Mu Lupitadi",
    filter_video: "Ku Video",
    book_appointment: "Angata tshikondo",
    next_slot: "Musangu udi ulonda",
    fee: "Mushinga",

    // Patient Dashboard
    patient_title: "Mukanda wanyi wa Makanda a Mubidi",
    patient_subtitle: "Tala bikondo biebe bia ku lupitadi, mabalu a manga ne bilumbu bia lupitadi mu bukubi.",
    export_health_booklet: "Patula Mukanda wa Makanda (PDF)",
    new_booking: "Tshikondo tshipiatshipia",
    tab_upcoming: "Bikondo bidi bilua",
    tab_prescriptions: "Mabalu a manga anyi",
    tab_documents: "Analyses ne Radios anyi",
    tab_past: "Bikondo bia kale",
    add_document: "Kudisha mukanda wa lupitadi",

    // Auth Modal
    auth_title: "Kubuela mu SangO Health",
    auth_tab_patient: "Mukanda wa Mubedi",
    auth_tab_doctor: "Munganga",
    auth_tab_admin: "Super Admin",
    auth_email: "Adrese wa Email",
    auth_password: "Tshisumunu tshia tshinsokoko",
    auth_forgot: "Udi mupue muoyo tshisumunu ?",
    auth_set_pwd: "Longolola tshisumunu",
    auth_submit: "Buela mpindieu"
  }
};
