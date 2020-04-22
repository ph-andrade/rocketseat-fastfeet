import * as Yup from 'yup';
import Delivery_problem from '../models/Delivery_problem';
import Delivery from '../models/Delivery';

class Delivery_problemController {
  async index(req, res) {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found' });
    }

    const delivery_problems = await Delivery_problem.findAll({
      where: { delivery_id: req.params.id },
    });
    return res.json(delivery_problems);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validations fails' });
    }

    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found' });
    }

    const delivery_problem = await Delivery_problem.create({
      delivery_id: req.params.id,
      description: req.body.description,
    });
    return res.json(delivery_problem);
  }
}

export default new Delivery_problemController();
