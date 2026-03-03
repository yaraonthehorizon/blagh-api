import { loggingService } from '../services/logging.service';

/**
 * Example script demonstrating the logging system capabilities
 */
export class LoggingExample {
  
  /**
   * Demonstrate basic logging
   */
  static demonstrateBasicLogging(): void {
    console.log('\n=== Basic Logging Examples ===');
    
    loggingService.info('Application started successfully');
    loggingService.warn('High memory usage detected: 85%');
    loggingService.debug('Processing configuration files');
    loggingService.verbose('Detailed configuration parsing');
    
    // Log with metadata
    loggingService.info('User action performed', {
      action: 'login',
      timestamp: new Date().toISOString(),
      source: 'web'
    });
  }
  
  /**
   * Demonstrate context-based logging
   */
  static demonstrateContextLogging(): void {
    console.log('\n=== Context-Based Logging Examples ===');
    
    // Set context for a request
    loggingService.setContext({
      requestId: 'REQ_123456789',
      userId: 'user_789',
      module: 'USERS',
      action: 'UPDATE',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    });
    
    // All logs now include the context
    loggingService.info('Processing user update request');
    loggingService.debug('Validating user data');
    loggingService.info('User updated successfully', {
      updatedFields: ['email', 'firstName'],
      userId: 'user_789'
    });
    
    // Clear context
    loggingService.setContext({});
  }
  
  /**
   * Demonstrate error logging
   */
  static demonstrateErrorLogging(): void {
    console.log('\n=== Error Logging Examples ===');
    
    try {
      // Simulate an error
      throw new Error('Database connection timeout');
    } catch (error) {
      loggingService.error('Failed to connect to database', {
        retryCount: 3,
        timeout: 5000,
        host: 'localhost:27017'
      }, error as Error);
    }
    
    // Simulate a validation error
    const validationError = new Error('Invalid email format');
    (validationError as any).code = 'VALIDATION_ERROR';
    
    loggingService.error('User validation failed', {
      field: 'email',
      value: 'invalid-email',
      rule: 'email_format'
    }, validationError);
  }
  
  /**
   * Demonstrate business event logging
   */
  static demonstrateBusinessLogging(): void {
    console.log('\n=== Business Event Logging Examples ===');
    
    // Set context for business operations
    loggingService.setContext({
      requestId: 'REQ_987654321',
      userId: 'user_456',
      module: 'ORDERS',
      action: 'CREATE'
    });
    
    // Log business events
    loggingService.logBusinessEvent('Order Created', 'ORDERS', 'CREATE', {
      orderId: 'ORD_12345',
      amount: 299.99,
      currency: 'USD',
      items: 3
    });
    
    loggingService.logBusinessEvent('Payment Processed', 'PAYMENTS', 'PROCESS', {
      orderId: 'ORD_12345',
      paymentMethod: 'credit_card',
      amount: 299.99,
      status: 'success'
    });
    
    loggingService.logBusinessEvent('Order Shipped', 'ORDERS', 'SHIP', {
      orderId: 'ORD_12345',
      trackingNumber: 'TRK_789012',
      shippingMethod: 'express',
      estimatedDelivery: '2024-01-15'
    });
    
    // Clear context
    loggingService.setContext({});
  }
  
  /**
   * Demonstrate performance logging
   */
  static demonstratePerformanceLogging(): void {
    console.log('\n=== Performance Logging Examples ===');
    
    // Simulate fast operation
    const fastStart = Date.now();
    setTimeout(() => {
      const duration = Date.now() - fastStart;
      loggingService.logPerformance('Fast Database Query', duration, {
        query: 'SELECT * FROM users WHERE id = ?',
        resultCount: 1
      });
    }, 50);
    
    // Simulate slow operation
    const slowStart = Date.now();
    setTimeout(() => {
      const duration = Date.now() - slowStart;
      loggingService.logPerformance('Slow Database Query', duration, {
        query: 'SELECT * FROM orders WHERE created_at > ?',
        resultCount: 15000,
        warning: 'Consider adding index on created_at'
      });
    }, 1500);
  }
  
  /**
   * Demonstrate security event logging
   */
  static demonstrateSecurityLogging(): void {
    console.log('\n=== Security Event Logging Examples ===');
    
    // Set context for security monitoring
    loggingService.setContext({
      ip: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    });
    
    // Log security events with different severity levels
    loggingService.logSecurityEvent('Failed Login Attempt', 'medium', {
      username: 'admin',
      reason: 'Invalid password',
      attemptCount: 2
    });
    
    loggingService.logSecurityEvent('Suspicious Activity', 'high', {
      userId: 'user_123',
      activity: 'Multiple failed login attempts',
      ip: '192.168.1.200',
      timeWindow: '5 minutes'
    });
    
    loggingService.logSecurityEvent('Account Locked', 'critical', {
      userId: 'user_123',
      reason: 'Too many failed attempts',
      lockoutDuration: '30 minutes',
      adminNotified: true
    });
    
    // Clear context
    loggingService.setContext({});
  }
  
  /**
   * Demonstrate API logging simulation
   */
  static demonstrateApiLogging(): void {
    console.log('\n=== API Logging Examples ===');
    
    // Simulate a request object
    const mockReq = {
      method: 'POST',
      url: '/api/users',
      ip: '192.168.1.150',
      headers: {
        'x-request-id': 'REQ_API_123',
        'user-agent': 'PostmanRuntime/7.32.3',
        'authorization': 'Bearer ***REDACTED***'
      },
      body: {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe'
      },
      query: {},
      params: {},
      user: { id: 'user_999' }
    };
    
    const mockRes = {
      statusCode: 201,
      get: (header: string) => header === 'Content-Length' ? '156' : null
    };
    
    // Log API request
    loggingService.logApiRequest(mockReq, {
      requestId: 'REQ_API_123',
      userId: 'user_999'
    });
    
    // Simulate response time
    const responseTime = 245;
    
    // Log API response
    loggingService.logApiResponse(mockReq, mockRes, responseTime, {
      requestId: 'REQ_API_123',
      userId: 'user_999'
    });
    
    // Simulate API error
    const error = new Error('Database constraint violation');
    loggingService.logApiError(mockReq, { ...mockRes, statusCode: 400 }, error, responseTime, {
      requestId: 'REQ_API_123',
      userId: 'user_999'
    });
  }
  
  /**
   * Run all examples
   */
  static runAllExamples(): void {
    console.log('🚀 Starting Logging System Examples...\n');
    
    this.demonstrateBasicLogging();
    this.demonstrateContextLogging();
    this.demonstrateErrorLogging();
    this.demonstrateBusinessLogging();
    this.demonstratePerformanceLogging();
    this.demonstrateSecurityLogging();
    this.demonstrateApiLogging();
    
    console.log('\n✅ All logging examples completed!');
    console.log('\n📝 Check your configured log outputs:');
    console.log('   - Console: All logs should appear above');
    console.log('   - File: Check ./logs/app.log (if enabled)');
    console.log('   - Database: Check logs collection (if enabled)');
    console.log('   - External: Check your external service (if configured)');
  }
}

// Export for use in other files
export default LoggingExample;
