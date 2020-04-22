import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import FileController from './app/controllers/FileController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliveryController from './app/controllers/DeliveryController';
import Pending_deliveryController from './app/controllers/Pending_deliveryController';
import Finished_deliveryController from './app/controllers/Finished_deliveryController';
import Delivery_problemController from './app/controllers/Delivery_problemController';
import Check_deliveryController from './app/controllers/Check_deliveryController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/files', upload.single('file'), FileController.store);

routes.get(
  '/deliveryman/:deliveryman_id/pending-deliveries',
  Pending_deliveryController.index
);
routes.put(
  '/deliveryman/:deliveryman_id/pending-deliveries/:delivery_id',
  Pending_deliveryController.update
);

routes.get(
  '/deliveryman/:deliveryman_id/finished-deliveries',
  Finished_deliveryController.index
);

routes.post('/delivery/:id/problems', Delivery_problemController.store);
routes.get('/delivery/:id/problems', Delivery_problemController.index);

routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);

routes.get('/deliverymans', DeliverymanController.index);
routes.post('/deliverymans', DeliverymanController.store);
routes.put('/deliverymans/:id', DeliverymanController.update);
routes.delete('/deliverymans/:id', DeliverymanController.delete);

routes.get('/deliveries', DeliveryController.index);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:id', DeliveryController.update);
routes.delete('/deliveries/:id', DeliveryController.delete);

routes.get('/deliveries/problems', Check_deliveryController.index);
routes.delete('/problem/:id/cancel-delivery', Check_deliveryController.delete);

export default routes;
