import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { VehiculeService } from '../services/vehicule.service';
import { VehiculeInput, VehiculeStatut } from '../models/vehicule';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">PARC AUTOMOBILE</p><h1>{{ vehicleId ? 'Modifier le véhicule' : 'Ajouter un véhicule' }}</h1><p class="muted">Renseignez les caractéristiques du véhicule.</p></div><a class="button secondary" routerLink="/vehicules">← Retour au parc</a></section>
    <form class="panel form-panel" [formGroup]="form" (ngSubmit)="save()">
      <div class="form-grid">
        <label>Immatriculation<input formControlName="immatriculation" required></label>
        <label>Marque<input formControlName="marque" required></label>
        <label>Modèle<input formControlName="modele" required></label>
        <label>Année<input type="number" formControlName="annee" required></label>
        <label>Couleur<input formControlName="couleur" required></label>
        <label>Carburant<select formControlName="carburant"><option>ESSENCE</option><option>DIESEL</option><option>HYBRIDE</option><option>ELECTRIQUE</option></select></label>
        <label>Boîte<select formControlName="boite"><option>MANUELLE</option><option>AUTOMATIQUE</option></select></label>
        <label>Catégorie<select formControlName="categorie"><option>ECONOMIQUE</option><option>COMPACTE</option><option>BERLINE</option><option>SUV</option><option>UTILITAIRE</option></select></label>
        <label>Nombre de places<input type="number" min="1" formControlName="nbPlaces"></label>
        <label>Kilométrage<input type="number" min="0" formControlName="kilometrage"></label>
        <label>Tarif journalier (€)<input type="number" min="0.01" step="0.01" formControlName="prixJournalier"></label>
        <label>URL de l'image<input formControlName="imageUrl"></label>
        @if (vehicleId) {
          <label>Statut<select formControlName="statut"><option value="DISPONIBLE">DISPONIBLE</option><option value="LOUE">LOUE</option><option value="MAINTENANCE">MAINTENANCE</option></select></label>
        }
      </div>
      @if (saved()) { <p class="success-note">Véhicule enregistré.</p> }
      <div class="form-actions"><a class="button secondary" routerLink="/vehicules">Annuler</a><button class="button primary" [disabled]="form.invalid">{{ vehicleId ? 'Enregistrer' : 'Créer le véhicule' }}</button></div>
    </form>
  `
})
export class VehiculeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(VehiculeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly form = this.fb.nonNullable.group({
    immatriculation: ['', Validators.required], marque: ['', Validators.required], modele: ['', Validators.required],
    annee: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]], couleur: ['', Validators.required],
    carburant: ['ESSENCE', Validators.required], boite: ['MANUELLE', Validators.required], categorie: ['ECONOMIQUE', Validators.required],
    nbPlaces: [5, [Validators.required, Validators.min(1)]], kilometrage: [0, [Validators.required, Validators.min(0)]],
    prixJournalier: [100, [Validators.required, Validators.min(0.01)]], imageUrl: [''],
    statut: this.fb.nonNullable.control<VehiculeStatut>('DISPONIBLE')
  });
  readonly saved = signal(false);
  vehicleId: string | null = null;

  ngOnInit(): void {
    this.vehicleId = this.route.snapshot.paramMap.get('id');
    if (this.vehicleId) this.service.get(this.vehicleId).subscribe(vehicle => this.form.patchValue(vehicle));
  }

  save(): void {
    if (this.form.invalid) return;
    const { statut, ...input } = this.form.getRawValue();
    const request = this.vehicleId
      ? this.service.update(this.vehicleId, input).pipe(
          switchMap(vehicle => vehicle.statut === statut
            ? of(vehicle)
            : this.service.setStatus(this.vehicleId!, statut))
        )
      : this.service.create(input);
    request.subscribe(() => {
      this.saved.set(true);
      setTimeout(() => this.router.navigateByUrl('/vehicules'), 600);
    });
  }
}
