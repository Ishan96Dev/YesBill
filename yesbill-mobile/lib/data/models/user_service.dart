import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_service.freezed.dart';
part 'user_service.g.dart';

/// Maps the `user_services` Supabase table.
@freezed
class UserService with _$UserService {
  const factory UserService({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    required String name,
    @Default('daily') String type,
    required double price,
    @Default('morning') String schedule,
    @JsonKey(name: 'icon') @Default('package') String iconName,
    @JsonKey(name: 'delivery_type') @Default('home_delivery') String deliveryType,
    @JsonKey(name: 'service_role') @Default('consumer') String serviceRole,
    @JsonKey(name: 'billing_day') @Default(1) int billingDay,
    @JsonKey(name: 'billing_month') int? billingMonth,
    @JsonKey(name: 'auto_generate_bill') @Default(true) bool autoGenerateBill,
    @Default(true) bool active,
    @JsonKey(name: 'client_name') String? clientName,
    @JsonKey(name: 'client_phone') String? clientPhone,
    @JsonKey(name: 'client_email') String? clientEmail,
    @JsonKey(name: 'client_address') String? clientAddress,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'end_date') String? endDate,
    String? notes,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _UserService;

  factory UserService.fromJson(Map<String, dynamic> json) =>
      _$UserServiceFromJson(json);
}

/// Service type helpers
extension UserServiceType on UserService {
  bool get isDaily => type == 'daily';
  bool get isWeekly => type == 'weekly';
  bool get isMonthly => type == 'monthly';
  bool get isYearly => type == 'yearly';
  bool get isConsumer => serviceRole == 'consumer';
  bool get isProvider => serviceRole == 'provider';

  String get deliveryTypeLabel {
    switch (deliveryType) {
      case 'home_delivery': return 'Home Delivery';
      case 'utility': return 'Utility';
      case 'visit_based': return 'Visit Based';
      case 'subscription': return 'Subscription';
      case 'payment': return 'Payment';
      default: return deliveryType;
    }
  }

  String get deliveredLabel =>
      deliveryType == 'visit_based' ? 'Visited' : 'Delivered';

  String get skippedLabel =>
      deliveryType == 'visit_based' ? 'Missed' : 'Skipped';
}
