import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'package:gugugaga_shipper/main.dart';

void main() {
  setUp(() {
    dotenv.testLoad(fileInput: '''
BASE_URL=http://localhost:5000/api
MAPBOX_ACCESS_TOKEN=mock_mapbox_token
OPENCAGE_API_KEY=mock_opencage_key
''');
  });

  testWidgets('Login screen shows GuGuGaGa SHIPPER and forms', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp(isLoggedIn: false));
    await tester.pumpAndSettle();

    // Verify that our app name and subtitle are shown.
    expect(find.text('GuGuGaGa'), findsOneWidget);
    expect(find.text('SHIPPER'), findsOneWidget);

    // Verify the 'Đăng nhập' title is present inside the card.
    expect(find.text('Đăng nhập'), findsWidgets);

    // Verify text inputs for phone number and password exist.
    expect(find.byType(TextField), findsNWidgets(2));
  });
}

