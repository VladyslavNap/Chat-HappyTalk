import { ChatMessage } from '../models/message.js';
import { Contact } from '../models/contact.js';
import { Group } from '../models/group.js';
import { createHmac } from 'crypto';

/**
 * Azure SignalR Service for real-time chat (Default mode).
 * Handles negotiate tokens and message broadcast via REST API.
 */
export class SignalRService {
  private endpoint: string;
  private accessKey: string;
  private hubName: string;

  constructor() {
    const connectionString = process.env.AZURE_SIGNALR_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_SIGNALR_CONNECTION_STRING environment variable is required');
    }

    // Parse connection string
    const parsed = this.parseConnectionString(connectionString);
    this.endpoint = parsed.endpoint;
    this.accessKey = parsed.accessKey;
    this.hubName = process.env.SIGNALR_HUB_NAME || 'chat';

    console.log(`SignalR Service initialized: ${this.endpoint}, hub: ${this.hubName}`);
  }

  /**
   * Parse Azure SignalR connection string.
   */
  private parseConnectionString(connectionString: string): { endpoint: string; accessKey: string } {
    // Remove any whitespace/newlines that might have gotten into the connection string
    const cleanedConnectionString = connectionString.replace(/\s+/g, '');
    const parts = cleanedConnectionString.split(';');
    let endpoint = '';
    let accessKey = '';

    for (const part of parts) {
      if (!part) continue;
      const [key, ...valueParts] = part.split('=');
      const value = valueParts.join('=');

      if (key.toLowerCase() === 'endpoint') {
        endpoint = value;
      } else if (key.toLowerCase() === 'accesskey') {
        accessKey = value;
      }
    }

    if (!endpoint || !accessKey) {
      throw new Error('Invalid connection string: missing Endpoint or AccessKey');
    }

    return { endpoint, accessKey };
  }

  /**
   * Generate a JWT token for SignalR client access.
   */
  private generateToken(userId: string, expiresInMinutes: number = 60): string {
    const audience = `${this.endpoint}/client/?hub=${this.hubName}`;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresInMinutes * 60);

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      aud: audience,
      iat: now,
      exp: exp,
      sub: userId,
      'nameid': userId
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = createHmac('sha256', this.accessKey)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  /**
   * Generate a JWT token for server REST API access.
   */
  private generateServerToken(expiresInMinutes: number = 60): string {
    const audience = `${this.endpoint}/api/v1/hubs/${this.hubName}`;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresInMinutes * 60);

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      aud: audience,
      iat: now,
      exp: exp
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = createHmac('sha256', this.accessKey)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  /**
   * Generate negotiate response for SignalR client.
   * Returns the SignalR service URL and access token.
   */
  async negotiate(userId?: string): Promise<{ url: string; accessToken: string }> {
    const clientUserId = userId || `user-${Date.now()}`;
    const accessToken = this.generateToken(clientUserId);

    // The URL format for Azure SignalR Service (client endpoint)
    const url = `${this.endpoint}/client/?hub=${this.hubName}`;

    console.log(`Negotiate for user ${clientUserId}: ${url}`);
    return { url, accessToken };
  }

  /**
   * Broadcast a message to a specific group using REST API.
   */
  async broadcastToRoom(roomid: string, message: ChatMessage): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/groups/${roomid}`;
    const token = this.generateServerToken();

    console.log(`Broadcasting to room ${roomid}: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'ReceiveMessage',
          arguments: [message]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to broadcast to room ${roomid}: ${response.status} ${response.statusText} - ${text}`);
      } else {
        console.log(`Message broadcast to room ${roomid} successful`);
      }
    } catch (error) {
      console.error('Error broadcasting to room:', error);
    }
  }

  /**
   * Broadcast a message to all connected clients.
   */
  async broadcastToAll(message: ChatMessage): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'ReceiveMessage',
          arguments: [message]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast to all: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting to all:', error);
    }
  }

  /**
   * Add a connection to a group (room).
   */
  async addToGroup(connectionId: string, roomid: string): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/groups/${roomid}/connections/${connectionId}`;
    const token = await this.generateToken('server');

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error(`Failed to add to group: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding to group:', error);
    }
  }

  /**
   * Remove a connection from a group (room).
   */
  async removeFromGroup(connectionId: string, roomid: string): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/groups/${roomid}/connections/${connectionId}`;
    const token = await this.generateToken('server');

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error(`Failed to remove from group: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing from group:', error);
    }
  }

  // ==================== User Presence Tracking ====================

  /**
   * Broadcast user online status change.
   */
  async broadcastUserOnline(userId: string, userProfile: any): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'UserOnline',
          arguments: [{ userId, userProfile }]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast user online: ${response.status} ${response.statusText}`);
      } else {
        console.log(`User ${userId} online status broadcast`);
      }
    } catch (error) {
      console.error('Error broadcasting user online:', error);
    }
  }

  /**
   * Broadcast user offline status change.
   */
  async broadcastUserOffline(userId: string): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'UserOffline',
          arguments: [{ userId }]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast user offline: ${response.status} ${response.statusText}`);
      } else {
        console.log(`User ${userId} offline status broadcast`);
      }
    } catch (error) {
      console.error('Error broadcasting user offline:', error);
    }
  }

  // ==================== Contact Management Events ====================

  /**
   * Broadcast contact added event to user.
   */
  async broadcastContactAdded(userId: string, contact: Contact): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${userId}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'ContactAdded',
          arguments: [contact]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast contact added: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting contact added:', error);
    }
  }

  /**
   * Broadcast contact removed event to user.
   */
  async broadcastContactRemoved(userId: string, contactId: string): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${userId}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'ContactRemoved',
          arguments: [{ contactId }]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast contact removed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting contact removed:', error);
    }
  }

  // ==================== Group Management Events ====================

  /**
   * Broadcast group created event to all members.
   */
  async broadcastGroupCreated(group: Group): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}`;
    const token = this.generateServerToken();

    try {
      // Send to each member
      for (const memberId of group.members) {
        const memberUrl = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${memberId}`;
        const response = await fetch(memberUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            target: 'GroupCreated',
            arguments: [group]
          })
        });

        if (!response.ok) {
          console.error(`Failed to broadcast group created to ${memberId}: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error broadcasting group created:', error);
    }
  }

  /**
   * Broadcast group updated event to all members.
   */
  async broadcastGroupUpdated(group: Group): Promise<void> {
    const token = this.generateServerToken();

    try {
      for (const memberId of group.members) {
        const memberUrl = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${memberId}`;
        const response = await fetch(memberUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            target: 'GroupUpdated',
            arguments: [group]
          })
        });

        if (!response.ok) {
          console.error(`Failed to broadcast group updated to ${memberId}: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error broadcasting group updated:', error);
    }
  }

  /**
   * Broadcast group members added event.
   */
  async broadcastGroupMembersAdded(group: Group, newMemberIds: string[]): Promise<void> {
    const token = this.generateServerToken();

    try {
      for (const memberId of group.members) {
        const memberUrl = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${memberId}`;
        const response = await fetch(memberUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            target: 'GroupMembersAdded',
            arguments: [{ groupId: group.id, newMemberIds }]
          })
        });

        if (!response.ok) {
          console.error(`Failed to broadcast members added to ${memberId}: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error broadcasting group members added:', error);
    }
  }

  /**
   * Broadcast group member removed event.
   */
  async broadcastGroupMemberRemoved(group: Group, removedMemberId: string): Promise<void> {
    const token = this.generateServerToken();

    try {
      // Notify all current members plus the removed member
      const notifyUsers = [...group.members, removedMemberId];
      for (const memberId of notifyUsers) {
        const memberUrl = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${memberId}`;
        const response = await fetch(memberUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            target: 'GroupMemberRemoved',
            arguments: [{ groupId: group.id, memberId: removedMemberId }]
          })
        });

        if (!response.ok) {
          console.error(`Failed to broadcast member removed to ${memberId}: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error broadcasting group member removed:', error);
    }
  }

  /**
   * Broadcast group deleted event to all members.
   */
  async broadcastGroupDeleted(groupId: string, memberIds: string[]): Promise<void> {
    const token = this.generateServerToken();

    try {
      for (const memberId of memberIds) {
        const memberUrl = `${this.endpoint}/api/v1/hubs/${this.hubName}/users/${memberId}`;
        const response = await fetch(memberUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            target: 'GroupDeleted',
            arguments: [{ groupId }]
          })
        });

        if (!response.ok) {
          console.error(`Failed to broadcast group deleted to ${memberId}: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error broadcasting group deleted:', error);
    }
  }

  // ==================== Avatar/Photo Events ====================

  /**
   * Broadcast avatar updated event.
   */
  async broadcastAvatarUpdated(userId: string, avatarUrl?: string): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'AvatarUpdated',
          arguments: [{ userId, avatarUrl }]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast avatar updated: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting avatar updated:', error);
    }
  }

  // ==================== Message Admin Events ====================

  /**
   * Broadcast message edited event to room.
   */
  async broadcastMessageEdited(message: ChatMessage): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/groups/${message.roomid}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'MessageEdited',
          arguments: [message]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast message edited: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting message edited:', error);
    }
  }

  /**
   * Broadcast message deleted event to room.
   */
  async broadcastMessageDeleted(messageId: string, roomid: string): Promise<void> {
    const url = `${this.endpoint}/api/v1/hubs/${this.hubName}/groups/${roomid}`;
    const token = this.generateServerToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: 'MessageDeleted',
          arguments: [{ messageId, roomid }]
        })
      });

      if (!response.ok) {
        console.error(`Failed to broadcast message deleted: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting message deleted:', error);
    }
  }
}
