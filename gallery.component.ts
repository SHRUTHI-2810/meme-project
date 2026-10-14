import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Meme } from './models';
import { MemeCanvasComponent } from './meme-canvas.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [MemeCanvasComponent],
  template: `
    @if (error()) { <p class="note">{{ error() }}</p> }
    <div class="grid">
      @for (m of memes(); track m.id) {
        <article class="card">
          <app-meme-canvas [imageUrl]="m.templateUrl" [captions]="m.captions" />
          <footer>
            <span class="name">{{ m.title || 'Untitled' }}</span>
            <button type="button" class="ghost" (click)="like(m)" [attr.aria-label]="'Like ' + (m.title || 'meme')">
              Like · {{ m.likes }}
            </button>
          </footer>
        </article>
      } @empty {
        @if (!error()) { <p class="note">Nothing here yet. Make a meme and save it to see it here.</p> }
      }
    </div>
  `,
})
export class GalleryComponent implements OnInit {
  private api = inject(ApiService);
  memes = signal<Meme[]>([]);
  error = signal('');

  ngOnInit() {
    this.api.memes().subscribe({
      next: (m) => this.memes.set(m),
      error: () => this.error.set('Could not load the gallery. Is the API running on port 3000?'),
    });
  }

  like(m: Meme) {
    this.api.like(m.id).subscribe((u) =>
      this.memes.update((list) => list.map((x) => (x.id === u.id ? { ...x, likes: u.likes } : x))));
  }
}
