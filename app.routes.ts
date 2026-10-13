import { Routes } from '@angular/router';
import { EditorComponent } from './editor.component';
import { GalleryComponent } from './gallery.component';

export const routes: Routes = [
  { path: '', component: EditorComponent, title: 'Make a meme' },
  { path: 'gallery', component: GalleryComponent, title: 'Gallery' },
  { path: '**', redirectTo: '' },
];
