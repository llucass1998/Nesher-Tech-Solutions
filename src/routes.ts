import { Router } from 'express';
import { AuthController } from './controllers/Authcontrollers'; 
import { DriverController } from './controllers/DriverController';
import { VehicleController } from './controllers/VehicleController';
import { DeliveryController } from './controllers/DeliveryController';
import { deprecatedRoute, requireRoles, verificarAccessTokenV1, verificarApiKeyPagamento, verificarToken } from './middlewares/middllewares';
import { UserController } from './controllers/UserController';
import { AuthV1Controller } from './controllers/AuthV1Controller';
import { DriverV1Controller } from './controllers/DriverV1Controller';
import { DashboardController } from './controllers/DashboardController';
import { LogiflowOperationsController } from './controllers/LogiflowOperationsController';
import { live, metrics, ready } from './lib/observability';

const routes = Router();

// Instanciando os nossos "cérebros"
const authController = new AuthController();
const userController = new UserController();
const driverController = new DriverController();
const vehicleController = new VehicleController();
const deliveryController = new DeliveryController();
const authV1Controller = new AuthV1Controller();
const driverV1Controller = new DriverV1Controller();
const dashboardController = new DashboardController();
const operationsController = new LogiflowOperationsController();

routes.get('/api/v1/health/live', live);
routes.get('/api/v1/health/ready', ready);
routes.get('/api/v1/metrics', metrics);

// ==========================================
// API V1 - AUTENTICACAO E MOTORISTA
// ==========================================
routes.post('/api/v1/auth/register', (req, res) => authV1Controller.register(req, res));
routes.post('/api/v1/auth/login', (req, res) => authV1Controller.login(req, res));
routes.post('/api/v1/auth/refresh', (req, res) => authV1Controller.refresh(req, res));
routes.post('/api/v1/auth/logout', (req, res) => authV1Controller.logout(req, res));
routes.get('/api/v1/auth/me', verificarAccessTokenV1, (req, res) => authV1Controller.me(req, res));

routes.get('/api/v1/driver/me', verificarAccessTokenV1, (req, res) => driverV1Controller.me(req, res));
routes.get('/api/v1/driver/deliveries', verificarAccessTokenV1, (req, res) => driverV1Controller.deliveries(req, res));
routes.get('/api/v1/driver/deliveries/:id', verificarAccessTokenV1, (req, res) => driverV1Controller.delivery(req, res));
routes.patch('/api/v1/driver/deliveries/:id/status', verificarAccessTokenV1, (req, res) => driverV1Controller.updateDeliveryStatus(req, res));

routes.get('/api/v1/dashboard/metrics', (req, res) => dashboardController.metrics(req, res));
routes.get('/api/v1/operations/deliveries', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.listDeliveries(req, res));
routes.get('/api/v1/operations/deliveries/:id/timeline', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.deliveryTimeline(req, res));
routes.patch('/api/v1/operations/deliveries/:id/status', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.updateDeliveryStatus(req, res));
routes.post('/api/v1/operations/deliveries/:id/occurrences', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.createOccurrence(req, res));
routes.post('/api/v1/operations/deliveries/:id/proofs', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.createProof(req, res));
routes.patch('/api/v1/operations/occurrences/:id', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.updateOccurrence(req, res));
routes.post('/api/v1/operations/occurrences/:id/reprocess', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.reprocessOccurrence(req, res));
routes.post('/api/v1/operations/occurrences/:id/escalate', verificarAccessTokenV1, requireRoles(['ADMIN', 'OPERATOR']), (req, res) => operationsController.escalateOccurrence(req, res));
routes.post('/api/v1/integrations/logidesk/ticket-updates', (req, res) => operationsController.receiveLogideskTicketUpdate(req, res));

// ==========================================
// ROTA DE LOGIN
// ==========================================
routes.post('/login', deprecatedRoute({ successor: '/api/v1/auth/login' }), (req, res) => authController.login(req, res));

routes.get('/dashboard/metrics', deprecatedRoute({ successor: '/api/v1/dashboard/metrics' }), (req, res) => dashboardController.metrics(req, res));

// ==========================================
// ROTAS DE MOTORISTAS
// ==========================================
routes.post('/drivers', deprecatedRoute({ successor: '/api/v1/auth/register' }), (req, res) => driverController.create(req, res));
routes.get('/drivers', deprecatedRoute(), (req, res) => driverController.index(req, res));
// NOVAS ROTAS (Editar e Excluir)
routes.put('/drivers/:id', deprecatedRoute(), (req, res) => driverController.update(req, res));
routes.delete('/drivers/:id', deprecatedRoute(), (req, res) => driverController.delete(req, res));
routes.patch('/drivers/:id/status', deprecatedRoute(), (req, res) => driverController.updateStatus(req, res));

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================
routes.post('/users', deprecatedRoute({ successor: '/api/v1/auth/register' }), (req, res) => userController.create(req, res));

// ==========================================
// ROTAS DE VEÍCULOS
// ==========================================
routes.post('/vehicles', deprecatedRoute(), (req, res) => vehicleController.create(req, res));
routes.get('/vehicles', deprecatedRoute(), (req, res) => vehicleController.index(req, res));
// NOVAS ROTAS (Editar e Excluir)
routes.put('/vehicles/:id', deprecatedRoute(), (req, res) => vehicleController.update(req, res));
routes.delete('/vehicles/:id', deprecatedRoute(), (req, res) => vehicleController.delete(req, res));
routes.patch('/vehicles/:id/status', deprecatedRoute(), (req, res) => vehicleController.updateStatus(req, res));

// ==========================================
// ROTAS DE ENTREGAS
// ==========================================
routes.post('/deliveries', deprecatedRoute(), verificarApiKeyPagamento, (req, res) => { deliveryController.create(req, res); });
routes.get('/deliveries', deprecatedRoute(), (req, res) => { deliveryController.index(req, res); });
routes.get('/deliveries/:id', deprecatedRoute(), (req, res) => { deliveryController.show(req, res); });
// NOVAS ROTAS (Editar e Excluir)
routes.put('/deliveries/:id', deprecatedRoute(), verificarApiKeyPagamento, (req, res) => { deliveryController.update(req, res); });
routes.delete('/deliveries/:id', deprecatedRoute(), (req, res) => { deliveryController.delete(req, res); });

// 🔒 Rota Protegida com o Middleware JWT
routes.patch('/deliveries/:id/status', deprecatedRoute({ successor: '/api/v1/driver/deliveries/:id/status' }), verificarToken, (req, res) => { deliveryController.updateStatus(req, res); });

export { routes };
