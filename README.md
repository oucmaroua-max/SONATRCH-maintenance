# Sonatrach – Plateforme de suivi des travaux de maintenance (GMAO)

Application web de gestion des ordres de travail de la **Direction Maintenance – Raffinerie d'Alger (Sonatrach, Division RPA)**.
Elle permet de créer, affecter, suivre et valider des travaux de maintenance selon la **hiérarchie organisationnelle** de la direction, avec gestion des utilisateurs, des intérims, des absences et des notifications.

> Projet réalisé dans le cadre du stage SPE (2CS, option SIT) – ESI Alger.

---

## Sommaire

1. [Fonctionnalités](#1-fonctionnalités)
2. [Stack technique](#2-stack-technique)
3. [Architecture](#3-architecture)
4. [Structure du dépôt](#4-structure-du-dépôt)
5. [Prérequis](#5-prérequis)
6. [Installation et lancement](#6-installation-et-lancement)
7. [Configuration (.env)](#7-configuration-env)
8. [Modèle de données](#8-modèle-de-données)
9. [Rôles et règles métier](#9-rôles-et-règles-métier)
10. [API REST](#10-api-rest)
11. [Sécurité](#11-sécurité)
12. [Scripts disponibles](#12-scripts-disponibles)
13. [Limites connues et pistes d'amélioration](#13-limites-connues-et-pistes-damélioration)

---

## 1. Fonctionnalités

### Gestion des travaux
- Création d'un ordre de travail (code auto `OT-AAAA-1xxx`, titre, description, unité, équipement, permis de travail, priorité, dates, nombre d'agents).
- **Affectation hiérarchique** : chaque niveau confie le travail au niveau immédiatement inférieur et dans son périmètre.
- Affectation **multiple** d'employés par un chef de service.
- Suivi : statut (En attente / En cours / Terminé / En retard / Annulé), avancement (%), observation, date de fin prévue.
- **Feedback de l'encadrement** sur les travaux terminés : *Validé*, *Validé avec réserves*, *Non validé*, *À reprendre*, *Non conforme HSE*. Une validation archive le travail ; un refus le renvoie « En cours » (avancement plafonné à 80 %).
- Registre filtrable (recherche, statut) et tableau de bord (indicateurs, répartition en donut, ordres prioritaires, activité récente).

### Administration
- Gestion des utilisateurs : création, édition, approbation, suspension / réactivation, réinitialisation du mot de passe.
- Historique de poste (rôle / organisation) et **journal d'audit** des actions administrateur.
- Gestion de la structure organisationnelle : sous-directions → départements → services (CRUD).
- Gestion des intérims (création, approbation, refus, clôture).

### Espace personnel
- Profil, changement de mot de passe.
- **Employés** : déclaration d'absence avec date de retour (réactivation automatique à échéance).
- **Responsables** : demande d'intérim soumise à l'administrateur ; le remplaçant peut basculer temporairement vers l'espace du responsable absent (en-tête `X-Acting-Interim`).
- Notifications internes (cloche, rafraîchissement toutes les 30 s).

---

## 2. Stack technique

| Couche | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS 3, lucide-react |
| **Backend** | Node.js, Express 5, TypeScript, `tsx` |
| **Base de données** | PostgreSQL, Drizzle ORM (`drizzle-kit push`), `pg` |
| **Authentification** | Sessions à jeton opaque (SHA-256 stocké en base), mots de passe hachés avec `bcrypt` |
| **Outillage** | ESLint, `typescript-eslint`, script de dev unifié (`scripts/dev.mjs`) |

---

## 3. Architecture

```
┌────────────────────┐   /api (proxy Vite)        ┌──────────────────────┐         ┌──────────────┐
│  Frontend (React)        │ ───────────────────▶ │  Backend (Express)         │ ─────▶│ PostgreSQL       │
│  127.0.0.1:5173          │   Bearer <token>           │  127.0.0.1:3000                       │ Drizzle         │
└────────────────────┘                            └──────────────────────┘         └──────────────┘
```

- **Frontend** : SPA avec routage maison basé sur `history.pushState` (voir `App.tsx` et `navigate()` dans `Shell.tsx`). L'état de session est un store externe (`session.ts`) consommé via `useSyncExternalStore`.
- **Backend** : architecture *routes → controllers → models*, avec middlewares `requireAuth` / `requireAdmin`.
- **Périmètre** : `utils/orgScope.ts` et `utils/effectiveScope.ts` calculent le périmètre visible (ou celui du délégant en cas d'intérim) pour filtrer les travaux et contrôler les affectations.

---

## 4. Structure du dépôt

```
.
├── package.json                 # Scripts racine (dev unifié, build front)
├── scripts/
│   └── dev.mjs                  # Lance backend + frontend (Windows)
├── Backend/
│   ├── drizzle.config.ts
│   └── src/
│       ├── app.ts               # Routes + gestion d'erreurs
│       ├── controllers/         # auth, user, org, work, interim, notification
│       ├── models/              # accès aux données (user, session, org, interim, notification)
│       ├── middleware/auth.ts   # requireAuth / requireAdmin
│       ├── utils/               # hash, orgScope, effectiveScope
│       ├── types/index.ts
│       └── db/                  # schema.ts, client.ts, seed.ts
└── Sonatrach-bolt-main/         # Frontend
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.ts
    └── src/
        ├── App.tsx              # Routage
        ├── api.ts, session.ts   # Client HTTP, session, intérim actif
        ├── works.ts, interims.ts, adminUsers.ts, profile.ts, notifications.ts
        ├── components/          # Shell (header/footer/cloche), OrgChart, Modal, badges…
        └── pages/               # Landing, Login, Dashboard, WorkOrders, NewWorkOrder,
                                 # WorkOrderDetail, Profile, admin/*
```

---

## 5. Prérequis

- **Node.js ≥ 22** (requis par les dépendances `@supabase/*` listées dans le lockfile du frontend ; ≥ 18 suffit pour le backend)
- **npm**
- **PostgreSQL** (une base nommée `Sonatrach_maintenance`)
- **Windows** pour utiliser le script `npm run dev` racine (il s'appuie sur `netstat` / `taskkill`). Sur Linux/macOS, lancer backend et frontend séparément (voir ci-dessous).

---

## 6. Installation et lancement

### 6.1 Cloner et installer les dépendances

```bash
git clone https://github.com/oucmaroua-max/SONATRCH-maintenance
cd <dossier-du-projet>

cd Backend && npm install && cd ..
cd Sonatrach-bolt-main && npm install && cd ..
```

### 6.2 Configurer l'environnement

Créer `Backend/.env` (voir [section 7](#7-configuration-env)).

### 6.3 Initialiser la base de données

```bash
cd Backend
npm run db:push     # crée les tables à partir de src/db/schema.ts
npm run seed        # insère la structure de base + un compte administrateur
```

Le seed crée :
- 3 sous-directions (`SDM`, `SDE`, `SDH`), 4 départements et 5 services ;
- un compte administrateur de **développement** : identifiant `admin` / mot de passe `Admin123!` → **à changer immédiatement hors environnement local**.

### 6.4 Lancer l'application

**Option A – tout-en-un (Windows), depuis la racine :**

```bash
npm run dev
```

Le script libère les ports 5173 et 3000 puis démarre backend et frontend.

**Option B – séparément (tous OS) :**

```bash
# Terminal 1
cd Backend && npm run dev                 # API sur http://127.0.0.1:3000

# Terminal 2
cd Sonatrach-bolt-main && npm run dev     # Interface sur http://127.0.0.1:5173
```

Ouvrir ensuite **http://127.0.0.1:5173**. Le frontend proxifie `/api` vers le backend.

### 6.5 Build de production

```bash
npm run build               # depuis la racine : build du frontend
cd Backend && npm run build && npm start
```

---

## 7. Configuration (.env)

Fichier `Backend/.env` :

```env
DATABASE_URL=postgresql://<utilisateur>:<mot_de_passe>@localhost:5177/Sonatrach_maintenance
PORT=3000
SESSION_DURATION_HOURS=24
```

| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | — (obligatoire) |
| `PORT` | Port de l'API | `3000` |
| `SESSION_DURATION_HOURS` | Durée de validité d'une session | `24` |

> ⚠️ Ne **jamais** versionner `Backend/.env`. Vérifier que `Backend/.gitignore` contient `.env`.

Le CORS du backend autorise uniquement `http://127.0.0.1:5173`.

---

## 8. Modèle de données

Tables principales (`Backend/src/db/schema.ts`) :

| Table | Description |
|---|---|
| `sous_directions`, `departements`, `services` | Hiérarchie organisationnelle (liée par les abréviations uniques) |
| `users` | Comptes (rôle, statut, rattachement, `is_admin`, absence) |
| `sessions` | Sessions (hash du jeton, expiration, révocation, user-agent, IP) |
| `works` | Ordres de travail (code, priorité, statut, avancement, archivage…) |
| `work_assignees` | Affectations multiples (employés) |
| `work_feedback` | Avis de l'encadrement sur un travail |
| `interim_periods` | Intérims (en attente, actif, refusé, terminé, annulé) |
| `notifications` | Notifications utilisateur |
| `user_position_history` | Historique des changements de rôle / organisation |
| `admin_audit_log` | Journal d'audit des actions administrateur |

Énumérations : `role`, `user_status`, `work_status`, `priority`, `interim_status`, `admin_action`, `feedback_decision`, `notification_type`.

---

## 9. Rôles et règles métier

### Hiérarchie

```
Directeur → Sous-directeur → Chef de département → Chef de service → Employé
```

| Créateur du travail | Peut affecter à… | Périmètre |
|---|---|---|
| Directeur | Sous-directeur | Toute la direction |
| Sous-directeur | Chef de département | Sa sous-direction |
| Chef de département | Chef de service | Son département |
| Chef de service | Employé(s) (multiple) | Son service |
| Employé | — (ne crée pas de travail) | — |

### Visibilité
Un utilisateur ne voit que les travaux des services de son périmètre ; le directeur voit tout. En **intérim actif**, le remplaçant agit avec le périmètre et le rôle du délégant.

### Statuts de compte
`pending` (en attente d'approbation) → `active` ⇄ `inactive` (absence) / `suspended`. La connexion est refusée pour `pending` et `suspended`.

### Feedback
Réservé aux rôles d'encadrement. Une décision *Validé* ou *Validé avec réserves* termine et **archive** le travail.

---

## 10. API REST

Toutes les routes `/api/*` (sauf login et health) exigent `Authorization: Bearer <token>`. 🔒 = réservé aux administrateurs.

### Authentification
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion (`identifier`, `password`) |
| POST | `/api/auth/logout` | Révocation de la session |
| GET | `/api/auth/me` | Utilisateur courant + intérims actifs comme remplaçant |
| GET | `/api/health` | État du serveur |

### Travaux
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/works` | Liste (périmètre, `?includeArchived=true`) |
| GET | `/api/works/assignable-users` | Utilisateurs affectables |
| POST | `/api/works` | Création |
| GET | `/api/works/:id` | Détail + feedbacks |
| PATCH | `/api/works/:id` | Mise à jour (statut, avancement, observation…) |
| POST | `/api/works/:id/feedback` | Ajout d'un feedback |

### Utilisateurs 🔒
| Méthode | Route | Description |
|---|---|---|
| GET / POST | `/api/users` | Liste / création |
| GET / PATCH | `/api/users/:id` | Détail (+ historique, audit) / modification |
| PATCH | `/api/users/:id/status` | Approbation, suspension, réactivation |
| POST | `/api/users/:id/reset-password` | Réinitialisation du mot de passe |

### Profil personnel
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/me/profile` | Mon profil |
| POST | `/api/me/change-password` | Changer mon mot de passe |
| POST | `/api/me/declare-absence` | Déclarer une absence |
| POST | `/api/me/declare-return` | Déclarer mon retour |

### Organisation
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/org` | Arbre complet (authentifié) |
| POST / PATCH / DELETE 🔒 | `/api/org/sous-directions[/:abrv]` | CRUD sous-directions |
| POST / PATCH / DELETE 🔒 | `/api/org/departements[/:abrv]` | CRUD départements |
| POST / PATCH / DELETE 🔒 | `/api/org/services[/:abrv]` | CRUD services |

### Intérims
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/interims/mine` | Mes intérims |
| POST | `/api/interims/request` | Demande d'intérim (responsable) |
| GET / POST 🔒 | `/api/interims` | Liste / création directe |
| PATCH 🔒 | `/api/interims/:id/approve` · `/reject` · `/end` | Traitement et clôture |

### Notifications
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Liste + nombre de non lues |
| PATCH | `/api/notifications/:id/read` | Marquer comme lue |
| PATCH | `/api/notifications/read-all` | Tout marquer comme lu |

---

## 11. Sécurité

- Mots de passe hachés avec **bcrypt** (10 tours) ; longueur minimale de 8 caractères.
- Jetons de session **aléatoires (256 bits)** ; seul leur **hash SHA-256** est stocké ; expiration et révocation côté serveur.
- Contrôle d'accès par **rôle** et par **périmètre organisationnel** côté serveur (le frontend n'est qu'une aide à l'affichage).
- **Journal d'audit** des actions d'administration.
- Les réponses utilisateur excluent toujours `passwordHash`.

---

## 12. Scripts disponibles

**Racine**

| Commande | Description |
|---|---|
| `npm run dev` | Backend + frontend (Windows) |
| `npm run build` | Build du frontend |
| `npm run preview` | Prévisualisation du build |

**Backend (`Backend/`)**

| Commande | Description |
|---|---|
| `npm run dev` | API en mode watch (`tsx`) |
| `npm run db:push` | Synchronise le schéma Drizzle avec la base |
| `npm run seed` | Données initiales |
| `npm run build` / `npm start` | Compilation et exécution en production |

**Frontend (`Sonatrach-bolt-main/`)**

| Commande | Description |
|---|---|
| `npm run dev` | Serveur Vite |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |

---

## 13. Limites connues et pistes d'amélioration

- Le **tableau de bord** affiche encore certains indicateurs statiques (disponibilité des unités, activité récente, prochain arrêt) issus de données de démonstration.
- La page d'accueil contient un bouton **[DEV] Espace admin** à retirer en production.
- Le script `npm run dev` racine est spécifique à **Windows**.
- Pas encore de tests automatisés ni de pagination sur les listes.
- Pistes : export PDF/Excel des ordres de travail, pièces jointes, historique d'avancement, notifications e-mail, déploiement conteneurisé (Docker).

---

© 2026 – Projet académique réalisé pour la Direction Maintenance de la Raffinerie d'Alger (Sonatrach).
