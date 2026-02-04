import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupsService } from '../../services/groups.service';
import { ContactsService } from '../../services/contacts.service';
import { Group } from '../../models/group.model';
import { Contact } from '../../models/contact.model';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group.component.html',
  styleUrl: './create-group.component.scss'
})
export class CreateGroupComponent implements OnInit {
  showDialog = signal(false);
  
  groupName = signal('');
  groupDescription = signal('');
  selectedMemberIds = signal<Set<string>>(new Set());
  
  contacts = this.contactsService.contactsSignal;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Computed filtered contacts (only online contacts for quick selection)
  availableContacts = computed(() => {
    return this.contacts().sort((a, b) => {
      // Online contacts first
      if (a.contactStatus === 'online' && b.contactStatus !== 'online') return -1;
      if (a.contactStatus !== 'online' && b.contactStatus === 'online') return 1;
      return (a.nickname || a.contactDisplayName).localeCompare(b.nickname || b.contactDisplayName);
    });
  });
  
  canSubmit = computed(() => {
    return this.groupName().trim().length > 0 && this.selectedMemberIds().size > 0;
  });
  
  constructor(
    private groupsService: GroupsService,
    private contactsService: ContactsService
  ) {}
  
  ngOnInit(): void {
    // Load contacts when component initializes
    this.contactsService.getContacts(true).subscribe();
  }
  
  open(): void {
    this.showDialog.set(true);
    this.reset();
  }
  
  close(): void {
    this.showDialog.set(false);
    this.reset();
  }
  
  reset(): void {
    this.groupName.set('');
    this.groupDescription.set('');
    this.selectedMemberIds.set(new Set());
    this.errorMessage.set(null);
  }
  
  toggleMember(contactUserId: string): void {
    const selected = new Set(this.selectedMemberIds());
    if (selected.has(contactUserId)) {
      selected.delete(contactUserId);
    } else {
      selected.add(contactUserId);
    }
    this.selectedMemberIds.set(selected);
  }
  
  isMemberSelected(contactUserId: string): boolean {
    return this.selectedMemberIds().has(contactUserId);
  }
  
  createGroup(): void {
    if (!this.canSubmit()) {
      return;
    }
    
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    const request = {
      name: this.groupName().trim(),
      description: this.groupDescription().trim() || undefined,
      memberIds: Array.from(this.selectedMemberIds())
    };
    
    this.groupsService.createGroup(request).subscribe({
      next: (group) => {
        console.log('Group created:', group);
        this.close();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Failed to create group:', err);
        this.errorMessage.set(err.error?.error || 'Failed to create group');
        this.isSubmitting.set(false);
      }
    });
  }
  
  selectAll(): void {
    const allIds = new Set(this.availableContacts().map(c => c.contactUserId));
    this.selectedMemberIds.set(allIds);
  }
  
  deselectAll(): void {
    this.selectedMemberIds.set(new Set());
  }
}
