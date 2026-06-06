import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:image_picker/image_picker.dart';
import '../constants.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';

import 'package:flutter_compass/flutter_compass.dart';
import '../services/route_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final dynamic order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final _apiService = ApiService();
  final _locationService = LocationService();
  final _routeService = RouteService();
  final ImagePicker _picker = ImagePicker();
  bool _isLoading = false;
  List<LatLng> _routePoints = [];
  double _routeDistanceKm = 0;
  double _routeDurationMin = 0;
  bool _isLoadingRoute = true;
  double _currentHeading = 0.0;
  StreamSubscription<CompassEvent>? _compassSubscription;
  bool _showFullInfo = false;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    if (widget.order['status'] != 'DELIVERED' && widget.order['status'] != 'CANCELLED') {
      _locationService.startTracking().catchError((e) {
        print("Error starting location tracking: $e");
      });
    }
    _initCompass();
    // Fetch route ngay khi mở screen
    _initialRouteFetch();
  }

  void _initCompass() {
    _compassSubscription = FlutterCompass.events?.listen((event) {
      if (mounted) {
        setState(() {
          _currentHeading = event.heading ?? 0.0;
        });
      }
    });
  }

  /// Fetch route ngay khi mở screen, dùng vị trí branch nếu chưa có GPS
  Future<void> _initialRouteFetch() async {
    final branch = widget.order['branch'];
    final branchLat = branch['latitude'] != null ? branch['latitude'] as double : 10.762622;
    final branchLng = branch['longitude'] != null ? branch['longitude'] as double : 106.660172;
    final orderLat = widget.order['latitude'] != null ? widget.order['latitude'] as double : branchLat;
    final orderLng = widget.order['longitude'] != null ? widget.order['longitude'] as double : branchLng;

    // Lấy vị trí GPS hiện tại nếu có
    LatLng startPos;
    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 5));
      startPos = LatLng(pos.latitude, pos.longitude);
    } catch (_) {
      startPos = LatLng(branchLat, branchLng);
    }

    final endPos = LatLng(orderLat, orderLng);
    await _fetchRoute(startPos, endPos, force: true);
  }

  @override
  void dispose() {
    _locationService.stopTracking();
    _compassSubscription?.cancel();
    super.dispose();
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _isLoading = true);
    try {
      await _apiService.updateOrderStatus(widget.order['id'], status);
      if (status == 'DELIVERED') {
        _locationService.stopTracking();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Giao hàng thành công!'),
              ],
            ),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchRoute(LatLng start, LatLng end, {bool force = false}) async {
    if (!force) {
      // Chỉ re-fetch khi vị trí thay đổi > 30m
      final cached = _routeService.getCachedRoute();
      if (cached != null && cached.isNotEmpty && _routePoints.isNotEmpty) {
        return;
      }
    }

    final result = await _routeService.getRoute(start, end);
    if (mounted) {
      setState(() {
        _routePoints = result.points;
        _routeDistanceKm = result.distanceKm;
        _routeDurationMin = result.durationMin;
        _isLoadingRoute = false;
      });
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'DRIVER_ASSIGNED': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao thành công';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'DRIVER_ASSIGNED': return const Color(0xFFFF6B00);
      case 'DELIVERED': return Colors.green;
      case 'CANCELLED': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _formatDistance(double km) {
    if (km < 1) return '${(km * 1000).round()} m';
    return '${km.toStringAsFixed(1)} km';
  }

  String _formatDuration(double min) {
    if (min < 1) return '< 1 phút';
    if (min < 60) return '${min.round()} phút';
    final h = (min / 60).floor();
    final m = (min % 60).round();
    return '${h}h ${m}p';
  }

  @override
  Widget build(BuildContext context) {
    final branch = widget.order['branch'];
    final branchLat = branch['latitude'] != null ? branch['latitude'] as double : 10.762622;
    final branchLng = branch['longitude'] != null ? branch['longitude'] as double : 106.660172;

    final orderLat = widget.order['latitude'] != null ? widget.order['latitude'] as double : branchLat;
    final orderLng = widget.order['longitude'] != null ? widget.order['longitude'] as double : branchLng;

    final branchPos = LatLng(branchLat, branchLng);
    final orderPos = LatLng(orderLat, orderLng);
    final status = widget.order['status'] ?? '';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 8)],
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1A2E)),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 8)],
            ),
            child: Row(
              children: [
                Icon(Icons.circle, size: 8, color: _getStatusColor(status)),
                const SizedBox(width: 6),
                Text(
                  _getStatusText(status),
                  style: TextStyle(
                    color: _getStatusColor(status),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // MAP (full screen)
          StreamBuilder<Position>(
            stream: Geolocator.getPositionStream(
              locationSettings: const LocationSettings(
                accuracy: LocationAccuracy.high,
                distanceFilter: 10,
              ),
            ),
            builder: (context, snapshot) {
              final currentLat = snapshot.hasData ? snapshot.data!.latitude : branchLat;
              final currentLng = snapshot.hasData ? snapshot.data!.longitude : branchLng;
              final currentPos = LatLng(currentLat, currentLng);

              final samePoint = (currentPos.latitude == orderPos.latitude && currentPos.longitude == orderPos.longitude);

              // Fetch route khi GPS cập nhật
              if (snapshot.hasData) {
                _fetchRoute(currentPos, orderPos);
              }

              // Tạo bounds bao gồm tất cả các điểm
              final boundsPoints = <LatLng>[currentPos, orderPos, branchPos];
              if (_routePoints.isNotEmpty) {
                boundsPoints.addAll(_routePoints);
              }

              return FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: currentPos,
                  initialZoom: 15.0,
                  initialCameraFit: samePoint
                      ? null
                      : CameraFit.bounds(
                          bounds: LatLngBounds.fromPoints(boundsPoints),
                          padding: const EdgeInsets.fromLTRB(50, 120, 50, 350),
                        ),
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${AppConstants.mapboxAccessToken}',
                    userAgentPackageName: 'com.example.GuGuGaGa_shipper',
                  ),
                  // Route polyline - luôn hiển thị đường đi
                  PolylineLayer(
                    polylines: [
                      if (_routePoints.isNotEmpty) ...[
                        // Shadow line (bóng đổ)
                        Polyline(
                          points: _routePoints,
                          strokeWidth: 8.0,
                          color: const Color(0xFF4285F4).withOpacity(0.3),
                        ),
                        // Main route line (đường cong theo tuyến đường)
                        Polyline(
                          points: _routePoints,
                          strokeWidth: 5.0,
                          color: const Color(0xFF4285F4),
                        ),
                      ] else ...[
                        // Fallback: đường thẳng khi chưa có route
                        Polyline(
                          points: [currentPos, orderPos],
                          strokeWidth: 3.0,
                          color: Colors.grey.withOpacity(0.5),
                        ),
                      ],
                    ],
                  ),
                  MarkerLayer(
                    markers: [
                      // Shipper position
                      Marker(
                        point: currentPos,
                        width: 48,
                        height: 48,
                        child: Transform.rotate(
                          angle: _currentHeading * (3.14159 / 180),
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.4), blurRadius: 12, spreadRadius: 2)],
                            ),
                            child: const Padding(
                              padding: EdgeInsets.all(6),
                              child: Icon(Icons.navigation, color: Color(0xFF00C853), size: 28),
                            ),
                          ),
                        ),
                      ),
                      // Branch position
                      Marker(
                        point: branchPos,
                        width: 40,
                        height: 40,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: 8)],
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(6),
                            child: Icon(Icons.store, color: Color(0xFF4285F4), size: 22),
                          ),
                        ),
                      ),
                      // Destination
                      Marker(
                        point: orderPos,
                        width: 44,
                        height: 44,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [BoxShadow(color: Colors.red.withOpacity(0.3), blurRadius: 8)],
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(6),
                            child: Icon(Icons.location_on, color: Colors.red, size: 26),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),

          // Route info badge nhỏ gọn ở góc trái trên
          if (_routePoints.isNotEmpty && _routeDistanceKm > 0)
            Positioned(
              top: MediaQuery.of(context).padding.top + 56,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 8),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.route, color: Color(0xFF4285F4), size: 14),
                    const SizedBox(width: 4),
                    Text(
                      _formatDistance(_routeDistanceKm),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFF1A1A2E)),
                    ),
                    const SizedBox(width: 6),
                    Container(width: 1, height: 12, color: Colors.grey.shade300),
                    const SizedBox(width: 6),
                    const Icon(Icons.access_time, color: Color(0xFFFF6B00), size: 14),
                    const SizedBox(width: 4),
                    Text(
                      _formatDuration(_routeDurationMin),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFF1A1A2E)),
                    ),
                  ],
                ),
              ),
            ),

          // Loading route indicator nhỏ gọn
          if (_isLoadingRoute)
            Positioned(
              top: MediaQuery.of(context).padding.top + 56,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 8),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF4285F4))),
                    SizedBox(width: 6),
                    Text('Đang tải...', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
              ),
            ),

          // Bottom Sheet
          DraggableScrollableSheet(
            initialChildSize: 0.38,
            minChildSize: 0.15,
            maxChildSize: 0.75,
            builder: (context, scrollController) {
              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, -4)),
                  ],
                ),
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Drag handle
                        Center(
                          child: Container(
                            margin: const EdgeInsets.only(top: 12, bottom: 16),
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),

                        // Order ID + Amount
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                'Đơn hàng #${widget.order['id']}',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E)),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.green.shade50,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${widget.order['totalAmount']}đ',
                                style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w700, fontSize: 16),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Delivery Steps
                        _buildDeliveryStep(
                          icon: Icons.store,
                          color: const Color(0xFF4285F4),
                          title: 'Lấy hàng tại',
                          subtitle: branch['name'] ?? '',
                          detail: branch['address'] ?? '',
                          isFirst: true,
                        ),
                        _buildDeliveryStep(
                          icon: Icons.location_on,
                          color: Colors.red,
                          title: 'Giao đến',
                          subtitle: widget.order['user']?['name'] ?? '',
                          detail: widget.order['deliveryAddress'] ?? '',
                          isLast: true,
                        ),

                        const SizedBox(height: 16),

                        // Customer info
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: const Color(0xFFFF6B00).withOpacity(0.1),
                                child: const Icon(Icons.person, color: Color(0xFFFF6B00)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(widget.order['user']?['name'] ?? 'Khách hàng', style: const TextStyle(fontWeight: FontWeight.w600)),
                                    Text(widget.order['deliveryPhone'] ?? '', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                                  ],
                                ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.green.shade50,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: IconButton(
                                  icon: Icon(Icons.phone, color: Colors.green.shade600),
                                  onPressed: () {},
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Order items
                        const SizedBox(height: 16),
                        GestureDetector(
                          onTap: () => setState(() => _showFullInfo = !_showFullInfo),
                          child: Row(
                            children: [
                              const Text('Chi tiết đơn hàng', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                              Icon(_showFullInfo ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: Colors.grey),
                            ],
                          ),
                        ),
                        if (_showFullInfo && widget.order['orderItem'] != null) ...[
                          const SizedBox(height: 10),
                          ...((widget.order['orderItem'] as List).map((item) {
                            final name = item['product'] != null
                                ? item['product']['name']
                                : (item['combo'] != null ? item['combo']['name'] : 'N/A');
                            final type = item['combo'] != null ? 'Combo' : 'SP';
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.orange.shade50,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text('x${item['quantity']}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFFFF6B00))),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(name, style: const TextStyle(fontSize: 14)),
                                      Text(' ($type)', style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
                                    ],
                                  ),
                                  Text('${item['price'] * item['quantity']}đ', style: const TextStyle(fontWeight: FontWeight.w500)),
                                ],
                              ),
                            );
                          })),
                        ],

                        // Action button
                        if (status == 'DRIVER_ASSIGNED') ...[
                          const SizedBox(height: 20),
                          if (_isLoading)
                            const Center(child: CircularProgressIndicator(color: Color(0xFF00C853)))
                          else
                            Row(
                              children: [
                                Expanded(
                                  child: SizedBox(
                                    height: 54,
                                    child: OutlinedButton.icon(
                                      icon: const Icon(Icons.camera_alt, color: Colors.blue),
                                      label: const Text(
                                        'QUÉT AI ĐỐI SOÁT',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: Colors.blue,
                                        side: const BorderSide(color: Colors.blue, width: 2),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                      ),
                                      onPressed: _scanReceiptWithAI,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: SizedBox(
                                    height: 54,
                                    child: ElevatedButton.icon(
                                      icon: const Icon(Icons.check_circle, size: 20),
                                      label: const Text(
                                        'XÁC NHẬN GIAO',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF00C853),
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                      ),
                                      onPressed: () => _updateStatus('DELIVERED'),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                        ],
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _scanReceiptWithAI() async {
    try {
      final XFile? file = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (file == null) return;

      setState(() => _isLoading = true);

      // Call API
      final bytes = await file.readAsBytes();
      final result = await _apiService.scanReceipt(bytes, file.name);
      
      setState(() => _isLoading = false);

      final String? orderId = result['orderId'];
      final int? amount = result['amount'];
      final String paymentStatus = result['paymentStatus'] ?? "UNKNOWN";
      final String paymentMethod = result['paymentMethod'] ?? "UNKNOWN";

      final isIdMatch = orderId != null && orderId.toString().contains(widget.order['id'].toString());
      final isAmountMatch = amount != null && amount == (widget.order['totalAmount'] as num).toInt();
      final isSuccess = paymentStatus == "SUCCESS";

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.psychology, color: Colors.blue),
              SizedBox(width: 8),
              Text("Kết Quả Đối Soát AI"),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildVerificationRow(
                label: "Mã đơn hàng:",
                value: orderId ?? "Không tìm thấy",
                isMatch: isIdMatch,
              ),
              const SizedBox(height: 8),
              _buildVerificationRow(
                label: "Số tiền:",
                value: amount != null ? "${amount}đ" : "Không tìm thấy",
                isMatch: isAmountMatch,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Text("Phương thức: ", style: TextStyle(fontWeight: FontWeight.w500)),
                  Text(paymentMethod),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Text("Trạng thái GD: ", style: TextStyle(fontWeight: FontWeight.w500)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isSuccess ? Colors.green.shade50 : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      paymentStatus,
                      style: TextStyle(
                        color: isSuccess ? Colors.green.shade700 : Colors.red.shade700,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              if (isIdMatch && isAmountMatch && isSuccess)
                const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 20),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        "Thông tin trùng khớp hoàn toàn!",
                        style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                )
              else
                const Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange, size: 20),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        "Phát hiện thông tin chưa khớp hoặc giao dịch chưa thành công.",
                        style: TextStyle(color: Colors.orange, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                  ],
                ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Hủy"),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C853),
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(context);
                _updateStatus('DELIVERED');
              },
              child: const Text("Xác Nhận Giao"),
            ),
          ],
        ),
      );

    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Lỗi đối soát AI: $e")),
        );
      }
    }
  }

  Widget _buildVerificationRow({required String label, required String value, required bool isMatch}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        Row(
          children: [
            Text(value, style: TextStyle(color: isMatch ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
            const SizedBox(width: 4),
            Icon(
              isMatch ? Icons.check_circle : Icons.cancel,
              color: isMatch ? Colors.green : Colors.red,
              size: 16,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDeliveryStep({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String detail,
    bool isFirst = false,
    bool isLast = false,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: Colors.grey.shade300,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                  Text(subtitle, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  if (detail.isNotEmpty)
                    Text(detail, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
