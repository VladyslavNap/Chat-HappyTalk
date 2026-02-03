import { Routes } from '@angular/router';
import { Chat } from './pages/chat/chat';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Chat,
    canActivate: [authGuard],
    title: 'HappyTalk - Chat'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
