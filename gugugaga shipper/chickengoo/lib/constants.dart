import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  static String get mapboxAccessToken => dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '';
  static String get openCageApiKey => dotenv.env['OPENCAGE_API_KEY'] ?? '';
  static String get baseUrl => dotenv.env['BASE_URL'] ?? 'http:///api'; 
  static String get geminiApiKey => dotenv.env['GEMINI_API_KEY'] ?? ''; 
}
