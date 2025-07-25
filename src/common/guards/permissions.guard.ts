import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { Reflector } from '@nestjs/core';
import { Request } from "express";

interface JwtUser {
  userId: number;
  email: string;
  role: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService, 
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    if (user.role === 'Admin') return true;
    if (!user) throw new ForbiddenException('No user found in request');

    const method = request.method;
    console.log(`Method: ${method}`);
    const path = request.route.path;
    console.log(`Path: ${path}`);
    const fullUrl = request.baseUrl + request.route.path;
    console.log(`Full URL: ${fullUrl}`);

    const action = this.mapMethodToAction(method);
    const resource = this.extractResourceFromPath(fullUrl); // e.g. 'products'
    const code = `${resource}:${action}`;

    const hasPermission = await this.permissionsService.userHasPermission(
      user.userId,
      code,
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Permission denied for ${code}`);
    }

    return true;
    }

    private mapMethodToAction(method: string): string {
    switch (method) {
      case 'GET':
        return 'read';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'read';
    }
  }

  private extractResourceFromPath(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }
}