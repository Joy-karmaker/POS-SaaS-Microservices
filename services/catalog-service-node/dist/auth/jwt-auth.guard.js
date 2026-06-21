"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JwtAuthGuard", {
    enumerable: true,
    get: function() {
        return JwtAuthGuard;
    }
});
const _common = require("@nestjs/common");
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
let JwtAuthGuard = class JwtAuthGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new _common.UnauthorizedException('No token provided');
        }
        let secret;
        try {
            secret = process.env.AUTH_JWT_SECRET;
            if (!secret) {
                throw new Error('AUTH_JWT_SECRET is not configured');
            }
            const payload = _jsonwebtoken.verify(token, secret);
            // Attach the decoded payload to the request object
            // Payload contains: id, role, tenant_id
            request.user = payload;
        } catch (e) {
            throw new _common.UnauthorizedException('Invalid or expired token');
        }
        return true;
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type === 'Bearer' && token) {
            return token;
        }
        if (request.headers.cookie) {
            const match = request.headers.cookie.match(/pos_access_token=([^;]+)/);
            if (match) {
                return match[1];
            }
        }
        return undefined;
    }
};
JwtAuthGuard = _ts_decorate([
    (0, _common.Injectable)()
], JwtAuthGuard);

//# sourceMappingURL=jwt-auth.guard.js.map