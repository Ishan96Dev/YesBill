import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_profile.freezed.dart';
part 'user_profile.g.dart';

/// Maps the `user_profiles` Supabase table.
@freezed
class UserProfile with _$UserProfile {
  const factory UserProfile({
    required String id,
    @JsonKey(name: 'full_name') String? fullName,
    @JsonKey(name: 'display_name') String? displayName,
    @JsonKey(name: 'avatar_url') String? avatarUrl,
    @JsonKey(name: 'cover_image_url') String? coverImageUrl,
    @Default('UTC') String timezone,
    @Default('INR') String currency,
    @JsonKey(name: 'country_code') String? countryCode,
    String? country,
    String? location,
    String? website,
    String? language,
    String? phone,
    String? company,
    String? bio,
    @Default('light') String theme,
    @JsonKey(name: 'notifications_enabled') @Default(true) bool notificationsEnabled,
    @JsonKey(name: 'onboarding_completed') @Default(false) bool onboardingCompleted,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
    @JsonKey(name: 'currency_code') String? currencyCode,
    @JsonKey(name: 'email_notifications') @Default(true) bool emailNotifications,
    @JsonKey(name: 'notification_prefs') Map<String, dynamic>? notificationPrefs,
    @JsonKey(name: 'onboarding_skipped_steps') Map<String, dynamic>? onboardingSkippedSteps,
    @JsonKey(name: 'ai_config_reminder_shown') bool? aiConfigReminderShown,
  }) = _UserProfile;

  factory UserProfile.fromJson(Map<String, dynamic> json) =>
      _$UserProfileFromJson(json);
}
