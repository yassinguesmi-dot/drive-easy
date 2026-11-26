import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../core/environment';
import { Vehicule, VehiculeInput, VehiculeStatut } from '../models/vehicule';

@Injectable({ providedIn: 'root' })
export class VehiculeService {
  private readonly base = `${environment.apiBaseUrl}/vehicules`;
  readonly vehicles = signal<Vehicule[]>([]);

  constructor(private readonly http: HttpClient) {}

  list(filters: { carburant?: string; categorie?: string; statut?: string; prixMax?: number } = {}): Observable<Vehicule[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, value);
    });
    return this.http.get<Vehicule[]>(this.base, { params }).pipe(tap(items => this.vehicles.set(items)));
  }

  available(dateDebut: string, dateFin: string): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.base}/disponibles`, { params: { dateDebut, dateFin } });
  }

  get(id: string): Observable<Vehicule> { return this.http.get<Vehicule>(`${this.base}/${id}`); }
  create(input: VehiculeInput): Observable<Vehicule> { return this.http.post<Vehicule>(this.base, input); }
  update(id: string, input: VehiculeInput): Observable<Vehicule> { return this.http.put<Vehicule>(`${this.base}/${id}`, input); }
  setStatus(id: string, statut: VehiculeStatut): Observable<Vehicule> {
    return this.http.patch<Vehicule>(`${this.base}/${id}/statut`, { statut });
  }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
