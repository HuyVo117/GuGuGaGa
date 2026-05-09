import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchAll();
    // Polling every 5 seconds
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

  Future<void> _fetchAll({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
      });
    }
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
      if (!silent && mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _acceptOrder(int orderId) async {
    try {
      await _apiService.acceptOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Nhận đơn thành công!')),
        );
        _fetchAll();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e')),
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

  Widget _buildAvailableOrderList() {
    if (_availableOrders.isEmpty) {
      return const Center(child: Text('Không có đơn hàng mới'));
    }
    return ListView.builder(
      itemCount: _availableOrders.length,
      itemBuilder: (context, index) {
        final order = _availableOrders[index];
        return Card(
          margin: const EdgeInsets.all(8),
          color: Colors.orange.shade50,
          child: ListTile(
            title: Text('Đơn #${order['id']}'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Địa chỉ: ${order['deliveryAddress']}'),
                Text('SĐT: ${order['deliveryPhone']}'),
                Text('Tổng: ${order['totalAmount']} đ'),
                Text(
                  'Trạng thái: ${order['status']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
            trailing: ElevatedButton(
              onPressed: () => _acceptOrder(order['id']),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
              child: const Text('Nhận đơn'),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMyOrderList() {
    if (_myOrders.isEmpty) {
      return const Center(child: Text('Không có đơn hàng nào'));
    }
    return ListView.builder(
      itemCount: _myOrders.length,
      itemBuilder: (context, index) {
        final order = _myOrders[index];
        return Card(
          margin: const EdgeInsets.all(8),
          child: ListTile(
            title: Text('Đơn #${order['id']}'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Khách: ${order['deliveryAddress']}'),
                Text('SĐT: ${order['deliveryPhone']}'),
                Text(
                  'Trạng thái: ${order['status']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      OrderDetailScreen(order: order),
                ),
              ).then((_) => _fetchAll());
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đơn hàng'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchAll(),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(
              text: 'Đơn chờ nhận (${_availableOrders.length})',
              icon: const Icon(Icons.new_releases),
            ),
            Tab(
              text: 'Đơn của tôi (${_myOrders.length})',
              icon: const Icon(Icons.assignment),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
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

