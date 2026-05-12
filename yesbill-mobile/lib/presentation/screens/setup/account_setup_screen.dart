import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:image_picker/image_picker.dart';

import '../../../core/data/app_countries.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/ai_provider_info.dart';
import '../../../providers/ai_settings_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/notifications_provider.dart';
import '../../widgets/common/app_background_effects.dart';
import '../../widgets/auth_widgets.dart';

// ── Step indicators ───────────────────────────────────────────────────────────

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current});
  final int current; // 0-based

  static const _labels = ['Profile', 'AI Setup'];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(_labels.length * 2 - 1, (i) {
        if (i.isOdd) {
          // connector
          final done = (i ~/ 2) < current;
          return Expanded(
            child: Container(
              height: 2,
              color: done ? AppColors.primary : Colors.white.withAlpha(50),
            ),
          );
        }
        final step = i ~/ 2;
        final isDone = step < current;
        final isCurrent = step == current;
        return _StepDot(
          label: _labels[step],
          index: step + 1,
          isDone: isDone,
          isCurrent: isCurrent,
        );
      }),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({
    required this.label,
    required this.index,
    required this.isDone,
    required this.isCurrent,
  });

  final String label;
  final int index;
  final bool isDone;
  final bool isCurrent;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDone
                ? AppColors.primary
                : isCurrent
                    ? AppColors.primary
                    : Colors.white.withAlpha(30),
            border: Border.all(
              color: isDone || isCurrent
                  ? AppColors.primary
                  : Colors.white.withAlpha(80),
              width: 2,
            ),
          ),
          child: Center(
            child: isDone
                ? const Icon(LucideIcons.check, size: 16, color: Colors.white)
                : Text(
                    '$index',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isCurrent ? Colors.white : Colors.white54,
                    ),
                  ),
          ),
        ),
        const Gap(4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isDone || isCurrent ? Colors.white : Colors.white54,
          ),
        ),
      ],
    );
  }
}

// ── Country picker bottom sheet ───────────────────────────────────────────────

Future<AppCountry?> _showCountryPicker(BuildContext context) {
  return showModalBottomSheet<AppCountry>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _CountryPickerSheet(),
  );
}

class _CountryPickerSheet extends StatefulWidget {
  const _CountryPickerSheet();

  @override
  State<_CountryPickerSheet> createState() => _CountryPickerSheetState();
}

class _CountryPickerSheetState extends State<_CountryPickerSheet> {
  final _searchCtrl = TextEditingController();
  List<AppCountry> _filtered = kAppCountries;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _filter(String q) {
    setState(() {
      _filtered = q.isEmpty
          ? kAppCountries
          : kAppCountries
              .where((c) => c.name.toLowerCase().contains(q.toLowerCase()))
              .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      expand: false,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: AppColors.cardDark,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const Gap(8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Gap(16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Select Country',
                style: AppTextStyles.h3.copyWith(color: Colors.white),
              ),
            ),
            const Gap(12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchCtrl,
                onChanged: _filter,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search country…',
                  hintStyle: const TextStyle(color: Colors.white54),
                  prefixIcon:
                      const Icon(LucideIcons.search, color: Colors.white54, size: 18),
                  filled: true,
                  fillColor: Colors.white.withAlpha(15),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
            const Gap(8),
            Expanded(
              child: ListView.builder(
                controller: controller,
                itemCount: _filtered.length,
                itemBuilder: (_, i) {
                  final c = _filtered[i];
                  return InkWell(
                    onTap: () => Navigator.of(context).pop(c),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      child: Row(
                        children: [
                          Text(c.flag, style: const TextStyle(fontSize: 24)),
                          const Gap(12),
                          Expanded(
                            child: Text(
                              c.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          Text(
                            '${c.dialCode}  ${c.currency}',
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Profile step ──────────────────────────────────────────────────────────────

class _ProfileStep extends ConsumerStatefulWidget {
  const _ProfileStep({required this.onNext});
  final void Function(String displayName) onNext;

  @override
  ConsumerState<_ProfileStep> createState() => _ProfileStepState();
}

class _ProfileStepState extends ConsumerState<_ProfileStep> {
  final _displayNameCtrl = TextEditingController();
  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _websiteCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _languageCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();

  AppCountry? _country;
  bool _saving = false;
  String? _displayNameError;
  String? _fullNameError;
  String? _countryError;

  // Photo upload state
  String? _avatarUrl;
  String? _coverUrl;
  bool _uploadingAvatar = false;
  bool _uploadingCover = false;

  @override
  void dispose() {
    _displayNameCtrl.dispose();
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _companyCtrl.dispose();
    _websiteCtrl.dispose();
    _locationCtrl.dispose();
    _languageCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    bool ok = true;
    setState(() {
      _displayNameError = null;
      _fullNameError = null;
      _countryError = null;

      final dn = _displayNameCtrl.text.trim();
      if (dn.isEmpty) {
        _displayNameError = 'Display name is required';
        ok = false;
      } else if (dn.length < 2) {
        _displayNameError = 'At least 2 characters required';
        ok = false;
      }

      final fn = _fullNameCtrl.text.trim();
      if (fn.isEmpty) {
        _fullNameError = 'Full name is required';
        ok = false;
      } else if (fn.length < 2) {
        _fullNameError = 'At least 2 characters required';
        ok = false;
      }

      if (_country == null) {
        _countryError = 'Country is required';
        ok = false;
      }
    });
    return ok;
  }

  Future<void> _uploadAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1200,
    );
    if (picked == null || !mounted) return;

    setState(() => _uploadingAvatar = true);
    try {
      final bytes = await picked.readAsBytes();
      final repo = ref.read(profileRepositoryProvider);
      final fileName = 'avatar_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await repo.uploadAvatar(bytes, fileName);
      if (mounted) setState(() => _avatarUrl = url);
    } catch (_) {
      // Non-blocking — can retry in settings
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _uploadCover() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 2400,
    );
    if (picked == null || !mounted) return;

    setState(() => _uploadingCover = true);
    try {
      final bytes = await picked.readAsBytes();
      final repo = ref.read(profileRepositoryProvider);
      final fileName = 'cover_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await repo.uploadCoverImage(bytes, fileName);
      if (mounted) setState(() => _coverUrl = url);
    } catch (_) {
      // Non-blocking
    } finally {
      if (mounted) setState(() => _uploadingCover = false);
    }
  }

  Future<void> _next() async {
    if (!_validate()) return;
    setState(() => _saving = true);
    try {
      final c = _country!;
      await ref.read(profileRepositoryProvider).updateProfile({
        'display_name': _displayNameCtrl.text.trim(),
        'full_name': _fullNameCtrl.text.trim(),
        'country': c.name,
        'country_code': c.dialCode,
        'currency': c.currency,
        'currency_code': c.currencySymbol,
        'timezone': c.timezone,
        if (_phoneCtrl.text.trim().isNotEmpty) 'phone': _phoneCtrl.text.trim(),
        if (_companyCtrl.text.trim().isNotEmpty) 'company': _companyCtrl.text.trim(),
        if (_websiteCtrl.text.trim().isNotEmpty) 'website': _websiteCtrl.text.trim(),
        if (_locationCtrl.text.trim().isNotEmpty) 'location': _locationCtrl.text.trim(),
        if (_languageCtrl.text.trim().isNotEmpty) 'language': _languageCtrl.text.trim(),
        if (_bioCtrl.text.trim().isNotEmpty) 'bio': _bioCtrl.text.trim(),
      });
    } catch (_) {
      // Continue even if profile save fails — can be retried later
    } finally {
      if (mounted) setState(() => _saving = false);
    }
    widget.onNext(_displayNameCtrl.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final c = _country;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Text(
          'Set up your profile',
          style: AppTextStyles.h1.copyWith(color: Colors.white),
        ).animate().fadeIn().slideY(begin: 0.1),
        const Gap(6),
        Text(
          'Tell us a bit about yourself to personalize YesBill.',
          style: AppTextStyles.body.copyWith(color: Colors.white70),
        ).animate().fadeIn(delay: 60.ms).slideY(begin: 0.1),
        const Gap(24),

        // ── Cover & Avatar upload ──────────────────────────────────────────
        _OnboardCoverAndAvatar(
          coverUrl: _coverUrl,
          avatarUrl: _avatarUrl,
          uploadingAvatar: _uploadingAvatar,
          uploadingCover: _uploadingCover,
          onUploadAvatar: _uploadAvatar,
          onUploadCover: _uploadCover,
        ),
        const Gap(24),

        // Display name
        _FieldLabel(text: 'Display Name', required: true),
        const Gap(8),
        _InputField(
          controller: _displayNameCtrl,
          hint: 'e.g. Ishan',
          icon: LucideIcons.user,
          errorText: _displayNameError,
          onChanged: (_) => setState(() => _displayNameError = null),
        ),
        const Gap(16),

        // Full name
        _FieldLabel(text: 'Full Name', required: true),
        const Gap(8),
        _InputField(
          controller: _fullNameCtrl,
          hint: 'e.g. Ishan Chakraborty',
          icon: LucideIcons.userCheck,
          errorText: _fullNameError,
          onChanged: (_) => setState(() => _fullNameError = null),
        ),
        const Gap(16),

        // Country
        _FieldLabel(text: 'Country', required: true),
        const Gap(8),
        GestureDetector(
          onTap: () async {
            final picked = await _showCountryPicker(context);
            if (picked != null) {
              setState(() {
                _country = picked;
                _countryError = null;
              });
            }
          },
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _countryError != null
                    ? AppColors.error
                    : Colors.white.withAlpha(40),
              ),
            ),
            child: Row(
              children: [
                if (c != null) ...[
                  Text(c.flag, style: const TextStyle(fontSize: 20)),
                  const Gap(10),
                  Expanded(
                    child: Text(
                      c.name,
                      style:
                          const TextStyle(color: Colors.white, fontSize: 15),
                    ),
                  ),
                  Text(
                    c.dialCode,
                    style: const TextStyle(
                        color: Colors.white54, fontSize: 13),
                  ),
                ] else ...[
                  const Icon(LucideIcons.mapPin,
                      color: Colors.white54, size: 18),
                  const Gap(10),
                  const Expanded(
                    child: Text(
                      'Select your country',
                      style:
                          TextStyle(color: Colors.white54, fontSize: 15),
                    ),
                  ),
                ],
                const Icon(LucideIcons.chevronsUpDown,
                    color: Colors.white38, size: 16),
              ],
            ),
          ),
        ),
        if (_countryError != null) ...[
          const Gap(6),
          Text(
            _countryError!,
            style: const TextStyle(color: AppColors.error, fontSize: 12),
          ),
        ],

        // Currency + Timezone (auto-filled from country)
        if (c != null) ...[
          const Gap(12),
          Row(
            children: [
              Expanded(
                child: _ReadOnlyChip(
                  icon: LucideIcons.wallet,
                  label: '${c.currencySymbol}  ${c.currency}',
                ),
              ),
              const Gap(8),
              Expanded(
                child: _ReadOnlyChip(
                  icon: LucideIcons.clock,
                  label: c.timezone.split('/').last.replaceAll('_', ' '),
                ),
              ),
            ],
          ),
        ],
        const Gap(16),

        // Phone (optional)
        _FieldLabel(text: 'Phone Number', optional: true),
        const Gap(8),
        _InputField(
          controller: _phoneCtrl,
          hint: 'e.g. 9876543210',
          icon: LucideIcons.phone,
          keyboardType: TextInputType.phone,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        ),
        const Gap(16),

        // Company (optional)
        _FieldLabel(text: 'Company', optional: true),
        const Gap(8),
        _InputField(
          controller: _companyCtrl,
          hint: 'e.g. Acme Corp',
          icon: LucideIcons.briefcase,
        ),
        const Gap(16),

        // Website (optional)
        _FieldLabel(text: 'Website', optional: true),
        const Gap(8),
        _InputField(
          controller: _websiteCtrl,
          hint: 'e.g. https://example.com',
          icon: LucideIcons.link,
          keyboardType: TextInputType.url,
        ),
        const Gap(16),

        // Location (optional)
        _FieldLabel(text: 'Location', optional: true),
        const Gap(8),
        _InputField(
          controller: _locationCtrl,
          hint: 'e.g. Mumbai, India',
          icon: LucideIcons.mapPin,
        ),
        const Gap(16),

        // Language (optional)
        _FieldLabel(text: 'Language', optional: true),
        const Gap(8),
        _InputField(
          controller: _languageCtrl,
          hint: 'e.g. English',
          icon: LucideIcons.languages,
        ),
        const Gap(16),

        // Bio (optional)
        _FieldLabel(text: 'Bio', optional: true),
        const Gap(8),
        _TextAreaField(
          controller: _bioCtrl,
          hint: 'Tell us a bit about yourself… (max 500 chars)',
          maxLength: 500,
        ),
        const Gap(32),

        // Next button
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _saving ? null : _next,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Next — AI Setup',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      Gap(8),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
          ),
        ),
        const Gap(16),
        Center(
          child: Text(
            'You can update all of this later in Settings.',
            style: AppTextStyles.caption.copyWith(color: Colors.white38),
          ),
        ),
      ],
    );
  }
}

// ── Onboarding Cover & Avatar widget (dark-theme styled) ─────────────────────

class _OnboardCoverAndAvatar extends StatelessWidget {
  const _OnboardCoverAndAvatar({
    required this.coverUrl,
    required this.avatarUrl,
    required this.uploadingAvatar,
    required this.uploadingCover,
    required this.onUploadAvatar,
    required this.onUploadCover,
  });

  final String? coverUrl;
  final String? avatarUrl;
  final bool uploadingAvatar;
  final bool uploadingCover;
  final VoidCallback onUploadAvatar;
  final VoidCallback onUploadCover;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(30)),
      ),
      child: Column(
        children: [
          // Cover photo
          GestureDetector(
            onTap: uploadingCover ? null : onUploadCover,
            child: Stack(
              children: [
                Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    image: coverUrl != null && coverUrl!.isNotEmpty
                        ? DecorationImage(
                            image: NetworkImage(coverUrl!),
                            fit: BoxFit.cover,
                          )
                        : null,
                    gradient: coverUrl == null || coverUrl!.isEmpty
                        ? const LinearGradient(
                            colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                  ),
                  child: coverUrl == null || coverUrl!.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                uploadingCover
                                    ? LucideIcons.loader
                                    : LucideIcons.imagePlus,
                                color: Colors.white54,
                                size: 28,
                              ),
                              const Gap(6),
                              Text(
                                uploadingCover
                                    ? 'Uploading…'
                                    : 'Tap to add cover photo',
                                style: const TextStyle(
                                  color: Colors.white54,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        )
                      : null,
                ),
                if (coverUrl != null && coverUrl!.isNotEmpty)
                  Positioned(
                    right: 10,
                    bottom: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.camera,
                              size: 12, color: Colors.white),
                          Gap(4),
                          Text(
                            'Change',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Avatar + upload buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // Avatar circle
                GestureDetector(
                  onTap: uploadingAvatar ? null : onUploadAvatar,
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 34,
                        backgroundColor: AppColors.primary.withOpacity(0.3),
                        backgroundImage:
                            avatarUrl != null && avatarUrl!.isNotEmpty
                                ? NetworkImage(avatarUrl!)
                                : null,
                        child: avatarUrl == null || avatarUrl!.isEmpty
                            ? uploadingAvatar
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white),
                                  )
                                : const Icon(LucideIcons.user,
                                    color: Colors.white, size: 26)
                            : null,
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: AppColors.surfaceDark, width: 2),
                          ),
                          child: const Icon(LucideIcons.camera,
                              size: 11, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
                const Gap(14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Profile Photo',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Gap(2),
                      Text(
                        avatarUrl != null && avatarUrl!.isNotEmpty
                            ? 'Tap the circle to change'
                            : 'Tap the circle to add a photo',
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 11),
                      ),
                      const Gap(8),
                      Row(
                        children: [
                          _SmallUploadBtn(
                            label: coverUrl == null || coverUrl!.isEmpty
                                ? 'Add Cover'
                                : 'Change Cover',
                            icon: LucideIcons.imagePlus,
                            loading: uploadingCover,
                            onTap: onUploadCover,
                          ),
                          const Gap(8),
                          _SmallUploadBtn(
                            label: avatarUrl == null || avatarUrl!.isEmpty
                                ? 'Add Avatar'
                                : 'Change Avatar',
                            icon: LucideIcons.camera,
                            loading: uploadingAvatar,
                            onTap: onUploadAvatar,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallUploadBtn extends StatelessWidget {
  const _SmallUploadBtn({
    required this.label,
    required this.icon,
    required this.loading,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primary.withAlpha(30),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.primary.withAlpha(80)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            loading
                ? const SizedBox(
                    width: 12,
                    height: 12,
                    child:
                        CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                  )
                : Icon(icon, size: 12, color: AppColors.primaryLight),
            const Gap(4),
            Text(
              label,
              style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontSize: 11,
                  fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}


// ── AI setup step ─────────────────────────────────────────────────────────────

String? _aiProviderLocalAsset(String providerId) {
  return switch (providerId) {
    'openai' => 'assets/images/openai.png',
    'anthropic' => 'assets/images/anthropic.png',
    'google' => 'assets/images/google-ai.png',
    'ollama' => 'assets/images/ollama.png',
    _ => null,
  };
}

class _AiStep extends ConsumerStatefulWidget {
  const _AiStep({required this.userName, required this.onComplete});
  final String userName;
  final Future<void> Function({required bool skippedAi}) onComplete;

  @override
  ConsumerState<_AiStep> createState() => _AiStepState();
}

class _AiStepState extends ConsumerState<_AiStep> {
  String _selectedProviderId = 'openai';
  final _apiKeyCtrl = TextEditingController();
  final _ollamaUrlCtrl =
      TextEditingController(text: 'http://localhost:11434');
  bool _obscureKey = true;
  String? _selectedModel;
  bool _saving = false;
  bool _showSkipWarning = false;
  bool _aiInsightsEnabled = true;
  // 'idle' | 'checking' | 'valid' | 'invalid'
  String _keyStatus = 'idle';

  @override
  void dispose() {
    _apiKeyCtrl.dispose();
    _ollamaUrlCtrl.dispose();
    super.dispose();
  }

  List<AiProviderModelInfo> _models(List<AiProviderInfo> providers) {
    final p = providers.firstWhere(
      (p) => p.id == _selectedProviderId,
      orElse: () => providers.isEmpty
          ? const AiProviderInfo(
              id: '',
              name: '',
              description: '',
              logoUrl: '',
              docsUrl: '',
              keyPrefix: 'sk-',
              requiresKey: true,
              models: [],
            )
          : providers.first,
    );
    return p.models.where((m) => !m.isDeprecated).toList();
  }

  Future<void> _save(List<AiProviderInfo> providers) async {
    final key = _apiKeyCtrl.text.trim();
    final isOllama = _selectedProviderId == 'ollama';
    if (!isOllama && key.isEmpty) return;

    setState(() => _saving = true);
    try {
      await ref.read(aiSettingsMutationProvider.notifier).save(
            provider: _selectedProviderId,
            apiKey: isOllama ? '' : key,
            selectedModel: _selectedModel,
            ollamaBaseUrl:
                isOllama ? _ollamaUrlCtrl.text.trim() : null,
          );
      await widget.onComplete(skippedAi: false);
    } catch (_) {
      await widget.onComplete(skippedAi: false);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _validateKey() async {
    final key = _apiKeyCtrl.text.trim();
    if (key.isEmpty) return;
    setState(() => _keyStatus = 'checking');
    try {
      final valid = await ref
          .read(aiSettingsMutationProvider.notifier)
          .validateKey(provider: _selectedProviderId, apiKey: key);
      if (mounted) setState(() => _keyStatus = valid ? 'valid' : 'invalid');
    } catch (_) {
      if (mounted) setState(() => _keyStatus = 'invalid');
    }
  }

  String _providerLabel(String id) {
    switch (id) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'google':
        return 'Google';
      case 'ollama':
        return 'Ollama';
      default:
        return id;
    }
  }

  IconData _providerIcon(String id) {
    switch (id) {
      case 'openai':
        return LucideIcons.brain;
      case 'anthropic':
        return LucideIcons.sparkles;
      case 'google':
        return LucideIcons.globe;
      case 'ollama':
        return LucideIcons.cpu;
      default:
        return LucideIcons.bot;
    }
  }

  Color _providerColor(String id) {
    switch (id) {
      case 'openai':
        return const Color(0xFF10a37f);
      case 'anthropic':
        return const Color(0xFFD97757);
      case 'google':
        return const Color(0xFF4285F4);
      case 'ollama':
        return const Color(0xFF6366F1);
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final providersAsync = ref.watch(aiProviderCatalogProvider);
    final providers = providersAsync.valueOrNull ?? const [];

    // Sync selected model when provider changes
    final models = _models(providers);
    if (_selectedModel == null && models.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final rec = models.firstWhere(
          (m) => m.recommended,
          orElse: () => models.first,
        );
        setState(() => _selectedModel = rec.id);
      });
    }

    final isOllama = _selectedProviderId == 'ollama';
    final canSave = isOllama
        ? _ollamaUrlCtrl.text.trim().isNotEmpty
        : _apiKeyCtrl.text.trim().isNotEmpty;

    // Provider display list: from catalog or fallback to hardcoded IDs
    final providerIds = providers.isNotEmpty
        ? providers.map((p) => p.id).toList()
        : ['openai', 'anthropic', 'google', 'ollama'];

    final selectedProviderInfo = providers.firstWhere(
      (p) => p.id == _selectedProviderId,
      orElse: () => AiProviderInfo(
        id: _selectedProviderId,
        name: _providerLabel(_selectedProviderId),
        description: '',
        logoUrl: '',
        docsUrl: '',
        keyPrefix: 'sk-',
        requiresKey: _selectedProviderId != 'ollama',
        models: const [],
      ),
    );

    return Stack(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Configure AI',
              style: AppTextStyles.h1.copyWith(color: Colors.white),
            ).animate().fadeIn().slideY(begin: 0.1),
            const Gap(6),
            Text(
              'Connect an AI provider to enable bill generation, chat & insights.',
              style: AppTextStyles.body.copyWith(color: Colors.white70),
            ).animate().fadeIn(delay: 60.ms).slideY(begin: 0.1),
            const Gap(24),

            // Provider cards
            Text(
              'CHOOSE PROVIDER',
              style: AppTextStyles.labelSm.copyWith(
                  color: Colors.white54, letterSpacing: 1.2),
            ),
            const Gap(12),
            SizedBox(
              height: 96,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: providerIds.length,
                separatorBuilder: (_, __) => const Gap(10),
                itemBuilder: (_, i) {
                  final id = providerIds[i];
                  final isSelected = id == _selectedProviderId;
                  final color = _providerColor(id);
                  return GestureDetector(
                    onTap: () => setState(() {
                      _selectedProviderId = id;
                      _apiKeyCtrl.clear();
                      _selectedModel = null;
                      _keyStatus = 'idle';
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 90,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: isSelected
                            ? color.withAlpha(40)
                            : Colors.white.withAlpha(10),
                        border: Border.all(
                          color: isSelected ? color : Colors.white.withAlpha(30),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Builder(builder: (_) {
                            final asset = _aiProviderLocalAsset(id);
                            if (asset != null) {
                              return Container(
                                width: 36,
                                height: 36,
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withAlpha(isSelected ? 30 : 18),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Image.asset(asset, fit: BoxFit.contain),
                              );
                            }
                            return Icon(
                              _providerIcon(id),
                              size: 26,
                              color: isSelected ? color : Colors.white54,
                            );
                          }),
                          const Gap(6),
                          Text(
                            _providerLabel(id),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color:
                                  isSelected ? Colors.white : Colors.white54,
                            ),
                          ),
                          if (isSelected) ...[
                            const Gap(4),
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: color,
                              ),
                            ),
                          ]
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const Gap(24),

            // Provider info banner
            if (selectedProviderInfo.description.isNotEmpty)
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: Container(
                  key: ValueKey(_selectedProviderId),
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: _providerColor(_selectedProviderId).withAlpha(20),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: _providerColor(_selectedProviderId).withAlpha(60)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(18),
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: () {
                          final asset = _aiProviderLocalAsset(_selectedProviderId);
                          if (asset != null) {
                            return Image.asset(asset, fit: BoxFit.contain);
                          }
                          return Icon(_providerIcon(_selectedProviderId),
                              size: 16, color: Colors.white70);
                        }(),
                      ),
                      const Gap(10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              selectedProviderInfo.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Gap(3),
                            Text(
                              selectedProviderInfo.description,
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 12, height: 1.4),
                            ),
                            if (selectedProviderInfo.docsUrl.isNotEmpty) ...[
                              const Gap(8),
                              GestureDetector(
                                onTap: () => launchUrl(
                                  Uri.parse(selectedProviderInfo.docsUrl),
                                  mode: LaunchMode.externalApplication,
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'View Docs',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: AppColors.primaryLight,
                                          fontWeight: FontWeight.w600),
                                    ),
                                    Gap(3),
                                    Icon(LucideIcons.externalLink,
                                        size: 11, color: AppColors.primaryLight),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // API Key or Ollama URL
            if (!isOllama) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _FieldLabel(text: '${selectedProviderInfo.name} API Key', required: true),
                  if (selectedProviderInfo.docsUrl.isNotEmpty)
                    GestureDetector(
                      onTap: () => launchUrl(
                        Uri.parse(selectedProviderInfo.docsUrl),
                        mode: LaunchMode.externalApplication,
                      ),
                      child: Row(
                        children: [
                          Text(
                            'Get API Key',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600),
                          ),
                          const Gap(4),
                          const Icon(LucideIcons.externalLink,
                              size: 12, color: AppColors.primary),
                        ],
                      ),
                    ),
                ],
              ),
              const Gap(8),
              Row(
                children: [
                  Expanded(
                    child: _InputField(
                      controller: _apiKeyCtrl,
                      hint: '${selectedProviderInfo.keyPrefix}…',
                      icon: LucideIcons.key,
                      obscureText: _obscureKey,
                      onChanged: (_) => setState(() => _keyStatus = 'idle'),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureKey
                              ? LucideIcons.eye
                              : LucideIcons.eyeOff,
                          size: 18,
                          color: Colors.white54,
                        ),
                        onPressed: () =>
                            setState(() => _obscureKey = !_obscureKey),
                      ),
                    ),
                  ),
                ],
              ),
              if (_keyStatus == 'valid') ...[
                const Gap(6),
                const Row(
                  children: [
                    Icon(LucideIcons.checkCircle,
                        size: 14, color: Color(0xFF10B981)),
                    Gap(6),
                    Text('Key verified',
                        style: TextStyle(
                            color: Color(0xFF10B981), fontSize: 12)),
                  ],
                ),
              ] else if (_keyStatus == 'invalid') ...[
                const Gap(6),
                const Row(
                  children: [
                    Icon(LucideIcons.alertCircle,
                        size: 14, color: AppColors.error),
                    Gap(6),
                    Text('Key validation failed',
                        style: TextStyle(
                            color: AppColors.error, fontSize: 12)),
                  ],
                ),
              ],
              const Gap(10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: (_keyStatus == 'checking' ||
                          _apiKeyCtrl.text.trim().isEmpty)
                      ? null
                      : _validateKey,
                  icon: _keyStatus == 'checking'
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.primary),
                        )
                      : const Icon(LucideIcons.shieldCheck,
                          size: 16, color: AppColors.primary),
                  label: Text(
                    _keyStatus == 'checking' ? 'Validating…' : 'Validate Key',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: BorderSide(
                        color: AppColors.primary.withAlpha(80), width: 1),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ] else ...[
              _FieldLabel(text: 'Ollama Base URL', required: true),
              const Gap(8),
              _InputField(
                controller: _ollamaUrlCtrl,
                hint: 'http://localhost:11434',
                icon: LucideIcons.server,
                onChanged: (_) => setState(() {}),
              ),
            ],
            const Gap(20),

            // Model selection
            if (models.isNotEmpty) ...[
              Text(
                'MODEL',
                style: AppTextStyles.labelSm.copyWith(
                    color: Colors.white54, letterSpacing: 1.2),
              ),
              const Gap(10),
              ...models.map((m) {
                final isSelected = m.id == _selectedModel;
                return GestureDetector(
                  onTap: () => setState(() => _selectedModel = m.id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: isSelected
                          ? AppColors.primary.withAlpha(30)
                          : Colors.white.withAlpha(8),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : Colors.white.withAlpha(25),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    m.name,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: isSelected
                                          ? FontWeight.w700
                                          : FontWeight.w500,
                                    ),
                                  ),
                                  if (m.recommended) ...[
                                    const Gap(6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary
                                            .withAlpha(50),
                                        borderRadius:
                                            BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'Recommended',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primaryLight,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              if (m.description.isNotEmpty) ...[
                                const Gap(2),
                                Text(
                                  m.description,
                                  style: const TextStyle(
                                      color: Colors.white54, fontSize: 12),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(LucideIcons.check,
                              size: 16, color: AppColors.primary),
                      ],
                    ),
                  ),
                );
              }),
              const Gap(12),
            ],

            // AI Insights toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withAlpha(25)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.brainCircuit,
                      size: 18, color: AppColors.primaryLight),
                  const Gap(12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AI Insights',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Gap(2),
                        Text(
                          'Smart summaries and bill analysis',
                          style:
                              TextStyle(color: Colors.white54, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _aiInsightsEnabled,
                    onChanged: (v) => setState(() => _aiInsightsEnabled = v),
                    activeColor: AppColors.primary,
                    inactiveThumbColor: Colors.white38,
                    inactiveTrackColor: Colors.white.withAlpha(20),
                  ),
                ],
              ),
            ),
            const Gap(20),

            // Buttons
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: (_saving || !canSave)
                    ? null
                    : () => _save(providers),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.sparkles, size: 18),
                          Gap(8),
                          Text(
                            'Complete Setup',
                            style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
              ),
            ),
            const Gap(12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed:
                    _saving ? null : () => setState(() => _showSkipWarning = true),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white54,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: Colors.white.withAlpha(30)),
                  ),
                ),
                child: const Text(
                  'Skip for now',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ),
            const Gap(16),
            Center(
              child: Text(
                'You can configure AI anytime in Settings → AI Configuration.',
                style: AppTextStyles.caption.copyWith(color: Colors.white38),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),

        // Skip warning modal
        if (_showSkipWarning)
          _SkipAiModal(
            userName: widget.userName,
            onSkip: () {
              setState(() => _showSkipWarning = false);
              widget.onComplete(skippedAi: true);
            },
            onConfigure: () => setState(() => _showSkipWarning = false),
          ),
      ],
    );
  }
}

// ── Skip AI warning overlay ───────────────────────────────────────────────────

class _SkipAiModal extends StatelessWidget {
  const _SkipAiModal({
    required this.userName,
    required this.onSkip,
    required this.onConfigure,
  });

  final String userName;
  final VoidCallback onSkip;
  final VoidCallback onConfigure;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onConfigure,
      child: Container(
        color: Colors.black.withAlpha(160),
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.cardDark,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: Colors.white.withAlpha(30)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFF59E0B).withAlpha(30),
                    ),
                    child: const Icon(LucideIcons.alertTriangle,
                        color: Color(0xFFF59E0B), size: 22),
                  ),
                  const Gap(16),
                  Text(
                    'AI features will be limited',
                    style: AppTextStyles.h3.copyWith(color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                  const Gap(10),
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 14, height: 1.5),
                      children: [
                        TextSpan(
                            text:
                                'Hey ${userName.isEmpty ? "there" : userName}! '),
                        const TextSpan(
                            text:
                                'Without an AI provider, Bill Generation, Ask AI Chat, and AI Insights will not be available.'),
                      ],
                    ),
                  ),
                  const Gap(20),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton(
                          onPressed: onConfigure,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Configure Now'),
                        ),
                      ),
                      const Gap(10),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: onSkip,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white70,
                            side: BorderSide(
                                color: Colors.white.withAlpha(50)),
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Skip'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Shared input widgets ──────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.text, this.required = false, this.optional = false});
  final String text;
  final bool required;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (required) ...[
          const Gap(4),
          const Text('*', style: TextStyle(color: AppColors.error, fontSize: 13)),
        ],
        if (optional) ...[
          const Gap(4),
          const Text(
            '(optional)',
            style: TextStyle(color: Colors.white38, fontSize: 12),
          ),
        ],
      ],
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    this.hint,
    this.icon,
    this.errorText,
    this.onChanged,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
    this.inputFormatters,
  });

  final TextEditingController controller;
  final String? hint;
  final IconData? icon;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: errorText != null
                  ? AppColors.error
                  : Colors.white.withAlpha(40),
            ),
          ),
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            obscureText: obscureText,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            style: const TextStyle(color: Colors.white, fontSize: 15),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.white38, fontSize: 15),
              prefixIcon: icon != null
                  ? Icon(icon, color: Colors.white54, size: 18)
                  : null,
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 14),
            ),
          ),
        ),
        if (errorText != null) ...[
          const Gap(6),
          Text(
            errorText!,
            style:
                const TextStyle(color: AppColors.error, fontSize: 12),
          ),
        ],
      ],
    );
  }
}

class _TextAreaField extends StatelessWidget {
  const _TextAreaField({
    required this.controller,
    this.hint,
    this.maxLength,
  });

  final TextEditingController controller;
  final String? hint;
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(40)),
      ),
      child: TextField(
        controller: controller,
        maxLines: 4,
        maxLength: maxLength,
        style: const TextStyle(color: Colors.white, fontSize: 15),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white38, fontSize: 14),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          counterStyle: const TextStyle(color: Colors.white38),
        ),
      ),
    );
  }
}

class _ReadOnlyChip extends StatelessWidget {
  const _ReadOnlyChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primary.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.primary.withAlpha(60)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.primaryLight),
          const Gap(6),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontSize: 12,
                  fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────

class AccountSetupScreen extends ConsumerStatefulWidget {
  const AccountSetupScreen({super.key});

  @override
  ConsumerState<AccountSetupScreen> createState() =>
      _AccountSetupScreenState();
}

class _AccountSetupScreenState extends ConsumerState<AccountSetupScreen> {
  int _step = 0;
  String _displayName = '';
  bool _completing = false;

  Future<void> _complete({required bool skippedAi}) async {
    setState(() => _completing = true);
    try {
      final updates = <String, dynamic>{'onboarding_completed': true};
      if (skippedAi) updates['onboarding_skipped_steps'] = {'ai_config': true};
      // Retry once on transient failure
      for (var attempt = 0; attempt < 2; attempt++) {
        try {
          await ref.read(profileRepositoryProvider).updateProfile(updates);
          break;
        } catch (e) {
          if (attempt == 1) rethrow;
          await Future<void>.delayed(const Duration(milliseconds: 800));
        }
      }

      // Mirror web frontend: push an in-app notification when AI config is
      // skipped so the user sees a reminder in the notification bell.
      if (skippedAi) {
        final userId = ref.read(authProvider).user?.id;
        if (userId != null) {
          unawaited(
            ref.read(notificationsProvider.notifier).createIfAbsent(
              userId: userId,
              type: 'ai_config_incomplete',
              title: 'AI not configured',
              message:
                  'Add an API key in Settings → AI Configuration to unlock '
                  'Bill Generation, Ask AI Chat, and AI Insights.',
            ),
          );
        }
      }
    } catch (_) {
      // Don't block user if DB write fails
    } finally {
      if (mounted) {
        ref.invalidate(userProfileProvider);
        context.go('/dashboard');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_completing) {
      return Scaffold(
        backgroundColor: AppColors.surfaceDark,
        body: const Stack(
          children: [
            AppBackgroundEffects(),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  Gap(20),
                  Text(
                    'Setting up your account…',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surfaceDark,
      body: Stack(
        children: [
          const AppBackgroundEffects(),
          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Column(
                    children: [
                      // Logo row
                      Row(
                        children: [
                          const AuthBrandLogo(size: 40),
                          const Gap(10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'YesBill',
                                style: AppTextStyles.h2.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800),
                              ),
                              const Text(
                                'OnBoard Profile',
                                style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          Text(
                            'Step ${_step + 1} of 2',
                            style: const TextStyle(
                                color: Colors.white54, fontSize: 13),
                          ),
                        ],
                      ),
                      const Gap(20),
                      _StepIndicator(current: _step),
                    ],
                  ),
                ),

                const Gap(24),

                // Step content
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    transitionBuilder: (child, anim) => SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.3, 0),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                          parent: anim, curve: Curves.easeOutCubic)),
                      child: FadeTransition(opacity: anim, child: child),
                    ),
                    child: KeyedSubtree(
                      key: ValueKey(_step),
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                        child: _step == 0
                            ? _ProfileStep(
                                onNext: (name) => setState(() {
                                  _displayName = name;
                                  _step = 1;
                                }),
                              )
                            : _AiStep(
                                userName: _displayName,
                                onComplete: ({required bool skippedAi}) =>
                                    _complete(skippedAi: skippedAi),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
