const cloud_name = process.env.CLOUD_NAME
const upload_preset = process.env.UPLOAD_PRESET
const api_key = process.env.PUBLIC_API_KEY
const source = 'ml'

async function generateSignature(timestamp: number): string {
  const url = process.env.SIGN_URL
  const params = {
    paramsToSign: {
      timestamp,
      upload_preset,
      source,
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
  const result = await response.json()
  return result.signature
}

export default async function uploadFile(file: File, ts: number): CloudinaryUploadApiResponse {
  const timestamp = Math.round(ts / 1000)
  const url = `https://api-ap.cloudinary.com/v1_1/${cloud_name}/auto/upload`
  const signature = await generateSignature(timestamp);
  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', timestamp)
  formData.append('source', source)
  formData.append('upload_preset', upload_preset)
  formData.append('api_key', api_key)
  formData.append('signature', signature)

  const res = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`HTTP error! Status: ${res.status} - ${t}`)
  }

  return await res.json()
}

interface CloudinaryUploadApiResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  bytes: number;
  type: 'upload';
  placeholder: boolean;
  url: string;
  secure_url: string;
  etag: string;
  created_at: string;
  tags: string[];
  moderation?: string[];
  folder?: string | null;
  asset_folder?: string | null;
  original_filename: string;
  original_extension: string;
  api_key: string;
  pages: number;
  eager?: string;
  is_animated?: boolean;
  frame_rate?: number;
  duration?: number;
}
