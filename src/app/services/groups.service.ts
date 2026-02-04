import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Group,
  GroupDetails,
  CreateGroupRequest,
  UpdateGroupRequest,
} from '../models/group.model';

/**
 * Service for managing private groups.
 * Handles group CRUD operations, member management, and real-time updates.
 */
@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private apiUrl = environment.apiUrl;
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  public groups$ = this.groupsSubject.asObservable();

  // Signal for reactive group list
  public groupsSignal = signal<Group[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Get all groups for the current user.
   */
  getGroups(): Observable<Group[]> {
    const url = `${this.apiUrl}/groups`;
    return this.http.get<Group[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap((groups) => {
        this.groupsSubject.next(groups);
        this.groupsSignal.set(groups);
      })
    );
  }

  /**
   * Get group details with member information.
   */
  getGroupDetails(groupId: string): Observable<GroupDetails> {
    const url = `${this.apiUrl}/groups/${groupId}`;
    return this.http.get<GroupDetails>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Create a new private group.
   */
  createGroup(request: CreateGroupRequest): Observable<Group> {
    const url = `${this.apiUrl}/groups`;
    return this.http.post<Group>(url, request, { headers: this.getAuthHeaders() }).pipe(
      tap((newGroup) => {
        const currentGroups = this.groupsSubject.value;
        this.groupsSubject.next([...currentGroups, newGroup]);
        this.groupsSignal.set([...currentGroups, newGroup]);
      })
    );
  }

  /**
   * Update group metadata (name, description, avatar).
   */
  updateGroup(groupId: string, request: UpdateGroupRequest): Observable<Group> {
    const url = `${this.apiUrl}/groups/${groupId}`;
    return this.http.patch<Group>(url, request, { headers: this.getAuthHeaders() }).pipe(
      tap((updatedGroup) => {
        const currentGroups = this.groupsSubject.value;
        const index = currentGroups.findIndex((g) => g.id === groupId);
        if (index !== -1) {
          currentGroups[index] = updatedGroup;
          this.groupsSubject.next([...currentGroups]);
          this.groupsSignal.set([...currentGroups]);
        }
      })
    );
  }

  /**
   * Add members to a group.
   */
  addGroupMembers(groupId: string, memberIds: string[]): Observable<Group> {
    const url = `${this.apiUrl}/groups/${groupId}/members`;
    return this.http.post<Group>(url, { memberIds }, { headers: this.getAuthHeaders() }).pipe(
      tap((updatedGroup) => {
        const currentGroups = this.groupsSubject.value;
        const index = currentGroups.findIndex((g) => g.id === groupId);
        if (index !== -1) {
          currentGroups[index] = updatedGroup;
          this.groupsSubject.next([...currentGroups]);
          this.groupsSignal.set([...currentGroups]);
        }
      })
    );
  }

  /**
   * Remove a member from a group.
   */
  removeGroupMember(groupId: string, memberId: string): Observable<Group> {
    const url = `${this.apiUrl}/groups/${groupId}/members/${memberId}`;
    return this.http.delete<Group>(url, { headers: this.getAuthHeaders() }).pipe(
      tap((updatedGroup) => {
        const currentGroups = this.groupsSubject.value;
        const index = currentGroups.findIndex((g) => g.id === groupId);
        if (index !== -1) {
          currentGroups[index] = updatedGroup;
          this.groupsSubject.next([...currentGroups]);
          this.groupsSignal.set([...currentGroups]);
        }
      })
    );
  }

  /**
   * Delete a group (soft delete).
   */
  deleteGroup(groupId: string): Observable<void> {
    const url = `${this.apiUrl}/groups/${groupId}`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        const currentGroups = this.groupsSubject.value.filter((g) => g.id !== groupId);
        this.groupsSubject.next(currentGroups);
        this.groupsSignal.set(currentGroups);
      })
    );
  }

  /**
   * Handle real-time group created event.
   */
  handleGroupCreated(group: Group): void {
    const currentGroups = this.groupsSubject.value;
    if (!currentGroups.find((g) => g.id === group.id)) {
      this.groupsSubject.next([...currentGroups, group]);
      this.groupsSignal.set([...currentGroups, group]);
    }
  }

  /**
   * Handle real-time group updated event.
   */
  handleGroupUpdated(group: Group): void {
    const currentGroups = this.groupsSubject.value;
    const index = currentGroups.findIndex((g) => g.id === group.id);
    if (index !== -1) {
      currentGroups[index] = group;
      this.groupsSubject.next([...currentGroups]);
      this.groupsSignal.set([...currentGroups]);
    }
  }

  /**
   * Handle real-time group deleted event.
   */
  handleGroupDeleted(groupId: string): void {
    const currentGroups = this.groupsSubject.value.filter((g) => g.id !== groupId);
    this.groupsSubject.next(currentGroups);
    this.groupsSignal.set(currentGroups);
  }

  /**
   * Get current groups from signal.
   */
  getCurrentGroups(): Group[] {
    return this.groupsSignal();
  }
}
