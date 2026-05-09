import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'dart:convert';
import '../services/api_service.dart';
import 'order_detail_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  List<dynamic> _myOrders = [];
  List<dynamic> _availableOrders = [];
  bool _isLoading = true;
  Timer? _timer;
  late TabController _tabController;
  String _driverName = 'Tài xế';
  String _driverPhone = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadDriverInfo();
    _fetchAll();
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _fetchAll(silent: true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDriverInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final driverStr = prefs.getString('driver');
    if (driverStr != null) {
      final driver = json.decode(driverStr);
      if (mounted) {
        setState(() {
          _driverName = driver['name'] ?? 'Tài xế';
          _driverPhone = driver['phone'] ?? '';
        });
      }
    }
  }

  Future<void> _fetchAll({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final myOrders = await _apiService.getAssignedOrders();
      final availableOrders = await _apiService.getAvailableOrders();
      if (mounted) {
        setState(() {
          _myOrders = myOrders;
          _availableOrders = availableOrders;
        });
      }
    } catch (e) {
      print('Error fetching orders: $e');
    } finally {
      if (!silent && mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _acceptOrder(int orderId) async {
    try {
      await _apiService.acceptOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Nhận đơn thành công!'),
              ],
            ),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        _fetchAll();
        _tabController.animateTo(1); // Switch to "Đơn của tôi" tab
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red.shade400,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }

  Future<void> _logout() async {
    _timer?.cancel();
    await _apiService.logout();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.amber;
      case 'ACCEPTED':
        return Colors.blue;
      case 'DRIVER_ASSIGNED':
        return Colors.orange;
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'ACCEPTED':
        return 'Chờ tài xế';
      case 'DRIVER_ASSIGNED':
        return 'Đang giao';
      case 'DELIVERED':
        return 'Đã giao';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'PENDING':
        return Icons.hourglass_empty;
      case 'ACCEPTED':
        return Icons.thumb_up_alt_outlined;
      case 'DRIVER_ASSIGNED':
        return Icons.delivery_dining;
      case 'DELIVERED':
        return Icons.check_circle_outline;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outline;
    }
  }

  Widget _buildStatsBar() {
    final delivering = _myOrders.where((o) => o['status'] == 'DRIVER_ASSIGNED').length;
    final delivered = _myOrders.where((o) => o['status'] == 'DELIVERED').length;
    final total = _myOrders.fold<int>(0, (sum, o) => sum + ((o['totalAmount'] ?? 0) as int));

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF6B00), Color(0xFFFF8C38)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF6B00).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(Icons.new_releases_outlined, '${_availableOrders.length}', 'Đơn mới'),
          Container(width: 1, height: 36, color: Colors.white30),
          _buildStatItem(Icons.delivery_dining, '$delivering', 'Đang giao'),
          Container(width: 1, height: 36, color: Colors.white30),
          _buildStatItem(Icons.check_circle_outline, '$delivered', 'Hoàn thành'),
          Container(width: 1, height: 36, color: Colors.white30),
          _buildStatItem(Icons.monetization_on_outlined, '${(total / 1000).toStringAsFixed(0)}k', 'Tổng'),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 22),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
      ],
    );
  }

  Widget _buildAvailableOrderList() {
    if (_availableOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('Chưa có đơn hàng mới', style: TextStyle(fontSize: 16, color: Colors.grey.shade500)),
            const SizedBox(height: 8),
            Text('Kéo xuống để làm mới', style: TextStyle(fontSize: 13, color: Colors.grey.shade400)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _fetchAll,
      color: const Color(0xFFFF6B00),
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 0, bottom: 80),
        itemCount: _availableOrders.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) return _buildStatsBar();
          final order = _availableOrders[index - 1];
          final branch = order['branch'];
          return Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {},
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.receipt_long, color: Color(0xFFFF6B00), size: 20),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Đơn #${order['id']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                Text('${order['totalAmount']}đ', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w600, fontSize: 14)),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _getStatusText(order['status']),
                            style: TextStyle(color: Colors.blue.shade700, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Branch info
                    _buildInfoRow(Icons.store, 'Chi nhánh', branch != null ? branch['name'] ?? '' : ''),
                    const SizedBox(height: 8),
                    _buildInfoRow(Icons.location_on, 'Giao đến', order['deliveryAddress'] ?? ''),
                    const SizedBox(height: 8),
                    _buildInfoRow(Icons.phone, 'SĐT khách', order['deliveryPhone'] ?? ''),
                    const SizedBox(height: 14),
                    // Accept button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _acceptOrder(order['id']),
                        icon: const Icon(Icons.check_circle_outline, size: 20),
                        label: const Text('NHẬN ĐƠN NÀY'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00C853),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildMyOrderList() {
    if (_myOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('Chưa có đơn hàng nào', style: TextStyle(fontSize: 16, color: Colors.grey.shade500)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _fetchAll,
      color: const Color(0xFFFF6B00),
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 0, bottom: 80),
        itemCount: _myOrders.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) return _buildStatsBar();
          final order = _myOrders[index - 1];
          final status = order['status'] ?? '';
          final statusColor = _getStatusColor(status);
          return Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => OrderDetailScreen(order: order)),
                ).then((_) => _fetchAll());
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(_getStatusIcon(status), color: statusColor, size: 20),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Đơn #${order['id']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                Text('${order['totalAmount']}đ', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(_getStatusIcon(status), color: statusColor, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                _getStatusText(status),
                                style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(Icons.location_on, 'Giao đến', order['deliveryAddress'] ?? ''),
                    const SizedBox(height: 6),
                    _buildInfoRow(Icons.phone, 'SĐT', order['deliveryPhone'] ?? ''),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text('Xem chi tiết', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                        const SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey.shade400),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: Colors.grey.shade500),
        const SizedBox(width: 8),
        Text('$label: ', style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis, maxLines: 2),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFF6B00), Color(0xFFFF8C38)],
            ),
          ),
        ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.delivery_dining, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_driverName, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                if (_driverPhone.isNotEmpty)
                  Text(_driverPhone, style: const TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ],
        ),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchAll(),
            tooltip: 'Làm mới',
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              if (value == 'logout') _logout();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.red, size: 20),
                    SizedBox(width: 8),
                    Text('Đăng xuất'),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFFFF6B00),
              indicatorWeight: 3,
              labelColor: const Color(0xFFFF6B00),
              unselectedLabelColor: Colors.grey.shade500,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.new_releases, size: 18),
                      const SizedBox(width: 6),
                      Text('Đơn mới (${_availableOrders.length})'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.assignment, size: 18),
                      const SizedBox(width: 6),
                      Text('Của tôi (${_myOrders.length})'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF6B00)))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAvailableOrderList(),
                _buildMyOrderList(),
              ],
            ),
    );
  }
}
