import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { ApiService } from './api.service';
import { Caption, Template } from './models';
import { MemeCanvasComponent } from './meme-canvas.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [MemeCanvasComponent],
  template: `
    <section class="picker" aria-label="Templates">
      @for (t of templates(); track t.id) {
        <button type="button" class="thumb" [class.on]="selected()?.id === t.id"
                (click)="pick(t)" [attr.aria-label]="t.name" [attr.aria-pressed]="selected()?.id === t.id">
          <img [src]="t.url" [alt]="t.name" loading="lazy">
        </button>
      } @empty {
        <p class="note">No templates yet. Run <code>npm run seed</code> in the server folder, or upload your own image.</p>
      }
      <label class="thumb upload">
        <span>Upload image</span>
        <input type="file" accept="image/*" (change)="upload($event)">
      </label>
    </section>

    <div class="workbench">
      <div class="stage">
        @if (imageUrl()) {
          <app-meme-canvas [imageUrl]="imageUrl()" [captions]="captions()" [editable]="true"
                           (captionMoved)="move($event)" />
          <p class="note">Drag a caption on the image to move it.</p>
        } @else {
          <p class="note">Pick a template to start.</p>
        }
      </div>

      <form class="controls" (submit)="$event.preventDefault()">
        <label class="field">Title
          <input type="text" maxlength="80" [value]="title()" (input)="title.set($any($event.target).value)"
                 placeholder="Name your meme">
        </label>

        @for (c of captions(); track $index) {
          <fieldset class="caption">
            <legend>Caption {{ $index + 1 }}</legend>
            <input type="text" maxlength="120" [value]="c.text" (input)="setText($index, $any($event.target).value)"
                   [attr.aria-label]="'Caption ' + ($index + 1) + ' text'">
            <label class="size">Size
              <input type="range" min="3" max="20" step="0.5" [value]="c.size"
                     (input)="setSize($index, +$any($event.target).value)">
            </label>
            <button type="button" class="ghost" (click)="remove($index)" [disabled]="captions().length <= 1">Remove</button>
          </fieldset>
        }
        <button type="button" class="ghost" (click)="add()" [disabled]="captions().length >= 6">Add caption</button>

        <div class="actions">
          <button type="button" class="primary" (click)="download()" [disabled]="!imageUrl()">Download PNG</button>
          <button type="button" (click)="save()" [disabled]="!selected()"
                  [title]="selected() ? '' : 'Uploaded images can be downloaded but not saved to the gallery'">
            Save to gallery
          </button>
        </div>
        <p class="status" role="status">{{ status() }}</p>
      </form>
    </div>
  `,
})
export class EditorComponent implements OnInit {
  private api = inject(ApiService);
  private canvas = viewChild(MemeCanvasComponent);

  templates = signal<Template[]>([]);
  selected = signal<Template | null>(null);
  imageUrl = signal('');
  title = signal('');
  status = signal('');
  captions = signal<Caption[]>([
    { text: 'When the build passes', x: 50, y: 9, size: 8 },
    { text: 'on the first try', x: 50, y: 91, size: 8 },
  ]);

  ngOnInit() {
    this.api.templates().subscribe({
      next: (t) => { this.templates.set(t); if (t.length) this.pick(t[0]); },
      error: () => this.status.set('Could not load templates. Is the API running on port 3000?'),
    });
  }

  pick(t: Template) { this.selected.set(t); this.imageUrl.set(t.url); this.status.set(''); }

  upload(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.selected.set(null); this.imageUrl.set(reader.result as string); };
    reader.readAsDataURL(file);
  }

  private patch(i: number, change: Partial<Caption>) {
    this.captions.update((list) => list.map((c, j) => (j === i ? { ...c, ...change } : c)));
  }
  setText(i: number, text: string) { this.patch(i, { text }); }
  setSize(i: number, size: number) { this.patch(i, { size }); }
  move(e: { index: number; x: number; y: number }) { this.patch(e.index, { x: e.x, y: e.y }); }
  add() { this.captions.update((l) => [...l, { text: '', x: 50, y: 50, size: 8 }]); }
  remove(i: number) { this.captions.update((l) => l.filter((_, j) => j !== i)); }

  download() {
    const url = this.canvas()?.toDataUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.title().trim() || 'meme'}.png`;
    a.click();
  }

  save() {
    const t = this.selected();
    if (!t) return;
    this.api.createMeme({ templateId: t.id, title: this.title(), captions: this.captions() }).subscribe({
      next: () => this.status.set('Saved to the gallery.'),
      error: () => this.status.set('Could not save. Add at least one caption and check that the API is running.'),
    });
  }
}
