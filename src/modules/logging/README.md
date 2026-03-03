# Logging Module

A comprehensive logging system that supports multiple transports (console, file, database, external) with configurable levels and automatic request context tracking.

## Features

- **Multiple Transport Support**: Console, File, Database, External services
- **Configurable Log Levels**: ERROR, WARN, INFO, DEBUG, VERBOSE
- **Automatic Context Tracking**: Request ID, User ID, Module, Action, IP, etc.
- **Data Sanitization**: Automatically redacts sensitive information
- **Performance Monitoring**: Tracks response times and slow requests
- **Database Integration**: Stores logs in MongoDB with TTL support
- **Structured Logging**: JSON and formatted output support

## Configuration

### Environment Variables

```bash
# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
# Log Level: error, warn, info, debug, verbose (default: info)
LOG_LEVEL=info

# Log Format: json, simple, colored (default: colored)
LOG_FORMAT=colored

# Console Logging
LOG_COLORS=true

# File Logging
LOG_FILE_ENABLED=false
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE=10m
LOG_FILE_MAX_FILES=5

# Database Logging
LOG_DATABASE_ENABLED=false
LOG_DATABASE_COLLECTION=logs
LOG_DATABASE_TTL_DAYS=30

# External Logging Services
LOG_EXTERNAL_ENABLED=false
LOG_EXTERNAL_TYPE=serilog
LOG_EXTERNAL_URL=
LOG_EXTERNAL_API_KEY=
LOG_EXTERNAL_APP_NAME=diagramers-api
```

## Usage

### Basic Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

// Simple logging
loggingService.info('User logged in successfully');
loggingService.warn('High memory usage detected');
loggingService.error('Database connection failed', { retryCount: 3 });

// With metadata
loggingService.info('Order created', {
  orderId: '12345',
  amount: 99.99,
  userId: 'user123'
});
```

### Request Context Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

// Set context for the current request
loggingService.setContext({
  requestId: 'REQ_123',
  userId: 'user456',
  module: 'USERS',
  action: 'CREATE',
  ip: '192.168.1.1'
});

// All subsequent logs will include this context
loggingService.info('Processing user creation');
loggingService.debug('Validating user data');
```

### API Request/Response Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

// In your middleware or controller
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  loggingService.logApiRequest(req, {
    requestId: req.headers['x-request-id'],
    userId: req.user?.id
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    loggingService.logApiResponse(req, res, responseTime, {
      requestId: req.headers['x-request-id'],
      userId: req.user?.id
    });
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});
```

### Error Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

try {
  // Your code here
} catch (error) {
  // Log error with context
  loggingService.error('Failed to process order', {
    orderId: '12345',
    userId: 'user123'
  }, error);
  
  // Re-throw or handle error
  throw error;
}
```

### Database Operation Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

const startTime = Date.now();
try {
  const result = await UserModel.create(userData);
  const duration = Date.now() - startTime;
  
  // Log successful operation
  loggingService.logDatabaseOperation('CREATE', 'users', userData, duration, {
    requestId: req.headers['x-request-id']
  });
  
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  
  // Log database error
  loggingService.logDatabaseError('CREATE', 'users', userData, error, {
    requestId: req.headers['x-request-id']
  });
  
  throw error;
}
```

### Business Event Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

// Log business events
loggingService.logBusinessEvent('Order Shipped', 'ORDERS', 'SHIP', {
  orderId: '12345',
  trackingNumber: 'TRK123',
  shippingMethod: 'express'
}, {
  requestId: req.headers['x-request-id'],
  userId: req.user?.id
});
```

### Performance Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

const startTime = Date.now();
// Your operation here
const duration = Date.now() - startTime;

loggingService.logPerformance('Database Query', duration, {
  query: 'SELECT * FROM users WHERE status = "active"',
  resultCount: 150
}, {
  requestId: req.headers['x-request-id']
});
```

### Security Event Logging

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

// Log security events with severity levels
loggingService.logSecurityEvent('Failed Login Attempt', 'high', {
  ip: '192.168.1.100',
  username: 'admin',
  reason: 'Invalid password'
}, {
  requestId: req.headers['x-request-id'],
  ip: req.ip
});

loggingService.logSecurityEvent('Suspicious Activity', 'critical', {
  userId: 'user123',
  activity: 'Multiple failed login attempts',
  ip: '192.168.1.100'
}, {
  requestId: req.headers['x-request-id'],
  userId: 'user123'
});
```

## Middleware Integration

### Automatic Request Logging

```typescript
import { LoggingMiddleware } from '../core/middleware/logging-middleware';

// Add to your Express app
app.use(LoggingMiddleware.logRequest());        // Logs all requests
app.use(LoggingMiddleware.logPerformance());    // Logs performance metrics
app.use(LoggingMiddleware.logError());          // Logs errors

// Or use individual middleware
app.use(LoggingMiddleware.logRequest());
app.use(LoggingMiddleware.logPerformance());
```

### Error Handling

```typescript
// Global error handler
app.use(LoggingMiddleware.logError());

// Or custom error handler
app.use((error, req, res, next) => {
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  
  loggingService.logApiError(req, res, error, responseTime, {
    requestId: req.headers['x-request-id'],
    userId: req.user?.id
  });
  
  next(error);
});
```

## Database Logging

### Enable Database Logging

```bash
LOG_DATABASE_ENABLED=true
LOG_DATABASE_COLLECTION=logs
LOG_DATABASE_TTL_DAYS=30
```

### Query Logs

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

// Query logs with filters
const logs = await loggingService.queryLogs({
  level: 'ERROR',
  module: 'USERS',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  limit: 100
});

// Get log statistics
const stats = await loggingService.getLogStats();

// Clean old logs
await loggingService.cleanOldLogs();
```

## File Logging

### Enable File Logging

```bash
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE=10m
LOG_FILE_MAX_FILES=5
```

## External Logging Services

### Sentry Integration

```bash
LOG_EXTERNAL_ENABLED=true
LOG_EXTERNAL_TYPE=sentry
LOG_EXTERNAL_URL=https://your-sentry-dsn@sentry.io/project
LOG_EXTERNAL_APP_NAME=diagramers-api
```

### Loggly Integration

```bash
LOG_EXTERNAL_ENABLED=true
LOG_EXTERNAL_TYPE=loggly
LOG_EXTERNAL_URL=https://logs-01.loggly.com/inputs/your-token/tag/http/
LOG_EXTERNAL_APP_NAME=diagramers-api
```

## Best Practices

1. **Set Context Early**: Set request context as early as possible in your middleware
2. **Use Appropriate Levels**: 
   - ERROR: For errors that need immediate attention
   - WARN: For potentially harmful situations
   - INFO: For general information about application flow
   - DEBUG: For detailed information useful for debugging
   - VERBOSE: For very detailed information
3. **Sanitize Sensitive Data**: The system automatically redacts common sensitive fields
4. **Include Relevant Metadata**: Add context that helps with debugging and monitoring
5. **Monitor Performance**: Use performance logging to identify bottlenecks
6. **Regular Cleanup**: Enable TTL for database logs to prevent storage issues

## Examples

### Complete Controller Example

```typescript
import { loggingService } from '../modules/logging/services/logging.service';

export class UserController {
  async createUser(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      // Set context for this request
      loggingService.setContext({
        requestId: req.headers['x-request-id'],
        userId: req.user?.id,
        module: 'USERS',
        action: 'CREATE',
        ip: req.ip
      });
      
      loggingService.info('Creating new user', {
        email: req.body.email,
        role: req.body.role
      });
      
      // Validate input
      const validationResult = await this.validateUser(req.body);
      if (!validationResult.valid) {
        loggingService.warn('User validation failed', {
          errors: validationResult.errors
        });
        return res.status(400).json({ errors: validationResult.errors });
      }
      
      // Create user
      const user = await this.userService.createUser(req.body);
      
      const duration = Date.now() - startTime;
      loggingService.info('User created successfully', {
        userId: user.id,
        duration: `${duration}ms`
      });
      
      res.status(201).json(user);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggingService.error('Failed to create user', {
        email: req.body.email,
        duration: `${duration}ms`
      }, error);
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

This logging system provides comprehensive coverage for all your application needs while maintaining performance and flexibility.
