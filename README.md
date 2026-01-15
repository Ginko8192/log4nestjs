# log4nestjs
A custom logger for NestJS based on winston with logs styled like log4j ones 

## Usage
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