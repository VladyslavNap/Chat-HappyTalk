import { Routes } from '@angular/router';
import { Chat } from './pages/chat/chat';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';
import { ContactsListComponent } from './components/contacts-list/contacts-list.component';
import { ProfileComponent } from './pages/profile/profile.component';

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
    path: 'contacts',
    component: ContactsListComponent,
    canActivate: [authGuard],
    title: 'HappyTalk - Contacts'
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    title: 'HappyTalk - Profile'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
