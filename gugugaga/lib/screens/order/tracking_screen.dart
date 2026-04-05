import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../constants.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/order.dart';

import 'dart:math' as math;
import '../../services/route_service.dart';

class TrackingScreen extends StatefulWidget {
  final int orderId;

  const TrackingScreen({super.key, required this.orderId});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final ApiService _apiService = ApiService();
  final RouteService _routeService = RouteService();
  Order? _order;
  Timer? _timer;
  bool _isLoading = true;
  String? _errorMessage;
  List<LatLng> _routePoints = [];
  LatLng? _lastRouteStart;
  LatLng? _lastRouteEnd;
  double _driverHeading = 0.0;
  LatLng? _lastDriverPos;

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
    // Poll every 10 seconds
    _timer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _fetchOrderDetails(silent: true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrderDetails({bool silent = false}) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    try {
      final orderData = await _apiService.getOrderDetail(widget.orderId,authProvider.token!);
      if (mounted) {
        setState(() {
          _order = Order.fromJson(orderData);
          _isLoading = false;
          _errorMessage = null;
          
          // Calculate driver heading and fetch route if driver has position
          if (_order!.driver != null && 
              _order!.driver!.latitude != null && 
              _order!.driver!.longitude != null) {
            final newDriverPos = LatLng(_order!.driver!.latitude!, _order!.driver!.longitude!);
            
            // Calculate heading only if driver moved
            if (_lastDriverPos != null && newDriverPos != _lastDriverPos) {
              _driverHeading = _calculateBearing(_lastDriverPos!, newDriverPos);
            }
            _lastDriverPos = newDriverPos;

            // Always fetch route when driver has position
            // _fetchRoute has built-in logic to avoid re-fetching if positions haven't changed significantly
            final branchLat = _order!.branch?.latitude ?? 10.762622;
            final branchLng = _order!.branch?.longitude ?? 106.660172;
            final deliveryLat = _order!.latitude ?? branchLat;
            final deliveryLng = _order!.longitude ?? branchLng;
            final deliveryPos = LatLng(deliveryLat, deliveryLng);
            _fetchRoute(newDriverPos, deliveryPos);
          }
        });
      }
    } catch (e) {
      print("Error fetching order details: $e");
      if (mounted && !silent) {
        setState(() {
          _isLoading = false;
          _errorMessage = "Không thể tải thông tin đơn hàng";
        });
      }
    }
  }

  double _calculateBearing(LatLng start, LatLng end) {
    final lat1 = start.latitude * (math.pi / 180);
    final lon1 = start.longitude * (math.pi / 180);
    final lat2 = end.latitude * (math.pi / 180);
    final lon2 = end.longitude * (math.pi / 180);

    final dLon = lon2 - lon1;
    final y = math.sin(dLon) * math.cos(lat2);
    final x = math.cos(lat1) * math.sin(lat2) -
        math.sin(lat1) * math.cos(lat2) * math.cos(dLon);
    final bearing = math.atan2(y, x);
    return (bearing * (180 / math.pi) + 360) % 360;
  }

  Future<void> _fetchRoute(LatLng start, LatLng end) async {
    // Avoid re-fetching if start/end haven't changed significantly (e.g., < 20m)
    if (_lastRouteStart != null && _lastRouteEnd != null) {
      final Distance distance = Distance();
      if (distance.as(LengthUnit.Meter, start, _lastRouteStart!) < 20 &&
          distance.as(LengthUnit.Meter, end, _lastRouteEnd!) < 20) {
        return;
      }
    }

    final points = await _routeService.getRoute(start, end);
    if (mounted) {
      setState(() {
        _routePoints = points;
        _lastRouteStart = start;
        _lastRouteEnd = end;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text("Theo dõi đơn hàng")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null || _order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Theo dõi đơn hàng")),
        body: Center(child: Text(_errorMessage ?? "Lỗi không xác định")),
      );
    }

    // Coordinates
    // Branch location (default fallback if missing)
    final branchLat = _order!.branch?.latitude ?? 10.762622;
    final branchLng = _order!.branch?.longitude ?? 106.660172;
    final branchPos = LatLng(branchLat, branchLng);

    // Driver location
    LatLng? driverPos;
    if (_order!.driver != null && _order!.driver!.latitude != null && _order!.driver!.longitude != null) {
      driverPos = LatLng(_order!.driver!.latitude!, _order!.driver!.longitude!);
    }

    // Delivery location (Customer)
    final deliveryLat = _order!.latitude ?? branchLat;
    final deliveryLng = _order!.longitude ?? branchLng;
    final deliveryPos = LatLng(deliveryLat, deliveryLng);

    final bounds = LatLngBounds.fromPoints([
      if (driverPos != null) driverPos else branchPos,
      deliveryPos,
    ]);



    return Scaffold(
      appBar: AppBar(
        title: Text("Đơn hàng #${widget.orderId}"),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            flex: 3,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: deliveryPos,
                initialZoom: 13.0,
                initialCameraFit: CameraFit.bounds(
                  bounds: bounds,
                  padding: const EdgeInsets.all(50),
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${AppConstants.mapboxAccessToken}',
                  userAgentPackageName: 'com.example.GuGuGaGa',
                ),
                PolylineLayer(
                  polylines: [
                    if (_routePoints.isNotEmpty && driverPos != null)
                      Polyline(
                        points: _routePoints,
                        strokeWidth: 4.0,
                        color: Colors.blue,
                      ),
                  ],
                ),
                MarkerLayer(
                  markers: [
                    // Branch Marker
                    Marker(
                      point: branchPos,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.store, color: Colors.blue, size: 40),
                    ),
                    // Customer Marker
                    Marker(
                      point: deliveryPos,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.home, color: Colors.red, size: 40),
                    ),
                    // Driver Marker
                    if (driverPos != null)
                      Marker(
                        point: driverPos,
                        width: 40,
                        height: 40,
                        child: Transform.rotate(
                          angle: _driverHeading * (math.pi / 180),
                          child: const Icon(Icons.motorcycle, color: Colors.green, size: 40),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Trạng thái: ${_order!.statusText}",
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  if (_order!.driver != null)
                    Text("Tài xế: ${_order!.driver!.name} - ${_order!.driver!.phone}"),
                  if (_order!.driver == null)
                    const Text("Đang tìm tài xế..."),
                  const SizedBox(height: 8),
                  const Text("Vị trí tài xế cập nhật mỗi 10 giây."),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
