import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocationService } from '../services/location.service';
import { VehiculeService } from '../services/vehicule.service';
import { LocationStatistics } from '../models/location';

const DEMO_DASHBOARD = {
  totalVehicles: 18,
  vehiclesByStatus: { DISPONIBLE: 11, LOUE: 5, MAINTENANCE: 2 },
  activeLocations: 5,
  chiffreAffaires: 4850,
  tauxOccupation: 0.72
};

@Component({
  standalone: true,
  imports: [CurrencyPipe, PercentPipe, RouterLink],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">{{ todayLabel }}</p><h1>Bonjour, bienvenue 👋</h1><p class="muted">Voici le résumé de votre agence aujourd'hui.</p></div>
      <a class="button primary" routerLink="/locations/new">＋ Nouvelle location</a>
    </section>
    @if (demoMode()) {
      <div class="dashboard-demo-banner" role="status">Mode démonstration : les données du service indisponible sont remplacées par des exemples.</div>
    }
    <section class="metric-grid">
      <article class="metric-card"><div class="metric-label">Véhicules disponibles <span class="metric-icon green">▣</span></div><strong>{{ vehicleCount('DISPONIBLE') ?? '—' }}</strong><small>{{ vehicleTotal() ?? '—' }} véhicules{{ vehicleFailed() ? ' · exemple' : ' au total' }}</small></article>
      <article class="metric-card"><div class="metric-label">Locations en cours <span class="metric-icon blue">↗</span></div><strong>{{ activeLocationCount() ?? '—' }}</strong><small>{{ locationsFailed() ? 'exemple de démonstration' : 'contrats actuellement actifs' }}</small></article>
      <article class="metric-card"><div class="metric-label">Chiffre d'affaires <span class="metric-icon violet">€</span></div><strong>{{ revenue() === null ? '—' : (revenue()! | currency:'EUR':'symbol':'1.0-0') }}</strong><small>{{ statisticsFailed() ? 'exemple de démonstration' : 'locations terminées ce mois' }}</small></article>
      <article class="metric-card"><div class="metric-label">Taux d'occupation <span class="metric-icon orange">◷</span></div><strong>{{ occupancy() === null ? '—' : (occupancy()! | percent:'1.0-0') }}</strong><small>{{ statisticsFailed() ? 'exemple de démonstration' : 'de la flotte totale' }}</small></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-heading"><div><h2>État de la flotte</h2><p class="muted">Répartition par disponibilité</p></div><a routerLink="/vehicules">Voir le parc →</a></div>
        <div class="fleet-row"><span><i class="legend green-bg"></i>Disponibles</span><strong>{{ vehicleCount('DISPONIBLE') ?? '—' }}</strong></div>
        <div class="bar"><span class="green-fill" [style.width.%]="ratio('DISPONIBLE')"></span></div>
        <div class="fleet-row"><span><i class="legend blue-bg"></i>En location</span><strong>{{ vehicleCount('LOUE') ?? '—' }}</strong></div>
        <div class="bar"><span class="blue-fill" [style.width.%]="ratio('LOUE')"></span></div>
        <div class="fleet-row"><span><i class="legend orange-bg"></i>Maintenance</span><strong>{{ vehicleCount('MAINTENANCE') ?? '—' }}</strong></div>
        <div class="bar"><span class="orange-fill" [style.width.%]="ratio('MAINTENANCE')"></span></div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><h2>Raccourcis</h2><p class="muted">Actions les plus utilisées</p></div></div>
        <a class="quick-link" routerLink="/vehicules/new"><span class="quick-icon">＋</span><span><b>Ajouter un véhicule</b><small>Enrichir votre catalogue</small></span><span class="arrow">→</span></a>
        <a class="quick-link" routerLink="/clients"><span class="quick-icon">♙</span><span><b>Consulter les clients</b><small>Profils et éligibilité</small></span><span class="arrow">→</span></a>
        <a class="quick-link" routerLink="/locations"><span class="quick-icon">↗</span><span><b>Suivre les locations</b><small>Réservations et retours</small></span><span class="arrow">→</span></a>
      </article>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private readonly vehicleService = inject(VehiculeService);
  private readonly locationService = inject(LocationService);
  readonly vehicles = this.vehicleService.vehicles;
  readonly stats = signal<LocationStatistics | null>(null);
  readonly vehicleLoaded = signal(false);
  readonly vehicleFailed = signal(false);
  readonly activeLocations = signal<number | null>(null);
  readonly locationsFailed = signal(false);
  readonly statisticsFailed = signal(false);
  readonly demoMode = signal(false);
  readonly todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase();

  ngOnInit(): void {
    this.vehicleService.list().subscribe({
      next: () => this.vehicleLoaded.set(true),
      error: () => {
        this.vehicleLoaded.set(true);
        this.vehicleFailed.set(true);
        this.demoMode.set(true);
      }
    });
    this.locationService.statistics().subscribe({
      next: result => this.stats.set(result),
      error: () => {
        this.statisticsFailed.set(true);
        this.demoMode.set(true);
      }
    });
    this.locationService.list(0, 'EN_COURS').subscribe({
      next: result => this.activeLocations.set(result.totalElements),
      error: () => {
        this.locationsFailed.set(true);
        this.demoMode.set(true);
      }
    });
  }

  vehicleTotal(): number | null {
    if (this.vehicleFailed()) return DEMO_DASHBOARD.totalVehicles;
    return this.vehicleLoaded() ? this.vehicles().length : null;
  }

  vehicleCount(status: keyof typeof DEMO_DASHBOARD.vehiclesByStatus): number | null {
    if (this.vehicleFailed()) {
      return DEMO_DASHBOARD.vehiclesByStatus[status];
    }
    return this.vehicleLoaded() ? this.count(status) : null;
  }

  activeLocationCount(): number | null {
    return this.locationsFailed() ? DEMO_DASHBOARD.activeLocations : this.activeLocations();
  }

  revenue(): number | null {
    return this.stats()?.chiffreAffaires ?? (this.statisticsFailed() ? DEMO_DASHBOARD.chiffreAffaires : null);
  }

  occupancy(): number | null {
    return this.stats()?.tauxOccupation ?? (this.statisticsFailed() ? DEMO_DASHBOARD.tauxOccupation : null);
  }

  count(status: string): number {
    return this.vehicles().filter(vehicle => vehicle.statut === status).length;
  }

  ratio(status: keyof typeof DEMO_DASHBOARD.vehiclesByStatus): number {
    const total = this.vehicleTotal();
    const count = this.vehicleCount(status);
    return total && count !== null ? count / total * 100 : 0;
  }
}
