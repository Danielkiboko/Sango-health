# SangO Health - Application de Prise de Rendez-vous Médical en RDC 🏥

Application web moderne, fluide et réactive conçue pour faciliter l'accès aux soins de santé et la prise de rendez-vous en cabinet et téléconsultation.

---

## 🎨 Identité Visuelle & Typographie

### 1. Logo Officiel
Les déclinaisons officielles haute résolution du logo **SangO Health** sont extraites dans `public/brand/` :
- **`sango-logo-green.png`** : Logo vert médical officiel (stéthoscope cœur + typographie SangO Health) avec fond transparent.
- **`sango-logo-white.png`** : Déclinaison blanche pour les fonds sombres (navbar sombre, footer).
- **`sango-logo-blue.png`** : Déclinaison bleue médicale.
- **`sango-logo-dark.png`** : Déclinaison slate sombre.
- **`sango-icon-green.png` / `favicon.png`** : Icône stéthoscope-cœur isolée pour favicon et icônes d'application.

### 2. Typographie
- **Typographie de Marque (Titres & Identité)** : **Fredoka** & **Quicksand** (Google Fonts) – pour retrouver l'esprit organique, chaleureux et arrondi du lettrage « SangO Health ».
- **Typographie Interface (UI & Données Médicales)** : **Plus Jakarta Sans** – lisibilité optimale pour les coordonnées, créneaux horaires, tarifs (CDF) et profils médicaux.

---

## 🚀 Démarrage Rapide

Le serveur de développement local tourne sur :
- **URL locale** : [http://localhost:5173/](http://localhost:5173/)
- **Sur le réseau local** : `http://10.86.82.13:5173/`

### Commandes utiles :
```bash
# Lancer le serveur de développement
npm run dev

# Tester la compilation TypeScript et le bundle de production
npm run build

# Prévisualiser le build
npm run preview
```

---

## ✨ Fonctionnalités Incluses

1. **Page d'accueil interactive** :
   - Moteur de recherche par spécialité médicale et localisation (communes, villes).
   - Accès rapide par spécialités (Généraliste, Cardiologue, Pédiatre, Dentiste).
   - Praticiens mis en avant avec avis, tarifs et disponibilités instantanées.
   - Témoignages et arguments de réassurance (sécurité des données, praticiens certifiés).

2. **Moteur de recherche & filtres** :
   - Filtrage instantané par nom, spécialité, adresse/commune.
   - Filtrage par modalité de consultation : Cabinet ou Téléconsultation vidéo.

3. **Prise de rendez-vous (Modal de réservation)** :
   - Sélection du motif de consultation.
   - Sélection du créneau horaire disponible.
   - Choix du type de consultation (Présentiel ou Visio).
   - Confirmation instantanée avec notification toast.

4. **Tableau de bord Patient** :
   - Suivi des rendez-vous à venir et passés.
   - Bouton d'annulation dynamique de RDV.
   - Bouton de lancement de consultation vidéo.

5. **Espace Praticien (Portail Médecin)** :
   - Vue sur l'agenda de la journée.
   - Liste des patients programmés avec leurs informations et statuts.

6. **Authentification simulée** :
   - Possibilité de basculer en un clic entre profil **Patient** et **Médecin**.
