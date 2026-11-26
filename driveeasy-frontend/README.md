# DriveEasy Frontend

Interface d'agence DriveEasy en Angular 22, standalone components et Signals. Toutes les requêtes utilisent l'API Gateway `http://localhost:8080/api`; aucun appel direct aux microservices n'est effectué.

## Prérequis

- Node.js compatible Angular 22 et npm
- Backend démarré selon [`driveeasy-backend/README.md`](../driveeasy-backend/README.md)

Installer Node.js depuis [nodejs.org](https://nodejs.org/) avec une version compatible Angular 22, puis vérifier `node --version` et `npm --version` dans une nouvelle fenêtre PowerShell.

## Installation et lancement

```powershell
npm install
npm start
```

Ouvrir http://localhost:4200. Pour créer la version optimisée : `npm run build`.

## Écrans

| Route | Fonction |
|---|---|
| `/dashboard` | Indicateurs du parc et chiffre d'affaires |
| `/vehicules` | Catalogue, filtres, tri, pagination, disponibilité et suppression des véhicules non loués |
| `/vehicules/new` | Création d'un véhicule |
| `/vehicules/:id/edit` | Modification d'un véhicule et de son statut |
| `/clients` | Recherche, création et suppression de clients |
| `/clients/:id` | Dossier client modifiable, éligibilité et historique des locations |
| `/locations` | Liste paginée, filtres par statut/période, départ, annulation et retour |
| `/locations/new` | Assistant réservation en 4 étapes avec filtrage des réservations qui se chevauchent |
| `/locations/:id/retour` | Kilométrage, clôture et impression du récapitulatif |
| `/espace-client` | Portail public, flotte filtrable par catégorie et demande de réservation en 3 étapes |

Si l'API est indisponible, le portail affiche quatre modèles d'exemple clairement identifiés; ils peuvent être filtrés par catégorie, mais leurs disponibilités doivent être vérifiées par les services avant toute réservation. Les erreurs HTTP sont centralisées par un intercepteur et affichées dans la bannière supérieure. Le service `ApiErrorService` expose le message au moyen d'un signal.

## Captures à ajouter

Enregistrer les captures de l'application dans `driveeasy-frontend/docs/captures/` après démarrage du backend : tableau de bord, catalogue avec filtre, fiche client/éligibilité, chaque étape de réservation, liste des locations et facture imprimable. Le rapport backend contient les légendes et l'analyse attendues.
