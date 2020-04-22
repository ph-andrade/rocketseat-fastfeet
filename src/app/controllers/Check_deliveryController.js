import Sequelize from 'sequelize';
import Delivery_problem from '../models/Delivery_problem';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class Check_deliveryController {
  async index(req, res) {
    const deliveries = await Delivery_problem.findAll({
      attributes: [
        Sequelize.literal(
          'DISTINCT ON("Delivery_problem"."delivery_id") "Delivery_problem"."id"'
        ),
        'id',
      ],

      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
          ],

          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'name',
                'street',
                'number',
                'complement',
                'city',
                'state',
                'cep',
              ],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['name', 'email'],
              include: [
                {
                  model: File,
                  as: 'avatar',
                  attributes: ['name', 'path', 'url'],
                },
              ],
            },
            {
              model: File,
              as: 'signature',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(deliveries);
  }

  async delete(req, res) {
    const delivery_problem = await Delivery_problem.findByPk(req.params.id, {
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
          ],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
                'name',
                'street',
                'number',
                'complement',
                'state',
                'city',
                'cep',
              ],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name', 'email'],
              include: [
                {
                  model: File,
                  as: 'avatar',
                  attributes: ['id', 'path', 'url'],
                },
              ],
            },
            {
              model: File,
              as: 'signature',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    if (!delivery_problem) {
      return res.status(400).json({ error: 'Delivery problem not found.' });
    }

    if (delivery_problem.delivery.canceled_at) {
      return res.status(400).json({ error: 'Delivery is already canceled.' });
    }
    delivery_problem.delivery.canceled_at = new Date();

    await delivery_problem.delivery.save();
    const { delivery } = delivery_problem;
    await Queue.add(CancellationMail.key, {
      delivery,
    });
    return res.json(delivery_problem);
  }
}

export default new Check_deliveryController();
