/**
 * Frontend Contact model matching backend Contact interface.
 */
export interface Contact {
  id: string;
  userId: string;
  contactUserId: string;
  contactDisplayName: string;
  contactAvatarUrl?: string;
  contactStatus?: 'online' | 'offline' | 'away';
  addedAt: string;
  nickname?: string;
  isFavorite?: boolean;
}

export interface ContactWithStatus extends Contact {
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface AddContactRequest {
  contactUserId: string;
  nickname?: string;
}

export interface UpdateContactRequest {
  nickname?: string;
  isFavorite?: boolean;
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away';
  isContact: boolean;
}
