import 'package:flutter/foundation.dart'
  show TargetPlatform, defaultTargetPlatform, kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  static String get mapboxAccessToken => dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '';
  static String get openCageApiKey => dotenv.env['OPENCAGE_API_KEY'] ?? '';
  static String get baseUrl {
    final envUrl = dotenv.env['BASE_URL'];
    if (kIsWeb) {
      if (envUrl != null && envUrl.isNotEmpty && !envUrl.contains('10.0.2.2')) {
        return envUrl;
      }
      return 'http://localhost:5000/api';
    }

    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }

    return 'http://localhost:5000/api';
  }

  static String get geminiApiKey => dotenv.env['GEMINI_API_KEY'] ?? '';
}
