import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Client, ClientInput } from '../models/client';
import { ClientService } from '../services/client.service';

@Component({
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">RELATION CLIENT</p><h1>Clients</h1><p class="muted">Identité, documents et fidélité de votre clientèle.</p></div><button class="button primary" (click)="toggleForm()">＋ Nouveau client</button></section>
    @if (showForm()) {
      <form class="panel form-panel compact-form" [formGroup]="form" (ngSubmit)="create()">
        <h2>Créer un profil client</h2>
        <div class="form-grid">
          <label>CIN<input formControlName="cin" required></label><label>Nom<input formControlName="nom" required></label>
          <label>Prénom<input formControlName="prenom" required></label><label>Date de naissance<input type="date" formControlName="dateNaissance" required></label>
          <label>Email<input type="email" formControlName="email" required></label><label>Téléphone<input formControlName="telephone" required></label>
          <label>Adresse<input formControlName="adresse" required></label><label>N° de permis<input formControlName="numeroPermis" required></label>
          <label>Expiration du permis<input type="date" formControlName="dateExpirationPermis" required></label>
        </div><div class="form-actions"><button type="button" class="button secondary" (click)="showForm.set(false)">Annuler</button><button class="button primary" [disabled]="form.invalid">Créer le profil</button></div>
      </form>
    }
    <section class="panel">
      <div class="panel-heading"><div><h2>Répertoire clients</h2><p class="muted">{{ clients().length }} profil(s) enregistré(s)</p></div><input class="search-input" placeholder="Rechercher nom, CIN, email…" [value]="query()" (input)="search($any($event.target).value)"></div>
      <div class="table-wrap"><table><thead><tr><th>CLIENT</th><th>CIN</th><th>EMAIL</th><th>PERMIS</th><th>FIDÉLITÉ</th><th></th></tr></thead><tbody>
        @for (client of visibleClients(); track client.id) {
          <tr><td><a class="table-person" [routerLink]="['/clients', client.id]"><span class="person-avatar">{{ initials(client) }}</span><span>{{ client.prenom }} {{ client.nom }}<small>Inscrit le {{ client.dateInscription | date:'dd/MM/yyyy' }}</small></span></a></td><td>{{ client.cin }}</td><td>{{ client.email }}</td><td><span [class.expired]="isExpired(client.dateExpirationPermis)">{{ isExpired(client.dateExpirationPermis) ? 'Expiré' : 'Valide' }}</span></td><td><span class="category-pill" [class]="client.categorieClient.toLowerCase()">{{ client.categorieClient }}</span></td><td><a class="text-link" [routerLink]="['/clients', client.id]">Détails →</a><button class="link-button" (click)="delete(client)">Supprimer</button></td></tr>
        } @empty { <tr><td colspan="6" class="empty-cell">Aucun client trouvé.</td></tr> }
      </tbody></table></div>
      <div class="pagination"><span>Page {{ pageNumber() + 1 }} / {{ totalPages() }}</span><div><button class="button secondary" (click)="movePage(-1)" [disabled]="pageNumber() === 0">← Précédent</button><button class="button secondary" (click)="movePage(1)" [disabled]="pageNumber() + 1 >= totalPages()">Suivant →</button></div></div>
    </section>
  `
})
export class ClientsComponent implements OnInit {
  private readonly service = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  readonly clients = signal<Client[]>([]);
  readonly showForm = signal(false);
  readonly query = signal('');
  readonly pageNumber = signal(0);
  readonly pageSize = 10;
  readonly form = this.fb.nonNullable.group({
    cin: ['', Validators.required], nom: ['', Validators.required], prenom: ['', Validators.required],
    dateNaissance: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required], adresse: ['', Validators.required],
    numeroPermis: ['', Validators.required], dateExpirationPermis: ['', Validators.required]
  });

  ngOnInit(): void { this.load(); }
  toggleForm(): void { this.showForm.update(value => !value); }
  search(value: string): void { this.query.set(value); this.pageNumber.set(0); this.load(value); }
  visibleClients(): Client[] {
    const start = this.pageNumber() * this.pageSize;
    return this.clients().slice(start, start + this.pageSize);
  }
  totalPages(): number { return Math.max(1, Math.ceil(this.clients().length / this.pageSize)); }
  movePage(offset: number): void {
    this.pageNumber.update(page => Math.min(this.totalPages() - 1, Math.max(0, page + offset)));
  }
  initials(client: Client): string { return `${client.prenom[0] ?? ''}${client.nom[0] ?? ''}`.toUpperCase(); }
  isExpired(date: string): boolean { return new Date(date) < new Date(new Date().toDateString()); }

  create(): void {
    if (this.form.invalid) return;
    const input: ClientInput = this.form.getRawValue();
    this.service.create(input).subscribe(() => {
      this.form.reset();
      this.showForm.set(false);
      this.pageNumber.set(0);
      this.load(this.query());
    });
  }

  delete(client: Client): void {
    if (!confirm(`Supprimer le profil de ${client.prenom} ${client.nom} ?`)) return;
    this.service.delete(client.id).subscribe(() => {
      this.pageNumber.set(0);
      this.load(this.query());
    });
  }

  private load(query = this.query()): void {
    this.service.list(query).subscribe(items => this.clients.set(items));
  }
}
