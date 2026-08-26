import "server-only";
import { createHash } from "node:crypto";
import {
  isSanityConfigured,
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/sanity/env";

export type SanityStudioUploadGrant = {
  _id: string;
  _type: string;
  purpose?: string;
  secretHash?: string;
  expiresAt?: string;
  usedAt?: string;
  objectKey?: string;
  filename?: string;
  mimeType?: string;
  bytes?: number;
  documentId?: string | null;
};

const UPLOAD_GRANT_TYPE = "studioUploadGrant";
const UPLOAD_GRANT_PURPOSE = "r2DownloadFileUpload";
const UPLOAD_GRANT_ID_PATTERN = /^studioUploadGrant\.[A-Za-z0-9._-]{10,}$/;

type StudioUploadGrantOptions = {
  purposes?: string[];
};

function getSanityWriteToken() {
  return process.env.SANITY_API_WRITE_TOKEN?.trim() || null;
}

function getSanityApiUrl(pathname: string) {
  return new URL(pathname, `https://${sanityProjectId}.api.sanity.io`);
}

function getUploadGrantId(req: Request) {
  const grantId = req.headers.get("x-sanity-upload-grant-id")?.trim() ?? "";
  return UPLOAD_GRANT_ID_PATTERN.test(grantId) ? grantId : null;
}

function getUploadGrantSecret(req: Request) {
  const secret = req.headers.get("x-sanity-upload-grant-secret")?.trim() ?? "";
  return secret.length >= 40 && secret.length <= 160 ? secret : null;
}

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

async function fetchUploadGrant(grantId: string, token: string) {
  const url = getSanityApiUrl(`/v${sanityApiVersion}/data/query/${sanityDataset}`);
  url.searchParams.set(
    "query",
    `*[_id == $id][0]{
      _id,
      _type,
      purpose,
      secretHash,
      expiresAt,
      usedAt,
      objectKey,
      filename,
      mimeType,
      bytes,
      documentId
    }`,
  );
  url.searchParams.set("$id", JSON.stringify(grantId));

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Sanity Studio upload access is required.");
  }

  const data = (await response.json()) as { result?: SanityStudioUploadGrant | null };
  return data.result ?? null;
}

async function mutateUploadGrant(mutations: Array<Record<string, unknown>>, token: string) {
  const response = await fetch(
    getSanityApiUrl(`/v${sanityApiVersion}/data/mutate/${sanityDataset}`),
    {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ mutations }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to update Sanity Studio upload access.");
  }
}

export async function requireSanityStudioUploadGrant(
  req: Request,
  options: StudioUploadGrantOptions = {},
) {
  if (!isSanityConfigured()) {
    throw new Error("Sanity is not configured.");
  }

  const token = getSanityWriteToken();
  if (!token) {
    throw new Error("Sanity write access is not configured.");
  }

  const grantId = getUploadGrantId(req);
  const secret = getUploadGrantSecret(req);
  if (!grantId || !secret) {
    throw new Error("Sanity Studio upload access is required.");
  }

  const grant = await fetchUploadGrant(grantId, token);
  const allowedPurposes = options.purposes ?? [UPLOAD_GRANT_PURPOSE];
  if (
    !grant ||
    grant._type !== UPLOAD_GRANT_TYPE ||
    !allowedPurposes.includes(grant.purpose ?? "") ||
    grant.secretHash !== hashSecret(secret)
  ) {
    throw new Error("Sanity Studio upload access denied.");
  }

  if (grant.usedAt) {
    throw new Error("Sanity Studio upload access denied.");
  }

  const expiresAt = grant.expiresAt ? Date.parse(grant.expiresAt) : Number.NaN;
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    throw new Error("Sanity Studio upload access denied.");
  }

  return grant;
}

export function assertUploadGrantMatches(
  grant: SanityStudioUploadGrant,
  expected: {
    filename?: string;
    mimeType?: string;
    bytes?: number;
    storageKey?: string;
  },
) {
  if (expected.filename && grant.filename && grant.filename !== expected.filename) {
    throw new Error("Sanity Studio upload access denied.");
  }

  if (expected.mimeType && grant.mimeType && grant.mimeType !== expected.mimeType) {
    throw new Error("Sanity Studio upload access denied.");
  }

  if (
    typeof expected.bytes === "number" &&
    typeof grant.bytes === "number" &&
    grant.bytes !== expected.bytes
  ) {
    throw new Error("Sanity Studio upload access denied.");
  }

  if (expected.storageKey && grant.objectKey !== expected.storageKey) {
    throw new Error("Sanity Studio upload access denied.");
  }
}

export async function markUploadGrantPresigned(grantId: string, objectKey: string) {
  const token = getSanityWriteToken();
  if (!token) {
    throw new Error("Sanity write access is not configured.");
  }

  await mutateUploadGrant(
    [
      {
        patch: {
          id: grantId,
          set: {
            objectKey,
            presignedAt: new Date().toISOString(),
          },
        },
      },
    ],
    token,
  );
}

export async function markUploadGrantUsed(grantId: string) {
  const token = getSanityWriteToken();
  if (!token) {
    throw new Error("Sanity write access is not configured.");
  }

  await mutateUploadGrant(
    [
      {
        patch: {
          id: grantId,
          set: {
            usedAt: new Date().toISOString(),
          },
        },
      },
    ],
    token,
  );
}
