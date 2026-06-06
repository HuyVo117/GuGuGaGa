# MÃ NGUỒN CỦA 3 GIAO DIỆN CHỨC NĂNG CHÍNH (CUSTOMER FLUTTER APP)

Tài liệu này cung cấp chi tiết mã nguồn giao diện (UI) và logic điều khiển tương ứng của 3 tính năng cốt lõi trên ứng dụng di động Khách hàng: **Nhận diện món ăn bằng AI Camera**, **Trợ lý tư vấn Chatbot AI**, và **Thanh toán chuyển khoản VietQR đối soát tự động qua Casso**.

---

## CHỨC NĂNG 1: NHẬN DIỆN MÓN ĂN BẰNG CAMERA AI
* **File giao diện**: `lib/screens/home/home_screen.dart` (Tập trung ở khối xử lý nhận diện AI và BottomSheet kết quả).
* **Mô tả hoạt động**: 
  - Khách hàng bấm chọn biểu tượng tìm kiếm ảnh $\rightarrow$ Hệ thống hiển thị bảng chọn chụp ảnh mới bằng Camera hoặc chọn ảnh sẵn có từ Thư viện.
  - Sau khi chọn ảnh, ứng dụng nén ảnh, gửi dữ liệu nhị phân lên Flask AI Service.
  - Khi nhận được nhãn món ăn và kết quả khớp thực đơn, app hiển thị một BottomSheet danh sách các món ăn tương ứng trong cơ sở dữ liệu Firestore kèm giá tiền và nút "Chi tiết".

### Mã nguồn logic xử lý chính:

```dart
  // --- KHỐI LOGIC NHẬN DIỆN MÓN ĂN BẰNG CAMERA AI ---
  
  // Hàm xử lý chụp/chọn ảnh và gửi lên API nhận dạng của AI Service
  Future<void> _recognizeFood(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (file == null) return;

      if (!mounted) return;
      
      // Hiển thị loading dialog chờ AI xử lý
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text("AI đang nhận diện món ăn..."),
                ],
              ),
            ),
          ),
        ),
      );

      // Đọc byte hình ảnh và gọi service
      final bytes = await file.readAsBytes();
      final result = await _apiService.recognizeFood(bytes, file.name);
      
      if (mounted) {
        Navigator.pop(context); // Tắt dialog loading
      }

      final String detectedName = result['detectedFoodName'] ?? "Không rõ";
      final List<dynamic> productsJson = result['matchedProducts'] ?? [];
      final List<Product> matchedProducts = productsJson.map((json) => Product.fromJson(json)).toList();

      // Nếu chỉ nhận dạng ra đúng 1 sản phẩm trùng khớp, chuyển hướng thẳng vào màn hình Chi tiết sản phẩm
      if (matchedProducts.length == 1) {
        if (!mounted) return;
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: matchedProducts.first),
          ),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("AI nhận dạng: ${matchedProducts.first.name}"),
            backgroundColor: Colors.green.shade600,
          ),
        );
        return;
      }

      // Nếu nhận dạng ra nhiều sản phẩm gợi ý hoặc không khớp, hiển thị BottomSheet để người dùng chọn
      if (!mounted) return;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) {
          final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              top: 16,
              left: 16,
              right: 16,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Icon(Icons.psychology, color: Colors.red),
                    SizedBox(width: 8),
                    Text(
                      "Kết Quả Nhận Diện AI",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  "Món ăn nhận diện: $detectedName",
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Món tương ứng trong thực đơn:",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 8),
                if (matchedProducts.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        "Không tìm thấy món tương ứng trong thực đơn.",
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  )
                else
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: matchedProducts.length,
                      itemBuilder: (context, index) {
                        final product = matchedProducts[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          child: ListTile(
                            leading: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: product.image != null && product.image!.isNotEmpty
                                  ? Image.network(
                                      product.image!,
                                      width: 50,
                                      height: 50,
                                      fit: BoxFit.cover,
                                    )
                                  : Container(
                                      color: Colors.amber[50],
                                      width: 50,
                                      height: 50,
                                      child: const Center(child: Text("🍗")),
                                    ),
                            ),
                            title: Text(
                              product.name,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text(
                              currencyFormat.format(product.price),
                              style: TextStyle(color: Colors.red.shade700),
                            ),
                            trailing: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade700,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                              onPressed: () {
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ProductDetailScreen(product: product),
                                  ),
                                );
                              },
                              child: const Text("Chi tiết"),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      );

    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Đóng loading dialog khi có lỗi
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Lỗi nhận diện AI: $e")),
        );
      }
    }
  }

  // Hiển thị hộp thoại lựa chọn nguồn ảnh
  void _showImageSourceSelector() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ListTile(
              title: Text(
                "Tìm kiếm bằng hình ảnh",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              leading: Icon(Icons.search),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text("Chụp ảnh mới"),
              onTap: () {
                Navigator.pop(context);
                _recognizeFood(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text("Chọn từ thư viện"),
              onTap: () {
                Navigator.pop(context);
                _recognizeFood(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }
```

---

## CHỨC NĂNG 2: TRỢ LÝ TƯ VẤN CHATBOT AI
* **File giao diện**: `lib/screens/chat/chat_screen.dart`
* **Mô tả hoạt động**: 
  - Giao diện phòng trò chuyện với Trợ lý AI. Người dùng gửi tin nhắn văn bản hỏi đáp về thông tin món ăn, ưu đãi hoặc chế độ dinh dưỡng.
  - Phản hồi của AI hỗ trợ hiển thị văn bản định dạng Markdown rất trực quan và có khả năng trả về các thẻ món ăn gợi ý đính kèm hình ảnh và giá cả.
  - Người dùng có thể nhấn nút "Thêm vào giỏ" hoặc "Mua ngay" trực tiếp từ cuộc hội thoại chat.

### Mã nguồn đầy đủ:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../services/ai_service.dart';
import '../../services/api_service.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import 'package:intl/intl.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../models/combo.dart';
import '../checkout/checkout_screen.dart';

class ChatScreen extends StatefulWidget {
  final Product? product;
  const ChatScreen({super.key, this.product});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  final AIService _aiService = AIService();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;

  List<Product> _products = [];
  List<Combo> _combos = [];

  @override
  void initState() {
    super.initState();
    _fetchMenu();
    // Khởi tạo tin nhắn chào mừng dựa trên ngữ cảnh sản phẩm (nếu mở từ trang chi tiết sản phẩm)
    final greetingText = widget.product != null
        ? "Xin chào! Bạn cần tôi tư vấn gì về món **${widget.product!.name}** không?"
        : "Xin chào! Tôi là trợ lý AI của GuGuGaGa. Bạn có bao nhiêu tiền và muốn ăn gì hôm nay?";
    _messages.add(ChatMessage(
      text: greetingText,
      isUser: false,
    ));
  }

  // Tải dữ liệu thực đơn để làm cơ sở dữ liệu ngữ cảnh cho AI tư vấn
  Future<void> _fetchMenu() async {
    try {
      final products = await _apiService.getProducts();
      final combos = await _apiService.getCombos();
      
      if (mounted) {
        setState(() {
          _products = products;
          _combos = combos;
        });
      }
    } catch (e) {
      print('Error fetching menu: $e');
    }
  }

  // Gửi tin nhắn và xử lý phản hồi từ AI
  Future<void> _sendMessage() async {
    if (_controller.text.isEmpty) return;

    final userText = _controller.text;
    setState(() {
      _messages.add(ChatMessage(text: userText, isUser: true));
      _isLoading = true;
    });
    _controller.clear();

    try {
      final response = await _aiService.sendMessage(
        userText,
        _products,
        _combos,
        currentProduct: widget.product,
      );
      
      setState(() {
        _messages.add(ChatMessage(
          text: response.text,
          isUser: false,
          suggestedItems: response.suggestedItems,
        ));
      });
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
          isUser: false,
        ));
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Gợi ý các câu hỏi nhanh cho khách hàng
  List<String> get _autoReplies {
    if (widget.product != null) {
      return [
        "Món này còn bán không?",
        "Có khuyến mãi gì không?",
        "Món này có cay không?",
        "Thời gian chuẩn bị mất bao lâu?",
      ];
    } else {
      return [
        "Hôm nay có khuyến mãi gì không?",
        "Món nào bán chạy nhất vậy?",
        "Shop có mở cửa không?",
        "Thời gian giao hàng mất bao lâu?",
      ];
    }
  }

  // Banner hiển thị thông tin sản phẩm nếu đang tư vấn riêng về món đó
  Widget _buildProductBanner() {
    if (widget.product == null) return const SizedBox.shrink();
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200, width: 1),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(6),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: widget.product!.image != null && widget.product!.image!.isNotEmpty
                  ? Image.network(
                      widget.product!.image!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const Center(child: Icon(Icons.broken_image, size: 24)),
                    )
                  : const Center(child: Text("🍗", style: TextStyle(fontSize: 24))),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.product!.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  currencyFormat.format(widget.product!.price),
                  style: TextStyle(
                    color: Colors.red.shade700,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () async {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await cartProvider.addProduct(
                widget.product!,
                quantity: 1,
                branchId: authProvider.selectedBranch?.id,
                token: authProvider.token,
              );
              if (context.mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CheckoutScreen(),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            child: const Text('Mua ngay'),
          ),
        ],
      ),
    );
  }

  // Danh sách các câu hỏi tự động
  Widget _buildAutoReplies() {
    final replies = _autoReplies;
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: replies.length,
        itemBuilder: (context, index) {
          final replyText = replies[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: ActionChip(
              label: Text(
                replyText,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.red.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              backgroundColor: Colors.red.shade50,
              side: BorderSide(color: Colors.red.shade100, width: 1),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              onPressed: () {
                _controller.text = replyText;
                _sendMessage();
              },
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trợ lý AI GuGuGaGa'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          _buildProductBanner(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return _buildMessage(_messages[index]);
              },
            ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: CircularProgressIndicator(),
            ),
          _buildAutoReplies(),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  color: Colors.red.shade700,
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Khung tin nhắn đơn lẻ
  Widget _buildMessage(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: message.isUser ? Colors.red.shade100 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
        ),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MarkdownBody(data: message.text),
            if (message.suggestedItems != null && message.suggestedItems!.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Divider(),
              const Text("Gợi ý cho bạn:", style: TextStyle(fontWeight: FontWeight.bold)),
              ...message.suggestedItems!.map((item) => _buildSuggestionCard(item)),
            ],
          ],
        ),
      ),
    );
  }

  // Thẻ hiển thị món ăn được gợi ý bởi AI trong cuộc trò chuyện
  Widget _buildSuggestionCard(SuggestedItem item) {
    dynamic actualItem;
    if (item.type == 'product') {
      actualItem = _products.firstWhere(
        (p) => p.id == item.id,
        orElse: () => Product(
          id: '-1',
          categoryId: '0',
          category: Category(id: '0', name: ''),
          name: 'Unknown Product',
          price: 0,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
    } else {
      actualItem = _combos.firstWhere(
        (c) => c.id == item.id,
        orElse: () => Combo(
          id: '-1',
          categoryId: '0',
          category: Category(id: '0', name: ''),
          name: 'Unknown Combo',
          price: 0,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          comboItems: [],
        ),
      );
    }

    if (actualItem.id == '-1') return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(top: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (actualItem.image != null && actualItem.image!.isNotEmpty)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: Image.network(
                actualItem.image!,
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 120,
                  color: Colors.grey.shade300,
                  child: const Icon(Icons.image_not_supported),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  actualItem.name,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  '${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(actualItem.price)}',
                  style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold),
                ),
                if (actualItem.desc != null && actualItem.desc!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    actualItem.desc!,
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _addToCart(item.type, actualItem);
                    },
                    icon: const Icon(Icons.add_shopping_cart, size: 18),
                    label: const Text('Thêm vào giỏ'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Thêm món ăn gợi ý vào giỏ hàng Firestore
  void _addToCart(String type, dynamic item) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    if (!authProvider.isAuthenticated || authProvider.selectedBranch == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn chi nhánh trước')),
      );
      return;
    }

    try {
      if (type == 'product') {
        await cartProvider.addProduct(
          item,
          branchId: authProvider.selectedBranch!.id,
          token: authProvider.token,
        );
      } else {
        await cartProvider.addCombo(
          item,
          branchId: authProvider.selectedBranch!.id,
          token: authProvider.token,
        );
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã thêm ${item.name} vào giỏ hàng!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi thêm giỏ hàng: $e')),
      );
    }
  }
}
```

---

## CHỨC NĂNG 3: CHUYỂN KHOẢN QR TỰ ĐỘNG (CASSO FLOW INTEGRATION)
* **File giao diện**: `lib/screens/checkout/bank_transfer_screen.dart`
* **Mô tả hoạt động**: 
  - Giao diện hiển thị khi khách hàng chọn thanh toán chuyển khoản ngân hàng.
  - App tạo mã VietQR động trích xuất từ dữ liệu Backend. Cấu hình thông tin thụ hưởng MB Bank chính xác của chủ cửa hàng: **`0817254941` - `NGUYEN GIA BAO`**.
  - Tích hợp một bộ lập lịch quét ngầm tự động (Timer) kích hoạt mỗi **4 giây**. Cứ mỗi 4 giây, hệ thống âm thầm gửi request kiểm tra giao dịch chuyển khoản trên Backend (được tích hợp API/Webhook đối soát tự động Casso Flow).
  - Ngay khi phát hiện giao dịch thành công khớp số tiền đơn hàng và nội dung đối soát (`GUGUGAGA_XXXXXX`), app tự động ngắt timer chạy ngầm và chuyển hướng người dùng sang trang thông báo thành công.

### Mã nguồn đầy đủ:

```dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../payment/payment_success_screen.dart';

class BankTransferScreen extends StatefulWidget {
  final String orderId;
  final int amount;

  const BankTransferScreen({
    super.key,
    required this.orderId,
    required this.amount,
  });

  @override
  State<BankTransferScreen> createState() => _BankTransferScreenState();
}

class _BankTransferScreenState extends State<BankTransferScreen> {
  bool _isSuccess = false;
  bool _isChecking = false;
  Timer? _paymentTimer;

  String _bankId = "MB";
  String _accountNo = "0817254941";
  String _accountName = "NGUYEN GIA BAO";
  bool _isLoadingConfig = true;

  @override
  void initState() {
    super.initState();
    _loadBankConfig();
    _startPaymentCheckTimer(); // Kích hoạt timer tự động kiểm tra giao dịch nền
  }

  // Cài đặt đếm thời gian kiểm tra ngầm mỗi 4 giây
  void _startPaymentCheckTimer() {
    _paymentTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!_isSuccess && !_isChecking) {
        _checkPaymentStatus(isManual: false, force: false);
      }
    });
  }

  // Tải cấu hình ngân hàng thụ hưởng từ Backend
  Future<void> _loadBankConfig() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final apiService = ApiService();
      final config = await apiService.getPaymentConfig(authProvider.token!);
      
      setState(() {
        _bankId = config['bankId'] ?? 'MB';
        _accountNo = config['accountNo'] ?? '0817254941';
        _accountName = config['accountName'] ?? 'NGUYEN GIA BAO';
        _isLoadingConfig = false;
      });
    } catch (e) {
      print('DEBUG: Failed to load bank config: $e');
      setState(() {
        _isLoadingConfig = false;
      });
    }
  }

  @override
  void dispose() {
    _paymentTimer?.cancel(); // Đảm bảo hủy bỏ timer khi rời trang
    super.dispose();
  }

  // Hàm gọi API Backend kiểm tra giao dịch (đã được liên kết Casso Flow)
  Future<void> _checkPaymentStatus({bool isManual = false, bool force = false}) async {
    if (_isSuccess) return;
    
    // Nếu kiểm tra thủ công, hiển thị vòng xoay loading trên button
    if (isManual) {
      setState(() {
        _isChecking = true;
      });
    }

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final apiService = ApiService();
      
      final response = await apiService.checkOrderPayment(
        widget.orderId,
        authProvider.token!,
        force: force,
      );
      
      if (mounted) {
        setState(() {
          _isChecking = false;
        });
      }

      // Nếu ghi nhận thành công, kích hoạt chuyển màn hình
      if (response['paid'] == true) {
        _triggerSuccess();
      } else if (isManual && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Hệ thống chưa ghi nhận được giao dịch của bạn. Vui lòng đợi trong giây lát hoặc kiểm tra lại thông tin chuyển khoản.',
            ),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isChecking = false;
        });
      }
      print('DEBUG: Lỗi kiểm tra thanh toán: $e');
      if (isManual && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi kiểm tra giao dịch: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // Khi thanh toán thành công
  void _triggerSuccess() {
    if (_isSuccess) return;
    _paymentTimer?.cancel(); // Ngắt timer
    setState(() {
      _isSuccess = true;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Đã nhận được ${NumberFormat.currency(locale: 'vi_VN', symbol: '₫').format(widget.amount)}. Giao dịch thành công!',
        ),
        backgroundColor: Colors.green,
      ),
    );

    // Chuyển hướng sang màn hình thành công
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const PaymentSuccessScreen()),
    );
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã sao chép $label!'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final formattedAmount = currencyFormat.format(widget.amount);
    final shortOrderId = widget.orderId.length > 8
        ? widget.orderId.substring(widget.orderId.length - 8)
        : widget.orderId;
    final addInfo = 'GUGUGAGA_$shortOrderId'.toUpperCase();

    // VietQR URL builder động tạo mã QR chứa số tiền & nội dung đối soát
    final qrUrl = 'https://img.vietqr.io/image/$_bankId-$_accountNo-compact.png'
        '?amount=${widget.amount}'
        '&addInfo=$addInfo'
        '&accountName=${Uri.encodeComponent(_accountName)}';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán chuyển khoản'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
      ),
      body: _isLoadingConfig
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Đang tải cấu hình ngân hàng...'),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Quét mã QR dưới đây hoặc chuyển khoản thủ công để thanh toán.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 20),

                  // Khung hiển thị mã QR VietQR động tải trực tiếp từ internet
                  Center(
                    child: Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            Image.network(
                              qrUrl,
                              height: 280,
                              width: 280,
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return SizedBox(
                                  height: 280,
                                  width: 280,
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      value: loadingProgress.expectedTotalBytes != null
                                          ? loadingProgress.cumulativeBytesLoaded /
                                              loadingProgress.expectedTotalBytes!
                                          : null,
                                    ),
                                  ),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) {
                                return const SizedBox(
                                  height: 280,
                                  width: 280,
                                  child: Center(
                                    child: Text(
                                      'Không thể tải mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.',
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'VietQR $_bankId',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Bảng thông tin chuyển khoản sao chép (copy-paste) thủ công
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDetailRow(
                            label: 'Ngân hàng',
                            value: 'Quân Đội (MB Bank)',
                          ),
                          const Divider(),
                          _buildDetailRow(
                            label: 'Số tài khoản',
                            value: _accountNo,
                            onCopy: () => _copyToClipboard(_accountNo, 'số tài khoản'),
                          ),
                          const Divider(),
                          _buildDetailRow(
                            label: 'Chủ tài khoản',
                            value: _accountName,
                          ),
                          const Divider(),
                          _buildDetailRow(
                            label: 'Số tiền',
                            value: formattedAmount,
                            onCopy: () => _copyToClipboard(widget.amount.toString(), 'số tiền'),
                          ),
                          const Divider(),
                          _buildDetailRow(
                            label: 'Nội dung chuyển',
                            value: addInfo,
                            onCopy: () => _copyToClipboard(addInfo, 'nội dung chuyển khoản'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Hiển thị dòng trạng thái quét
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: _isChecking
                            ? const CircularProgressIndicator(strokeWidth: 2.5)
                            : const Icon(Icons.info_outline, size: 16, color: Colors.blue),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Hệ thống đang tự động kiểm tra giao dịch của bạn...',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Nút kiểm tra thủ công dự phòng
                  ElevatedButton(
                    onPressed: _isChecking ? null : () => _checkPaymentStatus(isManual: true, force: true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isChecking
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Kiểm tra giao dịch ngay',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDetailRow({
    required String label,
    required String value,
    VoidCallback? onCopy,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
          if (onCopy != null)
            IconButton(
              icon: const Icon(Icons.copy, size: 18),
              onPressed: onCopy,
              color: Colors.red.shade700,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
        ],
      ),
    );
  }
}
```
