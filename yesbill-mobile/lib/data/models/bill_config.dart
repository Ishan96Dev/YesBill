import 'package:freezed_annotation/freezed_annotation.dart';

part 'bill_config.freezed.dart';
part 'bill_config.g.dart';

@freezed
class BillConfig with _$BillConfig {
  const factory BillConfig({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'daily_amount') required double dailyAmount,
    @Default('INR') String currency,
    @JsonKey(name: 'start_date') required DateTime startDate,
    @Default(true) bool active,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _BillConfig;

  factory BillConfig.fromJson(Map<String, dynamic> json) =>
      _$BillConfigFromJson(json);
}
