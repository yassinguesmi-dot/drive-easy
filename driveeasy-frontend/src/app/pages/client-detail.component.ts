import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Client, ClientInput, Eligibility } from '../models/client';
import { Location } from '../models/location';
import { ClientService } from '../services/client.service';
import { LocationService } from '../services/location.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">FICHE CLIENT</p><h1>{{ client()?.prenom }} {{ client()?.nom }}</h1><p class="muted">Dossier client et statut d'éligibilité.</p></div><a class="button secondary" routerLink="/clients">← Retour aux clients</a></section>
    @if (client(); as item) {
      <section class="profile-grid">
        <article class="panel profile-card"><span class="profile-avatar">{{ item.prenom[0] }}{{ item.nom[0] }}</span><h2>{{ item.prenom }} {{ item.nom }}</h2><span class="category-pill" [class]="item.categorieClient.toLowerCase()">{{ item.categorieClient }}</span>
          <div class="profile-info"><p><small>CIN</small><b>{{ item.cin }}</b></p><p><small>Date de naissance</small><b>{{ item.dateNaissance | date:'dd/MM/yyyy' }}</b></p><p><small>Email</small><b>{{ item.email }}</b></p><p><small>Téléphone</small><b>{{ item.telephone }}</b></p><p><small>Adresse</small><b>{{ item.adresse }}</b></p><p><small>Permis</small><b>{{ item.numeroPermis }}</b></p><p><small>Expiration permis</small><b>{{ item.dateExpirationPermis | date:'dd/MM/yyyy' }}</b></p></div>
          @if (eligibility(); as result) { <div class="eligibility" [class.good]="result.eligible"><b>{{ result.eligible ? '✓ Client éligible' : '⚠ Client non éligible' }}</b><span>{{ result.raison }} ({{ result.age }} ans)</span></div> }
        </article>
        <form class="panel form-panel" [formGroup]="form" (ngSubmit)="save()"><h2>Modifier le profil</h2>
          <div class="form-grid">
            <label>CIN<input formControlName="cin"></label><label>Nom<input formControlName="nom"></label>
            <label>Prénom<input formControlName="prenom"></label><label>Date de naissance<input type="date" formControlName="dateNaissance"></label>
            <label>Email<input type="email" formControlName="email"></label><label>Téléphone<input formControlName="telephone"></label>
            <label>Adresse<input formControlName="adresse"></label><label>N° de permis<input formControlName="numeroPermis"></label>
            <label>Expiration permis<input type="date" formControlName="dateExpirationPermis"></label>
          </div><div class="form-actions"><button class="button primary" [disabled]="form.invalid">Enregistrer les modifications</button></div>
        </form>
      </section>
      <section class="panel client-history">
        <div class="panel-heading"><div><h2>Historique des locations</h2><p class="muted">{{ locations().length }} location(s) récente(s)</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>VÉHICULE</th><th>PÉRIODE</th><th>RETOUR</th><th>MONTANT</th><th>STATUT</th></tr></thead><tbody>
          @for (location of locations(); track location.id) {
            <tr><td>{{ location.vehiculeId }}</td><td>{{ location.dateDebut | date:'dd/MM/yyyy' }} – {{ location.dateFinPrevue | date:'dd/MM/yyyy' }}</td><td>{{ location.dateRetourEffectif ? (location.dateRetourEffectif | date:'dd/MM/yyyy') : '—' }}</td><td>{{ location.montantTotal | currency:'EUR':'symbol':'1.2-2' }}</td><td><span class="status-pill" [class]="location.statut.toLowerCase()">{{ location.statut }}</span></td></tr>
          } @empty { <tr><td colspan="5" class="empty-cell">Aucune location enregistrée pour ce client.</td></tr> }
        </tbody></table></div>
      </section>
    }
  `
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ClientService);
  private readonly locationService = inject(LocationService);
  private readonly fb = inject(FormBuilder);
  readonly client = signal<Client | null>(null);
  readonly eligibility = signal<Eligibility | null>(null);
  readonly locations = signal<Location[]>([]);
  readonly form = this.fb.nonNullable.group({
    cin: ['', Validators.required], nom: ['', Validators.required], prenom: ['', Validators.required],
    dateNaissance: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required], adresse: ['', Validators.required],
    numeroPermis: ['', Validators.required], dateExpirationPermis: ['', Validators.required]
  });
  private readonly id = this.route.snapshot.paramMap.get('id')!;

  ngOnInit(): void {
    this.service.get(this.id).subscribe(client => {
      this.client.set(client);
      this.form.patchValue(client);
    });
    this.service.eligibility(this.id).subscribe(result => this.eligibility.set(result));
    this.locationService.list(0, '', '', '', this.id, 100)
      .subscribe(result => this.locations.set(result.content));
  }

  save(): void {
    if (this.form.invalid) return;
    const input: ClientInput = this.form.getRawValue();
    this.service.update(this.id, input).subscribe(client => {
      this.client.set(client);
      this.service.eligibility(this.id).subscribe(result => this.eligibility.set(result));
    });
  }
}
