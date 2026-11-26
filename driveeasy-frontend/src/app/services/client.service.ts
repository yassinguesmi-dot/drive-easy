import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../core/environment';
import { Client, ClientInput, Eligibility } from '../models/client';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly base = `${environment.apiBaseUrl}/clients`;
  readonly clients = signal<Client[]>([]);

  constructor(private readonly http: HttpClient) {}

  list(query = ''): Observable<Client[]> {
    const params = query ? new HttpParams().set('q', query) : new HttpParams();
    return this.http.get<Client[]>(this.base, { params }).pipe(tap(items => this.clients.set(items)));
  }
  get(id: string): Observable<Client> { return this.http.get<Client>(`${this.base}/${id}`); }
  eligibility(id: string): Observable<Eligibility> { return this.http.get<Eligibility>(`${this.base}/${id}/eligibilite`); }
  create(input: ClientInput): Observable<Client> { return this.http.post<Client>(this.base, input); }
  update(id: string, input: ClientInput): Observable<Client> { return this.http.put<Client>(`${this.base}/${id}`, input); }
  setCategory(id: string, categorie: string): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/${id}/categorie`, { categorie });
  }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
