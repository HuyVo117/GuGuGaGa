import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
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

  AuthProvider({String? initialUserDataStr, String? initialBranchStr}) {
    if (initialUserDataStr != null) {
      try {
        final extractedUserData = json.decode(initialUserDataStr) as Map<String, dynamic>;
        _token = extractedUserData['token'];
        _user = User.fromJson(extractedUserData['user']);
        _isAuthenticated = true;
      } catch (e) {
        print('DEBUG: AuthProvider init error: $e');
      }
    }
    if (initialBranchStr != null) {
      try {
        final extractedBranchData = json.decode(initialBranchStr) as Map<String, dynamic>;
        _selectedBranch = Branch.fromJson(extractedBranchData);
      } catch (e) {
        print('DEBUG: AuthProvider branch init error: $e');
      }
    }
  }

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

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userData', json.encode(data));

      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> loginWithGoogle() async {
    try {
      // Dùng Firebase Auth signInWithPopup trực tiếp (hoạt động tốt trên web)
      final googleProvider = firebase_auth.GoogleAuthProvider();
      googleProvider.addScope('email');

      final userCredential = await firebase_auth.FirebaseAuth.instance.signInWithPopup(googleProvider);
      final firebaseIdToken = await userCredential.user!.getIdToken();

      // Gửi ID Token lên Backend để nhận JWT
      final data = await _apiService.googleSignIn(firebaseIdToken!);
      _user = User.fromJson(data['user']);
      _token = data['token'];
      _isAuthenticated = true;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userData', json.encode(data));

      // Đăng xuất Firebase (dùng JWT của backend)
      await firebase_auth.FirebaseAuth.instance.signOut();

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
      final data = await _apiService.register(name, phone, email, password);
      _user = User.fromJson(data['user']);
      _token = data['token'];
      _isAuthenticated = true;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userData', json.encode(data));

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

  void logout() async {
    _user = null;
    _token = null;
    _selectedBranch = null;
    _isAuthenticated = false;
    await _firebaseAuthService.signOut();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('userData');
      await prefs.remove('selectedBranch');
    } catch (e) {
      print('DEBUG: AuthProvider.logout - Error removing preferences: $e');
    }
    notifyListeners();
  }

  Future<void> selectBranch(Branch branch) async {
    print('DEBUG: AuthProvider.selectBranch called for branch: ${branch.name}');
    _selectedBranch = branch;
    notifyListeners();
    print('DEBUG: AuthProvider.selectBranch - notifyListeners called');

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('selectedBranch', json.encode({
        'id': branch.id,
        'name': branch.name,
        'phone': branch.phone,
        'address': branch.address,
        'latitude': branch.latitude,
        'longitude': branch.longitude,
        'createdAt': branch.createdAt.toIso8601String(),
        'updatedAt': branch.updatedAt.toIso8601String(),
      }));
    } catch (e) {
      print('DEBUG: AuthProvider.selectBranch - Error saving branch: $e');
    }
    
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

  void clearBranch() async {
    _selectedBranch = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('selectedBranch');
    } catch (e) {
      print('DEBUG: AuthProvider.clearBranch - Error clearing branch: $e');
    }
    notifyListeners();
  }

  Future<bool> tryAutoLogin() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!prefs.containsKey('userData')) {
        return false;
      }
      final extractedUserData = json.decode(prefs.getString('userData')!) as Map<String, dynamic>;
      _token = extractedUserData['token'];
      _user = User.fromJson(extractedUserData['user']);
      _isAuthenticated = true;

      if (prefs.containsKey('selectedBranch')) {
        final extractedBranchData = json.decode(prefs.getString('selectedBranch')!) as Map<String, dynamic>;
        _selectedBranch = Branch.fromJson(extractedBranchData);
      }
      notifyListeners();
      return true;
    } catch (e) {
      print('DEBUG: Error in tryAutoLogin: $e');
      return false;
    }
  }

  void updateUser(User user) {
    _user = user;
    notifyListeners();
  }

  Future<void> updateProfile({
    required String name,
    required String email,
    required String address,
  }) async {
    try {
      if (_token == null) return;
      final updatedUserData = await _apiService.updateProfile(
        name: name,
        email: email,
        address: address,
        token: _token!,
      );
      _user = User.fromJson(updatedUserData);
      
      // Update SharedPreferences so user data persists
      final prefs = await SharedPreferences.getInstance();
      final userDataStr = prefs.getString('userData');
      if (userDataStr != null) {
        final userData = json.decode(userDataStr) as Map<String, dynamic>;
        userData['user'] = updatedUserData;
        await prefs.setString('userData', json.encode(userData));
      }
      
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
}

