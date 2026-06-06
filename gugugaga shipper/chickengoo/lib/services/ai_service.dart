import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/combo.dart';
import '../constants.dart';

class AIService {
  static const String _fallbackKey = 'AIzaSyBWUYcCfx3SdcoV8RplnNfiPV0u-vV6Kjo';

  String get _key =>
      AppConstants.geminiApiKey.isNotEmpty ? AppConstants.geminiApiKey : _fallbackKey;

  final String _url =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

  Future<AIResponse> sendMessage(
      String userMessage, List<Product> products, List<Combo> combos) async {

    final productList = products
        .map((p) => '- [${p.id}] ${p.name} - ${p.price}đ. ${p.desc ?? ""}')
        .join('\n');

    final comboList = combos
        .map((c) => '- [${c.id}] ${c.name} - ${c.price}đ. ${c.desc ?? ""}')
        .join('\n');

    final prompt = """
Bạn là AI của GuGuGaGa.

MENU:
$productList

$comboList

User: "$userMessage"
Nhiệm vụ: Gợi ý món theo ngân sách & sở thích.

Trả về JSON đúng cấu trúc:
{
  "text": "gợi ý",
  "suggestedItems": [
    {"type": "product|combo", "id": 1}
  ]
}
""";

    final response = await http.post(
      Uri.parse("$_url?key=$_key"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "contents": [
          {
            "role": "user",
            "parts": [
              {"text": prompt}
            ]
          }
        ]
      }),
    );

    if (response.statusCode != 200) {
      if (response.statusCode == 429 || response.body.contains('Quota exceeded')) {
        return AIResponse(text: "Hiện tại hệ thống đang quá tải, bạn vui lòng đợi khoảng 30 giây rồi thử lại nhé! (Lỗi: Quota exceeded)");
      }
      return AIResponse(text: "API Error: ${response.body}");
    }

    final data = json.decode(response.body);
    final text = data["candidates"]?[0]?["content"]?["parts"]?[0]?["text"];

    if (text == null) return AIResponse(text: "Không hiểu được phản hồi API.");

    // Try parsing JSON content
    final match = RegExp(r'\{[\s\S]*\}').firstMatch(text);

    if (match != null) {
      try {
        final jsonMap = jsonDecode(match.group(0)!);
        return AIResponse(
          text: jsonMap["text"],
          suggestedItems: (jsonMap["suggestedItems"] as List?)
              ?.map((e) => SuggestedItem.fromJson(e))
              .toList(),
        );
      } catch (_) {}
    }

    return AIResponse(text: text);
  }
}

class AIResponse {
  final String text;
  final List<SuggestedItem>? suggestedItems;
  AIResponse({required this.text, this.suggestedItems});
}

class SuggestedItem {
  final String type;
  final int id;

  SuggestedItem({required this.type, required this.id});

  factory SuggestedItem.fromJson(Map<String, dynamic> json) =>
      SuggestedItem(type: json["type"], id: json["id"]);
}
