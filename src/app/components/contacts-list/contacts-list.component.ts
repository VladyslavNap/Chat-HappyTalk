import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../../services/contacts.service';
import { Contact, UserSearchResult } from '../../models/contact.model';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts-list.component.html',
  styleUrl: './contacts-list.component.scss'
})
export class ContactsListComponent implements OnInit {
  contacts = this.contactsService.contactsSignal;
  onlineContacts = this.contactsService.onlineContactsSignal;
  
  searchQuery = signal('');
  searchResults = signal<UserSearchResult[]>([]);
  isSearching = signal(false);
  showAddDialog = signal(false);
  
  // Filter and sort contacts
  filteredContacts = computed(() => {
    const contacts = this.contacts();
    const query = this.searchQuery().toLowerCase();
    
    let filtered = contacts;
    if (query) {
      filtered = contacts.filter(c => 
        c.contactDisplayName.toLowerCase().includes(query) ||
        (c.nickname && c.nickname.toLowerCase().includes(query))
      );
    }
    
    // Sort: favorites first, then online, then alphabetical
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.contactStatus === 'online' && b.contactStatus !== 'online') return -1;
      if (a.contactStatus !== 'online' && b.contactStatus === 'online') return 1;
      return (a.nickname || a.contactDisplayName).localeCompare(b.nickname || b.contactDisplayName);
    });
  });
  
  selectedContact = signal<Contact | null>(null);
  editingNickname = signal<string | null>(null);
  nicknameInput = signal('');
  
  constructor(private contactsService: ContactsService) {}
  
  ngOnInit(): void {
    this.loadContacts();
  }
  
  loadContacts(): void {
    this.contactsService.getContacts(true).subscribe({
      error: (err) => console.error('Failed to load contacts:', err)
    });
  }
  
  searchUsers(query: string): void {
    if (!query || query.length < 2) {
      this.searchResults.set([]);
      return;
    }
    
    this.isSearching.set(true);
    this.contactsService.searchUsers(query, 20).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.isSearching.set(false);
      }
    });
  }
  
  addContact(user: UserSearchResult): void {
    if (user.isContact) {
      return;
    }
    
    this.contactsService.addContact({ contactUserId: user.id }).subscribe({
      next: () => {
        console.log('Contact added:', user.displayName);
        this.searchResults.set([]);
        this.showAddDialog.set(false);
      },
      error: (err) => console.error('Failed to add contact:', err)
    });
  }
  
  removeContact(contact: Contact): void {
    if (!confirm(`Remove ${contact.nickname || contact.contactDisplayName} from contacts?`)) {
      return;
    }
    
    this.contactsService.removeContact(contact.id).subscribe({
      next: () => console.log('Contact removed'),
      error: (err) => console.error('Failed to remove contact:', err)
    });
  }
  
  toggleFavorite(contact: Contact): void {
    this.contactsService.updateContact(contact.id, {
      isFavorite: !contact.isFavorite
    }).subscribe({
      error: (err) => console.error('Failed to update favorite:', err)
    });
  }
  
  startEditNickname(contact: Contact): void {
    this.editingNickname.set(contact.id);
    this.nicknameInput.set(contact.nickname || '');
  }
  
  saveNickname(contact: Contact): void {
    const nickname = this.nicknameInput().trim();
    
    this.contactsService.updateContact(contact.id, {
      nickname: nickname || undefined
    }).subscribe({
      next: () => {
        this.editingNickname.set(null);
      },
      error: (err) => console.error('Failed to update nickname:', err)
    });
  }
  
  cancelEditNickname(): void {
    this.editingNickname.set(null);
  }
  
  getStatusIcon(status?: string): string {
    switch (status) {
      case 'online': return '🟢';
      case 'away': return '🟡';
      default: return '⚪';
    }
  }
  
  getLastSeenText(contact: Contact): string {
    if (contact.contactStatus === 'online') {
      return 'Online';
    }
    
    // TODO: Format lastSeenAt timestamp to relative time (e.g., "2 hours ago")
    return 'Offline';
  }
}
