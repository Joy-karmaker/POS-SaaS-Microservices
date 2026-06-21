"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InventoryGateway", {
    enumerable: true,
    get: function() {
        return InventoryGateway;
    }
});
const _websockets = require("@nestjs/websockets");
const _socketio = require("socket.io");
const _jsonwebtoken = /*#__PURE__*/ _interop_require_wildcard(require("jsonwebtoken"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let InventoryGateway = class InventoryGateway {
    handleConnection(client) {
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
            const payload = _jsonwebtoken.verify(token, secret);
            const tenantId = payload.tenant_id;
            if (!tenantId) {
                console.log(`WebSocket connection rejected: No tenant_id in token (Client: ${client.id})`);
                client.disconnect(true);
                return;
            }
            // Join tenant-specific channel
            client.join(`tenant_${tenantId}`);
            console.log(`WebSocket client connected: ${client.id} joined room tenant_${tenantId}`);
        } catch (err) {
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
            stockQuantity
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
_ts_decorate([
    (0, _websockets.WebSocketServer)(),
    _ts_metadata("design:type", typeof _socketio.Server === "undefined" ? Object : _socketio.Server)
], InventoryGateway.prototype, "server", void 0);
InventoryGateway = _ts_decorate([
    (0, _websockets.WebSocketGateway)({
        cors: {
            origin: '*'
        },
        path: '/socket.io'
    })
], InventoryGateway);

//# sourceMappingURL=inventory.gateway.js.map