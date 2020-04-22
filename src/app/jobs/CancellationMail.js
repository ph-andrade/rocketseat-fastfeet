import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { delivery } = data;
    const { name: deliveryman, email } = delivery.deliveryman;
    const {
      name: recipient,
      street,
      number,
      complement,
      city,
      state,
      cep,
    } = delivery.recipient;
    await Mail.sendMail({
      to: `${deliveryman} <${email}>`,
      subject: 'Cancelamento de entrega',
      template: 'cancellation',
      context: {
        product: delivery.product,
        deliveryman,
        recipient,
        street,
        number,
        complement,
        city,
        state,
        cep,
      },
    });
  }
}

export default new CancellationMail();
