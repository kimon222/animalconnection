import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'animalconnectionsf@gmail.com',
    subject: `New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
  });

  if (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send' });
    return;
  }

  res.status(200).json({ success: true });
}
