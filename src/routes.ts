import { Router } from 'express';
import { AuthController } from './controllers/Authcontrollers'; 
import { DriverController } from './controllers/DriverController';
import { VehicleController } from './controllers/VehicleController';
import { DeliveryController } from './controllers/DeliveryController';
import { verificarAccessTokenV1, verificarApiKeyPagamento, verificarToken } from './middlewares/middllewares';
import { UserController } from './controllers/UserController';
import { AuthV1Controller } from './controllers/AuthV1Controller';
import { DriverV1Controller } from './controllers/DriverV1Controller';

const routes = Router();

// Instanciando os nossos "cérebros"
const authController = new AuthController();
const userController = new UserController();
const driverController = new DriverController();
const vehicleController = new VehicleController();
const deliveryController = new DeliveryController();
const authV1Controller = new AuthV1Controller();
const driverV1Controller = new DriverV1Controller();

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

// ==========================================
// ROTA DE LOGIN
// ==========================================
routes.post('/login', (req, res) => authController.login(req, res));

// ==========================================
// ROTAS DE MOTORISTAS
// ==========================================
routes.post('/drivers', (req, res) => driverController.create(req, res));
routes.get('/drivers', (req, res) => driverController.index(req, res));
// NOVAS ROTAS (Editar e Excluir)
routes.put('/drivers/:id', (req, res) => driverController.update(req, res));
routes.delete('/drivers/:id', (req, res) => driverController.delete(req, res));
routes.patch('/drivers/:id/status', (req, res) => driverController.updateStatus(req, res));

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================
routes.post('/users', (req, res) => userController.create(req, res));

// ==========================================
// ROTAS DE VEÍCULOS
// ==========================================
routes.post('/vehicles', (req, res) => vehicleController.create(req, res));
routes.get('/vehicles', (req, res) => vehicleController.index(req, res));
// NOVAS ROTAS (Editar e Excluir)
routes.put('/vehicles/:id', (req, res) => vehicleController.update(req, res));
routes.delete('/vehicles/:id', (req, res) => vehicleController.delete(req, res));
routes.patch('/vehicles/:id/status', (req, res) => vehicleController.updateStatus(req, res));

// ==========================================
// ROTAS DE ENTREGAS
// ==========================================
routes.post('/deliveries', verificarApiKeyPagamento, (req, res) => { deliveryController.create(req, res); });
routes.get('/deliveries', (req, res) => { deliveryController.index(req, res); });
routes.get('/deliveries/:id', (req, res) => { deliveryController.show(req, res); });
// NOVAS ROTAS (Editar e Excluir)
routes.put('/deliveries/:id', verificarApiKeyPagamento, (req, res) => { deliveryController.update(req, res); });
routes.delete('/deliveries/:id', (req, res) => { deliveryController.delete(req, res); });

// 🔒 Rota Protegida com o Middleware JWT
routes.patch('/deliveries/:id/status', verificarToken, (req, res) => { deliveryController.updateStatus(req, res); });

export { routes };
