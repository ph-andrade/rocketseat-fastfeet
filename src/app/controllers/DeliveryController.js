import * as Yup from 'yup';
import { setHours, setMinutes, setSeconds, isBefore, parseISO } from 'date-fns';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

import WithdrawalMail from '../jobs/WithdrawalMail';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page } = req.query;

    const deliveries = await Delivery.findAll({
      where: { canceled_at: null },
      order: ['created_at'],
      attributes: ['id', 'product', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
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
    });

    return res.json(deliveries);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      signature_id: Yup.number(),
      product: Yup.string().required(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validations fails' });
    }

    const start_date = parseISO(req.body.start_date);
    const withdrawalStartTime = setSeconds(
      setMinutes(setHours(start_date, 8), 0),
      0
    );
    const withdrawalEndTime = setSeconds(
      setMinutes(setHours(start_date, 18), 0),
      0
    );

    if (
      isBefore(start_date, withdrawalStartTime) ||
      isBefore(withdrawalEndTime, start_date)
    ) {
      return res.status(400).json({
        error: 'The product withdrawal time is from 08:00h to 18:00h',
      });
    }

    const delivery = await Delivery.create(req.body);

    const deliveryDetailed = await Delivery.findByPk(delivery.id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
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
      ],
    });

    await Queue.add(WithdrawalMail.key, {
      deliveryDetailed,
    });

    return res.json(deliveryDetailed);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      signature_id: Yup.number(),
      product: Yup.string(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validations fails' });
    }

    const start_date = parseISO(req.body.start_date);
    const withdrawalStartTime = setSeconds(
      setMinutes(setHours(start_date, 8), 0),
      0
    );
    const withdrawalEndTime = setSeconds(
      setMinutes(setHours(start_date, 18), 0),
      0
    );

    if (
      isBefore(start_date, withdrawalStartTime) ||
      isBefore(withdrawalEndTime, start_date)
    ) {
      return res.status(400).json({
        error: 'The product withdrawal time is from 08:00h to 18:00h',
      });
    }

    const delivery = await Delivery.findByPk(req.params.id);
    await delivery.update(req.body);
    return res.json(delivery);
  }

  async delete(req, res) {
    const delivery = await Delivery.findByPk(req.params.id, {
      attributes: ['id', 'product', 'start_date', 'end_date', 'canceled_at'],
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
    });

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'Delivery is already canceled.' });
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    await Queue.add(CancellationMail.key, {
      delivery,
    });
    return res.json(delivery);
  }
}

export default new DeliveryController();
