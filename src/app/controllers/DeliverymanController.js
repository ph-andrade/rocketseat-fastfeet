import * as Yup from 'yup';

import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    const deliverymans = await Deliveryman.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });
    return res.json(deliverymans);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      avatar_id: Yup.number(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validations fails' });
    }

    const emailExists = await Deliveryman.findOne({
      where: { email: req.body.email },
    });
    if (emailExists) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const deliveryman = await Deliveryman.create(req.body);
    return res.json(deliveryman);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      avatar_id: Yup.number(),
      email: Yup.string().email(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validations fails' });
    }

    const deliveryman = await Deliveryman.findByPk(req.params.id);

    const { email } = req.body;
    if (email && email !== deliveryman.email) {
      const emailExists = await Deliveryman.findOne({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
    }

    const deliverymanUpdate = await deliveryman.update(req.body);
    return res.json(deliverymanUpdate);
  }

  async delete(req, res) {
    const deliveryman = await Deliveryman.findByPk(req.params.id);

    if (!deliveryman)
      return res.status(400).json({ error: 'Deliveryman not found.' });

    await deliveryman.destroy(req.params.id);
    return res.json(deliveryman);
  }
}

export default new DeliverymanController();
