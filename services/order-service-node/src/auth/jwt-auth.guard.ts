import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret = process.env.AUTH_JWT_SECRET;
      if (!secret) {
        throw new Error('AUTH_JWT_SECRET is not configured');
      }

      const payload = jwt.verify(token, secret);
      (request as any).user = payload;
    } catch (e: any) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
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
}
