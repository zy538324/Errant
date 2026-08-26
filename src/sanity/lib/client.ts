import "server-only";
import {
  isSanityConfigured,
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/sanity/env";

type SanityQueryParams = Record<string, unknown>;

type SanityFetchOptions = RequestInit & {
  useCdn?: boolean;
  next?: {
    revalidate?: number;
  };
};

type SanityAssetUploadResult = {
  document: {
    _id: string;
    url?: string;
  };
};

type SanityReadClient = {
  fetch<T>(
    query: string,
    params?: SanityQueryParams,
    options?: SanityFetchOptions,
  ): Promise<T>;
};

type SanityWriteClient = {
  createOrReplace(document: Record<string, unknown>): Promise<void>;
  patchDocument(
    documentId: string,
    patch: {
      set?: Record<string, unknown>;
      unset?: string[];
    },
  ): Promise<void>;
  uploadImageAsset(input: {
    body: Buffer | Uint8Array;
    filename: string;
    contentType: string;
  }): Promise<{ assetId: string; url: string | null }>;
};

function getSanityHost(useCdn: boolean) {
  return useCdn
    ? `https://${sanityProjectId}.apicdn.sanity.io`
    : `https://${sanityProjectId}.api.sanity.io`;
}

function buildSanityQueryUrl(
  query: string,
  params: SanityQueryParams = {},
  useCdn = true,
) {
  const url = new URL(
    `/v${sanityApiVersion}/data/query/${sanityDataset}`,
    getSanityHost(useCdn),
  );

  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "published");

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "undefined") {
      continue;
    }

    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  return url;
}

async function parseSanityResponse<T>(response: Response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sanity request failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as { result: T };
  return data.result;
}

async function ensureSanityResponseOk(response: Response) {
  if (response.ok) {
    return;
  }

  const message = await response.text();
  throw new Error(`Sanity request failed (${response.status}): ${message}`);
}

function getSanityWriteToken() {
  return process.env.SANITY_API_WRITE_TOKEN?.trim() || null;
}

function sanitizeAssetFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180) || "preview.jpg";
}

export function getSanityReadClient() {
  if (!isSanityConfigured()) {
    return null;
  }

  const client: SanityReadClient = {
    async fetch<T>(
      query: string,
      params: SanityQueryParams = {},
      options: SanityFetchOptions = {},
    ) {
      const { headers, useCdn = true, ...rest } = options;
      const response = await fetch(buildSanityQueryUrl(query, params, useCdn), {
        ...rest,
        headers: {
          accept: "application/json",
          ...headers,
        },
      });

      return parseSanityResponse<T>(response);
    },
  };

  return client;
}

export function getSanityWriteClient() {
  const token = getSanityWriteToken();

  if (!isSanityConfigured() || !token) {
    return null;
  }

  const mutationUrl = new URL(
    `/v${sanityApiVersion}/data/mutate/${sanityDataset}`,
    getSanityHost(false),
  );

  const client: SanityWriteClient = {
    async createOrReplace(document: Record<string, unknown>) {
      const response = await fetch(mutationUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mutations: [{ createOrReplace: document }],
        }),
      });

      await ensureSanityResponseOk(response);
    },
    async patchDocument(documentId, patch) {
      const response = await fetch(mutationUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mutations: [
            {
              patch: {
                id: documentId,
                ...patch,
              },
            },
          ],
        }),
      });

      await ensureSanityResponseOk(response);
    },
    async uploadImageAsset(input) {
      const filename = sanitizeAssetFilename(input.filename);
      const bytes = Uint8Array.from(input.body);
      const uploadUrl = new URL(
        `/v${sanityApiVersion}/assets/images/${sanityDataset}`,
        getSanityHost(false),
      );
      uploadUrl.searchParams.set("filename", filename);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "content-type": input.contentType,
          "content-length": String(bytes.byteLength),
        },
        body: bytes,
      });

      await ensureSanityResponseOk(response);
      const result = (await response.json()) as SanityAssetUploadResult;
      return {
        assetId: result.document._id,
        url: result.document.url ?? null,
      };
    },
  };

  return client;
}
