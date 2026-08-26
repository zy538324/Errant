type ResendEmailResponse = {
  id?: string;
  name?: string;
  message?: string;
  error?: string;
};

type MailAddressInput =
  | string
  | {
      email: string;
      name?: string | null;
    };

export type SendResendMailInput = {
  from: string;
  to: MailAddressInput | MailAddressInput[];
  subject: string;
  html?: string;
  text: string;
  replyTo?: string | null;
};

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function parseEmailAddress(value: MailAddressInput | null | undefined) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    const email = value.email.trim().toLowerCase();
    return email ? { email, name: value.name?.trim() || undefined } : null;
  }

  const trimmed = value.trim();
  const bracketMatch = trimmed.match(/^(.*?)<([^>]+)>$/);
  if (bracketMatch) {
    const name = bracketMatch[1]?.trim().replace(/^"|"$/g, "");
    const email = bracketMatch[2]?.trim().toLowerCase();
    return email ? { email, name: name || undefined } : null;
  }

  return trimmed ? { email: trimmed.toLowerCase() } : null;
}

function formatAddress(value: MailAddressInput) {
  const address = parseEmailAddress(value);
  if (!address) {
    throw new Error("A valid email address is required.");
  }

  return address.name ? `${address.name} <${address.email}>` : address.email;
}

export function getResendMailStatus() {
  return {
    configured: Boolean(envValue("RESEND_API_KEY")),
  };
}

export async function sendResendMail(input: SendResendMailInput) {
  const apiKey = envValue("RESEND_API_KEY");

  if (!apiKey) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY.");
  }

  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (recipients.length === 0) {
    throw new Error("At least one email recipient is required.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: formatAddress(input.from),
      to: recipients.map(formatAddress),
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });

  const payload = (await response.json().catch(() => null)) as ResendEmailResponse | null;

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || `Resend rejected the email (${response.status}).`,
    );
  }

  return {
    requestId: payload?.id ?? null,
  };
}
