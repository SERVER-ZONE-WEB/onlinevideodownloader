import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:3000';

  Future<Map<String, dynamic>> downloadVideo(Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/download'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to download video');
    }
  }
}
