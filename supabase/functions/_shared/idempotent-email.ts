type ReminderEmail = { from: string; to: string[]; subject: string; html: string; text: string };

/** Provider-side duplicate protection also covers an ambiguous response before DB confirmation. */
export async function sendIdempotentEmail(email: ReminderEmail, key: string, apiKey: string): Promise<{ id: string }> {
  if (!apiKey || !key || key.length > 256) throw new Error('Email delivery is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(email),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  if (!response.ok || !result.id) throw new Error(`Reminder provider rejected delivery (${response.status})`);
  return { id: result.id };
}
