import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

function jsonError(message, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function decodeDataUrl(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl || '');
  if (!match) throw new Error('Invalid Hero Frame data.');
  const mimeType = match[1].toLowerCase();
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { mimeType, bytes };
}

function extensionFor(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (req.method !== 'POST') return jsonError('Method not allowed', 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return jsonError('Unauthorized', 401);

    const payload = await req.json();
    if (payload.endpoint !== 'uploadApprovedHeroFrame') return jsonError('Invalid upload endpoint.');
    if (payload.assetType !== 'HERO_FRAME' || payload.purpose !== 'HERO_RENDER' || payload.origin !== 'CreativeBrain' || payload.stage !== 'HeroPhotography') return jsonError('Invalid Hero Frame policy.');
    if (payload.consentGranted !== true) return jsonError('Hero Frame upload consent is required.');
    if (!/^[a-zA-Z0-9._:-]{8,120}$/.test(payload.requestId || '')) return jsonError('Invalid request ID.');

    if (!ALLOWED_MIME.has(String(payload.mimeType || '').toLowerCase())) return jsonError('Unsupported Hero Frame format.');
    const { mimeType, bytes } = decodeDataUrl(payload.fileDataUrl);
    if (!ALLOWED_MIME.has(mimeType)) return jsonError('Unsupported Hero Frame format.');
    if (mimeType !== String(payload.mimeType || '').toLowerCase()) return jsonError('Hero Frame MIME metadata does not match the upload body.');
    if (bytes.byteLength > MAX_BYTES) return jsonError('Hero Frame is too large.');

    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucket = Deno.env.get('R2_BUCKET_NAME');
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return jsonError('Hero Frame storage is not configured.', 500);

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey }
    });

    const safeUserId = String(user.id || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `creative-brain/hero-frames/${safeUserId}/${payload.requestId}.${extensionFor(mimeType)}`;
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: mimeType,
      Metadata: {
        assetType: 'HERO_FRAME',
        purpose: 'HERO_RENDER',
        origin: 'CreativeBrain',
        stage: 'HeroPhotography',
        requestId: payload.requestId
      }
    }));

    const signedUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 900 });
    return Response.json({
      ok: true,
      requestId: payload.requestId,
      file_uri: `r2://${bucket}/${key}`,
      storage_key: key,
      signed_url: signedUrl,
      expires_in: 900,
      mime_type: mimeType,
      assetType: 'HERO_FRAME',
      purpose: 'HERO_RENDER',
      origin: 'CreativeBrain',
      stage: 'HeroPhotography'
    });
  } catch (error) {
    return jsonError(error.message || 'Hero Frame upload failed.', 500);
  }
});