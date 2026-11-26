import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '../models/client';
import { Vehicule } from '../models/vehicule';
import { ClientService } from '../services/client.service';
import { VehiculeService } from '../services/vehicule.service';
import { ClientsComponent } from './clients.component';
import { VehiculesComponent } from './vehicules.component';

afterEach(() => vi.unstubAllGlobals());

describe('CRUD delete actions', () => {
  it('deletes a vehicle after confirmation and refreshes the catalogue', () => {
    const service = {
      list: vi.fn(() => of([])),
      delete: vi.fn(() => of(undefined))
    };
    const injector = Injector.create({
      providers: [{ provide: VehiculeService, useValue: service }]
    });
    const component = runInInjectionContext(injector, () => new VehiculesComponent());
    const vehicle: Vehicule = {
      id: 'vehicle-1', immatriculation: 'AA-123-BB', marque: 'Toyota', modele: 'Yaris',
      annee: 2024, couleur: 'Bleu', carburant: 'ESSENCE', boite: 'MANUELLE',
      nbPlaces: 5, kilometrage: 1000, prixJournalier: 80, statut: 'DISPONIBLE',
      categorie: 'ECONOMIQUE'
    };
    vi.stubGlobal('confirm', vi.fn(() => true));

    component.delete(vehicle);

    expect(service.delete).toHaveBeenCalledWith(vehicle.id);
    expect(service.list).toHaveBeenCalledOnce();
  });

  it('does not delete a vehicle when confirmation is declined', () => {
    const service = {
      list: vi.fn(() => of([])),
      delete: vi.fn(() => of(undefined))
    };
    const injector = Injector.create({
      providers: [{ provide: VehiculeService, useValue: service }]
    });
    const component = runInInjectionContext(injector, () => new VehiculesComponent());
    vi.stubGlobal('confirm', vi.fn(() => false));

    component.delete({
      id: 'vehicle-1', immatriculation: 'AA-123-BB', marque: 'Toyota', modele: 'Yaris',
      annee: 2024, couleur: 'Bleu', carburant: 'ESSENCE', boite: 'MANUELLE',
      nbPlaces: 5, kilometrage: 1000, prixJournalier: 80, statut: 'DISPONIBLE',
      categorie: 'ECONOMIQUE'
    });

    expect(service.delete).not.toHaveBeenCalled();
    expect(service.list).not.toHaveBeenCalled();
  });

  it('deletes a client after confirmation and refreshes the directory', () => {
    const service = {
      list: vi.fn(() => of([])),
      delete: vi.fn(() => of(undefined))
    };
    const injector = Injector.create({
      providers: [
        { provide: ClientService, useValue: service },
        { provide: FormBuilder, useValue: new FormBuilder() }
      ]
    });
    const component = runInInjectionContext(injector, () => new ClientsComponent());
    component.pageNumber.set(2);
    const client: Client = {
      id: 'client-1', cin: '12345678', nom: 'Doe', prenom: 'Jane',
      dateNaissance: '1990-01-01', email: 'jane@example.test', telephone: '12345678',
      adresse: '1 rue du test', numeroPermis: 'PERMIS-1', dateExpirationPermis: '2030-01-01',
      categorieClient: 'STANDARD', dateInscription: '2025-01-01', locationsTerminees: 0
    };
    vi.stubGlobal('confirm', vi.fn(() => true));

    component.delete(client);

    expect(service.delete).toHaveBeenCalledWith(client.id);
    expect(service.list).toHaveBeenCalledOnce();
    expect(component.pageNumber()).toBe(0);
  });
});
