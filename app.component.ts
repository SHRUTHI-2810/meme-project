import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="bar">
      <a class="brand" routerLink="/">Memesmith</a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Make</a>
        <a routerLink="/gallery" routerLinkActive="active">Gallery</a>
      </nav>
    </header>
    <main><router-outlet /></main>
  `,
})
export class AppComponent {}
