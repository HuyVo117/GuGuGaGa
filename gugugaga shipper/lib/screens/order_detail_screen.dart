import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
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
  bool _isLoading = false;
  List<LatLng> _routePoints = [];
  LatLng? _lastRouteStart;
  LatLng? _lastRouteEnd;
  double _currentHeading = 0.0;
  StreamSubscription<CompassEvent>? _compassSubscription;

  @override
  void initState() {
    super.initState();
    // Start tracking if order is not delivered/cancelled
    if (widget.order['status'] != 'DELIVERED' && widget.order['status'] != 'CANCELLED') {
      _locationService.startTracking().catchError((e) {
        print("Error starting location tracking: $e");
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi vị trí: $e')),
          );
        }
      });
    }
    _initCompass();
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

  @override
  void dispose() {
    _locationService.stopTracking();
    _compassSubscription?.cancel();
    super.dispose();
  }

  Future<void> _updateStatus(String status) async {
    setState(() {
      _isLoading = true;
    });
    try {
      await _apiService.updateOrderStatus(widget.order['id'], status);
      if (status == 'DELIVERED') {
        _locationService.stopTracking();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật trạng thái thành công')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
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
    final branch = widget.order['branch'];
    final branchLat = branch['latitude'] != null ? branch['latitude'] as double : 10.762622;
    final branchLng = branch['longitude'] != null ? branch['longitude'] as double : 106.660172;
    
    final orderLat = widget.order['latitude'] != null ? widget.order['latitude'] as double : branchLat;
    final orderLng = widget.order['longitude'] != null ? widget.order['longitude'] as double : branchLng;

    final branchPos = LatLng(branchLat, branchLng);
    final orderPos = LatLng(orderLat, orderLng);

    // Calculate bounds to fit both markers
    final bounds = LatLngBounds.fromPoints([branchPos, orderPos]);

    return Scaffold(
      appBar: AppBar(
        title: Text('Chi tiết đơn #${widget.order['id']}'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            flex: 2,
            child: StreamBuilder<Position>(
              stream: Geolocator.getPositionStream(
                locationSettings: const LocationSettings(
                  accuracy: LocationAccuracy.high,
                  distanceFilter: 10,
                ),
              ),
              builder: (context, snapshot) {
                // Use current location if available, else fallback to branch location
                final currentLat = snapshot.hasData ? snapshot.data!.latitude : branchLat;
                final currentLng = snapshot.hasData ? snapshot.data!.longitude : branchLng;
                final currentPos = LatLng(currentLat, currentLng);
                
                // Use GPS heading if moving fast enough, otherwise use Compass
                if (snapshot.hasData && snapshot.data!.speed > 1.0) {
                   // If speed > 1 m/s, prefer GPS heading
                   // Note: We are updating _currentHeading via compass stream, but we can override here if needed.
                   // However, usually compass is better for "phone rotation".
                   // Let's stick to compass for rotation as requested by user "xoay điện thoại".
                }

                // Update bounds to include current position and destination
                final dynamicBounds = LatLngBounds.fromPoints([currentPos, orderPos]);

                // Fetch route if we have a valid position
                if (snapshot.hasData) {
                   _fetchRoute(currentPos, orderPos);
                }

                return FlutterMap(
                  options: MapOptions(
                    initialCenter: currentPos,
                    initialZoom: 15.0,
                    initialCameraFit: CameraFit.bounds(
                      bounds: dynamicBounds,
                      padding: const EdgeInsets.all(50),
                    ),
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${AppConstants.mapboxAccessToken}',
                      userAgentPackageName: 'com.example.GuGuGaGa_shipper',
                    ),
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: _routePoints.isNotEmpty ? _routePoints : [currentPos, orderPos],
                          strokeWidth: 4.0,
                          color: Colors.blue,
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        // Shipper Location
                        Marker(
                          point: currentPos,
                          width: 40,
                          height: 40,
                          child: Transform.rotate(
                            angle: _currentHeading * (3.14159 / 180), // Convert degrees to radians
                            child: const Icon(Icons.navigation, color: Colors.green, size: 40),
                          ),
                        ),
                        // Destination Location
                        Marker(
                          point: orderPos,
                          width: 40,
                          height: 40,
                          child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Thông tin đơn hàng',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text('Chi nhánh: ${branch['name']}'),
                    Text('Địa chỉ CN: ${branch['address']}'),
                    const Divider(),
                    Text('Khách hàng: ${widget.order['user']['name']}'),
                    Text('Địa chỉ giao: ${widget.order['deliveryAddress']}'),
                    Text('SĐT: ${widget.order['deliveryPhone']}'),
                    Text('Tổng tiền: ${widget.order['totalAmount']} đ'),
                    const Divider(),
                    const Text(
                      'Chi tiết đơn hàng',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (widget.order['orderItem'] != null)
                      ...((widget.order['orderItem'] as List).map((item) {
                        final name = item['product'] != null
                            ? item['product']['name']
                            : (item['combo'] != null ? item['combo']['name'] : 'Sản phẩm không xác định');
                        final type = item['combo'] != null ? 'Combo' : 'Sản phẩm';
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.w500)),
                                    Text('$type x ${item['quantity']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                  ],
                                ),
                              ),
                              Text('${item['price'] * item['quantity']} đ'),
                            ],
                          ),
                        );
                      })),
                    const SizedBox(height: 16),
                    if (widget.order['status'] != 'DELIVERED')
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading
                              ? null
                              : () => _updateStatus('DELIVERED'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Xác nhận đã giao hàng'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
