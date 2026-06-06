import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/order.dart';
import '../../services/api_service.dart';
import '../order/order_history_screen.dart';
import '../payment/payment_success_screen.dart';

import 'map_picker_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  
  bool _isLoading = false;
  String _addressOption = 'default'; // 'default' or 'custom'
  String _phoneOption = 'default'; // 'default' or 'custom'
  double? _latitude;
  double? _longitude;

  @override
  void dispose() {
    _noteController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickAddressFromMap() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const MapPickerScreen()),
    );

    if (result != null && result is Map) {
      setState(() {
        _addressController.text = result['address'];
        _latitude = result['latitude'];
        _longitude = result['longitude'];
        _addressOption = 'custom';
      });
    }
  }

  Future<void> _placeOrder(BuildContext context) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    if (cartProvider.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Giỏ hàng trống!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (authProvider.user == null || authProvider.selectedBranch == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập và chọn chi nhánh!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Validate custom fields
    if (_addressOption == 'custom' && _addressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập địa chỉ giao hàng!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_phoneOption == 'custom' && _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập số điện thoại nhận hàng!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Validate default fields
    if (_addressOption == 'default') {
      if (authProvider.user?.address == null || authProvider.user!.address!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bạn chưa có địa chỉ mặc định. Vui lòng nhập địa chỉ khác.'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    if (_phoneOption == 'default') {
      if (authProvider.user?.phone == null || authProvider.user!.phone.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bạn chưa có số điện thoại mặc định. Vui lòng nhập số điện thoại khác.'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final deliveryAddress = _addressOption == 'default'
          ? authProvider.user!.address!
          : _addressController.text;

      final deliveryPhone = _phoneOption == 'default'
          ? authProvider.user!.phone
          : _phoneController.text;

      // Map frontend payment method to backend format
      String backendPaymentMethod = 'COD'; // Default to COD for now
      // You can add payment method selection in the UI later

      // Call API to create order
      final apiService = ApiService();
      final orderData = await apiService.createOrder(
        branchId: authProvider.selectedBranch!.id,
        paymentMethod: backendPaymentMethod,
        deliveryAddress: deliveryAddress,
        deliveryPhone: deliveryPhone,
        token: authProvider.token!,
        latitude: _addressOption == 'custom' ? _latitude : null,
        longitude: _addressOption == 'custom' ? _longitude : null,
      );

      // Parse the order from response
      final order = Order.fromJson(orderData);

      // Add to local orders list for immediate display
      cartProvider.addOrder(order);
      cartProvider.clear();

      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const PaymentSuccessScreen()),
        );

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đặt hàng thành công!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đặt hàng thất bại: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán'),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order Summary
              const Text(
                'Tóm tắt đơn hàng',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              ...cartProvider.items.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${item.name} x ${item.quantity}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                      Text(
                        currencyFormat.format(item.totalPrice),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Tổng cộng:',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    currencyFormat.format(cartProvider.totalAmount),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.red.shade700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              // Delivery Info
              if (user != null) ...[
                const Text(
                  'Thông tin giao hàng',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                
                // Address Selection
                const Text('Địa chỉ:', style: TextStyle(fontWeight: FontWeight.bold)),
                RadioListTile<String>(
                  title: Text(user.address ?? 'Địa chỉ mặc định'),
                  value: 'default',
                  groupValue: _addressOption,
                  onChanged: (value) {
                    setState(() {
                      _addressOption = value!;
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  activeColor: Colors.red.shade700,
                ),
                RadioListTile<String>(
                  title: const Text('Địa chỉ khác'),
                  value: 'custom',
                  groupValue: _addressOption,
                  onChanged: (value) {
                    setState(() {
                      _addressOption = value!;
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  activeColor: Colors.red.shade700,
                ),
                if (_addressOption == 'custom') ...[
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _addressController,
                          decoration: const InputDecoration(
                            hintText: 'Nhập địa chỉ mới',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _pickAddressFromMap,
                        icon: const Icon(Icons.map),
                        color: Colors.red.shade700,
                        tooltip: 'Chọn từ bản đồ',
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],

                // Phone Selection
                const SizedBox(height: 16),
                const Text('Số điện thoại:', style: TextStyle(fontWeight: FontWeight.bold)),
                RadioListTile<String>(
                  title: Text(user.phone),
                  value: 'default',
                  groupValue: _phoneOption,
                  onChanged: (value) {
                    setState(() {
                      _phoneOption = value!;
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  activeColor: Colors.red.shade700,
                ),
                RadioListTile<String>(
                  title: const Text('Số điện thoại khác'),
                  value: 'custom',
                  groupValue: _phoneOption,
                  onChanged: (value) {
                    setState(() {
                      _phoneOption = value!;
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  activeColor: Colors.red.shade700,
                ),
                if (_phoneOption == 'custom')
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      hintText: 'Nhập số điện thoại mới',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                const SizedBox(height: 16),
              ],

              // Note Field
              TextFormField(
                controller: _noteController,
                decoration: const InputDecoration(
                  labelText: 'Ghi chú (tùy chọn)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 32),
              // Place Order Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : () => _placeOrder(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade700,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Đặt hàng',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

