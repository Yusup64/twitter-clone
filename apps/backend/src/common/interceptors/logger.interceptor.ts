import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { LoggerService } from '@/src/common/shared/logger/logger.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // this.logger.logHttpRequest(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logger.logHttpRequest(request, {
            statusCode: response.statusCode,
            duration: `${Date.now() - startTime}ms`,
          });

          /* this.logger.trackPerformance(
            `${request.method} ${request.url}`,
            startTime,
          ); */
        },
        error: (error) => {
          if (!error.status || error.status >= 500) {
            this.logger.error('Request failed', error.stack, {
              method: request.method,
              url: request.url,
              errorMessage: error.message,
            });
          }
        },
      }),
    );
  }
}
