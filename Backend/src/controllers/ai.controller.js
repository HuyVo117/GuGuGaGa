import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import FormData from "form-data";
import db from "../configs/firestore.js";
import { ApiResponse } from "../configs/apiResponse.js";

const productsRef = db.collection("products");

export const aiController = {
  async recognizeFood(req, res) {
    try {
      if (!req.file) {
        throw new Error("No image file uploaded");
      }

      // 1. Package the image buffer and send it to the local Python AI service
      const form = new FormData();
      form.append("image", req.file.buffer, {
        filename: req.file.originalname || "image.jpg",
        contentType: req.file.mimetype,
      });

      const pythonResponse = await axios.post("http://localhost:8000/predict", form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      if (!pythonResponse.data || !pythonResponse.data.success) {
        throw new Error(pythonResponse.data.message || "Failed to get prediction from local AI");
      }

      const detectedCategory = pythonResponse.data.class_name; // e.g. "Gà Rán", "Burger", "Đồ Uống", "Món Phụ"
      const confidence = pythonResponse.data.confidence;

      // 2. Fetch all products from Firestore
      const snap = await productsRef.get();
      const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Search and filter products that belong to the detected category
      const categoriesRef = db.collection("categories");
      const catSnap = await categoriesRef.get();
      const allCategories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Find the category document that matches the detectedCategory name (case insensitive and space removed)
      const matchedCategory = allCategories.find(c => 
        c.name.toLowerCase().replace(/\s+/g, "") === detectedCategory.toLowerCase().replace(/\s+/g, "")
      );

      let matchedProducts = [];
      if (matchedCategory) {
        // Find products belonging to this category
        matchedProducts = allProducts.filter(p => p.categoryId === matchedCategory.id);
      } else {
        // Fallback: search product name contains detectedCategory
        matchedProducts = allProducts.filter(p => 
          p.name.toLowerCase().includes(detectedCategory.toLowerCase())
        );
      }

      return ApiResponse.success(res, {
        detectedFoodName: `${detectedCategory} (Độ tin cậy: ${(confidence * 100).toFixed(0)}%)`,
        matchedProducts
      }, "Food recognized successfully by local AI");

    } catch (error) {
      console.error("Local AI Error:", error);
      return ApiResponse.error(res, error, 400);
    }
  },

  async scanReceipt(req, res) {
    try {
      if (!req.file) {
        throw new Error("No image file uploaded");
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in backend environment");
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Convert buffer to generative part
      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype
        }
      };

      const prompt = `Phân tích ảnh chụp biên lai giao hàng hoặc ảnh chụp màn hình lịch sử giao dịch chuyển khoản (như Momo, Ngân hàng, v.v.).
Hãy trích xuất các thông tin sau:
1. "orderId": Mã đơn hàng (nếu tìm thấy trên biên lai/nội dung chuyển khoản, hãy lấy chuỗi đó, nếu không thấy thì trả về null).
2. "amount": Tổng số tiền đã thanh toán (số nguyên, ví dụ: 70000).
3. "paymentStatus": Trạng thái thanh toán ("SUCCESS" nếu giao dịch thành công, "FAILED" nếu thất bại, "PENDING" nếu đang xử lý hoặc chưa rõ).
4. "paymentMethod": Phương thức thanh toán ("MOMO", "BANKING", "COD" hoặc "UNKNOWN").

Trả về kết quả dưới dạng đối tượng JSON sạch có định dạng:
{
  "orderId": string hoặc null,
  "amount": number hoặc null,
  "paymentStatus": string,
  "paymentMethod": string
}
Không viết thêm bất kỳ từ giải tiếp hay giải thích nào khác ngoài chuỗi JSON sạch (không có khối mã markdown \`\`\`json).`;

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();
      
      let parsedResult;
      try {
        const cleanedText = text.replace(/```json|```/g, "").trim();
        parsedResult = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Gemini raw response:", text);
        throw new Error("AI returned invalid JSON format: " + text);
      }

      return ApiResponse.success(res, parsedResult, "Receipt scanned successfully");

    } catch (error) {
      console.error("AI Error:", error);
      return ApiResponse.error(res, error, 400);
    }
  }
};
