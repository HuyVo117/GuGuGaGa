import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../constants.dart';

class RouteService {
  Future<List<LatLng>> getRoute(LatLng start, LatLng end) async {
    // Mapbox Directions API (thuật toán tìm đường tối ưu giống Google Maps)
    final mapboxResult = await _getRouteFromMapbox(start, end);
    if (mapboxResult.isNotEmpty) return mapboxResult;

    // Fallback sang OSRM nếu Mapbox lỗi
    final osrmResult = await _getRouteFromOSRM(start, end);
    if (osrmResult.isNotEmpty) return osrmResult;

    return [];
  }

  Future<List<LatLng>> _getRouteFromOSRM(LatLng start, LatLng end) async {
    final String url =
        'https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson';

    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && (data['routes'] as List).isNotEmpty) {
          final List<dynamic> coordinates =
              data['routes'][0]['geometry']['coordinates'];
          return coordinates
              .map((coord) => LatLng(coord[1].toDouble(), coord[0].toDouble()))
              .toList();
        }
      }
      print('OSRM route failed: ${response.statusCode}');
    } catch (e) {
      print('OSRM error: $e');
    }
    return [];
  }

  Future<List<LatLng>> _getRouteFromMapbox(LatLng start, LatLng end) async {
    final token = AppConstants.mapboxAccessToken;
    if (token.isEmpty) return [];

    final String url =
        'https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=$token';

    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> coordinates =
            data['routes'][0]['geometry']['coordinates'];
        return coordinates
            .map((coord) => LatLng(coord[1].toDouble(), coord[0].toDouble()))
            .toList();
      }
      print('Mapbox route failed: ${response.statusCode} - ${response.body}');
    } catch (e) {
      print('Mapbox route error: $e');
    }
    return [];
  }
}

