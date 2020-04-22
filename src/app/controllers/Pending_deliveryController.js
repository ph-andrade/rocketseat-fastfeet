import {
  startOfDay,
  endOfDay,
  isBefore,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
} from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';

class Pending_deliveryController {
  async index(req, res) {
    const deliveryman = await Deliveryman.findByPk(req.params.deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: req.params.deliveryman_id,
        canceled_at: null,
        end_date: null,
      },
    });
    return res.json(deliveries);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date(),
      end_date: Yup.date(),
      signature_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validations fails' });
    }

    const delivery = await Delivery.findByPk(req.params.delivery_id);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    if (delivery.deliveryman_id != req.params.deliveryman_id) {
      return res.status(401).json({
        error: "You don't have permission to update this delivery",
      });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'Delivery is canceled' });
    }

    const date = new Date();
    const deliveries = await Delivery.count({
      where: {
        deliveryman_id: req.params.deliveryman_id,
        start_date: {
          [Op.between]: [startOfDay(date), endOfDay(date)],
        },
      },
    });
    const { start_date, end_date, signature_id } = req.body;

    if (delivery.start_date === null && !start_date) {
      return res.status(400).json({
        error:
          'You need to inform the withdrawal of the product before any changes.',
      });
    }

    if (delivery.start_date === null && deliveries >= 5) {
      return res
        .status(400)
        .json({ error: 'You can only make 5 withdrawals a day.' });
    }

    const startDate = parseISO(req.body.start_date);
    const withdrawalStartTime = setSeconds(
      setMinutes(setHours(startDate, 8), 0),
      0
    );
    const withdrawalEndTime = setSeconds(
      setMinutes(setHours(startDate, 18), 0),
      0
    );
    if (
      isBefore(startDate, withdrawalStartTime) ||
      isBefore(withdrawalEndTime, startDate)
    ) {
      return res.status(400).json({
        error: 'The product withdrawal time is from 08:00h to 18:00h',
      });
    }

    const deliveryUpdate = await delivery.update({
      start_date,
      end_date,
      signature_id,
    });

    return res.json(deliveryUpdate);
  }
}

export default new Pending_deliveryController();
