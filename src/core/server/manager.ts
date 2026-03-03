import * as express from 'express';
import { Application, Request, Response, NextFunction } from 'express';
import * as cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../logging';
import { PluginManager } from '../../plugins/base/manager';
import { Result } from '../../shared/types/result';
import { AuditMessageType, ResponseCode } from '../../shared/constants/enums';
import { handleResponse } from '../../shared/utils/handle-response';
import * as swaggerUi from 'swagger-ui-express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerJSDoc = require('swagger-jsdoc');
import routes from '../../routes';
import * as path from 'path';
import { AuthMiddleware } from '../middleware/auth-middleware';
import { LoggingMiddleware } from '../middleware/logging-middleware';


export interface ServerManagerConfig {
  port: number;
  host: string;
  cors: boolean;
  compression: boolean;
  security: boolean;
  socketio?: {
    enabled: boolean;
    cors?: {
      origin: string | string[];
      methods: string[];
    };
  };
}

export interface SocketEvent {
  event: string;
  handler: (socket: any, data: any) => void;
  description?: string;
}

export class ServerManager {
  private app: Application;
  private config: ServerManagerConfig;
  private pluginManager: PluginManager;
  private databaseManager: any = null;
  private server: any = null;
  private io: SocketIOServer | null = null;
  private socketEvents: Map<string, SocketEvent> = new Map();

  constructor(config: ServerManagerConfig, pluginManager: PluginManager) {
    this.config = config;
    this.pluginManager = pluginManager;
    this.app = express();
    this.setupMiddleware();
    this.setupSwagger();
    this.setupSocketIO();
  }

  setDatabaseManager(databaseManager: any): void {
    this.databaseManager = databaseManager;
    // Make database manager available to routes
    this.app.set('databaseManager', databaseManager);
  }

  private setupMiddleware(): void {
    // Security middleware - simplified for now
    if (this.config.security) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
      });
    }

    // CORS middleware
    if (this.config.cors) {
      this.app.use(cors());
    }

    // Compression middleware - simplified for now
    if (this.config.compression) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        // Basic compression logic would go here
        next();
      });
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging is now handled by the centralized request middleware
    // No need for global logging middleware here



    // Serve static files for Postman collection
    this.app.use('/public', express.static(path.join(process.cwd(), 'public')));
  }

  private setupSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Diagramers API',
          version: '1.0.0',
          description: 'API documentation for Diagramers',
        },
        servers: [
          {
            url: '/',
            description: 'API Server'
          }
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT token for authentication'
            }
          },
          parameters: {
            RequestIdentifier: {
              name: 'x-request-id',
              in: 'header',
              description: 'Request identifier for tracking (optional - will be auto-generated if not provided)',
              required: false,
              schema: {
                type: 'string',
                example: 'USERS_GETALL_123456789'
              }
            },
            CorrelationId: {
              name: 'x-correlation-id',
              in: 'header',
              description: 'Correlation ID for request tracking (alternative to x-request-id)',
              required: false,
              schema: {
                type: 'string',
                example: 'corr_123456789'
              }
            }
          },
          schemas: {
            Result: {
              type: 'object',
              properties: {
                data: {
                  description: 'Response data',
                  oneOf: [
                    { type: 'object' },
                    { type: 'array' },
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                    { type: 'null' }
                  ]
                },
                statusCode: {
                  type: 'integer',
                  description: 'Response status code',
                  example: 1000
                },
                errors: {
                  type: 'array',
                  description: 'Array of error messages',
                  items: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        description: 'Error message'
                      }
                    }
                  }
                },
                requestIdentifier: {
                  type: 'string',
                  description: 'Unique request identifier for tracking',
                  example: 'USERS_GETALL_123456789'
                },
                messages: {
                  type: 'array',
                  description: 'Array of informational messages',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['info', 'warn', 'error'],
                        description: 'Message type'
                      },
                      message: {
                        type: 'string',
                        description: 'Message content'
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Message timestamp'
                      }
                    }
                  }
                },
                additionalInfo: {
                  type: 'object',
                  description: 'Additional information for debugging/auditing'
                },
                user: {
                  type: 'object',
                  description: 'Authenticated user information',
                  nullable: true
                }
              },
              required: ['statusCode', 'errors', 'requestIdentifier'],
              example: {
                data: { message: 'Success' },
                statusCode: 1000,
                errors: [],
                requestIdentifier: 'USERS_GETALL_123456789',
                messages: [
                  {
                    type: 'info',
                    message: 'Operation completed successfully',
                    timestamp: '2024-01-01T00:00:00.000Z'
                  }
                ],
                additionalInfo: {},
                user: {
                  id: 'user123',
                  email: 'user@example.com',
                  role: 'admin'
                }
              }
            },
            Error: {
              type: 'object',
              properties: {
                data: {
                  type: 'null',
                  description: 'No data on error'
                },
                statusCode: {
                  type: 'integer',
                  description: 'Error status code',
                  example: 1002
                },
                errors: {
                  type: 'array',
                  description: 'Array of error messages',
                  items: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        description: 'Error message'
                      }
                    }
                  }
                },
                requestIdentifier: {
                  type: 'string',
                  description: 'Request identifier for tracking',
                  example: 'USERS_GETALL_ERROR_123456789'
                },
                messages: {
                  type: 'array',
                  description: 'Array of informational messages'
                },
                additionalInfo: {
                  type: 'object',
                  description: 'Additional error information'
                },
                user: {
                  type: 'object',
                  description: 'User information if available',
                  nullable: true
                }
              },
              required: ['statusCode', 'errors', 'requestIdentifier'],
              example: {
                data: null,
                statusCode: 1002,
                errors: [
                  {
                    message: 'Operation failed'
                  }
                ],
                requestIdentifier: 'USERS_GETALL_ERROR_123456789',
                messages: [
                  {
                    type: 'error',
                    message: 'Operation failed',
                    timestamp: '2024-01-01T00:00:00.000Z'
                  }
                ],
                additionalInfo: {},
                user: null
              }
            }
          }
        },
        security: [
          {
            BearerAuth: []
          }
        ],
      },
      apis: ['./src/modules/**/*.ts'], // Scan all module files for JSDoc comments
    };
    const swaggerSpec = swaggerJSDoc(swaggerOptions);

    // Post-process to inject global parameters into all routes
    this.injectGlobalParameters(swaggerSpec);

    // Serve Swagger UI static files
    this.app.use('/api-docs', express.static(require('swagger-ui-dist').absolutePath()));

    // Serve the Swagger UI HTML
    this.app.get('/api-docs', (req: Request, res: Response) => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="description" content="SwaggerUI" />
            <title>SwaggerUI</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
        </head>
        <body>
            <div style="margin: 20px 0; text-align: right;">
              <a href="/public/postman_collection.json" download>
                <button style="padding: 8px 16px; font-size: 16px;">Download Postman Collection</button>
              </a>
            </div>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
            <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js" crossorigin></script>
            <script>
                window.onload = () => {
                    const ui = SwaggerUIBundle({
                        url: '/api-docs/swagger.json',
                        dom_id: '#swagger-ui',
                        deepLinking: true,
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIStandalonePreset
                        ],
                        plugins: [
                            SwaggerUIBundle.plugins.DownloadUrl
                        ],
                        layout: "StandaloneLayout"
                    });
                };
            </script>
        </body>
        </html>
      `;
      res.send(html);
    });

    // Serve the OpenAPI spec as JSON
    this.app.get('/api-docs/swagger.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  /**
   * Inject global parameters into all Swagger routes
   */
  private injectGlobalParameters(spec: any): void {
    if (spec.paths) {
      Object.keys(spec.paths).forEach(path => {
        Object.keys(spec.paths[path]).forEach(method => {
          if (method !== 'parameters') {
            const operation = spec.paths[path][method];
            
            // Initialize parameters array if it doesn't exist
            if (!operation.parameters) {
              operation.parameters = [];
            }

            // Add global parameters if they don't already exist
            const globalParams = [
              {
                $ref: '#/components/parameters/RequestIdentifier'
              },
              {
                $ref: '#/components/parameters/CorrelationId'
              }
            ];

            globalParams.forEach(globalParam => {
              const paramExists = operation.parameters.some((param: any) => 
                param.$ref === globalParam.$ref
              );
              
              if (!paramExists) {
                operation.parameters.push(globalParam);
              }
            });

            // Ensure all operations have security defined
            if (!operation.security) {
              operation.security = [{ BearerAuth: [] }];
            }
          }
        });
      });
    }
  }

  private setupSocketIO(): void {
    if (this.config.socketio?.enabled) {
      this.server = createServer(this.app);
      this.io = new SocketIOServer(this.server, {
        cors: this.config.socketio.cors || {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      // Setup Socket.IO event handlers
      this.setupSocketEvents();

      logger.info('[ServerManager] Socket.IO enabled');
    }
  }

  private setupSocketEvents(): void {
    if (!this.io) return;

    // Connection event
    this.io.on('connection', (socket) => {
      logger.info(`[Socket.IO] Client connected: ${socket.id}`);

      // Register all custom events
      for (const [eventName, eventHandler] of this.socketEvents) {
        socket.on(eventName, (data) => {
          try {
            eventHandler.handler(socket, data);
          } catch (error) {
            logger.error(`[Socket.IO] Error handling event ${eventName}:`, error);
            socket.emit('error', { message: 'Internal server error' });
          }
        });
      }

      // Disconnect event
      socket.on('disconnect', () => {
        logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
      });

      // Error event
      socket.on('error', (error) => {
        logger.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Register a Socket.IO event handler
   */
  registerSocketEvent(event: SocketEvent): void {
    this.socketEvents.set(event.event, event);
    logger.info(`[Socket.IO] Registered event: ${event.event} - ${event.description || 'No description'}`);
  }

  /**
   * Emit an event to all connected clients
   */
  emitToAll(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
      logger.debug(`[Socket.IO] Emitted to all: ${event}`);
    }
  }

  /**
   * Emit an event to a specific room
   */
  emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
      logger.debug(`[Socket.IO] Emitted to room ${room}: ${event}`);
    }
  }

  /**
   * Get Socket.IO server instance
   */
  getSocketIO(): SocketIOServer | null {
    return this.io;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('[ServerManager] Initializing server...');

      // Start plugins
      await this.pluginManager.startPlugins();

      // Initialize AuthMiddleware with auth plugin
      this.initializeAuthMiddleware();

      // Register plugin routes
      this.registerPluginRoutes();

      // Error handling middleware
      this.setupErrorHandling();

      logger.info('[ServerManager] Server initialized successfully');
    } catch (error) {
      logger.error('[ServerManager] Failed to initialize server:', error);
      throw error;
    }
  }

  private registerPluginRoutes(): void {
    // Register public admin routes first (bypass middleware)
    this.app.get('/admin', (req: Request, res: Response) => {
      res.redirect('/admin/login');
    });
    
    this.app.get('/admin/login', (req: Request, res: Response) => {
      const loginPath = path.join(process.cwd(), 'public/admin/login.html');
      res.sendFile(loginPath);
    });

    // Register all routes from routes/index.ts at root level
    this.app.use('/', routes);

    // Plugin routes will be registered through a different mechanism
    // For now, we'll add a basic API info endpoint
    this.app.get('/api/plugins', (req: Request, res: Response) => {
      const plugins = this.pluginManager.getPlugins();
      const pluginInfo = plugins.map(plugin => {
        const metadata = plugin.getMetadata();
        return {
          name: metadata.name,
          version: metadata.version,
          description: metadata.description,
          enabled: plugin.isEnabled()
        };
      });
      const result = Result.success({ plugins: pluginInfo });
      result.addMessage(AuditMessageType.info, 'ServerManager', 'plugins', 'Plugin info retrieved');
      handleResponse(res, result);
    });

    // Socket.IO info endpoint
    if (this.config.socketio?.enabled) {
      this.app.get('/api/socket-info', (req: Request, res: Response) => {
        const events = Array.from(this.socketEvents.values()).map(event => ({
          event: event.event,
          description: event.description
        }));
        const result = Result.success({
          enabled: true,
          events: events
        });
        result.addMessage(AuditMessageType.info, 'ServerManager', 'socket-info', 'Socket info retrieved');
        handleResponse(res, result);
      });
    }
  }

  private initializeAuthMiddleware(): void {
    try {
      // Get the auth plugin from plugin manager
      const authPlugin = this.pluginManager.getPlugin('auth');
      if (authPlugin) {
        // Initialize AuthMiddleware with the auth module from the plugin
        const authModule = (authPlugin as any).getAuthModule?.() || authPlugin;
        AuthMiddleware.initialize(authModule);
        logger.info('[ServerManager] AuthMiddleware initialized successfully');
      } else {
        logger.warn('[ServerManager] Auth plugin not found, AuthMiddleware not initialized');
      }
    } catch (error) {
      logger.error('[ServerManager] Failed to initialize AuthMiddleware:', error);
    }
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      const result = Result.notFound(`Route ${req.method} ${req.path} not found`);
      result.addMessage(AuditMessageType.warn, 'ServerManager', '404', 'Route not found');
      handleResponse(res, result);
    });

    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      if (!error || !error.message) {
        logger.warn('Dangerous input may cause a crash');
      }
      logger.error('[ServerManager] Unhandled error:', error);
      const result = Result.error('Internal Server Error');
      result.addMessage(AuditMessageType.warn, 'ServerManager', 'setupErrorHandling', 'Dangerous input may cause a crash');
      handleResponse(res, result);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const serverToUse = this.server || this.app;
        const port = this.config.port;
        const host = this.config.host;

        serverToUse.listen(port, host, () => {
          logger.info(`[ServerManager] Server started on http://${host}:${port}/api-docs`);
          if (this.config.socketio?.enabled) {
            logger.info(`[ServerManager] Socket.IO available at ws://${host}:${port}`);
          }
          resolve();
        });

        serverToUse.on('error', (error: any) => {
          logger.error('[ServerManager] Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverToUse = this.server || this.app;

      if (serverToUse) {
        serverToUse.close((error: any) => {
          if (error) {
            logger.error('[ServerManager] Error stopping server:', error);
            reject(error);
          } else {
            logger.info('[ServerManager] Server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): Application {
    return this.app;
  }
} 