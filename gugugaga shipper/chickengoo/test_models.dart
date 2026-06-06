import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:io';

Future<void> main() async {
  // Load .env manually since we are running a script
  final envFile = File('.env');
  final lines = await envFile.readAsLines();
  String apiKey = '';
  for (var line in lines) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
      break;
    }
  }

  if (apiKey.isEmpty) {
    print('No API Key found in .env');
    return;
  }

  print('Using API Key: ${apiKey.substring(0, 5)}...');

  final model = GenerativeModel(model: 'gemini-pro', apiKey: apiKey);
  try {
    // There isn't a direct listModels method exposed in the high-level GenerativeModel class easily accessible here 
    // without using the lower level API or just trying a request.
    // However, the error message suggested calling ListModels. 
    // In the Dart SDK, this might be available on the client.
    // Let's try to just use 'gemini-1.0-pro' and see if it works by sending a "Hello" message.
    
    final modelsToTry = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro'];
    
    for (var m in modelsToTry) {
      print('Trying model: $m');
      try {
        final testModel = GenerativeModel(model: m, apiKey: apiKey);
        final response = await testModel.generateContent([Content.text('Hello')]);
        print('SUCCESS: Model $m is working! Response: ${response.text}');
        return; // Found a working one
      } catch (e) {
        print('FAILED: Model $m. Error: $e');
      }
    }
  } catch (e) {
    print('Error: $e');
  }
}
