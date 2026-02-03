import { Routes } from '@angular/router';
import { Chat } from './pages/chat/chat';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    title: 'HappyTalk - Login'
  },
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
