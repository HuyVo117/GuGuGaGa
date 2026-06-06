# 🍜 GuGuGaGa - Ứng Dụng Đặt Món Ăn Việt Nam

> Hệ thống đặt món ăn trực tuyến bao gồm: ứng dụng khách hàng (Flutter), ứng dụng shipper (Flutter), trang quản trị (React), backend API (Node.js/Express), và dịch vụ nhận diện món ăn bằng AI (Python/PyTorch).

---

## 📑 Mục Lục

- [Tổng Quan Kiến Trúc](#-tổng-quan-kiến-trúc)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Thiết Lập Firebase](#-thiết-lập-firebase)
- [Cài Đặt & Chạy Backend](#1--backend-nodejs--express)
- [Cài Đặt & Chạy Flutter App (Khách Hàng)](#2--flutter-app---khách-hàng-gugugaga)
- [Cài Đặt & Chạy Flutter App (Shipper)](#3--flutter-app---shipper-gugugaga-shipper)
- [Cài Đặt & Chạy Admin Panel](#4--admin-panel-react--vite)
- [Cài Đặt & Chạy AI Service](#5--ai-service-pythonpytorch)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [API Endpoints](#-api-endpoints)
- [Lưu Ý Quan Trọng](#-lưu-ý-quan-trọng)

---

## 🏗 Tổng Quan Kiến Trúc

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Flutter App      │     │  Flutter App      │     │  Admin Panel      │
│  (Khách hàng)     │     │  (Shipper)        │     │  (React + Vite)   │
│  Port: Mobile     │     │  Port: Mobile     │     │  Port: 5173       │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         └────────────┬───────────┴────────────────────────┘
                      │  HTTP REST API
                      ▼
              ┌───────────────┐        ┌───────────────┐
              │   Backend     │◄──────►│  AI Service   │
              │   (Express)   │        │  (Flask)      │
              │   Port: 5000  │        │  Port: 8000   │
              └───────┬───────┘        └───────────────┘
                      │
              ┌───────▼───────┐
              │   Firebase    │
              │  (Firestore + │
              │   Auth)       │
              └───────────────┘
```

---

## 💻 Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu | Tải về |
|---------|---------------------|--------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Flutter** | 3.3.0+ | [flutter.dev](https://flutter.dev/docs/get-started/install) |
| **Python** | 3.9+ | [python.org](https://www.python.org/downloads/) |
| **Git** | 2.x | [git-scm.com](https://git-scm.com/) |
| **Android Studio** hoặc **VS Code** | Mới nhất | Để chạy Flutter |

---

## 🔥 Thiết Lập Firebase

Dự án sử dụng **Firebase** (Firestore + Authentication). Bạn cần tạo project Firebase riêng:

### Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Nhấn **"Add project"** → đặt tên (vd: `gugugaga-food`)
3. Bật **Google Analytics** (tùy chọn) → nhấn **Create project**

### Bước 2: Bật Authentication

1. Vào **Authentication** → tab **Sign-in method**
2. Bật **Email/Password**
3. Bật **Google** (tùy chọn, nếu muốn đăng nhập bằng Google)

### Bước 3: Tạo Firestore Database

1. Vào **Firestore Database** → nhấn **Create database**
2. Chọn **Start in test mode** (để phát triển)
3. Chọn region gần nhất (vd: `asia-southeast1`)

### Bước 4: Lấy Service Account Key (cho Backend)

1. Vào **Project Settings** (⚙️) → tab **Service accounts**
2. Nhấn **"Generate new private key"** → tải file JSON
3. Đổi tên file thành `serviceAccountKey.json`
4. Đặt vào thư mục `Backend/`

### Bước 5: Cấu hình Firebase cho Flutter

1. Cài FlutterFire CLI:
   ```bash
   dart pub global activate flutterfire_cli
   ```
2. Chạy trong thư mục `gugugaga/`:
   ```bash
   flutterfire configure --project=YOUR_PROJECT_ID
   ```
3. Lặp lại cho thư mục `gugugaga shipper/`:
   ```bash
   cd "gugugaga shipper"
   flutterfire configure --project=YOUR_PROJECT_ID
   ```

> ⚠️ Lệnh trên sẽ tự tạo/cập nhật file `firebase_options.dart` với thông tin project của bạn.

---

## 1. 🖥 Backend (Node.js + Express)

### Cài đặt

```bash
cd Backend
npm install
```

### Tạo file môi trường

Tạo file `Backend/.env` với nội dung:

```env
# ===== Server =====
PORT=5000
NODE_ENV=development

# ===== JWT =====
JWT_SECRET=your_jwt_secret_key_here

# ===== Firebase =====
# Đường dẫn tới file Service Account Key đã tải ở Bước 4
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# ===== Cloudinary (Upload ảnh sản phẩm) =====
# Đăng ký tại https://cloudinary.com/ (miễn phí)
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_KEY=your_cloudinary_api_key
CLOUD_SECRET=your_cloudinary_api_secret

# ===== OpenCage Geocoding API (Chuyển địa chỉ → tọa độ) =====
# Đăng ký tại https://opencagedata.com/ (miễn phí 2500 request/ngày)
API_KEY=your_opencage_api_key

# ===== Gemini AI (Chat AI trong app) =====
# Lấy tại https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

# ===== Thanh toán ngân hàng (QR Code) =====
BANK_ID=MB
BANK_ACCOUNT_NO=your_bank_account_number
BANK_ACCOUNT_NAME=YOUR_BANK_ACCOUNT_NAME

# ===== Casso (Xác nhận thanh toán tự động - tùy chọn) =====
# Đăng ký tại https://casso.vn/
CASSO_API_KEY=your_casso_api_key
```

### Seed dữ liệu mẫu

```bash
npm run seed
```

> Lệnh này sẽ tạo tài khoản admin mẫu, chi nhánh, danh mục, và sản phẩm mẫu trong Firestore.

### Chạy Backend

```bash
npm run dev
```

> ✅ Server chạy tại `http://localhost:5000`

---

## 2. 📱 Flutter App - Khách Hàng (`gugugaga`)

### Cài đặt

```bash
cd gugugaga
flutter pub get
```

### Tạo file môi trường

Tạo file `gugugaga/.env` với nội dung:

```env
# URL của Backend API
# - Android Emulator: dùng 10.0.2.2 (thay cho localhost)
# - iOS Simulator / Web / Thiết bị thật cùng WiFi: dùng IP máy tính (vd: 192.168.1.100)
BASE_URL=http://10.0.2.2:5000/api

# Mapbox (cho bản đồ chọn vị trí)
# Đăng ký tại https://www.mapbox.com/ (miễn phí 50k loads/tháng)
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# OpenCage (geocoding - chuyển tọa độ thành địa chỉ)
OPENCAGE_API_KEY=your_opencage_api_key

# Gemini AI (chat AI tư vấn món ăn)
GEMINI_API_KEY=your_gemini_api_key
```

### Chạy ứng dụng

```bash
# Kiểm tra thiết bị
flutter devices

# Chạy trên Android Emulator
flutter run

# Chạy trên Chrome (Web)
flutter run -d chrome
```

> ⚠️ **Lưu ý cho Android Emulator**: `BASE_URL` phải dùng `http://10.0.2.2:5000/api` (không dùng `localhost`).
>
> ⚠️ **Lưu ý cho thiết bị thật**: Đổi `BASE_URL` thành IP của máy chạy Backend (vd: `http://192.168.1.100:5000/api`). Đảm bảo máy tính và điện thoại cùng mạng WiFi.

---

## 3. 🚚 Flutter App - Shipper (`gugugaga shipper`)

### Cài đặt

```bash
cd "gugugaga shipper"
flutter pub get
```

### Tạo file môi trường

Tạo file `gugugaga shipper/.env` với nội dung:

```env
# URL Backend API (tương tự app khách hàng)
BASE_URL=http://10.0.2.2:5000/api

# Mapbox (bản đồ điều hướng giao hàng)
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### Chạy ứng dụng

```bash
cd "gugugaga shipper"
flutter run
```

---

## 4. 🛠 Admin Panel (React + Vite)

### Cài đặt

```bash
cd Admin
npm install
```

### Tạo file môi trường

Tạo file `Admin/.env` với nội dung:

```env
# Mapbox Public Token (hiển thị bản đồ chi nhánh)
VITE_MAPBOX_PUBLIC=your_mapbox_public_token
```

> **Lưu ý**: Admin Panel kết nối Backend tại `http://localhost:5000/api/admin` (đã hardcode trong code). Nếu Backend chạy ở port/host khác, sửa trong file `Admin/src/lib/axios.js`.

### Chạy Admin Panel

```bash
npm run dev
```

> ✅ Admin Panel chạy tại `http://localhost:5173`

---

## 5. 🤖 AI Service (Python/PyTorch)

Dịch vụ nhận diện 30 món ăn Việt Nam bằng AI (MobileNet V2).

### Cài đặt

```bash
cd AI_Service
pip install -r requirements.txt
```

> ⚠️ Khuyến nghị tạo virtual environment trước:
> ```bash
> python -m venv venv
> # Windows:
> venv\Scripts\activate
> # macOS/Linux:
> source venv/bin/activate
> pip install -r requirements.txt
> ```

### Tải model đã huấn luyện

File model `food_classifier.pth` (~9MB) không bao gồm trong repo. Tải về từ:
- **Google Drive / Link chia sẻ**: *(liên hệ team để lấy link)*
- Đặt vào: `AI_Service/models/food_classifier.pth`

### Huấn luyện lại model (tùy chọn)

Nếu muốn tự huấn luyện:

1. Tải dataset từ Kaggle: **[Vietnamese Food Dataset](https://www.kaggle.com/)** *(30 loại, ~25.000 ảnh)*
2. Giải nén vào `AI_Service/dataset/` với cấu trúc:
   ```
   AI_Service/dataset/
   ├── train/
   │   ├── Banh beo/
   │   ├── Banh mi/
   │   ├── Pho/
   │   └── ... (30 thư mục)
   ├── val/
   │   └── ... (30 thư mục)
   └── test/
       └── ... (30 thư mục)
   ```
3. Chạy huấn luyện:
   ```bash
   python train.py
   ```
   > Model tốt nhất sẽ tự động lưu vào `models/food_classifier.pth`

### Chạy AI Service

```bash
python app.py
```

> ✅ AI Service chạy tại `http://localhost:8000`

### Test nhanh

```bash
# Kiểm tra sức khỏe
curl http://localhost:8000/health

# Nhận diện ảnh
curl -X POST -F "image=@path/to/food_image.jpg" http://localhost:8000/predict
```

---

## 📁 Cấu Trúc Thư Mục

```
GuGuGaGa/
├── Backend/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── configs/            # Cấu hình (env, firebase, cloudinary)
│   │   ├── controllers/        # Xử lý logic request
│   │   ├── middleware/          # JWT auth, admin check
│   │   ├── models/             # Data models
│   │   ├── routes/             # Định tuyến API
│   │   ├── services/           # Business logic
│   │   └── server.js           # Entry point
│   ├── uploads/                # Ảnh upload tạm
│   ├── .env                    # ⚠️ Tự tạo (xem hướng dẫn)
│   ├── serviceAccountKey.json  # ⚠️ Tự tạo (Firebase)
│   └── package.json
│
├── gugugaga/                   # Flutter App - Khách hàng
│   ├── lib/
│   │   ├── models/             # Data models (User, Product, Order...)
│   │   ├── providers/          # State management (Provider)
│   │   ├── screens/            # Các màn hình UI
│   │   ├── services/           # API calls, Firebase auth
│   │   ├── constants.dart      # Hằng số (API URL, keys)
│   │   ├── firebase_options.dart # ⚠️ Tự tạo bằng FlutterFire CLI
│   │   └── main.dart           # Entry point
│   ├── .env                    # ⚠️ Tự tạo (xem hướng dẫn)
│   └── pubspec.yaml
│
├── gugugaga shipper/           # Flutter App - Shipper
│   ├── lib/
│   │   ├── screens/            # Màn hình shipper
│   │   ├── services/           # API calls
│   │   └── main.dart
│   ├── .env                    # ⚠️ Tự tạo (xem hướng dẫn)
│   └── pubspec.yaml
│
├── Admin/                      # Admin Panel (React + Vite)
│   ├── src/
│   │   ├── components/         # UI Components
│   │   ├── pages/              # Trang quản trị
│   │   ├── services/           # API services
│   │   └── lib/axios.js        # Axios config
│   ├── .env                    # ⚠️ Tự tạo (xem hướng dẫn)
│   └── package.json
│
├── AI_Service/                 # AI nhận diện món ăn
│   ├── app.py                  # Flask API server
│   ├── train.py                # Script huấn luyện model
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   ├── food_classifier.pth # ⚠️ Tải riêng (không có trong repo)
│   │   └── README.md           # Giải thích chi tiết model
│   └── dataset/                # ⚠️ Tải từ Kaggle (không có trong repo)
│
├── .gitignore
└── README.md                   # ← Bạn đang ở đây
```

---

## 🔌 API Endpoints

### User API (`/api/user`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/register` | Đăng ký |
| GET | `/products` | Danh sách sản phẩm |
| POST | `/orders` | Tạo đơn hàng |
| GET | `/orders` | Lịch sử đơn hàng |
| GET | `/notifications` | Danh sách thông báo |
| POST | `/reviews` | Đánh giá sản phẩm |

### Admin API (`/api/admin`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/dashboard` | Dữ liệu dashboard |
| CRUD | `/products` | Quản lý sản phẩm |
| CRUD | `/orders` | Quản lý đơn hàng |
| CRUD | `/users` | Quản lý người dùng |
| CRUD | `/drivers` | Quản lý tài xế |

### AI API (`/api/ai`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/predict` | Nhận diện món ăn từ ảnh |
| POST | `/chat` | Chat AI tư vấn (Gemini) |

### AI Service Direct (`localhost:8000`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/health` | Kiểm tra trạng thái |
| POST | `/predict` | Nhận diện ảnh trực tiếp |

---

## 🔑 Tổng Hợp API Keys Cần Lấy

| API Key | Dùng cho | Đăng ký tại | Gói miễn phí |
|---------|----------|-------------|-------------|
| **Firebase** | Auth + Database | [firebase.google.com](https://firebase.google.com/) | ✅ Spark plan (miễn phí) |
| **Cloudinary** | Upload ảnh | [cloudinary.com](https://cloudinary.com/) | ✅ 25GB storage |
| **Mapbox** | Bản đồ | [mapbox.com](https://www.mapbox.com/) | ✅ 50K loads/tháng |
| **OpenCage** | Geocoding | [opencagedata.com](https://opencagedata.com/) | ✅ 2500 req/ngày |
| **Gemini AI** | Chat AI | [aistudio.google.com](https://aistudio.google.com/apikey) | ✅ Miễn phí |
| **Casso** | Thanh toán tự động | [casso.vn](https://casso.vn/) | ⚠️ Tùy gói |

---

## ⚡ Chạy Nhanh (Quick Start)

```bash
# 1. Clone repo
git clone https://github.com/HuyVo117/GuGuGaGa.git
cd GuGuGaGa

# 2. Backend
cd Backend
npm install
# Tạo file .env (xem hướng dẫn ở trên)
# Đặt serviceAccountKey.json vào đây
npm run seed        # Tạo dữ liệu mẫu
npm run dev         # Chạy backend → http://localhost:5000

# 3. Admin Panel (terminal mới)
cd Admin
npm install
# Tạo file .env
npm run dev         # → http://localhost:5173

# 4. Flutter App (terminal mới)
cd gugugaga
flutter pub get
# Tạo file .env
# Chạy: flutterfire configure
flutter run

# 5. AI Service (terminal mới - tùy chọn)
cd AI_Service
pip install -r requirements.txt
# Đặt model vào models/food_classifier.pth
python app.py       # → http://localhost:8000
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Không commit file `.env`** hoặc `serviceAccountKey.json` lên GitHub (đã có trong `.gitignore`).
2. **Dataset AI (~4.2GB)** không bao gồm trong repo, tải từ Kaggle riêng.
3. **Model file `.pth`** (~9MB) cũng không bao gồm, cần tải hoặc tự train.
4. **Thứ tự khởi chạy**: Backend → (AI Service) → Flutter App / Admin Panel.
5. **Firebase**: Mỗi thành viên nên dùng chung 1 Firebase project để đồng bộ dữ liệu.

---

## 👥 Đóng Góp

1. Fork repo
2. Tạo branch mới: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Tạo Pull Request

---

## 📄 License

Dự án phục vụ mục đích học tập (Đồ Án Chuyên Ngành).
