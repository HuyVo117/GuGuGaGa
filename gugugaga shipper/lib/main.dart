import 'package:flutter/material.dart';

import 'api_service.dart';

void main() {
  runApp(const ShipperApp());
}

class ShipperApp extends StatelessWidget {
  const ShipperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'gugugaga shipper',
      home: const ShipperHomePage(),
    );
  }
}

class ShipperHomePage extends StatefulWidget {
  const ShipperHomePage({super.key});

  @override
  State<ShipperHomePage> createState() => _ShipperHomePageState();
}

class _ShipperHomePageState extends State<ShipperHomePage> {
  final _api = ApiService();
  final _emailController = TextEditingController(text: 'driver@gugugaga.vn');
  final _passwordController = TextEditingController(text: '123456');
  final _latController = TextEditingController(text: '10.762622');
  final _lngController = TextEditingController(text: '106.660172');

  String? _token;
  bool _loading = false;
  List<dynamic> _availableOrders = [];
  List<dynamic> _assignedOrders = [];

  Future<void> _login() async {
    setState(() {
      _loading = true;
    });

    try {
      final result = await _api.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      final token = result['token']?.toString();
      if (token == null || token.isEmpty) {
        throw Exception('Missing token');
      }

      if (!mounted) return;
      setState(() {
        _token = token;
      });
      await _refreshOrders();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Dang nhap shipper thanh cong')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Dang nhap shipper that bai')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _refreshOrders() async {
    if (_token == null) return;

    try {
      final available = await _api.getAvailableOrders(_token!);
      final assigned = await _api.getAssignedOrders(_token!);
      if (!mounted) return;
      setState(() {
        _availableOrders = available;
        _assignedOrders = assigned;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Khong tai duoc danh sach don')),
      );
    }
  }

  Future<void> _acceptOrder(int id) async {
    if (_token == null) return;

    try {
      await _api.acceptOrder(_token!, id);
      await _refreshOrders();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Da nhan don #$id')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nhan don that bai')),
      );
    }
  }

  Future<void> _updateStatus(int id, String status) async {
    if (_token == null) return;

    try {
      await _api.updateOrderStatus(_token!, id, status);
      await _refreshOrders();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Da cap nhat don #$id -> $status')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cap nhat trang thai that bai')),
      );
    }
  }

  Future<void> _sendLocation() async {
    if (_token == null) return;

    final lat = double.tryParse(_latController.text.trim());
    final lng = double.tryParse(_lngController.text.trim());
    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lat/Lng khong hop le')),
      );
      return;
    }

    try {
      await _api.sendLocation(_token!, lat, lng);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Da gui vi tri hien tai')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gui vi tri that bai')),
      );
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('gugugaga shipper - Nhan don')),
      body: RefreshIndicator(
        onRefresh: _refreshOrders,
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            const Text('1) Dang nhap tai xe', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _loading ? null : _login,
              child: const Text('Dang nhap'),
            ),
            const Divider(height: 28),
            const Text('2) Don cho nhan', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (_availableOrders.isEmpty) const Text('Khong co don cho nhan.'),
            ..._availableOrders.map((order) {
              final item = order as Map<String, dynamic>;
              final orderId = item['id'] as int;
              return Card(
                child: ListTile(
                  title: Text('Don #$orderId - ${item['statusOrder']}'),
                  subtitle: Text('Tong tien: ${item['bill']?['total'] ?? 0} VND'),
                  trailing: ElevatedButton(
                    onPressed: _token == null ? null : () => _acceptOrder(orderId),
                    child: const Text('Nhan don'),
                  ),
                ),
              );
            }),
            const Divider(height: 28),
            const Text('3) Don da nhan', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (_assignedOrders.isEmpty) const Text('Chua co don da nhan.'),
            ..._assignedOrders.map((order) {
              final item = order as Map<String, dynamic>;
              final orderId = item['id'] as int;
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Don #$orderId - ${item['statusOrder']}'),
                      Text('Khach: ${item['user']?['email'] ?? '-'}'),
                      Text('Tong tien: ${item['bill']?['total'] ?? 0} VND'),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          ElevatedButton(
                            onPressed: _token == null
                                ? null
                                : () => _updateStatus(orderId, 'DELIVERING'),
                            child: const Text('Dang giao'),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _token == null
                                ? null
                                : () => _updateStatus(orderId, 'DELIVERED'),
                            child: const Text('Da giao'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
            const Divider(height: 28),
            const Text('4) Gui vi tri hien tai', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _latController,
              decoration: const InputDecoration(labelText: 'Latitude'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: _lngController,
              decoration: const InputDecoration(labelText: 'Longitude'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _token == null ? null : _sendLocation,
              child: const Text('Gui vi tri'),
            ),
          ],
        ),
      ),
    );
  }
}
