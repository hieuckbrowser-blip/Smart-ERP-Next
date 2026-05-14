import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentView?: string;
  lastSeen: string;
}

interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  timestamp: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'collaboration' })
@Injectable()
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private presence = new Map<string, UserPresence>();
  private cursors = new Map<string, CursorPosition>();
  private userSockets = new Map<string, string[]>(); // userId -> socketIds

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    const userName = client.handshake.auth.userName as string;
    const tenantId = client.handshake.auth.tenantId as string;

    if (!userId || !tenantId) {
      client.disconnect();
      return;
    }

    // Track user sockets
    const existing = this.userSockets.get(userId) || [];
    this.userSockets.set(userId, [...existing, client.id]);

    // Set presence
    const presence: UserPresence = {
      userId,
      userName,
      status: 'online',
      lastSeen: new Date().toISOString(),
    };
    this.presence.set(userId, presence);

    // Join tenant room
    client.join(`tenant:${tenantId}`);

    // Broadcast presence to tenant
    this.server.to(`tenant:${tenantId}`).emit('presence:update', {
      type: 'joined',
      user: presence,
    });

    // Send current presence list to new client
    const tenantUsers = Array.from(this.presence.values());
    client.emit('presence:list', tenantUsers);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    const tenantId = client.handshake.auth.tenantId as string;

    if (!userId) return;

    // Remove socket tracking
    const sockets = this.userSockets.get(userId) || [];
    const updated = sockets.filter((id) => id !== client.id);
    if (updated.length === 0) {
      this.userSockets.delete(userId);
      this.presence.delete(userId);
      this.cursors.delete(userId);

      // Broadcast departure
      this.server.to(`tenant:${tenantId}`).emit('presence:update', {
        type: 'left',
        userId,
      });
    } else {
      this.userSockets.set(userId, updated);
    }
  }

  /** Update user status */
  @SubscribeMessage('presence:status')
  handleStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: UserPresence['status'] },
  ) {
    const userId = client.handshake.auth.userId as string;
    const tenantId = client.handshake.auth.tenantId as string;
    const presence = this.presence.get(userId);

    if (presence) {
      presence.status = data.status;
      presence.lastSeen = new Date().toISOString();
      this.server.to(`tenant:${tenantId}`).emit('presence:update', {
        type: 'status',
        userId,
        status: data.status,
      });
    }
  }

  /** Update cursor position */
  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number; view: string },
  ) {
    const userId = client.handshake.auth.userId as string;
    const userName = client.handshake.auth.userName as string;
    const tenantId = client.handshake.auth.tenantId as string;
    const presence = this.presence.get(userId);

    if (presence) {
      const cursor: CursorPosition = {
        userId,
        userName,
        x: data.x,
        y: data.y,
        color: this.getUserColor(userId),
        timestamp: new Date().toISOString(),
      };
      this.cursors.set(userId, cursor);

      // Broadcast to others in same view
      client.to(`tenant:${tenantId}`).emit('cursor:update', cursor);
    }
  }

  /** Subscribe to document/view for co-editing */
  @SubscribeMessage('view:join')
  handleViewJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { view: string },
  ) {
    const userId = client.handshake.auth.userId as string;
    const tenantId = client.handshake.auth.tenantId as string;
    const presence = this.presence.get(userId);

    if (presence) {
      presence.currentView = data.view;
      client.join(`view:${data.view}`);

      // Notify others in the view
      client.to(`view:${data.view}`).emit('view:userJoined', {
        userId,
        userName: presence.userName,
      });
    }
  }

  /** Broadcast activity to team */
  @SubscribeMessage('activity:broadcast')
  handleActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { action: string; entityType: string; entityId: string; message: string },
  ) {
    const userId = client.handshake.auth.userId as string;
    const userName = client.handshake.auth.userName as string;
    const tenantId = client.handshake.auth.tenantId as string;

    this.server.to(`tenant:${tenantId}`).emit('activity:new', {
      userId,
      userName,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  private getUserColor(userId: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
