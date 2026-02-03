import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Chat } from './pages/chat/chat';
import { About } from './pages/about/about';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'HappyTalk - Home'
  },
  {
    path: 'chat',
    component: Chat,
    canActivate: [authGuard],
    title: 'HappyTalk - Chat'
  },
  {
    path: 'about',
    component: About,
    title: 'HappyTalk - About'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
