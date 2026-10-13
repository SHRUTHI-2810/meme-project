import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Caption, Meme, Template } from './models';

// In dev, proxy.conf.json forwards /api to the Node server.
// In production, serve the API from the same origin or change this to its full URL.
const API = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  templates() { return this.http.get<Template[]>(`${API}/templates`); }
  memes() { return this.http.get<Meme[]>(`${API}/memes`); }
  createMeme(body: { templateId: string; title: string; captions: Caption[] }) {
    return this.http.post<Meme>(`${API}/memes`, body);
  }
  like(id: string) { return this.http.post<Meme>(`${API}/memes/${id}/like`, {}); }
}
