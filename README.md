# log4nestjs
A custom logger for NestJS based on Winston with logs styled like log4j ones. This is an interface expected to work like NestJS one

## Features
- 🎨 Log4j-style formatted output
- 📁 Automatic daily log rollover
- 🔄 Built on Winston for robust logging capabilities
- 🎯 Full NestJS integration
- ⚡ Efficient logger caching per context

## Log File Management
By default, log4nestjs performs **daily log rotation** with context-based file separation:

- **Daily Rotation**: Logs are automatically rotated daily at midnight
- **Context-Based Files**: Each context gets its own set of log files for better organization
- **Automatic Archiving**: Logs older than 30 days are automatically compressed to `.gz` files
- **Date-Stamped Files**: Each log file includes the date in its name (e.g., `appservice-2025-01-16.log`)
- **Console + File Output**: Logs are written to both console (colorized) and files simultaneously

  
## Usage
### Basic Setup
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLogger } from 'log4nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Enable buffering until logger is ready
  });

  // Use custom logger
  app.useLogger(new CustomLogger());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```
### Using in Services
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  log(): void {
    this.logger.log('Getting hello message');
    this.logger.debug('Debug information');
    this.logger.warn('Warning message');
    this.logger.error('Error message');
  }
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub issue tracker](https://github.com/Ginko8192/log4nestjs/issues).
