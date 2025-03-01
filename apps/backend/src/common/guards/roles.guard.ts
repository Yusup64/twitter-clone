import { Role, Permission } from '@/src/utils/enum/user';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// 自定义装饰器，用于在控制器方法上标记所需的角色和权限
export const Roles = (roles?: Role[]) => {
  return SetMetadata('roles', roles || []);
};

export const Permissions = (permissions?: Permission[]) => {
  return SetMetadata('permissions', permissions || []);
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 首先检查是否是公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 获取当前方法上的角色和权限要求
    const requiredRoles =
      this.reflector.get<Role[]>('roles', context.getHandler()) || [];
    const requiredPermissions =
      this.reflector.get<Permission[]>('permissions', context.getHandler()) ||
      [];

    // 如果没有任何角色和权限要求，直接通过
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    // 获取当前请求的用户
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果需要角色/权限检查但没有用户信息，拒绝访问
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    // 检查角色权限
    const hasRequiredRole =
      requiredRoles.length === 0 ||
      requiredRoles.some((role) => (user.role & role) !== 0);

    // 检查具体权限
    const hasRequiredPermissions =
      requiredPermissions.length === 0 ||
      requiredPermissions.every(
        (permission) =>
          // 超级权限直接通过
          (user.permissions & Permission.SUPER_ACCESS) !== 0 ||
          (user.permissions & permission) !== 0,
      );

    // 同时满足角色和权限要求
    if (!hasRequiredRole || !hasRequiredPermissions) {
      throw new ForbiddenException('Forbidden');
    }

    return true;
  }
}
