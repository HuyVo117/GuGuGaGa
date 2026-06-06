import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../constants.dart';

class RouteService {
  Future<List<LatLng>> getRoute(LatLng start, LatLng end) async {
    final String url =
        'https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=${AppConstants.mapboxAccessToken}';

    try {
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['routes'] == null || (data['routes'] as List).isEmpty) {
          print('RouteService: No routes found in response');
          return [];
        }
        
        final List<dynamic> coordinates =
            data['routes'][0]['geometry']['coordinates'];

        return coordinates
            .map((coord) => LatLng(coord[1].toDouble(), coord[0].toDouble()))
            .toList();
      } else {
        print('RouteService: Failed to load route: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('RouteService: Error fetching route: $e');
      return [];
    }
  }
}
