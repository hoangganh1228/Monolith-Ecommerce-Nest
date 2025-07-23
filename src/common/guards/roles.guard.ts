import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // inject the reflector to get the roles from the decorator

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    ); // return: [ 'admin' ]

    if (!requiredRoles) {
      return true; // if no roles are required, allow access
    }

    const { user } = context.switchToHttp().getRequest(); // return: { user: { id: 1, email: 'admin@gmail.com', role: 'admin' } }
    console.log('user: ', user);

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }

    return true;
  }
}
