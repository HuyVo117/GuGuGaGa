import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FavoriteProvider with ChangeNotifier {
  List<String> _favoriteIds = [];

  List<String> get favoriteIds => _favoriteIds;

  FavoriteProvider() {
    loadFavorites();
  }

  Future<void> loadFavorites() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _favoriteIds = prefs.getStringList('favoriteProducts') ?? [];
      notifyListeners();
    } catch (e) {
      print('Failed to load favorites: $e');
    }
  }

  bool isFavorite(String id) {
    return _favoriteIds.contains(id);
  }

  Future<void> toggleFavorite(String id) async {
    if (_favoriteIds.contains(id)) {
      _favoriteIds.remove(id);
    } else {
      _favoriteIds.add(id);
    }
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('favoriteProducts', _favoriteIds);
    } catch (e) {
      print('Failed to save favorites: $e');
    }
  }
}
