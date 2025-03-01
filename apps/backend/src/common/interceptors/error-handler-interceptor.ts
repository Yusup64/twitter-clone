import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class ErrorHandlerInterceptors implements ExceptionFilter {
  private readonly logger = new Logger(ErrorHandlerInterceptors.name); // 创建 Logger 实例

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取错误消息
    const message =
      exception?.response?.message ||
      exception.message ||
      exception?.message?.message ||
      exception?.message?.error ||
      'Unknown error';

    // 只记录服务器错误（500及以上）和非HTTP异常
    if (!exception.status || status >= 500) {
      this.logger.error(`${status} ---- ${message}\n`, exception.stack);
    }

    // 构建错误响应消息
    const mesLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        status === HttpStatus.UNAUTHORIZED
          ? await 'Unauthorized'
          : status === HttpStatus.FORBIDDEN
            ? await 'Forbidden'
            : await 'Server Error',
      err: message,
    };

    // 获取请求头信息
    const headers = request.headers;

    // 只记录服务器错误的详细信息
    if (!exception.status || status >= 500) {
      this.logger.error({
        ...mesLog,
        ip:
          headers['x-real-ip'] ||
          headers['x-forwarded-for'] ||
          headers['remote-host'],
        ua: headers['user-agent'],
      });
    }

    // 返回错误响应
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      response.status(HttpStatus.OK).json(mesLog); // 401 和 403 错误返回 200 状态码
    } else if (status === HttpStatus.NOT_FOUND) {
      response.status(HttpStatus.NOT_FOUND).json(mesLog); // 404 错误返回 200 状态码
    } else if (
      status === HttpStatus.MOVED_PERMANENTLY ||
      status === HttpStatus.TEMPORARY_REDIRECT
    ) {
      response.status(status).json(mesLog); // 301 错误返回 200 状态码
    } else {
      response.status(HttpStatus.OK).json(mesLog); // 对于其他错误，仍然返回 200 状态码
    }
  }
}
