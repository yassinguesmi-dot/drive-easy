import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Client } from '../models/client';
import { Vehicule } from '../models/vehicule';
import { LocationSimulation } from '../models/location';
import { ClientService } from '../services/client.service';
import { LocationService } from '../services/location.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, PercentPipe, FormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">NOUVEAU CONTRAT</p><h1>Créer une location</h1><p class="muted">Suivez les étapes pour confirmer votre réservation.</p></div><a class="button secondary" routerLink="/locations">← Annuler</a></section>
    <section class="wizard-progress">
      @for (label of steps; track $index) { <div class="wizard-step" [class.current]="step() === $index + 1" [class.done]="step() > $index + 1"><span>{{ step() > $index + 1 ? '✓' : $index + 1 }}</span><small>{{ label }}</small></div> }
    </section>
    <section class="panel wizard-panel">
      @if (step() === 1) {
        <div class="panel-heading"><div><h2>Choisir un client éligible</h2><p class="muted">Seuls les clients de 21 ans ou plus avec permis valide peuvent louer.</p></div></div>
        <label class="wide-label">Client<select [(ngModel)]="clientId"><option value="">Sélectionnez un client</option>@for (client of clients(); track client.id) { <option [value]="client.id">{{ client.prenom }} {{ client.nom }} · {{ client.cin }} · {{ client.categorieClient }}</option> }</select></label>
        <div class="form-actions"><span></span><button class="button primary" [disabled]="!clientId" (click)="validateClient()">Continuer →</button></div>
      }
      @if (step() === 2) {
        <div class="panel-heading"><div><h2>Période et véhicule</h2><p class="muted">La disponibilité est vérifiée auprès du service véhicule.</p></div></div>
        <div class="form-grid"><label>Date de début<input type="date" [(ngModel)]="dateDebut" [min]="today"></label><label>Date de retour prévue<input type="date" [(ngModel)]="dateFinPrevue" [min]="dateDebut"></label></div>
        <button class="button secondary availability-button" (click)="loadVehicles()" [disabled]="!dateDebut || !dateFinPrevue">Rechercher les véhicules disponibles</button>
        @if (vehicles().length) {
          <div class="choice-grid">@for (vehicle of vehicles(); track vehicle.id) {
            <button class="choice-card" [class.selected]="vehiculeId === vehicle.id" (click)="vehiculeId = vehicle.id">
              <span class="choice-mark">{{ vehiculeId === vehicle.id ? '✓' : '＋' }}</span><b>{{ vehicle.marque }} {{ vehicle.modele }}</b>
              <small>{{ vehicle.immatriculation }} · {{ vehicle.categorie }} · {{ vehicle.prixJournalier | currency:'EUR':'symbol':'1.0-0' }}/jour</small>
            </button>
          }</div>
        } @else if (searched()) { <p class="empty-state">Aucun véhicule disponible sur cette période.</p> }
        <div class="form-actions"><button class="button secondary" (click)="step.set(1)">← Retour</button><button class="button primary" [disabled]="!vehiculeId" (click)="quote()">Simuler le tarif →</button></div>
      }
      @if (step() === 3) {
        <div class="panel-heading"><div><h2>Simulation du tarif</h2><p class="muted">Le montant tient compte de la catégorie fidélité.</p></div></div>
        @if (quoteResult(); as quote) {
          <div class="quote-summary"><div><span>Durée</span><b>{{ quote.nombreJours }} jour(s)</b></div><div><span>Tarif journalier</span><b>{{ quote.prixJournalier | currency:'EUR':'symbol':'1.2-2' }}</b></div><div><span>Catégorie</span><b>{{ quote.categorieClient }}</b></div><div><span>Remise appliquée</span><b>{{ quote.remise | percent }}</b></div><div class="quote-total"><span>Total estimé</span><strong>{{ quote.montantEstime | currency:'EUR':'symbol':'1.2-2' }}</strong></div></div>
        }
        <div class="form-actions"><button class="button secondary" (click)="step.set(2)">← Modifier</button><button class="button primary" (click)="step.set(4)">Confirmer la réservation →</button></div>
      }
      @if (step() === 4) {
        <div class="confirm-state"><span class="confirm-check">✓</span><h2>Prêt à confirmer ?</h2><p class="muted">La réservation sera créée en mémoire et apparaîtra dans la liste des locations.</p>
          @if (quoteResult(); as quote) { <strong>{{ quote.montantEstime | currency:'EUR':'symbol':'1.2-2' }}</strong> }
        </div>
        <div class="form-actions"><button class="button secondary" (click)="step.set(3)">← Retour</button><button class="button primary" [disabled]="saving()" (click)="confirm()">{{ saving() ? 'Création…' : 'Confirmer la réservation' }}</button></div>
      }
    </section>
  `
})
export class LocationWizardComponent implements OnInit {
  private readonly clientsService = inject(ClientService);
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  readonly steps = ['Client', 'Période & véhicule', 'Simulation', 'Confirmation'];
  readonly step = signal(1);
  readonly clients = signal<Client[]>([]);
  readonly vehicles = signal<Vehicule[]>([]);
  readonly quoteResult = signal<LocationSimulation | null>(null);
  readonly searched = signal(false);
  readonly saving = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);
  clientId = '';
  vehiculeId = '';
  dateDebut = this.today;
  dateFinPrevue = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  ngOnInit(): void { this.clientsService.list().subscribe(items => this.clients.set(items)); }

  validateClient(): void {
    if (!this.clientId) return;
    this.clientsService.eligibility(this.clientId).subscribe(result => {
      if (result.eligible) this.step.set(2);
      else alert(result.raison);
    });
  }

  loadVehicles(): void {
    if (this.dateFinPrevue < this.dateDebut) {
      alert('La date de retour doit être postérieure à la date de départ.');
      return;
    }
    this.vehiculeId = '';
    this.searched.set(true);
    this.locationService.availableVehicles(this.dateDebut, this.dateFinPrevue).subscribe(items => this.vehicles.set(items));
  }

  quote(): void {
    this.locationService.simulate({
      clientId: this.clientId, vehiculeId: this.vehiculeId,
      dateDebut: this.dateDebut, dateFinPrevue: this.dateFinPrevue
    }).subscribe(result => {
      this.quoteResult.set(result);
      this.step.set(3);
    });
  }

  confirm(): void {
    if (!this.quoteResult()) return;
    this.saving.set(true);
    this.locationService.reserve({
      clientId: this.clientId, vehiculeId: this.vehiculeId,
      dateDebut: this.dateDebut, dateFinPrevue: this.dateFinPrevue
    }).subscribe({
      next: () => this.router.navigateByUrl('/locations'),
      error: () => this.saving.set(false)
    });
  }
}
