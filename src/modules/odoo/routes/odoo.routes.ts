import { Router } from 'express';
import { OdooController } from '../controllers/odoo.controller';

const router = Router();
const odooController = new OdooController();

// Connection management routes
router.post('/connect', odooController.initializeConnection.bind(odooController));
router.get('/status', odooController.getConnectionStatus.bind(odooController));

// User routes
router.get('/users', odooController.getUsers.bind(odooController));
router.get('/users/:id', odooController.getUserById.bind(odooController));

// Customer routes
router.get('/customers', odooController.getCustomers.bind(odooController));
router.get('/customers/:id', odooController.getCustomerById.bind(odooController));
router.post('/customers', odooController.createCustomer.bind(odooController));
router.put('/customers/:id', odooController.updateCustomer.bind(odooController));

// Contact routes
router.get('/contacts', odooController.getContacts.bind(odooController));
router.get('/contacts/:id', odooController.getContactById.bind(odooController));

// Lead routes
router.get('/leads', odooController.getLeads.bind(odooController));
router.get('/leads/:id', odooController.getLeadById.bind(odooController));
router.post('/leads', odooController.createLead.bind(odooController));
router.put('/leads/:id', odooController.updateLead.bind(odooController));

// Opportunity routes
router.get('/opportunities', odooController.getOpportunities.bind(odooController));

// Product routes
router.get('/products', odooController.getProducts.bind(odooController));

// Order routes
router.get('/orders', odooController.getOrders.bind(odooController));

// Invoice routes
router.get('/invoices', odooController.getInvoices.bind(odooController));

// Ticket routes (Helpdesk)
router.get('/tickets', odooController.getTickets.bind(odooController));
router.get('/tickets/:id', odooController.getTicketById.bind(odooController));
router.post('/tickets', odooController.createTicket.bind(odooController));
router.put('/tickets/:id', odooController.updateTicket.bind(odooController));

export default router; 