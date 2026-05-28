import { Resend } from 'resend';

/**
 * Resend sandbox (`onboarding@resend.dev`) only delivers to your Resend account email.
 * Override when your domain is verified in Resend: set RESEND_TO=animalconnectionsf@gmail.com (and RESEND_FROM) in Vercel or .env.local.
 */
const DEFAULT_TO = 'animalconnectionsf@gmail.com';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

  // RESEND_TO in Vercel / .env.local overrides this default. If you still see sandbox errors,
  // remove RESEND_TO from Vercel or set it to the exact email you use to log into Resend.
  const to = process.env.RESEND_TO || DEFAULT_TO;
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

  const text = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`;
  const html = `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> <a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a></p>
<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
<p><strong>Message:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`;

  const emailPayload = {
    from,
    to,
    subject: `New message from ${name}`,
    text,
    html,
  };

  // Sandbox sender often rejects replyTo to arbitrary addresses; customer email stays in body.
  const sandboxFrom = from.includes('@resend.dev');
  if (!sandboxFrom) {
    emailPayload.replyTo = email;
  }

  const { error } = await resend.emails.send(emailPayload);

  if (error) {
    console.error('Resend send failed', { to, from, sandboxFrom, error });
    res.status(500).json({
      error: 'Failed to send',
      code: 'resend',
      resendMessage: error.message || String(error),
    });
    return;
  }

  res.status(200).json({ success: true });
}
