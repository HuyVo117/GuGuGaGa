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
    // Add initial greeting based on product context
    final greetingText = widget.product != null
        ? "Xin chào! Bạn cần tôi tư vấn gì về món **${widget.product!.name}** không?"
        : "Xin chào! Tôi là trợ lý AI của GuGuGaGa. Bạn có bao nhiêu tiền và muốn ăn gì hôm nay?";
    _messages.add(ChatMessage(
      text: greetingText,
      isUser: false,
    ));
  }

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

  Widget _buildSuggestionCard(SuggestedItem item) {
    // Find the actual item in the list
    dynamic actualItem;
    if (item.type == 'product') {
      actualItem = _products.firstWhere((p) => p.id == item.id, orElse: () => Product(id: '-1', categoryId: '0', category: Category(id: '0', name: ''), name: 'Unknown Product', price: 0, createdAt: DateTime.now(), updatedAt: DateTime.now()));
    } else {
      actualItem = _combos.firstWhere((c) => c.id == item.id, orElse: () => Combo(id: '-1', categoryId: '0', category: Category(id: '0', name: ''), name: 'Unknown Combo', price: 0, createdAt: DateTime.now(), updatedAt: DateTime.now(), comboItems: []));
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e')),
        );
      }
    }
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final List<SuggestedItem>? suggestedItems;

  ChatMessage({required this.text, required this.isUser, this.suggestedItems});
}
