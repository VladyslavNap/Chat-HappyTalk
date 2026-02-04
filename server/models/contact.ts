/**
 * Contact model for user relationship management.
 * Stored in Cosmos DB SQL with userId as partition key.
 */
export interface Contact {
  /** Unique contact relationship ID (GUID) */
  id: string;
  /** User ID who owns this contact (partition key) */
  userId: string;
  /** User ID of the contact */
  contactUserId: string;
  /** Display name of the contact */
  contactDisplayName: string;
  /** Contact's avatar URL */
  contactAvatarUrl?: string;
  /** Contact's current online status */
  contactStatus?: 'online' | 'offline' | 'away';
  /** ISO 8601 timestamp when contact was added */
  addedAt: string;
  /** Optional custom nickname for this contact */
  nickname?: string;
  /** Whether this contact is favorited */
  isFavorite?: boolean;
}

export interface AddContactRequest {
  contactUserId: string;
  nickname?: string;
}

export interface UpdateContactRequest {
  nickname?: string;
  isFavorite?: boolean;
}

export interface ContactListResponse {
  contacts: Contact[];
  continuationToken?: string;
}

export interface ContactWithStatus extends Contact {
  /** Real-time online status */
  isOnline: boolean;
  /** Last seen timestamp (if offline) */
  lastSeenAt?: string;
}

/**
 * Search result for finding users to add as contacts
 */
export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away';
  /** Whether this user is already a contact */
  isContact: boolean;
}
