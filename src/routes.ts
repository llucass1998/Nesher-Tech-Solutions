import { Router } from 'express';
import { AuthController } from './controllers/Authcontrollers'; 
import { DriverController } from './controllers/DriverController';
import { VehicleController } from './controllers/VehicleController';
import { DeliveryController } from './controllers/DeliveryController';
import { verificarApiKeyPagamento, verificarToken } from './middlewares/middllewares';
import { UserController } from './controllers/UserController';

const routes = Router();

// Instanciando os nossos "cérebros"
const authController = new AuthController();
const userController = new UserController();
const driverController = new DriverController();
const vehicleController = new VehicleController();
const deliveryController = new DeliveryController();

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