export type CategorieClient = 'STANDARD' | 'FIDELE' | 'VIP';

export interface Client {
  id: string;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  email: string;
  telephone: string;
  adresse: string;
  numeroPermis: string;
  dateExpirationPermis: string;
  categorieClient: CategorieClient;
  dateInscription: string;
  locationsTerminees: number;
}

export type ClientInput = Omit<Client, 'id' | 'categorieClient' | 'dateInscription' | 'locationsTerminees'>;

export interface Eligibility {
  eligible: boolean;
  age: number;
  permisValide: boolean;
  raison: string;
}
