import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VehiculeService } from '../services/vehicule.service';
import { Vehicule } from '../models/vehicule';

@Component({
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">PARC AUTOMOBILE</p><h1>Nos véhicules</h1><p class="muted">Gérez le catalogue et la disponibilité de votre flotte.</p></div><a class="button primary" routerLink="/vehicules/new">＋ Ajouter un véhicule</a></section>
    <section class="panel filter-panel">
      <label>Catégorie<select [(ngModel)]="category"><option value="">Toutes</option><option>ECONOMIQUE</option><option>COMPACTE</option><option>BERLINE</option><option>SUV</option><option>UTILITAIRE</option></select></label>
      <label>Carburant<select [(ngModel)]="fuel"><option value="">Tous</option><option>ESSENCE</option><option>DIESEL</option><option>HYBRIDE</option><option>ELECTRIQUE</option></select></label>
      <label>Statut<select [(ngModel)]="status"><option value="">Tous</option><option>DISPONIBLE</option><option>LOUE</option><option>MAINTENANCE</option></select></label>
      <label>Prix max. / jour<input type="number" min="0" [(ngModel)]="maxPrice" placeholder="Sans limite"></label>
      <label>Trier<select [(ngModel)]="sortMode"><option value="default">Recommandés</option><option value="price">Prix croissant</option><option value="year">Année récente</option></select></label>
      <button class="button secondary" (click)="search()">Filtrer</button>
    </section>
    <div class="result-caption">{{ vehicles().length }} véhicule(s)</div>
    <section class="vehicle-grid">
      @for (vehicle of visibleVehicles(); track vehicle.id) {
        <article class="vehicle-card">
          <div class="vehicle-image" [style.background-image]="'url(' + (vehicle.imageUrl || fallbackImage) + ')'"><span class="status-pill" [class]="vehicle.statut.toLowerCase()">{{ vehicle.statut }}</span></div>
          <div class="vehicle-body"><div class="vehicle-category">{{ vehicle.categorie }} · {{ vehicle.carburant }}</div><h2>{{ vehicle.marque }} {{ vehicle.modele }}</h2><p class="muted">{{ vehicle.annee }} · {{ vehicle.nbPlaces }} places · {{ vehicle.boite }}</p>
            <div class="vehicle-footer"><strong>{{ vehicle.prixJournalier | currency:'EUR':'symbol':'1.0-0' }} <small>/ jour</small></strong><span><a class="text-link" [routerLink]="['/vehicules', vehicle.id, 'edit']">Modifier →</a><button class="link-button" [disabled]="vehicle.statut === 'LOUE'" (click)="delete(vehicle)">Supprimer</button></span></div>
          </div>
        </article>
      } @empty { <div class="empty-state">Aucun véhicule ne correspond à ces filtres.</div> }
    </section>
    <div class="pagination"><span>Page {{ pageNumber() + 1 }} / {{ totalPages() }}</span><div><button class="button secondary" (click)="movePage(-1)" [disabled]="pageNumber() === 0">← Précédent</button><button class="button secondary" (click)="movePage(1)" [disabled]="pageNumber() + 1 >= totalPages()">Suivant →</button></div></div>
  `
})
export class VehiculesComponent implements OnInit {
  private readonly service = inject(VehiculeService);
  readonly vehicles = signal<Vehicule[]>([]);
  readonly fallbackImage = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7';
  readonly pageNumber = signal(0);
  readonly pageSize = 9;
  category = '';
  fuel = '';
  status = '';
  maxPrice: number | null = null;
  sortMode = 'default';

  ngOnInit(): void { this.search(); }

  search(): void {
    this.pageNumber.set(0);
    this.service.list({ categorie: this.category, carburant: this.fuel, statut: this.status, prixMax: this.maxPrice ?? undefined })
      .subscribe(items => this.vehicles.set(items));
  }

  visibleVehicles(): Vehicule[] {
    const items = [...this.vehicles()];
    if (this.sortMode === 'price') items.sort((a, b) => a.prixJournalier - b.prixJournalier);
    if (this.sortMode === 'year') items.sort((a, b) => b.annee - a.annee);
    const start = this.pageNumber() * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.vehicles().length / this.pageSize)); }

  movePage(offset: number): void {
    this.pageNumber.update(page => Math.min(this.totalPages() - 1, Math.max(0, page + offset)));
  }

  delete(vehicle: Vehicule): void {
    if (!confirm(`Supprimer le véhicule ${vehicle.marque} ${vehicle.modele} ?`)) return;
    this.service.delete(vehicle.id).subscribe(() => this.search());
  }
}
