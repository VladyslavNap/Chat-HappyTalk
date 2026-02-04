/**
 * Group model for private group chat management.
 * Stored in Cosmos DB SQL with id as partition key.
 * Groups are private chat rooms with selected members.
 */
export interface Group {
  /** Unique group ID (GUID) */
  id: string;
  /** Group name */
  name: string;
  /** Group description (optional) */
  description?: string;
  /** Group avatar/photo URL */
  avatarUrl?: string;
  /** User ID of the group creator/owner */
  createdBy: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt?: string;
  /** List of member user IDs */
  members: string[];
  /** List of admin user IDs (can manage group) */
  admins: string[];
  /** Whether the group is active */
  isActive: boolean;
  /** Group type - always 'private' for groups */
  type: 'private';
  /** Associated room ID for messages */
  roomId: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  /** User IDs to add as initial members */
  memberIds: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export interface AddGroupMembersRequest {
  /** User IDs to add to the group */
  memberIds: string[];
}

export interface RemoveGroupMemberRequest {
  /** User ID to remove from the group */
  memberId: string;
}

export interface GroupListResponse {
  groups: Group[];
  continuationToken?: string;
}

export interface GroupDetails extends Group {
  /** Populated member details */
  memberDetails: GroupMember[];
}

export interface GroupMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away';
  isAdmin: boolean;
  joinedAt: string;
}

/**
 * Generate a room ID for a group chat
 */
export function createGroupRoomId(groupId: string): string {
  return `group-${groupId}`;
}
