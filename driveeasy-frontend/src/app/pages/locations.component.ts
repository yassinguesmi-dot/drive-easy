import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Location, LocationPage } from '../models/location';
import { LocationService } from '../services/location.service';

@Component({
  standalone: true,
  imports: [DatePipe, CurrencyPipe, FormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">SUIVI DES CONTRATS</p><h1>Locations</h1><p class="muted">Réservations, départs et retours de véhicules.</p></div><a class="button primary" routerLink="/locations/new">＋ Nouvelle location</a></section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Historique des locations</h2><p class="muted">{{ page()?.totalElements || 0 }} contrat(s)</p></div>
        <div class="inline-actions"><select [(ngModel)]="status" (change)="load(0)"><option value="">Tous les statuts</option><option>RESERVEE</option><option>EN_COURS</option><option>TERMINEE</option><option>ANNULEE</option></select><input type="date" aria-label="Date de début du filtre" [(ngModel)]="dateDebut"><input type="date" aria-label="Date de fin du filtre" [(ngModel)]="dateFin"><button class="button secondary" (click)="load(0)">Filtrer</button><button class="button secondary" (click)="load(currentPage() - 1)" [disabled]="currentPage() === 0">←</button><button class="button secondary" (click)="load(currentPage() + 1)" [disabled]="currentPage() + 1 >= (page()?.totalPages || 0)">→</button></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>RÉFÉRENCE</th><th>VÉHICULE</th><th>CLIENT</th><th>PÉRIODE</th><th>MONTANT</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>
        @for (location of page()?.content || []; track location.id) {
          <tr><td><b>#{{ location.id.slice(0, 8).toUpperCase() }}</b></td><td>{{ location.vehiculeId }}</td><td>{{ location.clientId }}</td><td>{{ location.dateDebut | date:'dd/MM/yy' }} – {{ location.dateFinPrevue | date:'dd/MM/yy' }}</td><td>{{ location.montantTotal | currency:'EUR':'symbol':'1.0-0' }}</td><td><span class="status-pill" [class]="location.statut.toLowerCase()">{{ location.statut }}</span></td>
            <td>@if (location.statut === 'RESERVEE') { <button class="link-button" (click)="start(location)">Départ</button><button class="link-button" (click)="cancel(location)">Annuler</button> } @else if (location.statut === 'EN_COURS') { <a class="text-link" [routerLink]="['/locations', location.id, 'retour']">Retour</a> } @else { <a class="text-link" [routerLink]="['/locations', location.id, 'retour']">Détails</a> }</td></tr>
        } @empty { <tr><td colspan="7" class="empty-cell">Aucune location pour ces filtres.</td></tr> }
      </tbody></table></div>
    </section>
  `
})
export class LocationsComponent implements OnInit {
  private readonly service = inject(LocationService);
  readonly page = signal<LocationPage | null>(null);
  readonly currentPage = signal(0);
  status = '';
  dateDebut = '';
  dateFin = '';

  ngOnInit(): void { this.load(0); }
  load(page: number): void {
    if (page < 0) return;
    this.service.list(page, this.status, this.dateDebut, this.dateFin).subscribe(result => {
      this.page.set(result);
      this.currentPage.set(result.number);
    });
  }
  cancel(location: Location): void {
    if (confirm('Annuler cette réservation ?')) this.service.cancel(location.id).subscribe(() => this.load(this.currentPage()));
  }

  start(location: Location): void {
    const raw = prompt('Kilométrage au départ (km) :');
    if (raw === null) return;
    const mileage = Number(raw);
    if (!Number.isInteger(mileage) || mileage < 0) {
      alert('Saisissez un kilométrage entier positif.');
      return;
    }
    this.service.start(location.id, mileage).subscribe(() => this.load(this.currentPage()));
  }
}
