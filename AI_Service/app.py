import os
import io
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from PIL import Image
from flask import Flask, request, jsonify

app = Flask(__name__)

# 30 Vietnamese food classes — must match training folder order (alphabetical)
CLASSES = [
    "Banh beo",
    "Banh bot loc",
    "Banh can",
    "Banh canh",
    "Banh chung",
    "Banh cuon",
    "Banh duc",
    "Banh gio",
    "Banh khot",
    "Banh mi",
    "Banh pia",
    "Banh tet",
    "Banh trang nuong",
    "Banh xeo",
    "Bun bo Hue",
    "Bun dau mam tom",
    "Bun mam",
    "Bun rieu",
    "Bun thit nuong",
    "Ca kho to",
    "Canh chua",
    "Cao lau",
    "Chao long",
    "Com tam",
    "Goi cuon",
    "Hu tieu",
    "Mi quang",
    "Nem chua",
    "Pho",
    "Xoi xeo",
]

DISPLAY_NAMES = {
    "Banh beo": "Bánh Bèo",
    "Banh bot loc": "Bánh Bột Lọc",
    "Banh can": "Bánh Căn",
    "Banh canh": "Bánh Canh",
    "Banh chung": "Bánh Chưng",
    "Banh cuon": "Bánh Cuốn",
    "Banh duc": "Bánh Đúc",
    "Banh gio": "Bánh Giò",
    "Banh khot": "Bánh Khọt",
    "Banh mi": "Bánh Mì",
    "Banh pia": "Bánh Pía",
    "Banh tet": "Bánh Tét",
    "Banh trang nuong": "Bánh Tráng Nướng",
    "Banh xeo": "Bánh Xèo",
    "Bun bo Hue": "Bún Bò Huế",
    "Bun dau mam tom": "Bún Đậu Mắm Tôm",
    "Bun mam": "Bún Mắm",
    "Bun rieu": "Bún Riêu",
    "Bun thit nuong": "Bún Thịt Nướng",
    "Ca kho to": "Cá Kho Tộ",
    "Canh chua": "Canh Chua",
    "Cao lau": "Cao Lầu",
    "Chao long": "Cháo Lòng",
    "Com tam": "Cơm Tấm",
    "Goi cuon": "Gỏi Cuốn",
    "Hu tieu": "Hủ Tiếu",
    "Mi quang": "Mỳ Quảng",
    "Nem chua": "Nem Chua",
    "Pho": "Phở",
    "Xoi xeo": "Xôi Xéo",
}

# Image preprocessing transform (matching train.py validation transform)
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# Global state
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
custom_model = None
fallback_model = None
fallback_categories = None
model_path = os.path.join("models", "food_classifier.pth")

def map_imagenet_to_menu(class_name):
    """
    Fallback mapper: Maps ImageNet classes to closest matching Vietnamese food categories
    """
    class_lower = class_name.lower()
    
    if any(k in class_lower for k in ["noodle", "spaghetti", "carbonara", "ramen"]):
        return "Phở", "Pho"
    if any(k in class_lower for k in ["bread", "bun", "sandwich", "bagel", "pretzel"]):
        return "Bánh Mì", "Banh mi"
    if any(k in class_lower for k in ["soup", "bowl", "consomme"]):
        return "Bún Bò Huế", "Bun bo Hue"
    if any(k in class_lower for k in ["rice", "plate", "fried rice"]):
        return "Cơm Tấm", "Com tam"
    if any(k in class_lower for k in ["pancake", "waffle", "crepe"]):
        return "Bánh Xèo", "Banh xeo"
    if any(k in class_lower for k in ["dumpling", "wonton"]):
        return "Bánh Cuốn", "Banh cuon"
    if any(k in class_lower for k in ["spring roll", "burrito", "wrap"]):
        return "Gỏi Cuốn", "Goi cuon"
    if any(k in class_lower for k in ["fish", "seafood"]):
        return "Cá Kho Tộ", "Ca kho to"
        
    return "Phở", "Pho"

def init_models():
    global custom_model, fallback_model, fallback_categories
    print(f"[*] Initializing AI Models. Device: {device}")
    
    # 1. Try to load custom trained model
    if os.path.exists(model_path):
        try:
            print(f"[*] Found custom model weights at {model_path}. Loading custom model...")
            model = mobilenet_v2()
            num_features = model.classifier[1].in_features
            # Must match the training architecture
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.3),
                nn.Linear(num_features, len(CLASSES)),
            )
            
            state_dict = torch.load(model_path, map_location=device)
            model.load_state_dict(state_dict)
            model = model.to(device)
            model.eval()
            custom_model = model
            print(f"[+] Custom food classifier model loaded successfully! ({len(CLASSES)} classes)")
            return
        except Exception as e:
            print(f"[!] Error loading custom model: {e}")
            
    # 2. Load Fallback ImageNet Model
    print("[*] Loading Fallback ImageNet model...")
    try:
        weights = MobileNet_V2_Weights.DEFAULT
        model = mobilenet_v2(weights=weights)
        model = model.to(device)
        model.eval()
        fallback_model = model
        fallback_categories = weights.meta["categories"]
        print("[+] Fallback ImageNet model loaded successfully!")
    except Exception as e:
        print(f"[!] Critical Error loading fallback model: {e}")

# Initialize models on import/startup
init_models()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "custom_model_loaded": custom_model is not None,
        "num_classes": len(CLASSES),
        "device": str(device)
    })

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"success": False, "message": "No image file provided"}), 400
        
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No image file provided"}), 400
        
    try:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = preprocess(image).unsqueeze(0).to(device)
        
        # Scenario A: Use custom trained model
        if custom_model is not None:
            with torch.no_grad():
                outputs = custom_model(tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
                confidence, class_idx = torch.max(probabilities, dim=0)
                
                # Get top-3 predictions for debugging
                top3_prob, top3_idx = torch.topk(probabilities, 3)
            
            raw_class = CLASSES[class_idx.item()]
            display_name = DISPLAY_NAMES.get(raw_class, raw_class)
            conf_val = float(confidence.item())
            
            top3 = [
                {"class": CLASSES[idx.item()], "confidence": float(prob.item())}
                for prob, idx in zip(top3_prob, top3_idx)
            ]
            
            print(f"[Custom AI] Detected: {raw_class} ({conf_val:.2f}) | Top3: {top3}")
            return jsonify({
                "success": True,
                "raw_class": raw_class,
                "class_name": display_name,
                "confidence": conf_val,
                "top3": top3
            })
            
        # Scenario B: Fallback ImageNet model
        elif fallback_model is not None:
            with torch.no_grad():
                outputs = fallback_model(tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
                confidence, class_idx = torch.max(probabilities, dim=0)
                
            imagenet_class = fallback_categories[class_idx.item()]
            display_name, raw_class = map_imagenet_to_menu(imagenet_class)
            conf_val = float(confidence.item())
            
            print(f"[Fallback AI] Detected: {imagenet_class} ({conf_val:.2f}) -> Mapped to: {raw_class}")
            return jsonify({
                "success": True,
                "raw_class": raw_class,
                "class_name": display_name,
                "confidence": conf_val
            })
            
        else:
            return jsonify({"success": False, "message": "No models are loaded"}), 500
            
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == "__main__":
    print("[*] Starting local AI Service on port 8000...")
    app.run(host="0.0.0.0", port=8000)
