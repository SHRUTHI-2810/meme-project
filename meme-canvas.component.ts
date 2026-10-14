import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { Caption } from './models';

const clamp = (n: number) => Math.min(100, Math.max(0, n));

@Component({
  selector: 'app-meme-canvas',
  standalone: true,
  template: `
    <canvas #cv aria-label="Meme preview"
      [class.editable]="editable()"
      (pointerdown)="down($event)" (pointermove)="move($event)"
      (pointerup)="up()" (pointercancel)="up()"></canvas>`,
  styles: [`
    canvas { width: 100%; height: auto; display: block; background: #d5dbe3; }
    canvas.editable { touch-action: none; cursor: grab; }
  `],
})
export class MemeCanvasComponent {
  imageUrl = input.required<string>();
  captions = input<Caption[]>([]);
  editable = input(false);
  captionMoved = output<{ index: number; x: number; y: number }>();

  private cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private img?: HTMLImageElement;
  private dragging = -1;

  constructor() {
    effect(() => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { this.img = im; this.draw(); };
      im.src = this.imageUrl();
    });
    effect(() => { this.captions(); this.draw(); });
    document.fonts?.load('40px Anton').then(() => this.draw());
  }

  private draw() {
    const c = this.cv().nativeElement;
    const im = this.img;
    if (!im) return;
    c.width = im.naturalWidth;
    c.height = im.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(im, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const cap of this.captions()) {
      if (!cap.text) continue;
      const px = Math.round((c.width * cap.size) / 100);
      ctx.font = `${px}px Anton, Impact, "Arial Black", sans-serif`;
      ctx.lineWidth = px / 7;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#fff';
      const text = cap.text.toUpperCase();
      const x = (c.width * cap.x) / 100, y = (c.height * cap.y) / 100;
      ctx.strokeText(text, x, y, c.width * 0.96);
      ctx.fillText(text, x, y, c.width * 0.96);
    }
  }

  private pct(e: PointerEvent) {
    const r = this.cv().nativeElement.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  down(e: PointerEvent) {
    if (!this.editable()) return;
    const p = this.pct(e);
    let best = -1, bestDist = 20;
    this.captions().forEach((c, i) => {
      const d = Math.hypot((c.x - p.x) / 2.5, c.y - p.y); // text is wide, so x counts less
      if (d < bestDist) { bestDist = d; best = i; }
    });
    this.dragging = best;
    if (best >= 0) this.cv().nativeElement.setPointerCapture(e.pointerId);
  }

  move(e: PointerEvent) {
    if (this.dragging < 0) return;
    const p = this.pct(e);
    this.captionMoved.emit({ index: this.dragging, x: clamp(p.x), y: clamp(p.y) });
  }

  up() { this.dragging = -1; }

  toDataUrl() { return this.cv().nativeElement.toDataURL('image/png'); }
}
