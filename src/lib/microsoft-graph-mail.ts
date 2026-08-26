type GraphTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type MailAddressInput =
  | string
  | {
      email: string;
      name?: string | null;
    };

export type SendMicrosoft365MailInput = {
  to: MailAddressInput | MailAddressInput[];
  subject: string;
  html: string;
  text?: string;
  contentType?: "HTML" | "Text";
  fromEmail?: string | null;
  replyToEmail?: string | null;
  saveToSentItems?: boolean;
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

function toGraphRecipient(value: MailAddressInput) {
  const address = parseEmailAddress(value);
  if (!address) {
    throw new Error("A valid email recipient is required.");
  }

  return {
    emailAddress: {
      address: address.email,
      ...(address.name ? { name: address.name } : {}),
    },
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getDefaultSenderEmail() {
  return (
    parseEmailAddress(envValue("MS_GRAPH_SENDER_EMAIL"))?.email ??
    parseEmailAddress(envValue("MAIL_FROM"))?.email ??
    parseEmailAddress(envValue("SUPPORT_EMAIL"))?.email ??
    null
  );
}

function getDefaultReplyToEmail() {
  return (
    parseEmailAddress(envValue("MS_GRAPH_REPLY_TO_EMAIL"))?.email ??
    parseEmailAddress(envValue("MAIL_FROM"))?.email ??
    parseEmailAddress(envValue("SUPPORT_EMAIL"))?.email ??
    getDefaultSenderEmail()
  );
}

function hasOwn(object: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function resolveReplyToEmail(options?: { replyToEmail?: string | null }) {
  if (!options || !hasOwn(options, "replyToEmail")) {
    return getDefaultReplyToEmail();
  }

  return parseEmailAddress(options.replyToEmail)?.email ?? null;
}

export function getGraphMailStatus(options?: {
  senderEmail?: string | null;
  replyToEmail?: string | null;
}) {
  const tenantId = envValue("MS_GRAPH_TENANT_ID") ?? envValue("AZURE_TENANT_ID");
  const clientId = envValue("MS_GRAPH_CLIENT_ID") ?? envValue("AZURE_CLIENT_ID");
  const clientSecret =
    envValue("MS_GRAPH_CLIENT_SECRET") ?? envValue("AZURE_CLIENT_SECRET");
  const senderEmail =
    parseEmailAddress(options?.senderEmail)?.email ?? getDefaultSenderEmail();
  const replyToEmail = resolveReplyToEmail(options);

  return {
    configured: Boolean(tenantId && clientId && clientSecret && senderEmail),
    tenantIdConfigured: Boolean(tenantId),
    clientIdConfigured: Boolean(clientId),
    clientSecretConfigured: Boolean(clientSecret),
    senderEmail: senderEmail ?? "",
    replyToEmail: replyToEmail ?? "",
  };
}

async function getGraphAccessToken() {
  const tenantId = envValue("MS_GRAPH_TENANT_ID") ?? envValue("AZURE_TENANT_ID");
  const clientId = envValue("MS_GRAPH_CLIENT_ID") ?? envValue("AZURE_CLIENT_ID");
  const clientSecret =
    envValue("MS_GRAPH_CLIENT_SECRET") ?? envValue("AZURE_CLIENT_SECRET");

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph is not configured. Set MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, and MS_GRAPH_CLIENT_SECRET.",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  const payload = (await response.json().catch(() => null)) as GraphTokenResponse | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        "Unable to authenticate with Microsoft Graph.",
    );
  }

  return payload.access_token;
}

export async function sendMicrosoft365Mail(input: SendMicrosoft365MailInput) {
  const {
    to,
    subject,
    html,
    text,
    contentType = "HTML",
    fromEmail,
    saveToSentItems = true,
  } = input;
  const senderEmail = parseEmailAddress(fromEmail)?.email ?? getDefaultSenderEmail();
  const replyTo = resolveReplyToEmail(input);
  const recipients = Array.isArray(to) ? to : [to];
  const bodyContent = contentType === "Text" ? text ?? stripHtml(html) : html;

  if (!senderEmail) {
    throw new Error(
      "Microsoft Graph sender email is not configured. Set MS_GRAPH_SENDER_EMAIL or pass fromEmail.",
    );
  }

  if (recipients.length === 0) {
    throw new Error("At least one email recipient is required.");
  }

  const accessToken = await getGraphAccessToken();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType,
            content: bodyContent,
          },
          toRecipients: recipients.map(toGraphRecipient),
          ...(replyTo
            ? {
                replyTo: [
                  {
                    emailAddress: {
                      address: replyTo,
                    },
                  },
                ],
              }
            : {}),
        },
        saveToSentItems,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Microsoft Graph rejected the email.");
  }

  return {
    requestId:
      response.headers.get("request-id") ??
      response.headers.get("client-request-id") ??
      null,
  };
}
