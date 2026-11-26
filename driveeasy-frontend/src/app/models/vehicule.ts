export type VehiculeStatut = 'DISPONIBLE' | 'LOUE' | 'MAINTENANCE';

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  carburant: string;
  boite: string;
  nbPlaces: number;
  kilometrage: number;
  prixJournalier: number;
  statut: VehiculeStatut;
  categorie: string;
  imageUrl?: string;
}

export type VehiculeInput = Omit<Vehicule, 'id' | 'statut'>;
