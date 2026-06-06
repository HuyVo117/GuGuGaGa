import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/order.dart';
import 'tracking_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _loadOrders();
    // Poll every 5 seconds
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _loadOrders(silent: true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadOrders({bool silent = false}) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    if (authProvider.token == null) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Vui lòng đăng nhập để xem đơn hàng';
        });
      }
      return;
    }

    try {
      final apiService = ApiService();
      final ordersData = await apiService.getOrders(authProvider.token!);
      print('DEBUG: OrderHistoryScreen fetched ${ordersData.length} orders');
      
      // Clear existing orders and add new ones
      // Note: In a real app, you might want to diff the lists to avoid flickering
      // But for now, clearing and re-adding is simple and works
      cartProvider.clearOrders();
      for (var orderData in ordersData) {
        // print('DEBUG: Processing order ${orderData['id']} - Raw Status: ${orderData['status']}');
        try {
          final order = Order.fromJson(orderData);
          // print('DEBUG: Parsed Order ${order.id} - Mapped Status: ${order.status}');
          cartProvider.addOrder(order);
        } catch (e) {
          print('DEBUG: Failed to parse order: $e');
        }
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = null; // Clear error on success
        });
      }
    } catch (e) {
      print('DEBUG: Error loading orders: $e');
      if (mounted && !silent) {
        setState(() {
          _isLoading = false;
          // Only show error if it's not a silent background refresh
          // or if we have no data yet
          if (cartProvider.orders.isEmpty) {
             _errorMessage = 'Không thể tải đơn hàng: ${e.toString()}';
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final orders = cartProvider.orders;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Đơn mua'),
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Đơn mua'),
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 80, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadOrders,
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Đơn mua'),
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            tabs: [
              Tab(text: 'Chờ xác nhận'),
              Tab(text: 'Đã chấp nhận'),
              Tab(text: 'Đang giao'),
              Tab(text: 'Đã giao'),
              Tab(text: 'Đã hủy'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _OrderList(
              orders: orders
                  .where((o) => o.status == OrderStatus.pending)
                  .toList(),
              emptyMessage: 'Chưa có đơn hàng chờ xác nhận',
            ),
            _OrderList(
              orders: orders
                  .where((o) => o.status == OrderStatus.accepted)
                  .toList(),
              emptyMessage: 'Chưa có đơn hàng đã chấp nhận',
            ),
            _OrderList(
              orders: orders
                  .where((o) =>
                      o.status == OrderStatus.shipping ||
                      o.status == OrderStatus.driverAssigned)
                  .toList(),
              emptyMessage: 'Chưa có đơn hàng đang giao',
            ),
            _OrderList(
              orders: orders
                  .where((o) => o.status == OrderStatus.completed)
                  .toList(),
              emptyMessage: 'Chưa có đơn hàng đã giao',
            ),
            _OrderList(
              orders: orders
                  .where((o) => o.status == OrderStatus.cancelled)
                  .toList(),
              emptyMessage: 'Chưa có đơn hàng đã hủy',
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderList extends StatelessWidget {
  final List<Order> orders;
  final String emptyMessage;

  const _OrderList({
    required this.orders,
    required this.emptyMessage,
  });

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        // Find the parent state to call _loadOrders
        final state = context.findAncestorStateOfType<_OrderHistoryScreenState>();
        await state?._loadOrders();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _OrderCard(order: order);
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;

  const _OrderCard({required this.order});

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Colors.orange;
      case OrderStatus.accepted:
        return Colors.blue;
      case OrderStatus.driverAssigned:
        return Colors.indigo;
      case OrderStatus.shipping:
        return Colors.purple;
      case OrderStatus.completed:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Đơn hàng #${order.id.toString().length > 6 ? order.id.toString().substring(order.id.toString().length - 6) : order.id.toString().padLeft(6, '0')}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    order.statusText,
                    style: TextStyle(
                      color: _getStatusColor(order.status),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              DateFormat('dd/MM/yyyy HH:mm').format(order.createdAt),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    order.deliveryAddress,
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.phone, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  order.deliveryPhone,
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                ),
                const SizedBox(width: 16),
                Icon(Icons.payment, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  order.paymentMethodText,
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (order.status == OrderStatus.shipping || order.status == OrderStatus.driverAssigned)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TrackingScreen(orderId: order.id),
                        ),
                      );
                    },
                    icon: const Icon(Icons.map),
                    label: const Text('Theo dõi đơn hàng'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ),
            const Divider(),
            const SizedBox(height: 12),
            ...order.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${item.product?.name ?? item.combo?.name ?? 'Sản phẩm'} x ${item.quantity}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                    Text(
                      NumberFormat.currency(locale: 'vi_VN', symbol: '₫')
                          .format(item.price * item.quantity),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tổng cộng:',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  NumberFormat.currency(locale: 'vi_VN', symbol: '₫')
                      .format(order.totalAmount),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.red.shade700,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

