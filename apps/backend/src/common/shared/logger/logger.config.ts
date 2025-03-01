import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { format } from 'winston';
import * as path from 'path';
// import * as LokiTransport from 'winston-loki';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LokiTransport = require('winston-loki');

// 日志级别定义
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

// 日志上下文接口
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

// 添加颜色配置
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan',
};

winston.addColors(colors);

// 自定义格式化
const nestLikeFormat = format.printf(
  ({ level, message, timestamp, context }) => {
    // 获取进程ID
    const pid = process.pid;

    // 设置颜色
    const colorizer = format.colorize();
    const levelUpper = level.toUpperCase();

    // 格式化时间
    const formattedDate = new Date(timestamp as string).toLocaleString(
      'en-US',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      },
    );

    // 如果context是对象，格式化它
    const contextStr =
      typeof context === 'object'
        ? `\n${JSON.stringify(context, null, 2)}`
        : context
          ? ` ${context}`
          : '';

    return colorizer.colorize(
      level,
      `[INFO] ${pid}  - ${formattedDate}     ${levelUpper} ` +
        `${message}${contextStr}`,
    );
  },
);

// 修改日志格式化配置
const logFormat = {
  console: format.combine(format.timestamp(), format.ms(), nestLikeFormat),

  file: format.combine(format.timestamp(), format.json()),
};

// 创建日志传输配置
const createFileTransport = (level: string, filename: string) =>
  new DailyRotateFile({
    level,
    filename: path.join(process.cwd(), `logs/${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  });

// 添加 Loki Transport
const createLokiTransport = () =>
  new LokiTransport({
    host: 'http://localhost:3100', // Loki 服务地址
    labels: { app: 'rental-backend' }, // 标签用于分类日志
    json: true,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    level: 'silly', // Loki 捕获所有级别的日志
    // interval: 100, // 批量发送时间间隔
  });

// 日志配置
export const loggerConfig: winston.LoggerOptions = {
  level: 'silly', // 捕获所有级别的日志
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: logFormat.console,
      level: 'silly', // 覆盖控制台级别，确保捕获所有日志
    }),

    // 文件输出 - 错误日志
    createFileTransport('error', 'error'),

    // 文件输出 - 综合日志
    createFileTransport('silly', 'combined'),

    // Loki 输出 - 推送所有日志
    createLokiTransport(),
  ],
};
