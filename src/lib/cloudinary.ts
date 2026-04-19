import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImage(
  file: Buffer | string,
  folder = "perfume-erp/products"
): Promise<UploadResult> {
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] },
      (err, res) => (err || !res ? reject(err) : resolve(res))
    );

    if (typeof file === "string") {
      cloudinary.uploader.upload(file, { folder }, (err, res) =>
        err || !res ? reject(err) : resolve(res)
      );
    } else {
      stream.end(file);
    }
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
