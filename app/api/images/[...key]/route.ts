import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } },
) {
  if (!s3 || !S3_BUCKET) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  const key = params.key.join("/");

  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    const body = res.Body;
    if (!body) return new NextResponse("Not found", { status: 404 });

    const readable = (body as { transformToWebStream: () => ReadableStream }).transformToWebStream();
    return new NextResponse(readable, {
      headers: {
        "Content-Type": res.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(res.ContentLength ? { "Content-Length": String(res.ContentLength) } : {}),
      },
    });
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === "NoSuchKey" || code === "NotFound") {
      return new NextResponse("Not found", { status: 404 });
    }
    console.error("[images] fetch error", err);
    return new NextResponse("Error", { status: 500 });
  }
}
