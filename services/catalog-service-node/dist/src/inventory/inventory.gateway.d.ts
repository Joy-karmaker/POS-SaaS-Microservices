import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class InventoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    broadcastStockUpdate(tenantId: number, productId: number, stockQuantity: number): void;
    broadcastProductUpdated(tenantId: number, product: any): void;
    broadcastProductCreated(tenantId: number, product: any): void;
    broadcastProductDeleted(tenantId: number, productId: number): void;
}
