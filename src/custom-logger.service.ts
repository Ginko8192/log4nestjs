import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLogger implements LoggerService {
  private loggers: Map<string, Logger> = new Map();
  private defaultLogger: Logger;
  
  /**
   * The context of the logger (can be set manually or automatically inferred).
   */
  protected context?: string;
  
  /**
   * The original context of the logger (set in the constructor).
   */
  protected originalContext?: string;

constructor(context?: string) {
  if (context) {
    this.context = context;
    this.originalContext = context;
  }

  this.defaultLogger = createLogger({
    level: "debug",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      format.errors({ stack: true }),
      this.log4jFormat()
    ),
    transports: [
      new transports.DailyRotateFile({
        filename: "logs/default-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        maxFiles: "30d",
        zippedArchive: true,
      }),
      new transports.Console({
        format: format.combine(
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          format.errors({ stack: true }),
          this.log4jFormat(),
          format.colorize({ all: true }),
        )
      })
    ],
  });
}

private getLoggerForContext(context?: string): Logger {
  if (!context) return this.defaultLogger;

  const normalizedContext = context.toLowerCase().replace(/[^a-z0-9]/g, "-");

  if (!this.loggers.has(normalizedContext)) {
    const logger = createLogger({
      level: "debug",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        format.errors({ stack: true }),
        this.log4jFormat()
      ),
      transports: [
        new transports.DailyRotateFile({
          filename: `logs/${normalizedContext}-%DATE%.log`,
          datePattern: "YYYY-MM-DD",
          maxFiles: "30d",
          zippedArchive: true,
        }),
      new transports.Console({
        format: format.combine(
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          format.errors({ stack: true }),
          this.log4jFormat(),
          format.colorize({ all: true }),
        )
      })
      ],
    });

    this.loggers.set(normalizedContext, logger);
  }

  return this.loggers.get(normalizedContext)!;
}

private log4jFormat() {
  return format.printf(({ timestamp, level, message, context, stack }) => {
    const ctx = context || this.context || "default";
    const pid = process.pid;

    // Stringify objects cleanly
    const formattedMessage =
      typeof message === "object" ? JSON.stringify(message, null, 2) : message;

    // Log4j-like pattern:
    // yyyy-MM-dd HH:mm:ss.SSS LEVEL [PID] [context] - message
    let log = `[${timestamp}] ${level.toUpperCase().padEnd(5)} [${pid}] [${ctx}] - ${formattedMessage}`;

    if (stack) log += `\n${stack}`;

    return log;
  });
}

  /**
   * Write a 'log' level log.
   */
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'info');
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, stackOrContext?: string): void;
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: any, ...optionalParams: any[]) {
    const { messages, context, stack } =
      this.getContextAndStackAndMessagesToPrint([message, ...optionalParams]);

    this.printMessages(messages, context, 'error', stack);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'warn');
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'debug');
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'verbose');
  }

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, context?: string): void;
  fatal(message: any, ...optionalParams: [...any, string?]): void;
  fatal(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'error'); // Winston doesn't have 'fatal', use 'error'
  }

  /**
   * Set logger context
   * @param context context
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Resets the logger context to the value that was passed in the constructor.
   */
  resetContext() {
    this.context = this.originalContext;
  }

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: 'info' | 'error' | 'warn' | 'debug' | 'verbose' = 'info',
    errorStack?: unknown,
  ) {
    const logger = this.getLoggerForContext(context || this.context);
    
    messages.forEach(message => {
      const logData: any = {
        message,
        context: context || this.context,
      };

      if (errorStack) {
        logData.stack = errorStack;
      }

      // Map NestJS log levels to Winston levels
      switch (logLevel) {
        case 'verbose':
          logger.verbose(logData);
          break;
        case 'debug':
          logger.debug(logData);
          break;
        case 'warn':
          logger.warn(logData);
          break;
        case 'error':
          logger.error(logData);
          break;
        case 'info':
        default:
          logger.info(logData);
          break;
      }
    });
  }

  private getContextAndMessagesToPrint(args: unknown[]) {
    if (args?.length <= 1) {
      return { messages: args, context: this.context };
    }
    const lastElement = args[args.length - 1];
    const isContext = this.isString(lastElement);
    if (!isContext) {
      return { messages: args, context: this.context };
    }
    return {
      context: lastElement as string,
      messages: args.slice(0, args.length - 1),
    };
  }

  private getContextAndStackAndMessagesToPrint(args: unknown[]) {
    if (args.length === 2) {
      return this.isStackFormat(args[1])
        ? {
            messages: [args[0]],
            stack: args[1] as string,
            context: this.context,
          }
        : {
            messages: [args[0]],
            context: args[1] as string,
          };
    }

    const { messages, context } = this.getContextAndMessagesToPrint(args);
    if (messages?.length <= 1) {
      return { messages, context };
    }
    const lastElement = messages[messages.length - 1];
    const isStack = this.isString(lastElement);
    // https://github.com/nestjs/nest/issues/11074#issuecomment-1421680060
    if (!isStack && lastElement !== undefined) {
      return { messages, context };
    }
    return {
      stack: lastElement as string,
      messages: messages.slice(0, messages.length - 1),
      context,
    };
  }

  private isStackFormat(stack: unknown) {
    if (!this.isString(stack) && stack !== undefined) {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+/.test(stack as string);
  }

  private isString(value: unknown): value is string {
    return typeof value === 'string';
  }
}