import { Resend } from 'resend';

/** Verified inbox for notifications. With onboarding@resend.dev, Resend only delivers to allowed addresses — often your Resend login email until you add a verified domain. Override in Vercel: RESEND_TO */
const DEFAULT_TO = 'animalconnectionsf@gmail.com';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function readJsonBody(req) {
  if (req.body != null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const { name, email, phone, message } = body;
  if (!name || !email || !phone || !message) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  const resend = getResend();
  if (!resend) {
    console.error('RESEND_API_KEY is not set');
    res.status(500).json({ error: 'missing_api_key' });
    return;
  }

  const to = process.env.RESEND_TO || DEFAULT_TO;
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
  });

  if (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send', code: 'resend' });
    return;
  }

  res.status(200).json({ success: true });
}
