import { S3Client } from "@aws-sdk/client-s3";

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    // Railway bucket uses virtual-host style, but path-style is needed for
    // presigned URLs when the SDK constructs the host itself.
    forcePathStyle: false,
  });
}

export const s3 = getS3Client();
export const S3_BUCKET = process.env.S3_BUCKET ?? "";
