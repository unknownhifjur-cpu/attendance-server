import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/**
 * Upload a file Buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer
 * @param {object} options
 * @returns {Promise<object>}
 */
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "attendance-payroll",
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export { cloudinary };

