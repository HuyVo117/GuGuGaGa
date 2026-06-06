# VỊ TRÍ CÁC THÔNG SỐ CẤU HÌNH AI TRONG MÃ NGUỒN DỰ ÁN

Tài liệu này chỉ ra chính xác vị trí các file mã nguồn và các dòng code thiết lập các thông số AI trong dự án **GuGuGaGa**, giúp bạn dễ dàng chỉ dẫn khi được giáo viên phản biện hỏi lúc bảo vệ đồ án.

---

## 1. THÀNH PHẦN HUẤN LUYỆN MÔ HÌNH (FILE `AI_Service/train.py`)

Toàn bộ các tham số huấn luyện mạng nơ-ron học sâu được cấu hình trong file: [train.py](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py)

| Thông số cấu hình | Vị trí dòng code | Nội dung đoạn code thực tế |
| :--- | :--- | :--- |
| **Danh sách 30 món ăn tiếng Việt không dấu** | [Lines 11-42](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L11-L42) | Mảng `CLASSES = ["Banh beo", "Banh bot loc", ...]` định nghĩa nhãn thư mục dữ liệu. |
| **Tiền xử lý & Tăng cường ảnh tập Train** | [Lines 74-82](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L74-L82) | Biến `transforms.Compose` gồm `RandomResizedCrop(224)`, `RandomHorizontalFlip()`, `RandomRotation(20)`, `ColorJitter`, `RandomPerspective`, và `Normalize`. |
| **Tiền xử lý ảnh tập Validation** | [Lines 83-88](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L83-L88) | Biến `transforms.Compose` gồm `Resize(256)`, `CenterCrop(224)`, và `Normalize` chuẩn hóa. |
| **Đóng băng/Mở khóa các block mạng** | [Lines 113-120](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L113-L120) | Vòng lặp `for i, child in enumerate(model.features):` đóng băng (`requires_grad = False`) các block 0 đến 13, mở khóa (`requires_grad = True`) các block 14 đến 18. |
| **Tái cấu trúc bộ phân loại Classifier** | [Lines 122-126](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L122-L126) | Thay thế `model.classifier` bằng một `nn.Sequential` gồm `nn.Dropout(p=0.3)` và `nn.Linear(num_features, num_classes)`. |
| **Cấu hình thuật toán tối ưu (Optimizer)** | [Line 148](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L148) | `optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)` thiết lập thuật toán tối ưu **Adam** và phạt trọng số **weight decay**. |
| **Cấu hình bộ lập lịch Tốc độ học (Scheduler)**| [Line 151](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L151) | `scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)` thiết lập tự giảm tốc độ học đi 50%. |
| **Cấu hình Dừng sớm (Early Stopping)** | [Line 154](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L154) | `early_stopping = EarlyStopping(patience=patience)` với giá trị `patience` mặc định là **5** (dòng 216). |
| **Lưu file trọng số tốt nhất** | [Lines 197-200](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L197-L200) | `torch.save(model.state_dict(), "models/food_classifier.pth")` lưu đè tệp trọng số khi phát hiện độ chính xác tập kiểm thử vượt kỷ lục. |
| **Các tham số dòng lệnh mặc định (Epochs, Batch Size, LR)** | [Lines 213-216](file:///d:/DACN1/GuGuGaGa/AI_Service/train.py#L213-L216) | `--epochs` mặc định là **20**; `--batch_size` mặc định là **16**; `--lr` (learning rate) mặc định là **0.001**. |

---

## 2. THÀNH PHẦN CHẠY API NHẬN DIỆN MÔ HÌNH (FILE `AI_Service/app.py`)

Các tham số và quy trình tiền xử lý phục vụ quá trình dự đoán (Inference) thời gian thực nằm trong file: [app.py](file:///d:/DACN1/GuGuGaGa/AI_Service/app.py)

| Thông số cấu hình | Vị trí dòng code | Nội dung đoạn code thực tế |
| :--- | :--- | :--- |
| **Cấu hình Tiền xử lý ảnh nhận diện** | [Lines 80-88](file:///d:/DACN1/GuGuGaGa/AI_Service/app.py#L80-L88) | Biến `preprocess` dùng `transforms.Compose` đồng bộ kích thước $224 \times 224$ và chuẩn hóa kênh màu tương tự tập validation. |
| **Tên Việt hóa hiển thị (Display Names)** | [Lines 46-77](file:///d:/DACN1/GuGuGaGa/AI_Service/app.py#L46-L77) | Bảng tra cứu `DISPLAY_NAMES = {"Banh beo": "Bánh Bèo", ...}` để trả về tiếng Việt có dấu cho giao diện di động. |
| **Logic ánh xạ mô hình dự phòng (ImageNet Fallback Mapper)** | [Lines 97-120](file:///d:/DACN1/GuGuGaGa/AI_Service/app.py#L97-L120) | Hàm `map_imagenet_to_menu(class_name)` so sánh ký tự tên lớp ImageNet và quy về các món ăn gần nhất trong menu. |
| **Nạp file trọng số custom `.pth`** | [Lines 130-142](file:///d:/DACN1/GuGuGaGa/AI_Service/app.py#L130-L142) | Thiết lập cấu hình mạng MobileNet V2 rỗng và dùng `torch.load()` để nạp file trọng số tại `models/food_classifier.pth`. |
| **Cổng kết nối mặc định của API** | [Line 243](file:///d:/DACN1/GuGuGaGa/AI_Service/app.py#L243) | `app.run(host="0.0.0.0", port=8000)` thiết lập Flask lắng nghe ở cổng **8000**. |

---

## 3. THÀNH PHẦN KIỂM TRA ĐỘ TIN CẬY (FILE `gugugaga/lib/screens/home/home_screen.dart`)

Ngưỡng kiểm soát kết quả từ AI nhận diện trước khi gọi API Database nằm trong file: [home_screen.dart](file:///d:/DACN1/GuGuGaGa/gugugaga/lib/screens/home/home_screen.dart)

| Thông số cấu hình | Vị trí dòng code | Nội dung đoạn code thực tế |
| :--- | :--- | :--- |
| **Cấu hình độ phân giải ảnh chụp gửi AI**| [Lines 867-869](file:///d:/DACN1/GuGuGaGa/gugugaga/lib/screens/home/home_screen.dart#L867-L869) | `maxWidth: 800`, `maxHeight: 800`, `imageQuality: 85` giúp giảm dung lượng ảnh trước khi upload qua mạng Internet để tối ưu hóa tốc độ. |
