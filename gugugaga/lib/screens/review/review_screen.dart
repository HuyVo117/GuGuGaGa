import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class ReviewScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const ReviewScreen({super.key, required this.order});

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  int _driverRating = 5;
  final TextEditingController _driverCommentController = TextEditingController();

  // Maps item ID or index to its rating and comment controller
  final Map<String, int> _productRatings = {};
  final Map<String, TextEditingController> _productCommentControllers = {};

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Initialize rating values for products
    final List<dynamic> items = widget.order['orderItem'] ?? [];
    for (var i = 0; i < items.length; i++) {
      final item = items[i];
      final itemId = item['id']?.toString() ?? 'item_$i';
      _productRatings[itemId] = 5;
      _productCommentControllers[itemId] = TextEditingController();
    }
  }

  @override
  void dispose() {
    _driverCommentController.dispose();
    _productCommentControllers.values.forEach((c) => c.dispose());
    super.dispose();
  }

  Future<void> _submitReview() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final apiService = ApiService();

      final List<dynamic> items = widget.order['orderItem'] ?? [];
      final List<Map<String, dynamic>> productRatingsPayload = [];

      for (var i = 0; i < items.length; i++) {
        final item = items[i];
        final itemId = item['id']?.toString() ?? 'item_$i';
        
        productRatingsPayload.add({
          'productId': item['productId'],
          'comboId': item['comboId'],
          'rating': _productRatings[itemId],
          'comment': _productCommentControllers[itemId]?.text ?? '',
        });
      }

      final payload = {
        'driverRating': widget.order['driverId'] != null ? _driverRating : null,
        'driverComment': widget.order['driverId'] != null ? _driverCommentController.text : null,
        'productRatings': productRatingsPayload,
      };

      await apiService.submitOrderReview(
        widget.order['id'],
        authProvider.token!,
        payload,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cảm ơn bạn đã đánh giá dịch vụ!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Returns true to trigger refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi gửi đánh giá: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<dynamic> items = widget.order['orderItem'] ?? [];
    final hasDriver = widget.order['driverId'] != null;
    final driver = widget.order['driver'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đánh giá đơn hàng'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Driver rating section
            if (hasDriver) ...[
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: Colors.red.shade50,
                            child: Icon(Icons.delivery_dining, color: Colors.red.shade700),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Đánh giá tài xế giao hàng',
                                  style: TextStyle(fontSize: 14, color: Colors.grey),
                                ),
                                Text(
                                  driver != null ? (driver['name'] ?? 'Tài xế') : 'Tài xế giao hàng',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _RatingStars(
                        rating: _driverRating,
                        onRatingChanged: (val) {
                          setState(() {
                            _driverRating = val;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _driverCommentController,
                        decoration: InputDecoration(
                          hintText: 'Nhập phản hồi về tài xế (thái độ, thời gian...)',
                          hintStyle: const TextStyle(fontSize: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        maxLines: 2,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Products rating list
            const Text(
              'Đánh giá món ăn',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            ...items.map((item) {
              final i = items.indexOf(item);
              final itemId = item['id']?.toString() ?? 'item_$i';
              final isCombo = item['comboId'] != null;
              final name = isCombo 
                  ? (item['combo'] != null ? item['combo']['name'] : 'Combo') 
                  : (item['product'] != null ? item['product']['name'] : 'Sản phẩm');
              final image = isCombo
                  ? (item['combo'] != null ? item['combo']['image'] : null)
                  : (item['product'] != null ? item['product']['image'] : null);

              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: isCombo ? Colors.orange.shade50 : Colors.amber.shade50,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: image != null && image.isNotEmpty
                                  ? Image.network(image, fit: BoxFit.cover)
                                  : Center(child: Text(isCombo ? '🍱' : '🍗', style: const TextStyle(fontSize: 24))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              name,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Center(
                        child: _RatingStars(
                          rating: _productRatings[itemId] ?? 5,
                          onRatingChanged: (val) {
                            setState(() {
                              _productRatings[itemId] = val;
                            });
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _productCommentControllers[itemId],
                        decoration: InputDecoration(
                          hintText: 'Món ăn thế nào? Hãy chia sẻ cảm nhận nhé!',
                          hintStyle: const TextStyle(fontSize: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        maxLines: 2,
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade700,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Gửi đánh giá',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RatingStars extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onRatingChanged;
  final double size;

  const _RatingStars({
    required this.rating,
    required this.onRatingChanged,
    this.size = 36,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (index) {
        final starValue = index + 1;
        return IconButton(
          icon: Icon(
            starValue <= rating ? Icons.star : Icons.star_border,
            color: Colors.amber,
          ),
          iconSize: size,
          onPressed: () => onRatingChanged(starValue),
          padding: const EdgeInsets.symmetric(horizontal: 6),
          constraints: const BoxConstraints(),
        );
      }),
    );
  }
}
