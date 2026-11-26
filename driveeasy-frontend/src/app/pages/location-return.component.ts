import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocationDetail, Location } from '../models/location';
import { LocationService } from '../services/location.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">CLÔTURE DU CONTRAT</p><h1>Retour du véhicule</h1><p class="muted">Vérifiez le compteur et calculez le montant final.</p></div><a class="button secondary" routerLink="/locations">← Locations</a></section>
    @if (detail(); as data) {
      <section class="return-grid">
        <article class="panel"><div class="panel-heading"><div><h2>Résumé de la location</h2><p class="muted">#{{ data.location.id.slice(0, 8).toUpperCase() }}</p></div><span class="status-pill" [class]="data.location.statut.toLowerCase()">{{ data.location.statut }}</span></div>
          <div class="profile-info"><p><small>Client</small><b>{{ data.client.prenom }} {{ data.client.nom }}</b></p><p><small>Véhicule</small><b>{{ data.vehicule.marque }} {{ data.vehicule.modele }} · {{ data.vehicule.immatriculation }}</b></p><p><small>Période prévue</small><b>{{ data.location.dateDebut | date:'dd/MM/yyyy' }} – {{ data.location.dateFinPrevue | date:'dd/MM/yyyy' }}</b></p><p><small>Compteur au départ</small><b>{{ data.location.kmDepart ?? data.vehicule.kilometrage }} km</b></p></div>
        </article>
        @if (result(); as finished) {
          <article class="panel final-invoice"><span class="invoice-check">✓</span><h2>Retour enregistré</h2><p class="muted">Le véhicule est de nouveau disponible.</p><div class="invoice-row"><span>Montant final</span><b>{{ finished.montantTotal | currency:'EUR':'symbol':'1.2-2' }}</b></div><div class="invoice-row"><span>Pénalité de retard</span><b>{{ finished.penalite | currency:'EUR':'symbol':'1.2-2' }}</b></div><button class="button secondary" (click)="print()">Imprimer le récapitulatif</button></article>
        } @else {
          <form class="panel form-panel" (ngSubmit)="submit()"><h2>Enregistrer le retour</h2><label>Kilométrage au retour (km)<input type="number" min="0" [(ngModel)]="kmRetour" name="kmRetour" required></label><label>Date de retour effective<input type="date" [(ngModel)]="returnDate" name="returnDate" required></label><p class="muted">Une pénalité de 1,5 × le tarif journalier s'applique par jour de retard.</p><button class="button primary" [disabled]="saving() || data.location.statut !== 'EN_COURS'">{{ saving() ? 'Calcul…' : 'Calculer et clôturer' }}</button></form>
        }
      </section>
    }
  `
})
export class LocationReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(LocationService);
  readonly detail = signal<LocationDetail | null>(null);
  readonly result = signal<Location | null>(null);
  readonly saving = signal(false);
  kmRetour = 0;
  returnDate = new Date().toISOString().slice(0, 10);
  private readonly id = this.route.snapshot.paramMap.get('id')!;

  ngOnInit(): void {
    this.service.get(this.id).subscribe(value => {
      this.detail.set(value);
      this.kmRetour = value.vehicule.kilometrage;
    });
  }

  submit(): void {
    const location = this.detail()?.location;
    if (!location || this.kmRetour < (location.kmDepart ?? 0)) {
      alert('Le kilométrage retour doit être supérieur ou égal au compteur de départ.');
      return;
    }
    this.saving.set(true);
    this.service.finish(this.id, this.kmRetour, this.returnDate).subscribe({
      next: value => this.result.set(value),
      error: () => this.saving.set(false)
    });
  }

  print(): void { window.print(); }
}
