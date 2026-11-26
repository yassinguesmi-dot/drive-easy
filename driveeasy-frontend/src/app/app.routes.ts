import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { VehiculesComponent } from './pages/vehicules.component';
import { VehiculeFormComponent } from './pages/vehicule-form.component';
import { ClientsComponent } from './pages/clients.component';
import { ClientDetailComponent } from './pages/client-detail.component';
import { LocationsComponent } from './pages/locations.component';
import { LocationWizardComponent } from './pages/location-wizard.component';
import { LocationReturnComponent } from './pages/location-return.component';
import { ClientPortalComponent } from './pages/client-portal.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'espace-client', component: ClientPortalComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'vehicules', component: VehiculesComponent },
  { path: 'vehicules/new', component: VehiculeFormComponent },
  { path: 'vehicules/:id/edit', component: VehiculeFormComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'clients/:id', component: ClientDetailComponent },
  { path: 'locations', component: LocationsComponent },
  { path: 'locations/new', component: LocationWizardComponent },
  { path: 'locations/:id/retour', component: LocationReturnComponent },
  { path: '**', redirectTo: 'dashboard' }
];
