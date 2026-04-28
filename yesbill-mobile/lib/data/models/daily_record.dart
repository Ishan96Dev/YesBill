import 'package:freezed_annotation/freezed_annotation.dart';

part 'daily_record.freezed.dart';
part 'daily_record.g.dart';

@freezed
class DailyRecord with _$DailyRecord {
  const factory DailyRecord({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'bill_config_id') required String billConfigId,
    required DateTime date,
    required String status,
    required double amount,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _DailyRecord;

  factory DailyRecord.fromJson(Map<String, dynamic> json) =>
      _$DailyRecordFromJson(json);
}
