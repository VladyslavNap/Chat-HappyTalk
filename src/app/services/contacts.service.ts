import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Contact,
  AddContactRequest,
  UpdateContactRequest,
  UserSearchResult,
} from '../models/contact.model';

/**
 * Service for managing user contacts.
 * Handles contact CRUD operations and online/offline status tracking.
 */
@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  private apiUrl = environment.apiUrl;
  private contactsSubject = new BehaviorSubject<Contact[]>([]);
  public contacts$ = this.contactsSubject.asObservable();

  // Signal for reactive contact list
  public contactsSignal = signal<Contact[]>([]);
  public onlineContactsSignal = signal<Contact[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('happytalk_auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Get all contacts for the current user.
   */
  getContacts(includeOffline: boolean = true): Observable<Contact[]> {
    const url = `${this.apiUrl}/api/contacts?includeOffline=${includeOffline}`;
    return this.http.get<Contact[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap((contacts) => {
        this.contactsSubject.next(contacts);
        this.contactsSignal.set(contacts);
        this.updateOnlineContacts(contacts);
      })
    );
  }

  /**
   * Search for users to add as contacts.
   */
  searchUsers(query: string, limit: number = 20): Observable<UserSearchResult[]> {
    const url = `${this.apiUrl}/api/contacts/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    return this.http.get<UserSearchResult[]>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Add a new contact.
   */
  addContact(request: AddContactRequest): Observable<Contact> {
    const url = `${this.apiUrl}/api/contacts`;
    return this.http.post<Contact>(url, request, { headers: this.getAuthHeaders() }).pipe(
      tap((newContact) => {
        const currentContacts = this.contactsSubject.value;
        this.contactsSubject.next([...currentContacts, newContact]);
        this.contactsSignal.set([...currentContacts, newContact]);
        this.updateOnlineContacts([...currentContacts, newContact]);
      })
    );
  }

  /**
   * Update a contact (nickname, favorite status).
   */
  updateContact(contactId: string, request: UpdateContactRequest): Observable<Contact> {
    const url = `${this.apiUrl}/api/contacts/${contactId}`;
    return this.http.patch<Contact>(url, request, { headers: this.getAuthHeaders() }).pipe(
      tap((updatedContact) => {
        const currentContacts = this.contactsSubject.value;
        const index = currentContacts.findIndex((c) => c.id === contactId);
        if (index !== -1) {
          currentContacts[index] = updatedContact;
          this.contactsSubject.next([...currentContacts]);
          this.contactsSignal.set([...currentContacts]);
          this.updateOnlineContacts([...currentContacts]);
        }
      })
    );
  }

  /**
   * Remove a contact.
   */
  removeContact(contactId: string): Observable<void> {
    const url = `${this.apiUrl}/api/contacts/${contactId}`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        const currentContacts = this.contactsSubject.value.filter((c) => c.id !== contactId);
        this.contactsSubject.next(currentContacts);
        this.contactsSignal.set(currentContacts);
        this.updateOnlineContacts(currentContacts);
      })
    );
  }

  /**
   * Get online status for specific contacts.
   */
  getContactsStatus(contactIds: string[]): Observable<any> {
    const url = `${this.apiUrl}/api/contacts/status`;
    return this.http.post<any>(url, { contactIds }, { headers: this.getAuthHeaders() });
  }

  /**
   * Update contact status when real-time event received.
   */
  updateContactStatus(userId: string, status: 'online' | 'offline' | 'away'): void {
    const currentContacts = this.contactsSubject.value;
    const updatedContacts = currentContacts.map((contact) =>
      contact.contactUserId === userId ? { ...contact, contactStatus: status } : contact
    );
    this.contactsSubject.next(updatedContacts);
    this.contactsSignal.set(updatedContacts);
    this.updateOnlineContacts(updatedContacts);
  }

  /**
   * Update online contacts list.
   */
  private updateOnlineContacts(contacts: Contact[]): void {
    const onlineContacts = contacts.filter((c) => c.contactStatus === 'online');
    this.onlineContactsSignal.set(onlineContacts);
  }

  /**
   * Get current contacts from signal.
   */
  getCurrentContacts(): Contact[] {
    return this.contactsSignal();
  }

  /**
   * Get online contacts from signal.
   */
  getOnlineContacts(): Contact[] {
    return this.onlineContactsSignal();
  }
}
