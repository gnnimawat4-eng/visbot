import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadVisitorPhoto(base64Image: string, visitorId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: `visbot/visitors/${visitorId}`,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
    public_id: `photo_${Date.now()}`,
  })
  return result.secure_url
}
