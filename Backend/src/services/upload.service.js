import cloudinary from "../configs/cloudinary.js";

export const uploadImageProductService = async (filePath) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: "products/",
  });
};
export const uploadImageComboService = async (filePath) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: "combo/",
  });
};
export const deleteImageService = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};
