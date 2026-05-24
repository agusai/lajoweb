import { NextRequest } from 'next/server';
import { corsResponse, corsOptions, corsError } from '../../../../lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return corsError('Missing required fields: to, message', 400);
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromRaw = process.env.TWILIO_WHATSAPP_NUMBER ?? process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromRaw) {
      console.warn('Twilio credentials not configured — skipping WhatsApp notification');
      return corsResponse({ status: 'skipped', message: 'Twilio not configured' });
    }

    const toNumber = to.startsWith('+') ? to : `+${to}`;
    const fromNumber = fromRaw.startsWith('whatsapp:') ? fromRaw : `whatsapp:${fromRaw}`;

    const params = new URLSearchParams({
      To: `whatsapp:${toNumber}`,
      From: fromNumber,
      Body: message,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('Twilio error:', err);
      return corsError(`Twilio: ${err.message ?? err.code ?? 'send failed'}`, 502);
    }

    const data = await res.json();
    return corsResponse({ status: 'sent', sid: data.sid });
  } catch (err: any) {
    console.error('WhatsApp notification error:', err);
    return corsError(err.message ?? 'Internal server error', 500);
  }
}
