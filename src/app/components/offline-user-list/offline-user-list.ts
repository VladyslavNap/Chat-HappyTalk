import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../models/auth.model';

@Component({
  selector: 'app-offline-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offline-user-list.html',
  styleUrl: './offline-user-list.scss'
})
export class OfflineUserListComponent {
  offlineUsers = input<UserProfile[]>([]);
  userSelected = output<UserProfile>();

  selectUser(user: UserProfile) {
    this.userSelected.emit(user);
  }
}
