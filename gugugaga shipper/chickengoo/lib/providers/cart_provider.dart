import 'package:flutter/foundation.dart' hide Category;
import '../models/product.dart';
import '../models/combo.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class CartItem {
  final int? id; // CartItem ID from backend
  final Product? product;
  final Combo? combo;
  int quantity;
  bool isSyncing; // Flag to indicate if this item is currently being synced with backend

  CartItem({
    this.id,
    this.product,
    this.combo,
    this.quantity = 1,
    this.isSyncing = false,
  }) : assert(product != null || combo != null);

  int get price => (product?.price ?? combo?.price ?? 0);
  int get totalPrice => price * quantity;
  String get name => product?.name ?? combo?.name ?? '';
  String? get image => product?.image ?? combo?.image;
}

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  final List<Order> _orders = [];
  
  // Track pending operations to prevent race conditions
  // Key: "p_{productId}" or "c_{comboId}", Value: timestamp
  final Map<String, int> _pendingAdds = {};

  CartProvider();

  List<CartItem> get items => _items;
  List<Order> get orders => _orders;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  int get totalAmount => _items.fold(0, (sum, item) => sum + item.totalPrice);

  bool get isEmpty => _items.isEmpty;

  Future<void> loadCart(int branchId, String token) async {
    try {
      final apiService = ApiService();
      final cartData = await apiService.getCart(branchId, token);
      _updateLocalCartFromBackend(cartData);
    } catch (e) {
      print('Failed to load cart: $e');
    }
  }

  void _updateLocalCartFromBackend(Map<String, dynamic> cartData) {
    print('DEBUG: _updateLocalCartFromBackend called');
    
    // Create a map of backend items for easy lookup
    final backendItemsMap = <String, dynamic>{};
    if (cartData['cartItem'] != null) {
      for (var item in cartData['cartItem']) {
        if (item['product'] != null) {
          backendItemsMap['p_${item['product']['id']}'] = item;
        } else if (item['combo'] != null) {
          backendItemsMap['c_${item['combo']['id']}'] = item;
        }
      }
    }

    // We need to merge backend state with local state carefully
    // 1. Update existing items that match backend items
    // 2. Add new items from backend that aren't in local
    // 3. Remove items that are in local but not in backend (UNLESS they are pending add)

    final List<CartItem> newItems = [];
    final Set<String> processedKeys = {};

    // First pass: Match local items with backend items
    for (var localItem in _items) {
      String key;
      if (localItem.product != null) {
        key = 'p_${localItem.product!.id}';
      } else {
        key = 'c_${localItem.combo!.id}';
      }

      // If this item is currently being added (optimistic), keep it regardless of backend
      if (_pendingAdds.containsKey(key)) {
        newItems.add(localItem);
        processedKeys.add(key);
        continue;
      }

      if (backendItemsMap.containsKey(key)) {
        // Item exists in backend, update ID and sync quantity if not currently being modified by user
        final backendItem = backendItemsMap[key];
        // If the local item has an ID, it's already synced before. 
        // If it doesn't, it might be a newly added item that just got confirmed.
        
        // We trust backend for ID
        final int backendId = backendItem['id'];
        final int backendQty = backendItem['quantity'];
        
        // Update local item
        // Note: In a real complex app we might want to keep local quantity if user is actively editing
        // But here we'll take backend as truth unless we have a specific reason not to
        newItems.add(CartItem(
          id: backendId,
          product: localItem.product,
          combo: localItem.combo,
          quantity: backendQty,
        ));
        processedKeys.add(key);
      } else {
        // Item in local but not in backend, and not pending add.
        // This means it was removed on another device, or our add failed silently?
        // Or maybe we just removed it locally and are waiting for sync?
        // Ideally we should remove it.
      }
    }

    // Second pass: Add items from backend that weren't in local
    backendItemsMap.forEach((key, backendItem) {
      if (!processedKeys.contains(key)) {
        try {
          if (backendItem['product'] != null) {
            newItems.add(CartItem(
              id: backendItem['id'],
              product: Product.fromJson(backendItem['product']),
              quantity: backendItem['quantity'],
            ));
          } else if (backendItem['combo'] != null) {
             newItems.add(CartItem(
              id: backendItem['id'],
              combo: Combo.fromJson(backendItem['combo']),
              quantity: backendItem['quantity'],
            ));
          }
        } catch (e) {
          print('DEBUG: Failed to parse new cart item from backend: $e');
        }
      }
    });

    _items.clear();
    _items.addAll(newItems);
    notifyListeners();
  }

  Future<void> addProduct(Product product, {int quantity = 1, int? branchId, String? token}) async {
    final key = 'p_${product.id}';
    _pendingAdds[key] = DateTime.now().millisecondsSinceEpoch;

    // Optimistic update
    final existingIndex = _items.indexWhere(
      (i) => i.product?.id == product.id && i.combo == null,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }
    notifyListeners();

    // Sync with backend
    if (branchId != null && token != null) {
      try {
        final apiService = ApiService();
        final updatedCart = await apiService.addToCart(branchId, product.id, null, quantity, token);
        
        // Operation complete
        _pendingAdds.remove(key);
        
        // Check if item still exists locally (user might have removed it while we were waiting)
        final currentItemIndex = _items.indexWhere((i) => i.product?.id == product.id);
        if (currentItemIndex == -1) {
          // User removed item while we were adding. We should remove it from backend too.
          // Find the item ID from the updated cart
          final addedItem = _findItemInCartData(updatedCart, productId: product.id);
          if (addedItem != null && addedItem['id'] != null) {
             await removeItem(currentItemIndex, token: token, forceId: addedItem['id']);
          }
        } else {
           // Update with backend data (to get ID)
           _updateLocalCartFromBackend(updatedCart);
           
           // Check if quantity matches (user might have updated quantity while waiting)
           // If local quantity is different from what we just sent, we need to sync again
           // But for now, _updateLocalCartFromBackend handles the merge
        }
      } catch (e) {
        print('Failed to sync cart with backend: $e');
        _pendingAdds.remove(key);
        // Revert optimistic update if needed?
      }
    }
  }

  Future<void> addCombo(Combo combo, {int quantity = 1, int? branchId, String? token}) async {
    final key = 'c_${combo.id}';
    _pendingAdds[key] = DateTime.now().millisecondsSinceEpoch;

    // Add to local cart first for immediate UI update
    final existingIndex = _items.indexWhere(
      (i) => i.combo?.id == combo.id && i.product == null,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(combo: combo, quantity: quantity));
    }
    notifyListeners();

    // Sync with backend
    if (branchId != null && token != null) {
      try {
        final apiService = ApiService();
        final updatedCart = await apiService.addToCart(branchId, null, combo.id, quantity, token);
        
        _pendingAdds.remove(key);
        
        // Check if item still exists locally
        final currentItemIndex = _items.indexWhere((i) => i.combo?.id == combo.id);
        if (currentItemIndex == -1) {
           final addedItem = _findItemInCartData(updatedCart, comboId: combo.id);
           if (addedItem != null && addedItem['id'] != null) {
             await removeItem(currentItemIndex, token: token, forceId: addedItem['id']);
           }
        } else {
          _updateLocalCartFromBackend(updatedCart);
        }
      } catch (e) {
        print('Failed to sync cart with backend: $e');
        _pendingAdds.remove(key);
      }
    }
  }
  
  dynamic _findItemInCartData(Map<String, dynamic> cartData, {int? productId, int? comboId}) {
    if (cartData['cartItem'] == null) return null;
    for (var item in cartData['cartItem']) {
      if (productId != null && item['product'] != null && item['product']['id'] == productId) {
        return item;
      }
      if (comboId != null && item['combo'] != null && item['combo']['id'] == comboId) {
        return item;
      }
    }
    return null;
  }

  Future<void> removeItem(int index, {String? token, int? forceId}) async {
    int? itemIdToRemove;
    
    if (forceId != null) {
      itemIdToRemove = forceId;
    } else if (index >= 0 && index < _items.length) {
      itemIdToRemove = _items[index].id;
      // Optimistically remove from local
      _items.removeAt(index);
      notifyListeners();
    }

    if (token != null && itemIdToRemove != null) {
      try {
        final apiService = ApiService();
        final updatedCart = await apiService.removeCartItem(itemIdToRemove, token);
         _updateLocalCartFromBackend(updatedCart);
      } catch (e) {
        print('Failed to remove item from backend: $e');
        // If failed, maybe reload cart to restore state?
        // loadCart(branchId, token); // We don't have branchId here easily
      }
    }
  }

  Future<void> updateQuantity(int index, int quantity, {String? token}) async {
    if (quantity <= 0) {
      removeItem(index, token: token);
      return;
    }

    if (index >= 0 && index < _items.length) {
      final item = _items[index];
      // Optimistic update
      item.quantity = quantity;
      notifyListeners();

      if (token != null && item.id != null) {
        try {
          final apiService = ApiService();
          final updatedCart = await apiService.updateCartItem(item.id!, quantity, token);
          _updateLocalCartFromBackend(updatedCart);
        } catch (e) {
          print('Failed to update quantity on backend: $e');
        }
      }
    }
  }

  void clear() {
    _items.clear();
    _pendingAdds.clear();
    notifyListeners();
  }

  void addOrder(Order order) {
    _orders.insert(0, order);
    notifyListeners();
  }

  void clearOrders() {
    _orders.clear();
    notifyListeners();
  }
}
