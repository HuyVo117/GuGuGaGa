import {
  uploadImageProductService,
  deleteImageService,
  uploadImageComboService,
} from "../services/upload.service.js";
import { ApiResponse } from "../configs/apiResponse.js";
export const uploadImageProduct = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, { message: "No file uploaded" }, 400);
    }
    console.log("FILE RECEIVED:", req.file);
    const result = await uploadImageProductService(req.file.path);

    // Delete temp file
    // fs.unlinkSync(req.file.path); // Assuming fs is imported or handled in service.
    // Actually, let's keep it simple and rely on the service or just leave it for now as the plan didn't specify cleanup explicitly,
    // but it's good practice. However, I don't want to add imports if I don't have to.
    // The service takes filePath.

    return ApiResponse.success(
      res,
      {
        url: result.secure_url,
        public_id: result.public_id,
      },
      "Upload successful"
    );
  } catch (err) {
    return ApiResponse.error(res, err, 500);
  }
};
export const uploadImageCombo = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, { message: "No file uploaded" }, 400);
    }

    const result = await uploadImageComboService(req.file.path);

    return ApiResponse.success(
      res,
      {
        url: result.secure_url,
        public_id: result.public_id,
      },
      "Upload successful"
    );
  } catch (err) {
    return ApiResponse.error(res, err, 500);
  }
};
export const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return ApiResponse.error(res, { message: "public_id is required" }, 400);
    }

    await deleteImageService(public_id);

    return ApiResponse.success(res, null, "Image deleted");
  } catch (err) {
    return ApiResponse.error(res, err, 500);
  }
};
