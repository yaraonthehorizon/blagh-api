import { Request, Response } from 'express';
import { OdooService } from '../services/odoo.service';
import { OdooConnectionConfig } from '../../../core/config/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../../../shared/types/result';
import { ResponseCode } from '../../../shared/constants/enums';
import { handleResponse } from '../../../shared/utils/handle-response';

/**
 * @openapi
 * components:
 *   schemas:
 *     OdooConnectionStatus:
 *       type: object
 *       properties:
 *         isConnected:
 *           type: boolean
 *           description: Whether the connection to Odoo is active
 *         uid:
 *           type: number
 *           description: Odoo user ID
 *         sessionId:
 *           type: string
 *           description: Session identifier
 *         serverUrl:
 *           type: string
 *           description: Odoo server URL
 *         database:
 *           type: string
 *           description: Connected database name
 *     
 *     OdooUser:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: User ID
 *         name:
 *           type: string
 *           description: User name
 *         login:
 *           type: string
 *           description: Login username
 *         email:
 *           type: string
 *           description: Email address
 *         active:
 *           type: boolean
 *           description: Whether user is active
 *         company_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Company IDs
 *         partner_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Partner ID
 *     
 *     OdooCustomer:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Customer ID
 *         name:
 *           type: string
 *           description: Customer name
 *         email:
 *           type: string
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         is_company:
 *           type: boolean
 *           description: Whether it's a company
 *         customer_rank:
 *           type: number
 *           description: Customer ranking
 *         supplier_rank:
 *           type: number
 *           description: Supplier ranking
 *         street:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         country_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Country ID
 *     
 *     OdooLead:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Lead ID
 *         name:
 *           type: string
 *           description: Lead name
 *         partner_name:
 *           type: string
 *           description: Partner name
 *         contact_name:
 *           type: string
 *           description: Contact name
 *         email_from:
 *           type: string
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         type:
 *           type: string
 *           enum: [lead, opportunity]
 *           description: Lead type
 *         description:
 *           type: string
 *           description: Lead description
 *         probability:
 *           type: number
 *           description: Success probability
 *         expected_revenue:
 *           type: number
 *           description: Expected revenue
 *         date_deadline:
 *           type: string
 *           format: date
 *           description: Deadline date
 *     
 *     OdooOpportunity:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Opportunity ID
 *         name:
 *           type: string
 *           description: Opportunity name
 *         partner_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Partner ID
 *         expected_revenue:
 *           type: number
 *           description: Expected revenue
 *         probability:
 *           type: number
 *           description: Success probability
 *         date_deadline:
 *           type: string
 *           format: date
 *           description: Deadline date
 *         stage_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Stage ID
 *     
 *     OdooProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         default_code:
 *           type: string
 *           description: Internal reference
 *         list_price:
 *           type: number
 *           description: Sales price
 *         standard_price:
 *           type: number
 *           description: Cost price
 *         type:
 *           type: string
 *           enum: [consu, service, product]
 *           description: Product type
 *         categ_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Category ID
 *         active:
 *           type: boolean
 *           description: Whether product is active
 *     
 *     OdooOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Order ID
 *         name:
 *           type: string
 *           description: Order reference
 *         partner_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Customer ID
 *         date_order:
 *           type: string
 *           format: date-time
 *           description: Order date
 *         amount_total:
 *           type: number
 *           description: Total amount
 *         state:
 *           type: string
 *           enum: [draft, sent, sale, done, cancelled]
 *           description: Order state
 *         payment_term_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Payment term ID
 *     
 *     OdooInvoice:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Invoice ID
 *         name:
 *           type: string
 *           description: Invoice reference
 *         partner_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Customer ID
 *         date_invoice:
 *           type: string
 *           format: date
 *           description: Invoice date
 *         amount_total:
 *           type: number
 *           description: Total amount
 *         state:
 *           type: string
 *           enum: [draft, open, paid, cancelled]
 *           description: Invoice state
 *         payment_term_id:
 *           type: array
 *           items:
 *             type: number
 *           description: Payment term ID
  *     
  *     OdooTicket:
  *       type: object
  *       description: |
  *         Helpdesk ticket. Many2one fields are returned as arrays [id, display_name].
  *         - priority options (string):
  *           - "0": Normal
  *           - "1": Low
  *           - "2": High
  *           - "3": Very High
  *         - stage_id example: [3, "In Progress"], team_id example: [1, "Support"], user_id example: [7, "Agent Name"]
  *       properties:
  *         id:
  *           type: number
  *           description: Ticket ID
  *         name:
  *           type: string
  *           description: Ticket subject
  *         description:
  *           type: string
  *           description: Ticket description/body
  *         partner_id:
  *           type: array
  *           items:
  *             type: number
  *           description: Related customer (Many2one)
  *         priority:
  *           type: string
  *           enum: ["0", "1", "2", "3"]
  *           description: Priority code (0 Normal, 1 Low, 2 High, 3 Very High)
  *         stage_id:
  *           type: array
  *           items:
  *             type: number
  *           description: Stage (Many2one) returned as [id, name]
  *         team_id:
  *           type: array
  *           items:
  *             type: number
  *           description: Helpdesk team (Many2one) returned as [id, name]
  *         user_id:
  *           type: array
  *           items:
  *             type: number
  *           description: Assigned user (Many2one) returned as [id, name]
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: null
 *         statusCode:
 *           type: number
 *           example: 0
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *         requestIdentifier:
 *           type: string
 *         messages:
 *           type: null
 *         additionalInfo:
 *           type: null
 *         user:
 *           type: null
 *     
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *         statusCode:
 *           type: number
 *           example: 1000
 *         errors:
 *           type: array
 *           items: {}
 *         requestIdentifier:
 *           type: string
 *         messages:
 *           type: null
 *         additionalInfo:
 *           type: null
 *         user:
 *           type: null
 */

export class OdooController {
  private odooService: OdooService | null = null;

  constructor() {
    // Initialize with default config - will be overridden by actual config
    const defaultConfig: OdooConnectionConfig = {
      url: process.env.ODOO_URL || 'localhost',
      port: parseInt(process.env.ODOO_PORT || '8069'),
      protocol: (process.env.ODOO_PROTOCOL as 'http' | 'https') || 'http',
      database: process.env.ODOO_DATABASE || 'odoo',
      username: process.env.ODOO_USERNAME || 'admin',
      password: process.env.ODOO_PASSWORD || 'admin',
      company: parseInt(process.env.ODOO_COMPANY || '1'),
      timeout: parseInt(process.env.ODOO_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.ODOO_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.ODOO_RETRY_DELAY || '1000')
    };

    this.odooService = new OdooService(defaultConfig);
  }

  /**
   * @openapi
   * /api/odoo/connect:
   *   post:
   *     summary: Initialize Odoo connection
   *     description: Establishes connection to Odoo server using configured credentials
   *     tags: [Odoo]
   *     responses:
   *       200:
   *         description: Connection established successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               data: true
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Connection failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               data: null
   *               statusCode: 0
   *               errors: [{ message: "Failed to connect to Odoo server" }]
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   */
  async initializeConnection(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      if (!this.odooService) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo service not initialized' }], null, requestId));
        return;
      }
      const result = await this.odooService.initialize();
      result.requestIdentifier = requestId;
      handleResponse(res, result as unknown as Result<any>);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: error.message }], null, uuidv4()));
    }
  }

  /**
   * @openapi
   * /api/odoo/status:
   *   get:
   *     summary: Get Odoo connection status
   *     description: Returns the current connection status to Odoo server
   *     tags: [Odoo]
   *     responses:
   *       200:
   *         description: Connection status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/OdooConnectionStatus'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 isConnected: true
   *                 uid: 1
   *                 sessionId: "session_123"
   *                 serverUrl: "http://localhost:8069"
   *                 database: "odoo"
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to get connection status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      if (!this.odooService) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo service not initialized' }], null, requestId));
        return;
      }
      const status = this.odooService.getConnectionStatus();
      handleResponse(res, new Result(status, ResponseCode.Ok, [], null, requestId));
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: error.message }], null, uuidv4()));
    }
  }

  /**
   * @openapi
   * /api/odoo/users:
   *   get:
   *     summary: Get Odoo users
   *     description: Retrieve list of users from Odoo system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for users
   *         example: { "active": true }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "login", "email"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooUser'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "Administrator"
   *                   login: "admin"
   *                   email: "admin@example.com"
   *                   active: true
   *                   company_id: [1]
   *                   partner_id: [1]
   *                 - id: 2
   *                   name: "John Doe"
   *                   login: "john.doe"
   *                   email: "john@example.com"
   *                   active: true
   *                   company_id: [1]
   *                   partner_id: [2]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getUsers(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/users/{id}:
   *   get:
   *     summary: Get Odoo user by ID
   *     description: Retrieve a specific user from Odoo system by ID
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *         example: 1
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "login", "email"]
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/OdooUser'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 id: 1
   *                 name: "Administrator"
   *                 login: "admin"
   *                 email: "admin@example.com"
   *                 active: true
   *                 company_id: [1]
   *                 partner_id: [1]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to retrieve user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const { fields = [] } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getUserById(
        parseInt(id),
        Array.isArray(fields) ? fields as string[] : []
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/customers:
   *   get:
   *     summary: Get Odoo customers
   *     description: Retrieve list of customers/partners from Odoo system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for customers
   *         example: { "is_company": true, "customer_rank": { ">": 0 } }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "email", "phone", "is_company"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Customers retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooCustomer'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "ABC Company"
   *                   email: "contact@abc.com"
   *                   phone: "+1234567890"
   *                   is_company: true
   *                   customer_rank: 10
   *                   supplier_rank: 0
   *                   street: "123 Main St"
   *                   city: "New York"
   *                   country_id: [1]
   *                 - id: 2
   *                   name: "John Smith"
   *                   email: "john@example.com"
   *                   phone: "+0987654321"
   *                   is_company: false
   *                   customer_rank: 5
   *                   supplier_rank: 0
   *                   street: "456 Oak Ave"
   *                   city: "Los Angeles"
   *                   country_id: [1]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve customers
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getCustomers(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/customers/{id}:
   *   get:
   *     summary: Get Odoo customer by ID
   *     description: Retrieve a specific customer from Odoo system by ID
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Customer ID
   *         example: 1
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "email", "phone", "is_company"]
   *     responses:
   *       200:
   *         description: Customer retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/OdooCustomer'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 id: 1
   *                 name: "ABC Company"
   *                 email: "contact@abc.com"
   *                 phone: "+1234567890"
   *                 is_company: true
   *                 customer_rank: 10
   *                 supplier_rank: 0
   *                 street: "123 Main St"
   *                 city: "New York"
   *                 country_id: [1]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       404:
   *         description: Customer not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to retrieve customer
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const { fields = [] } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getCustomerById(
        parseInt(id),
        Array.isArray(fields) ? fields as string[] : []
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/customers:
   *   post:
   *     summary: Create Odoo customer
   *     description: Create a new customer/partner in Odoo system
   *     tags: [Odoo]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: Customer name
   *                 example: "New Customer"
   *               email:
   *                 type: string
   *                 description: Email address
   *                 example: "customer@example.com"
   *               phone:
   *                 type: string
   *                 description: Phone number
   *                 example: "+1234567890"
   *               is_company:
   *                 type: boolean
   *                 description: Whether it's a company
   *                 example: true
   *               street:
   *                 type: string
   *                 description: Street address
   *                 example: "123 Main St"
   *               city:
   *                 type: string
   *                 description: City
   *                 example: "New York"
   *               country_id:
   *                 type: integer
   *                 description: Country ID
   *                 example: 1
   *           example:
   *             name: "New Customer"
   *             email: "customer@example.com"
   *             phone: "+1234567890"
   *             is_company: true
   *             street: "123 Main St"
   *             city: "New York"
   *             country_id: 1
   *     responses:
   *       201:
   *         description: Customer created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: integer
   *                   description: Created customer ID
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data: 3
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to create customer
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const customerData = req.body;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.createCustomer(customerData);
      
      res.status(result.statusCode === 1000 ? 201 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/customers/{id}:
   *   put:
   *     summary: Update Odoo customer
   *     description: Update an existing customer/partner in Odoo system
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Customer ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Customer name
   *                 example: "Updated Customer"
   *               email:
   *                 type: string
   *                 description: Email address
   *                 example: "updated@example.com"
   *               phone:
   *                 type: string
   *                 description: Phone number
   *                 example: "+1234567890"
   *               is_company:
   *                 type: boolean
   *                 description: Whether it's a company
   *                 example: true
   *               street:
   *                 type: string
   *                 description: Street address
   *                 example: "456 Updated St"
   *               city:
   *                 type: string
   *                 description: City
   *                 example: "Los Angeles"
   *               country_id:
   *                 type: integer
   *                 description: Country ID
   *                 example: 1
   *           example:
   *             name: "Updated Customer"
   *             email: "updated@example.com"
   *             phone: "+1234567890"
   *             is_company: true
   *             street: "456 Updated St"
   *             city: "Los Angeles"
   *             country_id: 1
   *     responses:
   *       200:
   *         description: Customer updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: boolean
   *                   description: Update success status
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data: true
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       404:
   *         description: Customer not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to update customer
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const customerData = req.body;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.updateCustomer(parseInt(id), customerData);
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/leads:
   *   get:
   *     summary: Get Odoo leads
   *     description: Retrieve list of leads from Odoo CRM system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for leads
   *         example: { "type": "lead", "active": true }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "partner_name", "email_from", "phone", "type"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Leads retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooLead'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "New Sales Lead"
   *                   partner_name: "ABC Company"
   *                   contact_name: "John Doe"
   *                   email_from: "john@abc.com"
   *                   phone: "+1234567890"
   *                   type: "lead"
   *                   description: "Interested in our product"
   *                   probability: 50
   *                   expected_revenue: 10000
   *                   date_deadline: "2024-12-31"
   *                 - id: 2
   *                   name: "Website Inquiry"
   *                   partner_name: "XYZ Corp"
   *                   contact_name: "Jane Smith"
   *                   email_from: "jane@xyz.com"
   *                   phone: "+0987654321"
   *                   type: "lead"
   *                   description: "Website contact form"
   *                   probability: 30
   *                   expected_revenue: 5000
   *                   date_deadline: "2024-11-30"
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve leads
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getLeads(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getLeads(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/leads/{id}:
   *   get:
   *     summary: Get Odoo lead by ID
   *     description: Retrieve a specific lead from Odoo CRM system by ID
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Lead ID
   *         example: 1
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "partner_name", "email_from", "phone", "type"]
   *     responses:
   *       200:
   *         description: Lead retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/OdooLead'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 id: 1
   *                 name: "New Sales Lead"
   *                 partner_name: "ABC Company"
   *                 contact_name: "John Doe"
   *                 email_from: "john@abc.com"
   *                 phone: "+1234567890"
   *                 type: "lead"
   *                 description: "Interested in our product"
   *                 probability: 50
   *                 expected_revenue: 10000
   *                 date_deadline: "2024-12-31"
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       404:
   *         description: Lead not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to retrieve lead
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const { fields = [] } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getLeadById(
        parseInt(id),
        Array.isArray(fields) ? fields as string[] : []
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/leads:
   *   post:
   *     summary: Create Odoo lead
   *     description: Create a new lead in Odoo CRM system
   *     tags: [Odoo]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: Lead name
   *                 example: "New Sales Lead"
   *               partner_name:
   *                 type: string
   *                 description: Partner/company name
   *                 example: "ABC Company"
   *               contact_name:
   *                 type: string
   *                 description: Contact person name
   *                 example: "John Doe"
   *               email_from:
   *                 type: string
   *                 description: Email address
   *                 example: "john@abc.com"
   *               phone:
   *                 type: string
   *                 description: Phone number
   *                 example: "+1234567890"
   *               type:
   *                 type: string
   *                 enum: [lead, opportunity]
   *                 description: Lead type
   *                 example: "lead"
   *               description:
   *                 type: string
   *                 description: Lead description
   *                 example: "Interested in our product"
   *               probability:
   *                 type: number
   *                 description: Success probability (0-100)
   *                 example: 50
   *               expected_revenue:
   *                 type: number
   *                 description: Expected revenue
   *                 example: 10000
   *               date_deadline:
   *                 type: string
   *                 format: date
   *                 description: Deadline date
   *                 example: "2024-12-31"
   *           example:
   *             name: "New Sales Lead"
   *             partner_name: "ABC Company"
   *             contact_name: "John Doe"
   *             email_from: "john@abc.com"
   *             phone: "+1234567890"
   *             type: "lead"
   *             description: "Interested in our product"
   *             probability: 50
   *             expected_revenue: 10000
   *             date_deadline: "2024-12-31"
   *     responses:
   *       201:
   *         description: Lead created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: integer
   *                   description: Created lead ID
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data: 3
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to create lead
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async createLead(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const leadData = req.body;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.createLead(leadData);
      
      res.status(result.statusCode === 1000 ? 201 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/leads/{id}:
   *   put:
   *     summary: Update Odoo lead
   *     description: Update an existing lead in Odoo CRM system
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Lead ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Lead name
   *                 example: "Updated Sales Lead"
   *               partner_name:
   *                 type: string
   *                 description: Partner/company name
   *                 example: "Updated ABC Company"
   *               contact_name:
   *                 type: string
   *                 description: Contact person name
   *                 example: "John Doe"
   *               email_from:
   *                 type: string
   *                 description: Email address
   *                 example: "john@abc.com"
   *               phone:
   *                 type: string
   *                 description: Phone number
   *                 example: "+1234567890"
   *               type:
   *                 type: string
   *                 enum: [lead, opportunity]
   *                 description: Lead type
   *                 example: "lead"
   *               description:
   *                 type: string
   *                 description: Lead description
   *                 example: "Updated interest in our product"
   *               probability:
   *                 type: number
   *                 description: Success probability (0-100)
   *                 example: 75
   *               expected_revenue:
   *                 type: number
   *                 description: Expected revenue
   *                 example: 15000
   *               date_deadline:
   *                 type: string
   *                 format: date
   *                 description: Deadline date
   *                 example: "2024-12-31"
   *           example:
   *             name: "Updated Sales Lead"
   *             partner_name: "Updated ABC Company"
   *             contact_name: "John Doe"
   *             email_from: "john@abc.com"
   *             phone: "+1234567890"
   *             type: "lead"
   *             description: "Updated interest in our product"
   *             probability: 75
   *             expected_revenue: 15000
   *             date_deadline: "2024-12-31"
   *     responses:
   *       200:
   *         description: Lead updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: boolean
   *                   description: Update success status
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data: true
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       404:
   *         description: Lead not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Failed to update lead
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateLead(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const leadData = req.body;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.updateLead(parseInt(id), leadData);
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/opportunities:
   *   get:
   *     summary: Get Odoo opportunities
   *     description: Retrieve list of opportunities from Odoo CRM system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for opportunities
   *         example: { "type": "opportunity", "active": true }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "partner_id", "expected_revenue", "probability"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Opportunities retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooOpportunity'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "Enterprise Deal"
   *                   partner_id: [1]
   *                   expected_revenue: 50000
   *                   probability: 80
   *                   date_deadline: "2024-12-31"
   *                   stage_id: [1]
   *                 - id: 2
   *                   name: "SMB Contract"
   *                   partner_id: [2]
   *                   expected_revenue: 15000
   *                   probability: 60
   *                   date_deadline: "2024-11-30"
   *                   stage_id: [2]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve opportunities
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getOpportunities(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/products:
   *   get:
   *     summary: Get Odoo products
   *     description: Retrieve list of products from Odoo inventory system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for products
   *         example: { "active": true, "type": "product" }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "default_code", "list_price", "type"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooProduct'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "Laptop Computer"
   *                   default_code: "LAPTOP-001"
   *                   list_price: 999.99
   *                   standard_price: 750.00
   *                   type: "product"
   *                   categ_id: [1]
   *                   active: true
   *                 - id: 2
   *                   name: "Consulting Service"
   *                   default_code: "CONS-001"
   *                   list_price: 150.00
   *                   standard_price: 100.00
   *                   type: "service"
   *                   categ_id: [2]
   *                   active: true
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve products
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getProducts(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/orders:
   *   get:
   *     summary: Get Odoo orders
   *     description: Retrieve list of sales orders from Odoo system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for orders
   *         example: { "state": "sale", "active": true }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "partner_id", "date_order", "amount_total", "state"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooOrder'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "SO001"
   *                   partner_id: [1]
   *                   date_order: "2024-01-15T10:30:00Z"
   *                   amount_total: 1999.98
   *                   state: "sale"
   *                   payment_term_id: [1]
   *                 - id: 2
   *                   name: "SO002"
   *                   partner_id: [2]
   *                   date_order: "2024-01-16T14:45:00Z"
   *                   amount_total: 750.00
   *                   state: "draft"
   *                   payment_term_id: [1]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve orders
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getOrders(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/invoices:
   *   get:
   *     summary: Get Odoo invoices
   *     description: Retrieve list of invoices from Odoo system
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for invoices
   *         example: { "state": "open", "active": true }
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *         example: ["id", "name", "partner_id", "date_invoice", "amount_total", "state"]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Invoices retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooInvoice'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *             example:
   *               data:
   *                 - id: 1
   *                   name: "INV001"
   *                   partner_id: [1]
   *                   date_invoice: "2024-01-15"
   *                   amount_total: 1999.98
   *                   state: "open"
   *                   payment_term_id: [1]
   *                 - id: 2
   *                   name: "INV002"
   *                   partner_id: [2]
   *                   date_invoice: "2024-01-16"
   *                   amount_total: 750.00
   *                   state: "paid"
   *                   payment_term_id: [1]
   *               statusCode: 1000
   *               errors: []
   *               requestIdentifier: "550e8400-e29b-41d4-a716-446655440000"
   *               messages: null
   *               additionalInfo: null
   *               user: null
   *       500:
   *         description: Failed to retrieve invoices
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getInvoices(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/contacts:
   *   get:
   *     summary: Get Odoo contacts
   *     description: Retrieve contacts (individual partners) from Odoo
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Contacts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/OdooCustomer'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *       500:
   *         description: Failed to retrieve contacts
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getContacts(
        filters as any,
        Array.isArray(fields) ? fields as string[] : [],
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/contacts/{id}:
   *   get:
   *     summary: Get Odoo contact by ID
   *     description: Retrieve a specific contact by their ID
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: Contact ID
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *     responses:
   *       200:
   *         description: Contact retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/OdooCustomer'
   *                 statusCode:
   *                   type: number
   *                   example: 1000
   *                 errors:
   *                   type: array
   *                   items: {}
   *                 requestIdentifier:
   *                   type: string
   *                 messages:
   *                   type: null
   *                 additionalInfo:
   *                   type: null
   *                 user:
   *                   type: null
   *       404:
   *         description: Contact not found
   *       500:
   *         description: Failed to retrieve contact
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getContactById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const { fields = [] } = req.query;
      
      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const result = await this.odooService.getContactById(
        parseInt(id),
        Array.isArray(fields) ? fields as string[] : []
      );
      
      res.status(result.statusCode === 1000 ? 200 : 500).json({
        data: result.data,
        statusCode: result.statusCode,
        errors: result.errors,
        requestIdentifier: requestId,
        messages: result.messages,
        additionalInfo: result.additionalInfo,
        user: null
      });
    } catch (error: any) {
      res.status(500).json({
        data: null,
        statusCode: 0,
        errors: [{ message: error.message }],
        requestIdentifier: uuidv4(),
        messages: null,
        additionalInfo: null,
        user: null
      });
    }
  }

  /**
   * @openapi
   * /api/odoo/tickets:
   *   get:
  *     summary: Get Odoo tickets
  *     description: |
  *       Retrieve list of helpdesk tickets from Odoo.
  *       Notes and options:
  *         - Many2one fields are returned as arrays [id, display_name]
  *         - Priority codes: "0" Normal, "1" Low, "2" High, "3" Very High
  *         - Common stages include: "New", "In Progress", "Solved" (actual list depends on your Odoo)
  *         - Common teams include: "Support", "Customer Care" (actual list depends on your Odoo)
  *       
  *       Filtering usage (domain-like via query):
  *         - Equality: filters[priority]=2 (High)
  *         - By stage: filters[stage_id]=3
  *         - By team: filters[team_id]=1
  *         - By assigned user: filters[user_id]=7
  *         - Operators: filters[id][>]=100, filters[create_date][>=]=2025-01-01
  *       
  *       Selecting fields:
  *         - fields=id&fields=name&fields=priority&fields=stage_id&fields=team_id
   *     tags: [Odoo]
   *     parameters:
   *       - in: query
   *         name: filters
   *         schema:
   *           type: object
   *         description: Filter criteria for tickets
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
  *     examples:
  *       BasicFilters:
  *         summary: Filter by priority and team
  *         value:
  *           filters: { priority: "2", team_id: 1 }
  *           fields: ["id","name","priority","stage_id","team_id"]
  *           limit: 10
  *           offset: 0
    *     responses:
    *       200:
    *         description: Tickets retrieved successfully
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 data:
    *                   type: array
    *                   items:
    *                     $ref: '#/components/schemas/OdooTicket'
    *                 statusCode:
    *                   type: number
    *                   example: 1000
    *                 errors:
    *                   type: array
    *                   items: {}
    *                 requestIdentifier:
    *                   type: string
    *                 messages:
    *                   type: null
    *                 additionalInfo:
    *                   type: null
    *                 user:
    *                   type: null
    *       400:
    *         description: Helpdesk model not available
    *       500:
    *         description: Failed to retrieve tickets
    */
  async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { filters = {}, fields = [], limit = 100, offset = 0 } = req.query as any;

      if (!this.odooService) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo service not initialized' }], null, requestId));
        return;
      }

      const modelCheck = await this.odooService.isModelAvailable('helpdesk.ticket');
      if (modelCheck.statusCode !== 1000 || modelCheck.data !== true) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo Helpdesk app is not available or access is denied (model helpdesk.ticket not found).' }], null, requestId));
        return;
      }

      const result = await this.odooService.getTickets(
        filters || {},
        Array.isArray(fields) ? (fields as string[]) : [],
        parseInt(String(limit)) || 100,
        parseInt(String(offset)) || 0
      );

      result.requestIdentifier = requestId;
      handleResponse(res, result as unknown as Result<any>);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: error.message }], null, uuidv4()));
    }
  }

  /**
   * @openapi
   * /api/odoo/tickets/{id}:
   *   get:
   *     summary: Get Odoo ticket by ID
   *     description: Retrieve a specific helpdesk ticket by ID
   *     tags: [Odoo]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: fields
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Fields to retrieve
    *     responses:
    *       200:
    *         description: Ticket retrieved successfully
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 data:
    *                   $ref: '#/components/schemas/OdooTicket'
    *                 statusCode:
    *                   type: number
    *                 errors:
    *                   type: array
    *                   items: {}
    *                 requestIdentifier:
    *                   type: string
    *       400:
    *         description: Helpdesk model not available
    *       404:
    *         description: Ticket not found
    *       500:
    *         description: Failed to retrieve ticket
    */
  async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const { fields = [] } = req.query as any;

      if (!this.odooService) {
        res.status(500).json({
          data: null,
          statusCode: 0,
          errors: [{ message: 'Odoo service not initialized' }],
          requestIdentifier: requestId,
          messages: null,
          additionalInfo: null,
          user: null
        });
        return;
      }

      const modelCheck = await this.odooService.isModelAvailable('helpdesk.ticket');
      if (modelCheck.statusCode !== 1000 || modelCheck.data !== true) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo Helpdesk app is not available or access is denied (model helpdesk.ticket not found).' }], null, requestId));
        return;
      }

      const result = await this.odooService.getTicketById(
        parseInt(id),
        Array.isArray(fields) ? (fields as string[]) : []
      );

      result.requestIdentifier = requestId;
      handleResponse(res, result as unknown as Result<any>);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: error.message }], null, uuidv4()));
    }
  }

  /**
   * @openapi
   * /api/odoo/tickets:
   *   post:
   *     summary: Create Odoo ticket
   *     description: Create a helpdesk ticket in Odoo
   *     tags: [Odoo]
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             required:
    *               - name
    *             properties:
    *               name:
    *                 type: string
    *               description:
    *                 type: string
    *               partner_id:
    *                 type: integer
    *               priority:
    *                 type: string
    *               team_id:
    *                 type: integer
    *           example:
    *             name: "Website Support"
    *             description: "Customer cannot login"
    *             partner_id: 1
    *             priority: "2"
    *             team_id: 1
    *     responses:
    *       201:
    *         description: Ticket created
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 data:
    *                   type: integer
    *                 statusCode:
    *                   type: number
    *       400:
    *         description: Helpdesk model not available
    *       500:
    *         description: Failed to create ticket
   */
  async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const ticketData = req.body;

      if (!this.odooService) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo service not initialized' }], null, requestId));
        return;
      }

      const modelCheck = await this.odooService.isModelAvailable('helpdesk.ticket');
      if (modelCheck.statusCode !== 1000 || modelCheck.data !== true) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo Helpdesk app is not available or access is denied (model helpdesk.ticket not found).' }], null, requestId));
        return;
      }

      const result = await this.odooService.createTicket(ticketData);
      result.requestIdentifier = requestId;
      handleResponse(res, result as unknown as Result<any>);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: error.message }], null, uuidv4()));
    }
  }

  /**
   * @openapi
   * /api/odoo/tickets/{id}:
   *   put:
   *     summary: Update Odoo ticket
  *     description: Update a helpdesk ticket in Odoo
   *     tags: [Odoo]
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: integer
  *         description: Ticket ID to update
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               name:
    *                 type: string
    *               description:
    *                 type: string
    *               priority:
    *                 type: string
    *               stage_id:
    *                 type: integer
    *               team_id:
    *                 type: integer
    *               user_id:
    *                 type: integer
    *     responses:
    *       200:
    *         description: Ticket updated
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 data:
    *                   type: boolean
    *                 statusCode:
    *                   type: number
    *       400:
    *         description: Helpdesk model not available
    *       404:
    *         description: Ticket not found
    *       500:
    *         description: Failed to update ticket
   */
  async updateTicket(req: Request, res: Response): Promise<void> {
    try {
      const requestId = uuidv4();
      const { id } = req.params;
      const ticketData = req.body;

      if (!this.odooService) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo service not initialized' }], null, requestId));
        return;
      }

      const modelCheck = await this.odooService.isModelAvailable('helpdesk.ticket');
      if (modelCheck.statusCode !== 1000 || modelCheck.data !== true) {
        handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Odoo Helpdesk app is not available or access is denied (model helpdesk.ticket not found).' }], null, requestId));
        return;
      }

      const result = await this.odooService.updateTicket(parseInt(id), ticketData);
      result.requestIdentifier = requestId;
      handleResponse(res, result as unknown as Result<any>);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: error.message }], null, uuidv4()));
    }
  }
} 