import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../constants.dart';

class RouteResult {
  final List<LatLng> points;
  final double distanceKm; // khoảng cách (km)
  final double durationMin; // thời gian ước tính (phút)

  RouteResult({
    required this.points,
    this.distanceKm = 0,
    this.durationMin = 0,
  });

  bool get isEmpty => points.isEmpty;
  bool get isNotEmpty => points.isNotEmpty;
}

class RouteService {
  // Cache route để tránh gọi API liên tục
  RouteResult? _cachedRoute;
  LatLng? _cachedStart;
  LatLng? _cachedEnd;
  DateTime? _cachedAt;

  Future<RouteResult> getRoute(LatLng start, LatLng end) async {
    // Kiểm tra cache: nếu vị trí chưa thay đổi nhiều (< 30m) và cache < 30s
    if (_cachedRoute != null &&
        _cachedStart != null &&
        _cachedEnd != null &&
        _cachedAt != null) {
      final Distance distance = Distance();
      final startDiff =
          distance.as(LengthUnit.Meter, start, _cachedStart!);
      final endDiff = distance.as(LengthUnit.Meter, end, _cachedEnd!);
      final age = DateTime.now().difference(_cachedAt!).inSeconds;

      if (startDiff < 30 && endDiff < 30 && age < 30) {
        return _cachedRoute!;
      }
    }

    // Thử Mapbox trước (có routing tốt hơn)
    RouteResult result = await _getRouteFromMapbox(start, end);

    // Fallback OSRM nếu Mapbox fail
    if (result.isEmpty) {
      result = await _getRouteFromOSRM(start, end);
    }

    // Fallback thứ 2: OSRM server khác
    if (result.isEmpty) {
      result = await _getRouteFromOSRMFallback(start, end);
    }

    // Cache kết quả nếu thành công
    if (result.isNotEmpty) {
      _cachedRoute = result;
      _cachedStart = start;
      _cachedEnd = end;
      _cachedAt = DateTime.now();
    }

    return result;
  }

  /// Trả về cached route nếu có (không gọi API)
  RouteResult? getCachedRoute() => _cachedRoute;

  Future<RouteResult> _getRouteFromMapbox(LatLng start, LatLng end) async {
    final token = AppConstants.mapboxAccessToken;
    if (token.isEmpty) return RouteResult(points: []);

    final String url =
        'https://api.mapbox.com/directions/v5/mapbox/driving/'
        '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
        '?geometries=geojson&overview=full&access_token=$token';

    try {
      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && (data['routes'] as List).isNotEmpty) {
          final route = data['routes'][0];
          final List<dynamic> coordinates =
              route['geometry']['coordinates'];
          final points = coordinates
              .map((coord) =>
                  LatLng(coord[1].toDouble(), coord[0].toDouble()))
              .toList();

          final double distanceM = (route['distance'] ?? 0).toDouble();
          final double durationS = (route['duration'] ?? 0).toDouble();

          return RouteResult(
            points: points,
            distanceKm: distanceM / 1000,
            durationMin: durationS / 60,
          );
        }
      }
      print('Mapbox route failed: ${response.statusCode}');
    } catch (e) {
      print('Mapbox error: $e');
    }
    return RouteResult(points: []);
  }

  Future<RouteResult> _getRouteFromOSRM(LatLng start, LatLng end) async {
    final String url =
        'https://router.project-osrm.org/route/v1/driving/'
        '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
        '?overview=full&geometries=geojson';

    try {
      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && (data['routes'] as List).isNotEmpty) {
          final route = data['routes'][0];
          final List<dynamic> coordinates =
              route['geometry']['coordinates'];
          final points = coordinates
              .map((coord) =>
                  LatLng(coord[1].toDouble(), coord[0].toDouble()))
              .toList();

          final double distanceM = (route['distance'] ?? 0).toDouble();
          final double durationS = (route['duration'] ?? 0).toDouble();

          return RouteResult(
            points: points,
            distanceKm: distanceM / 1000,
            durationMin: durationS / 60,
          );
        }
      }
      print('OSRM route failed: ${response.statusCode}');
    } catch (e) {
      print('OSRM error: $e');
    }
    return RouteResult(points: []);
  }

  Future<RouteResult> _getRouteFromOSRMFallback(
      LatLng start, LatLng end) async {
    // Fallback server OSRM khác
    final String url =
        'https://routing.openstreetmap.de/routed-car/route/v1/driving/'
        '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
        '?overview=full&geometries=geojson';

    try {
      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && (data['routes'] as List).isNotEmpty) {
          final route = data['routes'][0];
          final List<dynamic> coordinates =
              route['geometry']['coordinates'];
          final points = coordinates
              .map((coord) =>
                  LatLng(coord[1].toDouble(), coord[0].toDouble()))
              .toList();

          final double distanceM = (route['distance'] ?? 0).toDouble();
          final double durationS = (route['duration'] ?? 0).toDouble();

          return RouteResult(
            points: points,
            distanceKm: distanceM / 1000,
            durationMin: durationS / 60,
          );
        }
      }
    } catch (e) {
      print('OSRM fallback error: $e');
    }
    return RouteResult(points: []);
  }
}
