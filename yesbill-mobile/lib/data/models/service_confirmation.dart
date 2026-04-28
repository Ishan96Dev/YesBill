import 'package:freezed_annotation/freezed_annotation.dart';

part 'service_confirmation.freezed.dart';
part 'service_confirmation.g.dart';

/// Maps the `service_confirmations` Supabase table.
@freezed
class ServiceConfirmation with _$ServiceConfirmation {
  const factory ServiceConfirmation({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'service_id') required String serviceId,
    required String date,
    @Default('pending') String status,
    @JsonKey(name: 'custom_amount') double? customAmount,
    String? notes,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _ServiceConfirmation;

  factory ServiceConfirmation.fromJson(Map<String, dynamic> json) =>
      _$ServiceConfirmationFromJson(json);
}

/// Confirmation status helpers
extension ConfirmationStatus on ServiceConfirmation {
  bool get isDelivered => status == 'delivered';
  bool get isSkipped => status == 'skipped';
  bool get isPending => status == 'pending';
}

class ConfirmationStatuses {
  static const delivered = 'delivered';
  static const skipped = 'skipped';
  static const pending = 'pending';
}
