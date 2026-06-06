# GIẢI THÍCH THƯ MỤC AI_SERVICE/MODELS
## THƯ MỤC LƯU TRỮ TRỌNG SỐ MÔ HÌNH HỌC SÂU (DEEP LEARNING MODEL WEIGHTS)

Thư mục `AI_Service/models` là nơi lưu trữ trọng số đã qua huấn luyện của mô hình AI nhận diện món ăn. Hiện tại thư mục chứa một file duy nhất: **`food_classifier.pth`**.

---

## 1. FILE `food_classifier.pth` LÀ GÌ?

* **Tên file**: `food_classifier.pth`
* **Kích thước**: ~9.3 MB (9,292,043 bytes).
* **Định dạng**: Định dạng tệp tin `.pth` hoặc `.pt` chuẩn của thư viện học sâu **PyTorch**.
* **Bản chất bên trong**: Tệp này chứa **`state_dict`** (từ điển trạng thái) của mô hình.
  * `state_dict` là một dictionary dạng key-value của Python, ánh xạ từng tầng mạng (layer) của mô hình (ví dụ: `features.18.0.weight`, `classifier.1.bias`,...) tới các tensor trọng số (weight tensors) và độ chệch (bias tensors) tương ứng dạng số thực.
  * Tệp **không lưu toàn bộ kiến trúc lập trình** của class Python, mà chỉ lưu các con số trọng số học được. Do đó kiến trúc mạng phải được định nghĩa bằng code trước khi nạp tệp này.

---

## 2. KIẾN TRÚC MÔ HÌNH TƯƠNG THÍCH

Trọng số trong file này được thiết kế để khớp chính xác với kiến trúc mạng được tùy biến từ **MobileNet V2**:
1. **Phần trích xuất đặc trưng (Features extraction)**: Gồm 19 block tích chập của MobileNet V2 (được giữ nguyên trọng số học chuyển vị từ tập ImageNet).
2. **Phần phân loại (Classifier)**: Gồm 2 tầng mới được cấu trúc lại:
   * **Dropout (p=0.3)**: Tắt ngẫu nhiên 30% nơ-ron khi huấn luyện để chống quá khớp (Overfitting).
   * **Linear (1280 -> 30)**: Tầng liên kết đầy đủ (Dense layer) nhận vào 1280 đặc trưng và tính toán điểm số cho **30 lớp món ăn Việt Nam**.

---

## 3. CƠ CHẾ ĐỌC VÀ GHI (LOAD/SAVE WORKFLOW)

```
[Huấn luyện: train.py] ---> Đạt Accuracy cao hơn ---> torch.save() ---> [models/food_classifier.pth]
                                                                                   |
[Dự đoán: app.py] <--- Khởi tạo khung MobileNetV2 <--- torch.load() <--------------+
```

### 3.1. Cơ chế ghi (Khi chạy `train.py`)
Khi bạn chạy tiến trình huấn luyện mô hình bằng tập dữ liệu:
* Sau mỗi Epoch, mô hình sẽ chạy dự đoán trên tập kiểm thử (Validation set).
* Nếu **độ chính xác (Accuracy)** của Epoch hiện tại vượt qua kỷ lục tốt nhất trước đó (`best_acc`), PyTorch sẽ ghi đè trọng số mới vào file bằng lệnh:
  ```python
  torch.save(model.state_dict(), "models/food_classifier.pth")
  ```

### 3.2. Cơ chế nạp (Khi khởi chạy Flask API `app.py`)
Khi chạy ứng dụng nhận diện `/predict`:
1. Hàm `init_models()` được gọi để khởi tạo bộ nhớ.
2. Hệ thống kiểm tra xem có tệp `models/food_classifier.pth` hay không.
3. Nếu có, hệ thống tạo một thực thể mạng MobileNet V2 rỗng và thiết lập tầng classifier 30 ngõ ra:
   ```python
   model = mobilenet_v2()
   model.classifier = nn.Sequential(
       nn.Dropout(p=0.3),
       nn.Linear(1280, 30),
   )
   ```
4. Sau đó nạp trọng số từ file `.pth` vào kiến trúc rỗng này:
   ```python
   state_dict = torch.load("models/food_classifier.pth", map_location=device)
   model.load_state_dict(state_dict)
   ```
5. Đưa mô hình về chế độ đánh giá (`model.eval()`) để sẵn sàng nhận ảnh dự đoán.

---

## 4. TẠI SAO DUNG LƯỢNG FILE LẠI RẤT NHỎ (CHỈ 9.3 MB)?

Trong học sâu, nhiều mô hình (như VGG-16) có dung lượng file trọng số lên tới hơn **500 MB** hoặc ResNet-50 khoảng **100 MB**. File của bạn chỉ có **9.3 MB** nhờ các lý do sau:
1. **Kiến trúc tối ưu của MobileNet V2**: Sử dụng kỹ thuật *Tích chập tách biệt theo chiều (Depthwise Separable Convolutions)* giúp giảm số lượng tham số đi từ 8 đến 9 lần so với tích chập thông thường mà độ chính xác chỉ giảm đi rất ít. Mô hình chỉ có khoảng **2.2 triệu tham số**.
2. **Chỉ lưu `state_dict`**: Tránh lưu trữ các siêu dữ liệu (metadata) thừa của kiến trúc lớp lập trình Python, chỉ lưu trữ mảng số thực thuần túy dạng nhị phân tối giản.
3. **Phù hợp chạy CPU/Mobile**: Dung lượng nhẹ giúp hệ thống tải file cực nhanh vào RAM khi khởi động server Flask (mất chưa đầy 1 giây) và tốn rất ít bộ nhớ, giúp server hoạt động ổn định trên máy chủ tài nguyên yếu.
