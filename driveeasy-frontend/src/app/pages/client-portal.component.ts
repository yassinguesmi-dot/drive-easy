import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Client, ClientInput } from '../models/client';
import { Location, LocationSimulation } from '../models/location';
import { Vehicule } from '../models/vehicule';
import { ClientService } from '../services/client.service';
import { LocationService } from '../services/location.service';
import { VehiculeService } from '../services/vehicule.service';

const DEMO_VEHICLES: Vehicule[] = [
  {
    id: 'vehicule-demo-1', immatriculation: '123 TUN 4567', marque: 'Toyota', modele: 'Yaris',
    annee: 2022, couleur: 'Blanc', carburant: 'ESSENCE', boite: 'AUTOMATIQUE', nbPlaces: 5,
    kilometrage: 24500, prixJournalier: 140, statut: 'DISPONIBLE', categorie: 'ECONOMIQUE',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'
  },
  {
    id: 'vehicule-demo-2', immatriculation: '234 TUN 5678', marque: 'Hyundai', modele: 'Tucson',
    annee: 2023, couleur: 'Gris', carburant: 'DIESEL', boite: 'AUTOMATIQUE', nbPlaces: 5,
    kilometrage: 12000, prixJournalier: 220, statut: 'DISPONIBLE', categorie: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b'
  },
  {
    id: 'vehicule-demo-3', immatriculation: '345 TUN 6789', marque: 'Renault', modele: 'Clio',
    annee: 2024, couleur: 'Rouge', carburant: 'ESSENCE', boite: 'MANUELLE', nbPlaces: 5,
    kilometrage: 8000, prixJournalier: 115, statut: 'DISPONIBLE', categorie: 'ECONOMIQUE',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=960&q=80'
  },
  {
    id: 'vehicule-demo-4', immatriculation: '456 TUN 7890', marque: 'Kia', modele: 'Sportage',
    annee: 2024, couleur: 'Noir', carburant: 'HYBRIDE', boite: 'AUTOMATIQUE', nbPlaces: 5,
    kilometrage: 9500, prixJournalier: 195, statut: 'DISPONIBLE', categorie: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=960&q=80'
  }
];

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PercentPipe, ReactiveFormsModule, RouterLink],
  template: `
    <div class="customer-portal">
      <header class="customer-nav">
        <a class="portal-brand" routerLink="/espace-client"><span class="portal-brand-mark">R</span>rent<span>car</span></a>
        <nav aria-label="Navigation principale">
          <a href="#flotte">Notre flotte</a>
          <a href="#services">Services</a>
          <a href="#a-propos">À propos</a>
        </nav>
        <a class="customer-nav-cta" href="#reserver">Réserver <span>↗</span></a>
      </header>

      <main>
        <section class="portal-hero">
          <div class="hero-orb hero-orb-one"></div><div class="hero-orb hero-orb-two"></div>
          <div class="hero-copy">
            <div class="hero-kicker"><span class="hero-kicker-dot"></span> LA ROUTE VOUS APPARTIENT</div>
            <h1>Le plaisir de<br>partir <span>quand vous voulez.</span></h1>
            <p>La bonne voiture, au bon moment. Découvrez une nouvelle façon de louer, pensée autour de vous.</p>
            <a class="hero-link" href="#reserver">Trouver ma voiture <span>↓</span></a>
            <div class="hero-trust"><div class="trust-avatars"><i>Y</i><i>A</i><i>M</i><i>+</i></div><span>Votre prochaine belle histoire commence ici.</span></div>
          </div>
          <div class="hero-visual">
            <div class="hero-image-glow"></div>
            <img class="hero-car-image" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&amp;fit=crop&amp;w=1200&amp;q=85" alt="Voiture élégante prête à partir">
            <div class="floating-note note-top"><span class="note-icon">✳</span><span><b>À votre rythme</b><small>La liberté, sans détour</small></span></div>
            <div class="floating-note note-bottom"><span class="note-star">★ ★ ★ ★ ★</span><b>Votre voyage mérite mieux.</b></div>
            <div class="hero-image-index">01 <span>/</span> 03</div>
          </div>
          <a class="hero-scroll" href="#experience"><span></span> FAITES DÉFILER</a>
        </section>

        <section class="booking-section" id="reserver">
          <div class="booking-heading" data-scroll-reveal>
            <div><div class="section-kicker">VOTRE PROCHAINE ÉCHAPPÉE</div><h2>On vous emmène où ?</h2></div>
            <div class="booking-assurance"><span>✓</span> Réservation simple & sans surprise</div>
          </div>

          @if (errorMessage()) {
            <div class="portal-error" role="alert" data-scroll-reveal><span>↗</span><div><b>Un petit contretemps</b><p>{{ errorMessage() }}</p></div><button type="button" aria-label="Fermer" (click)="errorMessage.set('')">×</button></div>
          }

          @if (!booking()) {
            <div class="booking-card" data-scroll-reveal>
              <div class="booking-steps" aria-label="Étapes de réservation">
                <div class="booking-step" [class.active]="step() === 1" [class.done]="step() > 1"><span>{{ step() > 1 ? '✓' : '01' }}</span><div><b>Votre escapade</b><small>Choisissez vos dates</small></div></div>
                <i class="step-connector" [class.complete]="step() > 1"></i>
                <div class="booking-step" [class.active]="step() === 2" [class.done]="step() > 2"><span>{{ step() > 2 ? '✓' : '02' }}</span><div><b>À votre nom</b><small>Vos coordonnées</small></div></div>
                <i class="step-connector" [class.complete]="step() > 2"></i>
                <div class="booking-step" [class.active]="step() === 3"><span>03</span><div><b>Et c'est parti</b><small>Votre confirmation</small></div></div>
              </div>

              @if (step() === 1) {
                <div class="step-content" animate.enter="booking-enter">
                  <div class="date-fields">
                    <label class="date-field"><span class="date-icon">↗</span><span class="field-caption">DÉPART</span><input aria-label="Date de départ" type="date" [min]="today" [value]="dateDebut()" (change)="setStartDate($any($event.target).value)"></label>
                    <span class="date-divider">→</span>
                    <label class="date-field"><span class="date-icon">↙</span><span class="field-caption">RETOUR</span><input aria-label="Date de retour" type="date" [min]="dateDebut()" [value]="dateFin()" (change)="dateFin.set($any($event.target).value)"></label>
                    <button class="find-car-button" type="button" (click)="searchCars()" [disabled]="searching()">{{ searching() ? 'Recherche…' : 'Trouver ma voiture' }}<span>↗</span></button>
                  </div>

                  @if (searched()) {
                    <div class="car-results-heading" data-scroll-reveal><div><h3>Une sélection qui vous ressemble.</h3><p>{{ vehicles().length }} voiture(s) disponible(s) pour vos dates</p></div><span class="result-live"><i></i> DISPONIBILITÉ EN TEMPS RÉEL</span></div>
                    <div class="customer-car-grid">
                      @for (vehicle of vehicles(); track vehicle.id; let i = $index) {
                        <article class="customer-car-card" data-scroll-reveal [class.chosen]="selectedVehicle()?.id === vehicle.id" [style.transition-delay.ms]="i * 90">
                          <button class="car-select-overlay" type="button" [attr.aria-label]="'Choisir ' + vehicle.marque + ' ' + vehicle.modele" (click)="selectVehicle(vehicle)"></button>
                          <div class="customer-car-image" [style.background-image]="'url(' + (vehicle.imageUrl || fallbackImage) + ')'">
                            <span class="car-category-tag">{{ vehicle.categorie }}</span>
                            <span class="car-select-mark">{{ selectedVehicle()?.id === vehicle.id ? '✓' : '＋' }}</span>
                          </div>
                          <div class="customer-car-info">
                            <div class="customer-car-meta">{{ vehicle.carburant }} <span>·</span> {{ vehicle.boite }} <span>·</span> {{ vehicle.nbPlaces }} places</div>
                            <h4>{{ vehicle.marque }} <span>{{ vehicle.modele }}</span></h4>
                            <div class="customer-car-bottom"><span><strong>{{ vehicle.prixJournalier | currency:'EUR':'symbol':'1.0-0' }}</strong><small> / jour</small></span><button type="button" class="car-choice-link" (click)="selectVehicle(vehicle)">{{ selectedVehicle()?.id === vehicle.id ? 'Choisie ✓' : 'Choisir →' }}</button></div>
                          </div>
                        </article>
                      } @empty {
                        <div class="no-cars"><span>⌁</span><h4>Pas encore de voiture pour ces dates.</h4><p>Modifiez votre période et nous chercherons à nouveau.</p></div>
                      }
                    </div>
                    @if (selectedVehicle()) {
                      <div class="selection-bar"><span>Votre choix : <b>{{ selectedVehicle()!.marque }} {{ selectedVehicle()!.modele }}</b></span><button type="button" class="continue-button" (click)="step.set(2)">Continuer <span>→</span></button></div>
                    }
                  }
                </div>
              }

              @if (step() === 2) {
                <div class="step-content booking-enter">
                  <div class="details-heading" data-scroll-reveal><div><span class="section-kicker">UN PLAISIR, ÇA SE PARTAGE</span><h3>Faisons connaissance.</h3><p>Quelques informations pour préparer votre réservation.</p></div><div class="selected-car-mini"><img [src]="selectedVehicle()?.imageUrl || fallbackImage" alt=""><span>{{ selectedVehicle()?.marque }} {{ selectedVehicle()?.modele }}<small>{{ dateDebut() | date:'dd MMM' }} — {{ dateFin() | date:'dd MMM' }}</small></span></div></div>
                  <form class="customer-details-form" [formGroup]="form" (ngSubmit)="prepareQuote()">
                    <label>Prénom<input formControlName="prenom" autocomplete="given-name" placeholder="Amira" required></label>
                    <label>Nom<input formControlName="nom" autocomplete="family-name" placeholder="Ben Ali" required></label>
                    <label>Adresse e-mail<input type="email" formControlName="email" autocomplete="email" placeholder="vous@exemple.com" required></label>
                    <label>Téléphone<input type="tel" formControlName="telephone" autocomplete="tel" placeholder="+216 20 000 000" required></label>
                    <label>CIN<input formControlName="cin" placeholder="Votre numéro de CIN" required></label>
                    <label>Date de naissance<input type="date" formControlName="dateNaissance" required></label>
                    <label>Numéro de permis<input formControlName="numeroPermis" placeholder="Numéro de votre permis" required></label>
                    <label>Permis valable jusqu'au<input type="date" formControlName="dateExpirationPermis" required></label>
                    <label class="full-field">Adresse de résidence<input formControlName="adresse" autocomplete="street-address" placeholder="Rue, ville, code postal" required></label>
                    <label class="privacy-check full-field"><input type="checkbox" [checked]="acceptedTerms()" (change)="acceptedTerms.set($any($event.target).checked)"><span>J'accepte que mes informations soient utilisées pour créer mon dossier de location. Un agent RentCar pourra me contacter au sujet de cette réservation.</span></label>
                    <div class="form-footer full-field"><button class="back-button" type="button" (click)="step.set(1)">← Retour au véhicule</button><button class="find-car-button" type="submit" [disabled]="form.invalid || !acceptedTerms() || preparing()">{{ preparing() ? 'Préparation…' : 'Voir mon estimation'}<span>→</span></button></div>
                  </form>
                  <p class="form-reassurance"><span>⌑</span> Pas de paiement maintenant. L'équipe confirme votre réservation.</p>
                </div>
              }

              @if (step() === 3) {
                <div class="step-content booking-enter">
                  @if (simulation(); as quote) {
                    <div class="quote-layout" data-scroll-reveal>
                      <div class="quote-copy"><span class="section-kicker">PRESQUE SUR LA ROUTE</span><h3>Voilà ce qui vous attend.</h3><p>Votre escapade, préparée avec soin et sans mauvaises surprises.</p>
                        <div class="quote-vehicle-card"><img [src]="selectedVehicle()?.imageUrl || fallbackImage" alt=""><div><span>{{ selectedVehicle()?.categorie }}</span><b>{{ selectedVehicle()?.marque }} {{ selectedVehicle()?.modele }}</b><small>{{ selectedVehicle()?.immatriculation }}</small></div></div>
                      </div>
                      <div class="quote-price-card">
                        <div class="quote-price-top"><span>VOTRE ESTIMATION</span><span class="price-spark">✳</span></div>
                        <div class="quote-total-price">{{ quote.montantEstime | currency:'EUR':'symbol':'1.2-2' }}</div>
                        <div class="quote-includes"><span>{{ quote.nombreJours }} jours de location</span><b>{{ quote.prixJournalier | currency:'EUR':'symbol':'1.2-2' }} / jour</b></div>
                        @if (quote.remise > 0) { <div class="quote-includes loyalty"><span>Avantage {{ quote.categorieClient }}</span><b>−{{ quote.remise | percent }}</b></div> }
                        <div class="quote-note">Le prix définitif sera confirmé avec notre équipe. Aucun paiement ne vous sera demandé en ligne.</div>
                        <button class="confirm-booking-button" type="button" (click)="confirmBooking()" [disabled]="confirming()">{{ confirming() ? 'Confirmation en cours…' : 'Confirmer ma demande'}<span>↗</span></button>
                        <button class="edit-booking-button" type="button" (click)="step.set(2)">Modifier mes informations</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <section class="reservation-success" data-scroll-reveal aria-live="polite">
              <div class="success-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <span class="success-medallion">✓</span><span class="section-kicker">UNE NOUVELLE HISTOIRE COMMENCE</span>
              <h2>C'est dans la boîte, {{ registeredClient()?.prenom }}.</h2>
              <p>Votre demande est bien enregistrée. Notre équipe RentCar vous contactera pour confirmer les derniers détails.</p>
              <div class="success-reference"><span>RÉFÉRENCE DE RÉSERVATION</span><b>#{{ booking()!.id.slice(0, 8).toUpperCase() }}</b></div>
              <div class="success-summary"><div><span>Votre voiture</span><b>{{ selectedVehicle()?.marque }} {{ selectedVehicle()?.modele }}</b></div><div><span>Vos dates</span><b>{{ dateDebut() | date:'dd MMM yyyy' }} — {{ dateFin() | date:'dd MMM yyyy' }}</b></div><div><span>Estimation</span><b>{{ booking()!.montantTotal | currency:'EUR':'symbol':'1.2-2' }}</b></div></div>
              <a class="confirm-booking-button success-link" routerLink="/espace-client">Revenir à l'accueil <span>→</span></a>
            </section>
          }
        </section>

        <section class="experience-section" id="experience">
          <div class="experience-intro" data-scroll-reveal><span class="section-kicker">L'ESPRIT DRIVE EASY</span><h2>Partir devrait<br>être <span>la partie facile.</span></h2></div>
          <div class="experience-cards">
            <article class="experience-card" data-scroll-reveal><span class="experience-number">01</span><div class="experience-icon">⌁</div><h3>Choisissez librement.</h3><p>Une sélection pensée pour vos envies et votre itinéraire.</p><span class="experience-card-arrow">↗</span></article>
            <article class="experience-card" data-scroll-reveal><span class="experience-number">02</span><div class="experience-icon">✳</div><h3>Tout est transparent.</h3><p>Un prix estimé dès le départ. Aucun frais caché, jamais.</p><span class="experience-card-arrow">↗</span></article>
            <article class="experience-card" data-scroll-reveal><span class="experience-number">03</span><div class="experience-icon">♡</div><h3>On reste à vos côtés.</h3><p>Une équipe qui vous accompagne, avant et pendant le voyage.</p><span class="experience-card-arrow">↗</span></article>
          </div>
        </section>

        <section class="services-section" id="services">
          <div class="services-heading" data-scroll-reveal>
            <div><span class="section-kicker">NOS SERVICES</span><h2>Tout est pensé pour votre trajet.</h2><p>De la recherche de votre voiture à la confirmation de votre demande, nous rendons chaque étape plus simple.</p></div>
            <a class="services-booking-link" href="#reserver">Commencer une réservation <span>↗</span></a>
          </div>
          <div class="services-grid">
            <article class="service-card" data-scroll-reveal><span class="service-icon">↗</span><span class="service-number">01</span><h3>Réservation en ligne</h3><p>Choisissez vos dates, parcourez les véhicules disponibles et envoyez votre demande en quelques étapes.</p><a href="#reserver">Réserver une voiture <span>→</span></a></article>
            <article class="service-card" data-scroll-reveal><span class="service-icon">▣</span><span class="service-number">02</span><h3>Une flotte pour vos envies</h3><p>Comparez les modèles selon leur catégorie, leur équipement et leur tarif journalier.</p><a href="#flotte">Découvrir la flotte <span>→</span></a></article>
            <article class="service-card" data-scroll-reveal><span class="service-icon">€</span><span class="service-number">03</span><h3>Une estimation claire</h3><p>Consultez une estimation avant de confirmer votre demande, sans paiement en ligne immédiat.</p><a href="#reserver">Estimer mon séjour <span>→</span></a></article>
            <article class="service-card" data-scroll-reveal><span class="service-icon">♡</span><span class="service-number">04</span><h3>Un suivi par notre équipe</h3><p>Après l'envoi de votre demande, notre équipe vous contacte pour confirmer les derniers détails.</p><a href="#a-propos">En savoir plus <span>→</span></a></article>
          </div>
        </section>

        <section class="fleet-section" id="flotte">
          <div class="fleet-heading" data-scroll-reveal>
            <div><span class="section-kicker">DES CLÉS POUR CHAQUE ENVIE</span><h2>Choisissez votre voiture.</h2></div>
            <a href="#reserver">Voir les disponibilités <span>↗</span></a>
          </div>
          <p class="fleet-intro">Choisissez un modèle parmi nos exemples, puis indiquez vos dates. Nous vérifierons sa disponibilité avant la réservation.</p>
          @if (showcaseIsDemo()) {
            <div class="fleet-demo-note" role="status">Voitures d'exemple : démarrez les services pour vérifier les disponibilités en direct.</div>
          }
          <div class="fleet-toolbar" data-scroll-reveal>
            <span class="fleet-count"><b>{{ filteredShowcaseVehicles().length }}</b> modèle(s) affiché(s)</span>
            <div class="fleet-filters" role="group" aria-label="Filtrer les voitures par catégorie">
              @for (filter of fleetFilters(); track filter.value) {
                <button type="button" [class.active]="selectedFleetCategory() === filter.value"
                  [attr.aria-pressed]="selectedFleetCategory() === filter.value"
                  (click)="selectFleetCategory(filter.value)">
                  {{ filter.label }} <span>{{ filter.count }}</span>
                </button>
              }
            </div>
          </div>
          <div class="fleet-showcase">
            @for (vehicle of filteredShowcaseVehicles(); track vehicle.id; let i = $index) {
              <article class="fleet-showcase-card" data-scroll-reveal [style.transition-delay.ms]="i * 80">
                <div class="fleet-showcase-image" [style.background-image]="'url(' + (vehicle.imageUrl || fallbackImage) + ')'">
                  <span class="fleet-showcase-category">{{ vehicle.categorie }}</span>
                  @if (showcaseIsDemo()) { <span class="fleet-showcase-example">EXEMPLE</span> }
                </div>
                <div class="fleet-showcase-content">
                  <div class="fleet-showcase-meta">{{ vehicle.annee }} · {{ vehicle.carburant }} · {{ vehicle.nbPlaces }} places</div>
                  <h3>{{ vehicle.marque }} <span>{{ vehicle.modele }}</span></h3>
                  <div class="fleet-showcase-footer">
                    <span class="fleet-showcase-price">{{ vehicle.prixJournalier | currency:'EUR':'symbol':'1.0-0' }} <small>/ jour</small></span>
                    <button class="fleet-select-button" type="button" [attr.aria-label]="'Choisir ' + vehicle.marque + ' ' + vehicle.modele" (click)="selectShowcase(vehicle)">Choisir cette voiture <span>↗</span></button>
                  </div>
                </div>
              </article>
            } @empty { <p class="fleet-empty" data-scroll-reveal>Aucun modèle dans cette catégorie pour le moment.</p> }
          </div>
        </section>

        <section class="about-section" id="a-propos">
          <div class="about-copy" data-scroll-reveal>
            <span class="section-kicker">À PROPOS DE DRIVE EASY</span>
            <h2>La liberté de partir, avec l'esprit tranquille.</h2>
            <p>RentCar vous accompagne dans la location de votre voiture avec un parcours simple : vous choisissez votre véhicule et vos dates, vous recevez une estimation, puis notre équipe prend le relais pour confirmer votre demande.</p>
            <p>Notre priorité : vous donner les informations essentielles dès le départ et rester disponibles à chaque étape de votre réservation.</p>
            <a class="about-booking-link" href="#reserver">Préparer mon prochain trajet <span>↗</span></a>
          </div>
          <div class="about-values">
            <article data-scroll-reveal><span>01</span><div><h3>La clarté avant tout</h3><p>Les informations utiles et l'estimation sont présentées avant l'envoi de votre demande.</p></div></article>
            <article data-scroll-reveal><span>02</span><div><h3>Le choix en toute liberté</h3><p>Parcourez la flotte et sélectionnez les dates qui correspondent à votre projet.</p></div></article>
            <article data-scroll-reveal><span>03</span><div><h3>Un échange humain</h3><p>Une demande en ligne ne remplace pas notre équipe : elle vous accompagne pour la confirmer.</p></div></article>
          </div>
        </section>
      </main>

      <footer class="customer-footer"><a class="portal-brand" routerLink="/espace-client"><span class="portal-brand-mark">R</span>rent<span>car</span></a><span>Moins de contraintes. Plus de route. © RentCar 2026</span><a class="customer-dashboard-button" routerLink="/dashboard">Aller au tableau de bord <span>↗</span></a></footer>
    </div>
  `
})
export class ClientPortalComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly clientService = inject(ClientService);
  private readonly vehicleService = inject(VehiculeService);
  private readonly locationService = inject(LocationService);

  readonly step = signal(1);
  readonly vehicles = signal<Vehicule[]>([]);
  readonly showcaseVehicles = signal<Vehicule[]>([]);
  readonly selectedFleetCategory = signal('TOUTES');
  readonly fleetFilters = computed(() => {
    const vehicles = this.showcaseVehicles();
    const categories = [...new Set(vehicles.map(vehicle => vehicle.categorie))].sort();
    return [
      { value: 'TOUTES', label: 'Toute la flotte', count: vehicles.length },
      ...categories.map(category => ({
        value: category,
        label: category === 'ECONOMIQUE' ? 'Économiques' : category,
        count: vehicles.filter(vehicle => vehicle.categorie === category).length
      }))
    ];
  });
  readonly filteredShowcaseVehicles = computed(() => {
    const category = this.selectedFleetCategory();
    const vehicles = this.showcaseVehicles();
    return category === 'TOUTES' ? vehicles : vehicles.filter(vehicle => vehicle.categorie === category);
  });
  readonly selectedVehicle = signal<Vehicule | null>(null);
  readonly registeredClient = signal<Client | null>(null);
  readonly simulation = signal<LocationSimulation | null>(null);
  readonly booking = signal<Location | null>(null);
  readonly searched = signal(false);
  readonly searching = signal(false);
  readonly preparing = signal(false);
  readonly confirming = signal(false);
  readonly acceptedTerms = signal(false);
  readonly errorMessage = signal('');
  readonly showcaseIsDemo = signal(false);
  readonly today = this.toLocalDate(new Date());
  readonly dateDebut = signal(this.today);
  readonly dateFin = signal(this.toLocalDate(new Date(Date.now() + 2 * 86400000)));
  readonly fallbackImage = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=960&q=80';
  readonly form = this.fb.nonNullable.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    cin: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required],
    adresse: ['', Validators.required],
    numeroPermis: ['', Validators.required],
    dateExpirationPermis: ['', Validators.required]
  });
  private pendingShowcaseId: string | null = null;
  private revealObserver?: IntersectionObserver;
  private revealMutations?: MutationObserver;

  ngOnInit(): void {
    this.vehicleService.list({ statut: 'DISPONIBLE' }).subscribe({
      next: items => {
        this.showcaseVehicles.set(items.slice().sort((first, second) => first.prixJournalier - second.prixJournalier).slice(0, 4));
      },
      error: () => {
        this.showcaseIsDemo.set(true);
        this.showcaseVehicles.set(DEMO_VEHICLES);
        this.errorMessage.set('Des voitures d’exemple sont affichées. Démarrez les services pour vérifier les disponibilités et réserver.');
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined'
      || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      return;
    }

    const root = this.host.nativeElement.querySelector<HTMLElement>('.customer-portal');
    if (!root) return;
    this.revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else {
          entry.target.classList.remove('is-revealed');
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

    const observeTargets = (node: Node): void => {
      if (!(node instanceof HTMLElement)) return;
      if (node.matches('[data-scroll-reveal]')) this.revealObserver?.observe(node);
      node.querySelectorAll<HTMLElement>('[data-scroll-reveal]')
        .forEach(target => this.revealObserver?.observe(target));
    };

    this.revealMutations = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(observeTargets);
      }
    });
    this.revealMutations.observe(root, { childList: true, subtree: true });
    observeTargets(root);
    root.classList.add('scroll-reveal-enabled');
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.revealMutations?.disconnect();
  }

  setStartDate(value: string): void {
    this.dateDebut.set(value);
    if (this.dateFin() < value) this.dateFin.set(value);
  }

  searchCars(): void {
    if (!this.dateDebut() || !this.dateFin() || this.dateFin() < this.dateDebut()) {
      this.errorMessage.set('Choisissez une date de retour postérieure ou égale à la date de départ.');
      return;
    }
    this.errorMessage.set('');
    this.searching.set(true);
    this.selectedVehicle.set(null);
    const preferredVehicleId = this.pendingShowcaseId;
    this.pendingShowcaseId = null;
    this.locationService.availableVehicles(this.dateDebut(), this.dateFin()).subscribe({
      next: cars => {
        this.vehicles.set(cars);
        if (preferredVehicleId) {
          this.selectedVehicle.set(cars.find(car => car.id === preferredVehicleId) ?? null);
        }
        this.searched.set(true);
        this.searching.set(false);
      },
      error: error => {
        this.searching.set(false);
        this.showRequestError(error);
      }
    });
  }

  selectVehicle(vehicle: Vehicule): void {
    this.selectedVehicle.set(vehicle);
    this.errorMessage.set('');
    document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  selectShowcase(vehicle: Vehicule): void {
    this.pendingShowcaseId = vehicle.id;
    this.step.set(1);
    document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.searchCars();
  }

  selectFleetCategory(category: string): void {
    this.selectedFleetCategory.set(category);
  }

  prepareQuote(): void {
    if (this.form.invalid || !this.acceptedTerms() || !this.selectedVehicle()) return;
    this.errorMessage.set('');
    this.preparing.set(true);
    const input: ClientInput = {
      ...this.form.getRawValue(),
      dateNaissance: this.form.controls.dateNaissance.value,
      dateExpirationPermis: this.form.controls.dateExpirationPermis.value
    };
    this.clientService.create(input).subscribe({
      next: client => {
        this.registeredClient.set(client);
        this.clientService.eligibility(client.id).subscribe({
          next: eligibility => {
            if (!eligibility.eligible) {
              this.preparing.set(false);
              this.errorMessage.set(eligibility.raison);
              return;
            }
            this.locationService.simulate({
              clientId: client.id,
              vehiculeId: this.selectedVehicle()!.id,
              dateDebut: this.dateDebut(),
              dateFinPrevue: this.dateFin()
            }).subscribe({
              next: quote => {
                this.simulation.set(quote);
                this.step.set(3);
                this.preparing.set(false);
              },
              error: error => {
                this.preparing.set(false);
                this.showRequestError(error);
              }
            });
          },
          error: error => {
            this.preparing.set(false);
            this.showRequestError(error);
          }
        });
      },
      error: error => {
        this.preparing.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.errorMessage.set('Cette CIN, cette adresse e-mail ou ce numéro de permis est déjà associé à un dossier. Pour modifier ou réserver avec un dossier existant, contactez notre agence.');
        } else {
          this.showRequestError(error);
        }
      }
    });
  }

  confirmBooking(): void {
    const client = this.registeredClient();
    const quote = this.simulation();
    const vehicle = this.selectedVehicle();
    if (!client || !quote || !vehicle) return;
    this.confirming.set(true);
    this.errorMessage.set('');
    this.locationService.reserve({
      clientId: client.id,
      vehiculeId: vehicle.id,
      dateDebut: this.dateDebut(),
      dateFinPrevue: this.dateFin()
    }).subscribe({
      next: reservation => {
        this.booking.set(reservation);
        this.confirming.set(false);
      },
      error: error => {
        this.confirming.set(false);
        this.showRequestError(error);
      }
    });
  }

  private showRequestError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.errorMessage.set(error.error?.detail ?? error.error?.message
        ?? `La demande n'a pas pu aboutir (${error.status || 'connexion indisponible'}). Veuillez réessayer.`);
      return;
    }
    this.errorMessage.set("La demande n'a pas pu aboutir. Veuillez réessayer.");
  }

  private toLocalDate(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }
}
