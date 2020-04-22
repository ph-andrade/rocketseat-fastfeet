import Mail from '../../lib/Mail';

class WithdrawalMail {
  get key() {
    return 'WithdrawalMail';
  }

  async handle({ data }) {
    const { deliveryDetailed } = data;
    const { name: deliveryman, email } = deliveryDetailed.deliveryman;
    const {
      name: recipient,
      street,
      number,
      complement,
      city,
      state,
      cep,
    } = deliveryDetailed.recipient;
    await Mail.sendMail({
      to: `${deliveryman} <${email}>`,
      subject: 'Produto disponível para a retirada',
      template: 'withdrawal',
      context: {
        product: deliveryDetailed.product,
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

export default new WithdrawalMail();
