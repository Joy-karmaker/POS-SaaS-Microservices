import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/socket.io',
})
export class InventoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth?.token || client.handshake.query?.token;

      // Extract token from cookie if not provided in auth/query parameters
      if (!token && client.handshake.headers.cookie) {
        const match = client.handshake.headers.cookie.match(/pos_access_token=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }

      if (!token) {
        console.log(`WebSocket connection rejected: No token provided (Client: ${client.id})`);
        client.disconnect(true);
        return;
      }

      const secret = process.env.AUTH_JWT_SECRET;
      if (!secret) {
        console.error('AUTH_JWT_SECRET is not configured inside WebSocket Gateway');
        client.disconnect(true);
        return;
      }

      const payload = jwt.verify(token as string, secret) as any;
      const tenantId = payload.tenant_id;

      if (!tenantId) {
        console.log(`WebSocket connection rejected: No tenant_id in token (Client: ${client.id})`);
        client.disconnect(true);
        return;
      }

      // Join tenant-specific channel
      client.join(`tenant_${tenantId}`);
      console.log(`WebSocket client connected: ${client.id} joined room tenant_${tenantId}`);
    } catch (err: any) {
      console.error(`WebSocket connection verification failed: ${err.message} (Client: ${client.id})`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`WebSocket client disconnected: ${client.id}`);
  }

  broadcastStockUpdate(tenantId: number, productId: number, stockQuantity: number) {
    this.server.to(`tenant_${tenantId}`).emit('stock_updated', {
      productId,
      stockQuantity,
    });
  }

  broadcastProductUpdated(tenantId: number, product: any) {
    this.server.to(`tenant_${tenantId}`).emit('product_updated', product);
  }

  broadcastProductCreated(tenantId: number, product: any) {
    this.server.to(`tenant_${tenantId}`).emit('product_created', product);
  }

  broadcastProductDeleted(tenantId: number, productId: number) {
    this.server.to(`tenant_${tenantId}`).emit('product_deleted', productId);
  }
}
