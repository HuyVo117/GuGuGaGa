import 'package:flutter/material.dart';

import 'api_service.dart';

void main() {
  runApp(const CustomerApp());
}

class CustomerApp extends StatelessWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'gugugaga',
      home: const CustomerHomePage(),
    );
  }
}

class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({super.key});

  @override
  State<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends State<CustomerHomePage> {
  final _api = ApiService();
  final _emailController = TextEditingController(text: 'user@gugugaga.vn');
  final _passwordController = TextEditingController(text: '123456');

  String? _token;
  bool _authLoading = false;
  List<dynamic> _products = [];
  List<dynamic> _branches = [];
  List<dynamic> _orders = [];
  final Map<int, int> _cart = {};
  int? _selectedBranchId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    try {
      final results = await Future.wait([
        _api.getPublicProducts(),
        _api.getPublicBranches(),
      ]);

      final items = results[0] as List<dynamic>;
      final branches = results[1] as List<dynamic>;
      if (!mounted) return;
      setState(() {
        _products = items;
        _branches = branches;
        if (_branches.isNotEmpty && _selectedBranchId == null) {
          _selectedBranchId = (_branches.first as Map<String, dynamic>)['id'] as int;
        }
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Khong tai duoc du lieu public')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _loginOrRegister({required bool register}) async {
    setState(() {
      _authLoading = true;
    });

    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();
      final result = register
          ? await _api.register(email, password)
          : await _api.login(email, password);

      final token = result['token']?.toString();
      if (token == null || token.isEmpty) {
        throw Exception('Missing token');
      }

      if (!mounted) return;
      setState(() {
        _token = token;
      });
      await _loadOrders();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(register ? 'Dang ky thanh cong' : 'Dang nhap thanh cong')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(register ? 'Dang ky that bai' : 'Dang nhap that bai')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _authLoading = false;
        });
      }
    }
  }

  Future<void> _loadOrders() async {
    if (_token == null) return;

    try {
      final items = await _api.getUserOrders(_token!);
      if (!mounted) return;
      setState(() {
        _orders = items;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Khong tai duoc lich su don hang')),
      );
    }
  }

  Future<void> _createOrder() async {
    if (_token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Can dang nhap truoc khi dat mon')),
      );
      return;
    }

    if (_selectedBranchId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chua co chi nhanh')),
      );
      return;
    }

    final items = _cart.entries
        .where((entry) => entry.value > 0)
        .map((entry) => {
              'productId': entry.key,
              'quantity': entry.value,
            })
        .toList();

    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gio hang trong')),
      );
      return;
    }

    try {
      final order = await _api.createOrder(
        token: _token!,
        branchId: _selectedBranchId!,
        items: items,
      );

      if (!mounted) return;
      setState(() {
        _cart.clear();
      });
      await _loadOrders();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Dat mon thanh cong. Don #${order['id']}')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Dat mon that bai')),
      );
    }
  }

  double _cartTotal() {
    double total = 0;
    for (final product in _products) {
      final map = product as Map<String, dynamic>;
      final id = map['id'] as int;
      final qty = _cart[id] ?? 0;
      final price = (map['price'] as num?)?.toDouble() ?? 0;
      total += qty * price;
    }
    return total;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('gugugaga - Dat mon')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await _loadProducts();
                await _loadOrders();
              },
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  const Text('1) Dang nhap khach hang', style: TextStyle(fontWeight: FontWeight.bold)),
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
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: _authLoading ? null : () => _loginOrRegister(register: false),
                        child: const Text('Dang nhap'),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _authLoading ? null : () => _loginOrRegister(register: true),
                        child: const Text('Dang ky'),
                      ),
                    ],
                  ),
                  const Divider(height: 28),
                  const Text('2) Chon chi nhanh va san pham',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButton<int>(
                    value: _selectedBranchId,
                    isExpanded: true,
                    items: _branches
                        .map((branch) => DropdownMenuItem<int>(
                              value: (branch as Map<String, dynamic>)['id'] as int,
                              child: Text('${branch['name']} - ${branch['address']}'),
                            ))
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedBranchId = value;
                      });
                    },
                  ),
                  const SizedBox(height: 8),
                  ..._products.map((product) {
                    final item = product as Map<String, dynamic>;
                    final id = item['id'] as int;
                    final qty = _cart[id] ?? 0;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['name']?.toString() ?? 'Product'),
                                  Text('Gia: ${item['price'] ?? '-'} VND'),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: qty > 0
                                  ? () {
                                      setState(() {
                                        _cart[id] = qty - 1;
                                      });
                                    }
                                  : null,
                              icon: const Icon(Icons.remove_circle_outline),
                            ),
                            Text('$qty'),
                            IconButton(
                              onPressed: () {
                                setState(() {
                                  _cart[id] = qty + 1;
                                });
                              },
                              icon: const Icon(Icons.add_circle_outline),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  Text('Tong gio hang: ${_cartTotal().toStringAsFixed(0)} VND'),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: _createOrder,
                    child: const Text('Dat mon'),
                  ),
                  const Divider(height: 28),
                  const Text('3) Lich su don hang', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (_orders.isEmpty) const Text('Chua co don hang.'),
                  ..._orders.map((order) {
                    final item = order as Map<String, dynamic>;
                    return Card(
                      child: ListTile(
                        title: Text('Don #${item['id']} - ${item['statusOrder']}'),
                        subtitle: Text('Tong tien: ${item['bill']?['total'] ?? 0} VND'),
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}
