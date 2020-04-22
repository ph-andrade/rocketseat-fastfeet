import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';

class Finished_deliveryController {
  async index(req, res) {
    const deliveryman = await Deliveryman.findByPk(req.params.deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: req.params.deliveryman_id,
        canceled_at: null,
        end_date: { [Op.not]: null },
      },
    });
    return res.json(deliveries);
  }
}

export default new Finished_deliveryController();
