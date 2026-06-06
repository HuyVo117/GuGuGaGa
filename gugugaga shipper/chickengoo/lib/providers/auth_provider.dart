import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../models/branch.dart';

import '../services/api_service.dart';

import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../services/firebase_auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  String? _token;
  Branch? _selectedBranch;
  bool _isAuthenticated = false;
  final ApiService _apiService = ApiService();
  final FirebaseAuthService _firebaseAuthService = FirebaseAuthService();
  
  String? _verificationId;

  User? get user => _user;
  String? get token => _token;
  Branch? get selectedBranch => _selectedBranch;
  bool get isAuthenticated => _isAuthenticated;

  Future<void> login(String phone, String password) async {
    try {
      final data = await _apiService.login(phone, password);
      _user = User.fromJson(data['user']);
      _token = data['token'];
      _isAuthenticated = true;
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  // Verify phone number for registration or password reset
  Future<void> verifyPhone(String phone, Function(String) onCodeSent, Function(String) onError) async {
    try {
      // Format phone number to E.164 format if needed (e.g., +84)
      // Assuming input is like 0912345678, convert to +84912345678
      String formattedPhone = phone;
      if (phone.startsWith('0')) {
        formattedPhone = '+84${phone.substring(1)}';
      }
      
      await _firebaseAuthService.verifyPhoneNumber(
        phoneNumber: formattedPhone,
        onCodeSent: (verificationId, resendToken) {
          _verificationId = verificationId;
          onCodeSent(verificationId);
        },
        onVerificationFailed: (e) {
          onError(e.message ?? 'Verification failed');
        },
        onVerificationCompleted: (credential) async {
          // Auto-resolution (Android only usually)
          // We can handle this if we want auto-sign-in
        },
        onCodeAutoRetrievalTimeout: (verificationId) {
          _verificationId = verificationId;
        },
      );
    
    } catch (e) {
      String errorMessage = e.toString();
      if (e is firebase_auth.FirebaseAuthException) {
        if (e.code == 'billing-not-enabled') {
          errorMessage = 'Dự án chưa kích hoạt thanh toán. Vui lòng sử dụng số điện thoại thử nghiệm (Test Number) trong Firebase Console.';
        } else if (e.message != null && e.message!.contains('BILLING_NOT_ENABLED')) {
           errorMessage = 'Dự án chưa kích hoạt thanh toán. Vui lòng sử dụng số điện thoại thử nghiệm (Test Number) trong Firebase Console.';
        }
      }
      onError(errorMessage);
    }
  }

  // Verify OTP and proceed
  Future<void> verifyOTP(String smsCode) async {
    if (_verificationId == null) {
      throw Exception('Verification ID is null');
    }
    
    try {
      final credential = _firebaseAuthService.getCredential(_verificationId!, smsCode);
      await _firebaseAuthService.signInWithCredential(credential);
      // If successful, Firebase user is signed in.
      // We can now proceed with backend registration or password reset.
    } catch (e) {
      rethrow;
    }
  }

  Future<void> register(String name, String phone, String email, String password) async {
    try {
      // Ensure Firebase user is signed in (verified)
      if (_firebaseAuthService.currentUser == null) {
        throw Exception('Phone number not verified');
      }
      
      final data = await _apiService.register(name, phone, email, password);
      _user = User.fromJson(data['user']);
      _token = data['token'];
      _isAuthenticated = true;
      
      // Sign out from Firebase as we use our own backend auth
      await _firebaseAuthService.signOut();
      
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> resetPassword(String phone, String newPassword) async {
    try {
      // Ensure Firebase user is signed in (verified)
      if (_firebaseAuthService.currentUser == null) {
        throw Exception('Phone number not verified');
      }

      // Get Firebase ID Token (force refresh)
      final token = await _firebaseAuthService.currentUser!.getIdToken(true);
      if (token == null) {
        throw Exception('Failed to get verification token');
      }

      // Ensure phone number is in E.164 format (same as Firebase)
      String formattedPhone = phone;
      if (phone.startsWith('0')) {
        formattedPhone = '+84${phone.substring(1)}';
      }

      await _apiService.resetPassword(formattedPhone, newPassword, token: token);
      
      // Sign out from Firebase
      await _firebaseAuthService.signOut();
    } catch (e) {
      rethrow;
    }
  }

  void logout() {
    _user = null;
    _token = null;
    _selectedBranch = null;
    _isAuthenticated = false;
    _firebaseAuthService.signOut();
    notifyListeners();
  }

  Future<void> selectBranch(Branch branch) async {
    print('DEBUG: AuthProvider.selectBranch called for branch: ${branch.name}');
    _selectedBranch = branch;
    notifyListeners();
    print('DEBUG: AuthProvider.selectBranch - notifyListeners called');
    
    // Create cart for this branch if user is authenticated
    if (_isAuthenticated && _token != null) {
      print('DEBUG: AuthProvider.selectBranch - User is authenticated, creating cart...');
      try {
        await _apiService.createCart(branch.id, _token!);
        print('DEBUG: AuthProvider.selectBranch - Cart created successfully');
      } catch (e) {
        // Cart might already exist, that's okay
        print('DEBUG: AuthProvider.selectBranch - Cart creation failed (might already exist): ${e.toString()}');
      }
    } else {
      print('DEBUG: AuthProvider.selectBranch - User NOT authenticated or token null');
    }
  }

  void clearBranch() {
    _selectedBranch = null;
    notifyListeners();
  }

  void updateUser(User user) {
    _user = user;
    notifyListeners();
  }
}

