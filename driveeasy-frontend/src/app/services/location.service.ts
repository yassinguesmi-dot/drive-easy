import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../core/environment';
import { Location, LocationDetail, LocationPage, LocationSimulation, LocationStatistics } from '../models/location';
import { Vehicule } from '../models/vehicule';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly base = `${environment.apiBaseUrl}/locations`;

  constructor(private readonly http: HttpClient) {}

  list(page = 0, statut = '', dateDebut = '', dateFin = '', clientId = '', size = 10): Observable<LocationPage> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'dateCreation,desc');
    if (statut) params = params.set('statut', statut);
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);
    if (clientId) params = params.set('clientId', clientId);
    return this.http.get<LocationPage>(this.base, { params });
  }
  availableVehicles(dateDebut: string, dateFin: string): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.base}/vehicules-disponibles`, { params: { dateDebut, dateFin } });
  }
  get(id: string): Observable<LocationDetail> { return this.http.get<LocationDetail>(`${this.base}/${id}`); }
  simulate(input: Pick<LocationSimulation, 'clientId' | 'vehiculeId' | 'dateDebut' | 'dateFinPrevue'>): Observable<LocationSimulation> {
    return this.http.post<LocationSimulation>(`${this.base}/simulation`, input);
  }
  reserve(input: Pick<LocationSimulation, 'clientId' | 'vehiculeId' | 'dateDebut' | 'dateFinPrevue'>): Observable<Location> {
    return this.http.post<Location>(this.base, input);
  }
  start(id: string, kmDepart: number): Observable<Location> {
    return this.http.patch<Location>(`${this.base}/${id}/depart`, { kmDepart });
  }
  finish(id: string, kmRetour: number, dateRetourEffectif: string): Observable<Location> {
    return this.http.patch<Location>(`${this.base}/${id}/retour`, { kmRetour, dateRetourEffectif });
  }
  cancel(id: string): Observable<Location> { return this.http.patch<Location>(`${this.base}/${id}/annulation`, {}); }
  statistics(): Observable<LocationStatistics> { return this.http.get<LocationStatistics>(`${this.base}/statistiques`); }
}
