import 'branch.dart';
import 'product.dart';
import 'combo.dart';
import 'driver.dart';

enum OrderStatus {
  pending,
  accepted,
  driverAssigned,
  shipping,
  completed,
  cancelled,
}

enum PaymentMethod {
  cash,
  banking,
  momo,
  vnpay,
}

class Order {
  final int id;
  final int userId;
  final int branchId;
  final int totalAmount;
  final OrderStatus status;
  final String deliveryAddress;
  final String deliveryPhone;
  final PaymentMethod paymentMethod;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double? latitude;
  final double? longitude;
  final List<OrderItem> items;
  final Branch? branch;
  final Driver? driver;

  Order({
    required this.id,
    required this.userId,
    required this.branchId,
    required this.totalAmount,
    required this.status,
    required this.deliveryAddress,
    required this.deliveryPhone,
    required this.paymentMethod,
    required this.createdAt,
    required this.updatedAt,
    this.latitude,
    this.longitude,
    required this.items,
    this.branch,
    this.driver,
  });

  String get statusText {
    switch (status) {
      case OrderStatus.pending:
        return 'Chờ xác nhận';
      case OrderStatus.accepted:
        return 'Đã chấp nhận';
      case OrderStatus.driverAssigned:
        return 'Tài xế đã nhận';
      case OrderStatus.shipping:
        return 'Đang giao hàng';
      case OrderStatus.completed:
        return 'Đã giao';
      case OrderStatus.cancelled:
        return 'Đã hủy';
    }
  }

  String get paymentMethodText {
    switch (paymentMethod) {
      case PaymentMethod.cash:
        return 'Tiền mặt';
      case PaymentMethod.banking:
        return 'Chuyển khoản';
      case PaymentMethod.momo:
        return 'Momo';
      case PaymentMethod.vnpay:
        return 'VNPay';
    }
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    // Map backend status to frontend enum
    OrderStatus mapStatus(String backendStatus) {
      print('DEBUG: Mapping backend status: $backendStatus');
      switch (backendStatus.toUpperCase()) {
        case 'PENDING':
          return OrderStatus.pending;
        case 'ACCEPTED':
          return OrderStatus.accepted;
        case 'DRIVER_ASSIGNED':
          return OrderStatus.driverAssigned;
        case 'SHIPPING':
          return OrderStatus.shipping;
        case 'DELIVERED':
          return OrderStatus.completed;
        case 'CANCELLED':
          return OrderStatus.cancelled;
        default:
          print('DEBUG: Unknown status "$backendStatus", defaulting to PENDING');
          return OrderStatus.pending;
      }
    }

    // Map backend payment method to frontend enum
    PaymentMethod mapPaymentMethod(String backendMethod) {
      switch (backendMethod.toUpperCase()) {
        case 'COD':
          return PaymentMethod.cash;
        case 'MOMO':
          return PaymentMethod.momo;
        case 'BANKING':
          return PaymentMethod.banking;
        case 'VNPAY':
          return PaymentMethod.vnpay;
        default:
          return PaymentMethod.cash;
      }
    }

    return Order(
      id: json['id'],
      userId: json['userId'],
      branchId: json['branchId'],
      totalAmount: json['totalAmount'],
      status: mapStatus(json['status'] ?? 'PENDING'),
      deliveryAddress: json['deliveryAddress'] ?? '',
      deliveryPhone: json['deliveryPhone'] ?? '',
      paymentMethod: mapPaymentMethod(json['paymentMethod'] ?? 'COD'),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      items: (json['orderItem'] as List?)
              ?.map((e) => OrderItem.fromJson(e))
              .toList() ??
          [],
      branch: json['branch'] != null ? Branch.fromJson(json['branch']) : null,
      driver: json['driver'] != null ? Driver.fromJson(json['driver']) : null,
    );
  }
}

class OrderItem {
  final int id;
  final int orderId;
  final int? productId;
  final int? comboId;
  final int quantity;
  final int price;
  final Product? product;
  final Combo? combo;

  OrderItem({
    required this.id,
    required this.orderId,
    this.productId,
    this.comboId,
    required this.quantity,
    required this.price,
    this.product,
    this.combo,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      orderId: json['orderId'],
      productId: json['productId'],
      comboId: json['comboId'],
      quantity: json['quantity'],
      price: json['price'],
      product: json['product'] != null
          ? Product.fromJson(json['product'])
          : null,
      combo: json['combo'] != null ? Combo.fromJson(json['combo']) : null,
    );
  }
}
