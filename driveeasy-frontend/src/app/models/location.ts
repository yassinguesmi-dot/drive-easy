export type StatutLocation = 'RESERVEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Location {
  id: string;
  clientId: string;
  vehiculeId: string;
  dateDebut: string;
  dateFinPrevue: string;
  dateRetourEffectif: string | null;
  kmDepart: number | null;
  kmRetour: number | null;
  prixJournalierApplique: number;
  montantTotal: number;
  penalite: number;
  statut: StatutLocation;
  dateCreation: string;
}

export interface LocationPage {
  content: Location[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LocationSimulation {
  clientId: string;
  vehiculeId: string;
  dateDebut: string;
  dateFinPrevue: string;
  prixJournalier: number;
  categorieClient: string;
  nombreJours: number;
  remise: number;
  montantEstime: number;
}

export interface LocationStatistics {
  chiffreAffaires: number;
  tauxOccupation: number;
  vehiculesLesPlusLoues: string[];
}

export interface LocationDetail {
  location: Location;
  client: { id: string; nom: string; prenom: string; categorieClient: string };
  vehicule: { id: string; immatriculation: string; marque: string; modele: string; kilometrage: number };
}

/** Référence courte affichée pour un contrat (ex. « #DEMO-1 » ou « #3F2A9C1B »). */
export function locationReference(id: string): string {
  const raw = id.startsWith('location-') ? id.slice('location-'.length) : id.slice(0, 8);
  return `#${raw.toUpperCase()}`;
}
