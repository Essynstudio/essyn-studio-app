/**
 * Cloudflare R2 — Storage client
 * Uses S3-compatible API with presigned URLs for direct browser uploads.
 * Bucket: essyn-gallery-photos
 * Public URL: https://media.essyn.studio/{path}
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = "495e91f9a92b00c7bef2feb3c9548a01";
const BUCKET_NAME = "essyn-gallery-photos";
const PUBLIC_BASE_URL = "https://media.essyn.studio";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

/**
 * Generate a presigned URL for direct browser upload.
 * Expires in 5 minutes.
 */
export async function getUploadPresignedUrl(path: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(path: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: path }));
}

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(path: string): string {
  return `${PUBLIC_BASE_URL}/${path}`;
}

export { BUCKET_NAME, PUBLIC_BASE_URL };
