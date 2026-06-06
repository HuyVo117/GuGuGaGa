import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

class LocationService {
  final ApiService _apiService = ApiService();
  StreamSubscription<Position>? _positionStreamSubscription;
  bool _isStopped = false;

  Future<void> startTracking() async {
    _isStopped = false;
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return Future.error('Location services are disabled.');
    }

    if (_isStopped) return;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Location permissions are denied');
      }
    }

    if (_isStopped) return;

    if (permission == LocationPermission.deniedForever) {
      return Future.error(
          'Location permissions are permanently denied, we cannot request permissions.');
    }

    // Use standard LocationSettings
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 20, // Update every 20 meters to avoid spamming
    );

    if (_isStopped) return;

    _positionStreamSubscription = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position position) {
        if (_isStopped) {
          _positionStreamSubscription?.cancel();
          return;
        }
        print('Location update: ${position.latitude}, ${position.longitude}');
        _apiService.updateLocation(position.latitude, position.longitude).catchError((e) {
            print("Error updating location: $e");
        });
      },
      onError: (e) {
          print("Location stream error: $e");
      }
    );
  }

  void stopTracking() {
    _isStopped = true;
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
  }
}
