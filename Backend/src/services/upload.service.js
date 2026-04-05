import cloudinary from "../configs/cloudinary.js";

export async function deleteImageService(publicId) {
	if (!publicId) return null;

	if (!cloudinary?.uploader?.destroy) {
		return { result: "skipped" };
	}

	try {
		return await cloudinary.uploader.destroy(publicId);
	} catch {
		return { result: "failed" };
	}
}

export const uploadService = {
	deleteImageService,
};
