const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MXN = 73900; // $739 MXN en centavos

module.exports.default = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://pianoacademycl.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      return_url: 'https://pianoacademycl.com/gracias.html?session_id={CHECKOUT_SESSION_ID}',
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Piano Academy — Clara',
              description: 'Guía PDF Vol. I y II · 60 ejercicios en video · +100 tutoriales · Acceso permanente',
            },
            unit_amount: PRICE_MXN,
          },
          quantity: 1,
        },
      ],
      payment_method_types: ['card'],
    });

    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: err.message });
  }
};
