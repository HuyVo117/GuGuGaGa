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
  String _accountNo = "1234567890";
  String _accountName = "GUGUGAGA FOOD STORE";
  bool _isLoadingConfig = true;

  @override
  void initState() {
    super.initState();
    _loadBankConfig();
    _startPaymentCheckTimer();
  }

  void _startPaymentCheckTimer() {
    _paymentTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!_isSuccess && !_isChecking) {
        _checkPaymentStatus(isManual: false, force: false);
      }
    });
  }

  Future<void> _loadBankConfig() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final apiService = ApiService();
      final config = await apiService.getPaymentConfig(authProvider.token!);
      
      setState(() {
        _bankId = config['bankId'] ?? 'MB';
        _accountNo = config['accountNo'] ?? '1234567890';
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
    _paymentTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkPaymentStatus({bool isManual = false, bool force = false}) async {
    if (_isSuccess) return;
    
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

  void _triggerSuccess() {
    if (_isSuccess) return;
    _paymentTimer?.cancel();
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
    // VietQR URL builder
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
                  // Instructions
                  const Text(
                    'Quét mã QR dưới đây hoặc chuyển khoản thủ công để thanh toán.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 20),

                  // VietQR Image Card
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

                  // Bank details list
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          _buildDetailRow(
                            label: 'Ngân hàng',
                            value: '$_bankId (Ngân hàng đối tác)',
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

                  // Pulsing status indicator
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
                        'Nhấn kiểm tra sau khi bạn đã chuyển khoản',
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Manual confirmation button
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
                            'Tôi đã chuyển khoản, kiểm tra ngay',
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
