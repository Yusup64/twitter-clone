import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // const request = context.switchToHttp().getRequest();
        // if (request.url.includes('/gzh/auth')) return data;
        if (data && data.status && data.status != 200) {
          // throw new BadGatewayException(data.message);
          return data.response;
        } else {
          return {
            statusCode: 200,
            data: data,
          };
        }
      }),
    );
  }
}
