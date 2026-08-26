import { useCallback, useMemo, useRef, useState } from "react";
import {
  PatchEvent,
  set,
  setIfMissing,
  unset,
  useClient,
  type ObjectInputProps,
} from "sanity";

export type R2DownloadFileValue = {
  storageKey?: string;
  mimeType?: string;
  bytes?: number;
  filename?: string;
  uploadedAt?: string;
};

type PresignResponse = {
  uploadUrl?: string;
  objectKey?: string;
  headers?: Record<string, string>;
  filename?: string;
  mimeType?: string;
  bytes?: number;
  uploadedAt?: string;
  error?: string;
};

type FinaliseResponse = {
  downloadFile?: R2DownloadFileValue & { _type?: "r2DownloadFile" };
  previewImage?: {
    _type: "image";
    asset: {
      _type: "reference";
      _ref: string;
    };
  };
  previewImageUrl?: string | null;
  error?: string;
};

type ClearResponse = {
  ok?: boolean;
  error?: string;
};

type UploadGrant = {
  id: string;
  secret: string;
  headers: Record<string, string>;
};

type StudioGrantPurpose = "r2DownloadFileUpload" | "r2DownloadFileClear";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function formatBytes(bytes?: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadApiError(response: Response, fallback: string, apiError?: string) {
  if (response.status === 401 || response.status === 403) {
    return apiError ?? "Sanity Studio could not authorise this upload. Refresh Studio and try again.";
  }

  return apiError ?? fallback;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createRandomHex(byteCount: number) {
  const bytes = new Uint8Array(byteCount);
  window.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashUploadGrantSecret(secret: string) {
  const bytes = new TextEncoder().encode(secret);
  const hash = await window.crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(hash));
}

async function uploadViaAppRoute(
  descriptor: PresignResponse,
  file: File,
  grant: UploadGrant,
) {
  const formData = new FormData();
  formData.set("storageKey", descriptor.objectKey ?? "");
  formData.set("filename", descriptor.filename || file.name);
  formData.set("mimeType", descriptor.mimeType || file.type || "application/octet-stream");
  formData.set("bytes", String(descriptor.bytes ?? file.size));
  formData.set("file", file);

  const response = await fetch("/api/sanity/r2-upload/file", {
    method: "POST",
    headers: grant.headers,
    body: formData,
  });
  const result = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(
      getUploadApiError(
        response,
        "Unable to upload the full-quality image through the app.",
        result?.error,
      ),
    );
  }
}

async function uploadOriginal(
  descriptor: PresignResponse,
  file: File,
  grant: UploadGrant,
) {
  await uploadViaAppRoute(descriptor, file, grant);
}

export function R2DownloadFileInput(props: ObjectInputProps<R2DownloadFileValue>) {
  const { value, onChange } = props;
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sanityClient = useClient({ apiVersion: "2021-06-07" });

  const documentValue = (
    props as unknown as {
      document?: {
        _id?: string;
        title?: string;
        collectionSlug?: string;
        slug?: { current?: string };
      };
    }
  ).document;

  const collectionSlug = useMemo(() => {
    return slugify(documentValue?.collectionSlug || "studio");
  }, [documentValue?.collectionSlug]);

  const createStudioGrant = useCallback(
    async (purpose: StudioGrantPurpose, file?: File) => {
      if (!window.crypto?.subtle) {
        throw new Error("This browser cannot create secure Studio upload access.");
      }

      const grantId = `studioUploadGrant.${window.crypto.randomUUID()}`;
      const secret = createRandomHex(32);
      const now = new Date();
      const mimeType = file ? file.type || "application/octet-stream" : undefined;

      await sanityClient.createOrReplace({
        _id: grantId,
        _type: "studioUploadGrant",
        purpose,
        secretHash: await hashUploadGrantSecret(secret),
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        filename: file?.name,
        mimeType,
        bytes: file?.size,
        documentId: documentValue?._id ?? null,
      });

      return {
        id: grantId,
        secret,
        headers: {
          "x-sanity-upload-grant-id": grantId,
          "x-sanity-upload-grant-secret": secret,
        },
      };
    },
    [documentValue?._id, sanityClient],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setMessage(null);

      try {
        const grant = await createStudioGrant("r2DownloadFileUpload", file);

        const response = await fetch("/api/sanity/r2-upload/presign", {
          method: "POST",
          headers: {
            ...grant.headers,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            collectionSlug,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            bytes: file.size,
          }),
        });

        const descriptor = (await response.json().catch(() => null)) as PresignResponse | null;
        if (!response.ok || !descriptor?.uploadUrl || !descriptor.objectKey) {
          throw new Error(getUploadApiError(response, "Unable to prepare upload.", descriptor?.error));
        }

        await uploadOriginal(descriptor, file, grant);

        const finaliseResponse = await fetch("/api/sanity/r2-upload/finalise", {
          method: "POST",
          headers: {
            ...grant.headers,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            storageKey: descriptor.objectKey,
            filename: descriptor.filename || file.name,
            mimeType: descriptor.mimeType || file.type || "application/octet-stream",
            bytes: descriptor.bytes ?? file.size,
            title: documentValue?.title || file.name,
            documentId: documentValue?._id,
            slug: documentValue?.slug,
          }),
        });

        const finalised = (await finaliseResponse.json().catch(() => null)) as FinaliseResponse | null;
        if (!finaliseResponse.ok || !finalised?.downloadFile) {
          throw new Error(
            getUploadApiError(
              finaliseResponse,
              "Unable to create the website preview image.",
              finalised?.error,
            ),
          );
        }

        const patches = [
          set(finalised.downloadFile),
          ...(finalised.previewImage
            ? [setIfMissing({}, ["previewImage"]), set(finalised.previewImage, ["previewImage"])]
            : []),
          ...(finalised.previewImageUrl
            ? [set(finalised.previewImageUrl, ["previewImageUrl"])]
            : []),
        ];

        onChange(PatchEvent.from(patches));
        setMessage("Done. The image is ready: customer download stored privately and website preview created automatically.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to upload file.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      collectionSlug,
      createStudioGrant,
      documentValue?._id,
      documentValue?.slug,
      documentValue?.title,
      onChange,
    ],
  );

  const handleClear = useCallback(async () => {
    setUploading(true);
    setMessage(null);

    try {
      if (documentValue?._id) {
        const grant = await createStudioGrant("r2DownloadFileClear");
        const response = await fetch("/api/sanity/r2-upload/clear", {
          method: "POST",
          headers: {
            ...grant.headers,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            documentId: documentValue._id,
            slug: documentValue.slug?.current,
          }),
        });
        const result = (await response.json().catch(() => null)) as ClearResponse | null;

        if (!response.ok || !result?.ok) {
          throw new Error(
            getUploadApiError(
              response,
              "Unable to clear the uploaded image reference.",
              result?.error,
            ),
          );
        }
      }

      onChange(PatchEvent.from([
        unset(),
        unset(["previewImage"]),
        unset(["previewImageUrl"]),
      ]));
      setMessage("Cleared. The private download and website preview references were removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to clear upload.");
    } finally {
      setUploading(false);
    }
  }, [createStudioGrant, documentValue?._id, documentValue?.slug, onChange]);

  return (
    <div
      style={{
        border: "1px solid var(--card-border-color)",
        borderRadius: "0.75rem",
        padding: "1rem",
        background: "var(--card-bg-color)",
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <div style={{ fontWeight: 700 }}>Upload the shop image</div>
      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
        Choose the full-quality image once. The site will automatically create the website preview and keep the customer download private.
      </p>
      {value?.storageKey ? (
        <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
          <div><strong>Uploaded:</strong> {value.filename || "Image uploaded"}</div>
          <div><strong>Size:</strong> {formatBytes(value.bytes)}</div>
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/avif,image/heic,image/heif,image/jpeg,image/jpg,image/png,image/tiff,image/webp"
        disabled={uploading || props.readOnly}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
        }}
      />
      {value?.storageKey ? (
        <button
          type="button"
          disabled={uploading || props.readOnly}
          onClick={() => {
            void handleClear();
          }}
        >
          Clear uploaded image
        </button>
      ) : null}
      {uploading ? <p style={{ margin: 0, fontSize: "0.85rem" }}>Uploading and creating the preview...</p> : null}
      {message ? <p style={{ margin: 0, fontSize: "0.85rem" }}>{message}</p> : null}
    </div>
  );
}
