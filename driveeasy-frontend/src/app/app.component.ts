import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ApiErrorService } from './core/api-error.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (isClientPortal()) {
      <router-outlet />
    } @else {
      <div class="shell">
        <aside class="sidebar">
          <a class="brand" routerLink="/dashboard"><span class="brand-mark">D</span><span>Drive <span>Easy</span></span></a>
          <p class="nav-caption">ESPACE AGENCE</p>
          <nav>
            <a routerLink="/dashboard" routerLinkActive="active"><span>◫</span> Tableau de bord</a>
            <a routerLink="/vehicules" routerLinkActive="active"><span>▣</span> Véhicules</a>
            <a routerLink="/clients" routerLinkActive="active"><span>♙</span> Clients</a>
            <a routerLink="/locations" routerLinkActive="active"><span>↗</span> Locations</a>
            <a routerLink="/espace-client"><span>✦</span> Portail client</a>
          </nav>
          <div class="sidebar-footer">Drive Easy · Portail agence</div>
        </aside>
        <main class="main">
          <header class="topbar"><span class="crumb">Drive Easy <span>/</span> Gestion de flotte</span><div class="avatar">AG</div></header>
          @if (errors.message(); as message) {
            <div class="error-banner" role="alert"><span>{{ message }}</span><button (click)="errors.clear()">Fermer</button></div>
          }
          <router-outlet />
        </main>
      </div>
    }
  `
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private revealObserver?: IntersectionObserver;
  private revealMutations?: MutationObserver;
  readonly errors = inject(ApiErrorService);
  readonly isClientPortal = signal(this.router.url.startsWith('/espace-client'));

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const root = this.host.nativeElement.querySelector('.main') as HTMLElement | null;
    if (!root) return;

    const selector = '.page-head, .metric-card, .panel, .vehicle-card, .choice-card, .quick-link, .empty-state, .confirm-state';
    const observeTargets = (node: Node): void => {
      if (!(node instanceof HTMLElement)) return;
      if (node.matches(selector)) {
        node.setAttribute('data-scroll-reveal', '');
        this.revealObserver?.observe(node);
      }
      node.querySelectorAll<HTMLElement>(selector).forEach(target => {
        target.setAttribute('data-scroll-reveal', '');
        this.revealObserver?.observe(target);
      });
    };

    this.revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else {
          entry.target.classList.remove('is-revealed');
        }
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    observeTargets(root);
    root.classList.add('scroll-reveal-enabled');
    this.revealMutations = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(observeTargets);
      }
    });
    this.revealMutations.observe(root, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.revealMutations?.disconnect();
  }

  ngOnInit(): void {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.isClientPortal.set(event.urlAfterRedirects.startsWith('/espace-client')));
  }
}
