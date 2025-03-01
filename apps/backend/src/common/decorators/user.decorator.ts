import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export const UserAuth = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<any> => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Authorization token not provided');
    }

    try {
      const jwtService = new JwtService({
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Verify and decode the token
      const decoded = await jwtService.verifyAsync(token);

      // Return the full decoded payload or a specific property if `data` is provided
      return data ? decoded[data as string] : decoded;
    } catch (err) {
      throw new Error(`Invalid token: ${err.message}`);
    }
  },
);

export type UserAuthType = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
};
