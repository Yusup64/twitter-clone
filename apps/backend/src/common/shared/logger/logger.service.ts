import {
  Injectable,
  Scope,
  LoggerService as NestLoggerService,
} from '@nestjs/common';
import { Logger, createLogger } from 'winston';
import { loggerConfig, LogLevel, LogContext } from './logger.config';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger(loggerConfig);
  }

  // 基础日志方法
  log(level: LogLevel, message: any, context?: LogContext) {
    const logMessage =
      typeof message === 'object'
        ? JSON.stringify(message)
        : message.toString();

    this.logger.log({
      level,
      message: logMessage,
      context,
    });
  }

  // 公共日志方法
  error(message: any, trace?: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      trace,
    });
  }

  warn(message: any, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: any, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: any, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  verbose(message: any, context?: LogContext) {
    this.log(LogLevel.VERBOSE, message, context);
  }

  // 特殊方法：记录 HTTP 请求
  logHttpRequest(req: any, context?: LogContext) {
    const userId = req.user?.id || 'anonymous';
    const clientIp =
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.ip ||
      'unknown';

    const logData = {
      userId,
      ip: clientIp,
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      statusCode: context?.statusCode,
      ua: req.headers['user-agent'],
      duration: context?.duration,
    };

    // 修改日志消息格式
    const message = context?.statusCode
      ? `${req.method} ${req.url} ${context.statusCode} ${context.duration || ''}`
      : `${req.method} ${req.url}`;

    // this.log(LogLevel.INFO, message, logData);
  }
  /* 
  // 特殊方法：记录性能追踪
  trackPerformance(
    operationName: string,
    startTime: number,
    context?: LogContext,
  ) {
    const duration = Date.now() - startTime;
    // 修改性能日志格式
    this.log(LogLevel.INFO, `${operationName} +${duration}ms`, context);
  } */
}
