"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt = __importStar(require("jsonwebtoken"));
let InventoryGateway = class InventoryGateway {
    server;
    handleConnection(client) {
        try {
            let token = client.handshake.auth?.token || client.handshake.query?.token;
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
            const payload = jwt.verify(token, secret);
            const tenantId = payload.tenant_id;
            if (!tenantId) {
                console.log(`WebSocket connection rejected: No tenant_id in token (Client: ${client.id})`);
                client.disconnect(true);
                return;
            }
            client.join(`tenant_${tenantId}`);
            console.log(`WebSocket client connected: ${client.id} joined room tenant_${tenantId}`);
        }
        catch (err) {
            console.error(`WebSocket connection verification failed: ${err.message} (Client: ${client.id})`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        console.log(`WebSocket client disconnected: ${client.id}`);
    }
    broadcastStockUpdate(tenantId, productId, stockQuantity) {
        this.server.to(`tenant_${tenantId}`).emit('stock_updated', {
            productId,
            stockQuantity,
        });
    }
    broadcastProductUpdated(tenantId, product) {
        this.server.to(`tenant_${tenantId}`).emit('product_updated', product);
    }
    broadcastProductCreated(tenantId, product) {
        this.server.to(`tenant_${tenantId}`).emit('product_created', product);
    }
    broadcastProductDeleted(tenantId, productId) {
        this.server.to(`tenant_${tenantId}`).emit('product_deleted', productId);
    }
};
exports.InventoryGateway = InventoryGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], InventoryGateway.prototype, "server", void 0);
exports.InventoryGateway = InventoryGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        path: '/socket.io',
    })
], InventoryGateway);
//# sourceMappingURL=inventory.gateway.js.map