/**
 * Frontend Group model matching backend Group interface.
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  members: string[];
  admins: string[];
  isActive: boolean;
  type: 'private';
  roomId: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export interface GroupDetails extends Group {
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
