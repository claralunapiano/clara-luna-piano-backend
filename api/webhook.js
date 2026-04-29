const Stripe = require('stripe');
const { Resend } = require('resend');
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
 
const DRIVE_LINKS = {
  vol1_pdf:    'https://drive.google.com/file/d/1ZMLnHAsQ3nK1n2go0oDH4tISL1xsJSUL/view?usp=drivesdk',
  vol2_pdf:    'https://drive.google.com/file/d/1ApxmLLdvj65mQPLJGvvJfo-eV9YjDGnV/view?usp=drivesdk',
  coord_vol1:  'https://drive.google.com/file/d/1qcMEscU6Gr0Xpe-XhwckV1D6uYzB9epa/view?usp=sharing',
  coord_vol2:  'https://drive.google.com/file/d/1weIMIAFnWac8sy3yadAHt27nnAeDvLl2/view?usp=sharing',
};
 
module.exports.config = { api: { bodyParser: false } };
 
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
 
module.exports.default = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
 
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
 
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const customerName  = session.customer_details?.name || 'estudiante';
 
    if (!customerEmail) {
      console.error('No email found in session');
      return res.status(200).json({ received: true });
    }
 
    try {
      await resend.emails.send({
        from:    'Clara Luna Piano Academy <cursos@pianoacademycl.com>',
        reply_to: 'claritapianoartist@gmail.com',
        to:      customerEmail,
        subject: '¡Tus materiales de piano están aquí! 🎹',
        html:    buildEmailHTML(customerName),
      });
      console.log(`Email sent to ${customerEmail}`);
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }
  }
 
  return res.status(200).json({ received: true });
}
 
function buildEmailHTML(name) {
  const firstName = name.split(' ')[0];
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tus materiales de Clara Luna Piano Academy</title>
</head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FDFCFA;border:0.5px solid #D4AA56;">
 
        <!-- Header -->
        <tr>
          <td style="background:#1C1A16;padding:40px;text-align:center;border-bottom:2px solid #B8933A;">
            <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Clara Luna</p>
            <h1 style="margin:0;font-size:28px;font-weight:300;color:#FDFCFA;font-family:Georgia,serif;letter-spacing:0.05em;">Piano Academy</h1>
          </td>
        </tr>
 
        <!-- Body -->
        <tr>
          <td style="padding:48px 40px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8933A;font-family:'DM Sans',sans-serif;">Todo listo</p>
            <h2 style="margin:0 0 24px;font-size:26px;font-weight:300;color:#1C1A16;font-family:Georgia,serif;line-height:1.3;">
              ¡Hola, ${firstName}!<br>Tus materiales ya están aquí.
            </h2>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#6B6660;font-family:Arial,sans-serif;font-weight:300;">
              Gracias por confiar en Clara Luna Piano Academy. A continuación encuentras los enlaces de descarga de todos tus materiales. Guárdalos en un lugar seguro — son de acceso permanente.
            </p>
 
            <!-- Products -->
            <table width="100%" cellpadding="0" cellspacing="0">
 
              <tr>
                <td style="padding-bottom:12px;">
                  <table width="100%" style="border:0.5px solid #EDE8DF;background:#FDFCFA;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#B8933A;font-family:Arial,sans-serif;">Volumen I · Guía PDF</p>
                        <p style="margin:0 0 10px;font-size:15px;color:#1C1A16;font-family:Georgia,serif;font-weight:400;">Cómo tocar piano y leer partituras</p>
                        <a href="${DRIVE_LINKS.vol1_pdf}" style="display:inline-block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#FDFCFA;background:#1C1A16;padding:10px 24px;text-decoration:none;font-family:Arial,sans-serif;">
                          Descargar →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
 
              <tr>
                <td style="padding-bottom:12px;">
                  <table width="100%" style="border:0.5px solid #EDE8DF;background:#FDFCFA;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#B8933A;font-family:Arial,sans-serif;">Volumen II · Guía PDF</p>
                        <p style="margin:0 0 10px;font-size:15px;color:#1C1A16;font-family:Georgia,serif;font-weight:400;">Cómo tocar piano y leer partituras</p>
                        <a href="${DRIVE_LINKS.vol2_pdf}" style="display:inline-block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#FDFCFA;background:#1C1A16;padding:10px 24px;text-decoration:none;font-family:Arial,sans-serif;">
                          Descargar →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
 
              <tr>
                <td style="padding-bottom:12px;">
                  <table width="100%" style="border:0.5px solid #EDE8DF;background:#FDFCFA;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#B8933A;font-family:Arial,sans-serif;">Bonus I · Video</p>
                        <p style="margin:0 0 10px;font-size:15px;color:#1C1A16;font-family:Georgia,serif;font-weight:400;">30 ejercicios para coordinar ambas manos</p>
                        <a href="${DRIVE_LINKS.coord_vol1}" style="display:inline-block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#FDFCFA;background:#1C1A16;padding:10px 24px;text-decoration:none;font-family:Arial,sans-serif;">
                          Ver video →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
 
              <tr>
                <td style="padding-bottom:0;">
                  <table width="100%" style="border:0.5px solid #EDE8DF;background:#FDFCFA;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#B8933A;font-family:Arial,sans-serif;">Bonus II · Video</p>
                        <p style="margin:0 0 10px;font-size:15px;color:#1C1A16;font-family:Georgia,serif;font-weight:400;">30 ejercicios para coordinar ambas manos — Vol. 2</p>
                        <a href="${DRIVE_LINKS.coord_vol2}" style="display:inline-block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#FDFCFA;background:#1C1A16;padding:10px 24px;text-decoration:none;font-family:Arial,sans-serif;">
                          Ver video →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
 
            </table>
 
            <!-- Note -->
            <div style="margin:32px 0 0;padding:20px;background:#F7F4EE;border-left:2px solid #B8933A;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#6B6660;font-family:Arial,sans-serif;font-weight:300;">
                <strong style="color:#1C1A16;font-weight:500;">Tip:</strong> Los links de Google Drive son permanentes. Te recomiendo guardar este correo o descargar los archivos a tu dispositivo para tener acceso sin conexión.
              </p>
            </div>
 
            <p style="margin:32px 0 0;font-size:13px;line-height:1.7;color:#6B6660;font-family:Arial,sans-serif;font-weight:300;">
              ¿Tienes alguna pregunta? Escríbeme directamente a
              <a href="mailto:claritapianoartist@gmail.com" style="color:#B8933A;">claritapianoartist@gmail.com</a>
            </p>
 
            <div style="margin-top:40px;padding-top:24px;border-top:0.5px solid #EDE8DF;">
              <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-style:italic;color:#1C1A16;">Clara Luna</p>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8933A;font-family:Arial,sans-serif;">Piano Academy</p>
            </div>
          </td>
        </tr>
 
        <!-- Footer -->
        <tr>
          <td style="background:#1C1A16;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);font-family:Arial,sans-serif;letter-spacing:0.05em;">
              © 2026 Clara Luna Piano Academy · claritapianoartist@gmail.com
            </p>
          </td>
        </tr>
 
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
 
