import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/extensions/context_extensions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/core_providers.dart';
import '../../widgets/common/app_dropdown.dart';

class ProfileSettingsScreen extends ConsumerStatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  ConsumerState<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends ConsumerState<ProfileSettingsScreen> {
  final _displayNameCtrl = TextEditingController();
  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _websiteCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _countryCtrl = TextEditingController();
  final _languageCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  bool _uploadingAvatar = false;
  bool _uploadingCover = false;
  String _timezone = 'Asia/Kolkata';
  String _currency = 'INR';
  String? _avatarUrl;
  String? _coverImageUrl;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _displayNameCtrl.dispose();
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _companyCtrl.dispose();
    _websiteCtrl.dispose();
    _locationCtrl.dispose();
    _countryCtrl.dispose();
    _languageCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        title: const Text('Profile'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 132),
              children: [
                _CoverAndAvatar(
                  coverImageUrl: _coverImageUrl,
                  avatarUrl: _avatarUrl,
                  uploadingAvatar: _uploadingAvatar,
                  uploadingCover: _uploadingCover,
                  onUploadAvatar: _uploadAvatar,
                  onUploadCover: _uploadCover,
                ),
                const SizedBox(height: AppSpacing.base),
                TextFormField(
                  enabled: false,
                  initialValue: ref.read(supabaseClientProvider).auth.currentUser?.email ?? '',
                  decoration: const InputDecoration(labelText: 'Email address'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _displayNameCtrl,
                  decoration: const InputDecoration(labelText: 'Display name'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _fullNameCtrl,
                  decoration: const InputDecoration(labelText: 'Full name'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone number'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _companyCtrl,
                  decoration: const InputDecoration(labelText: 'Company'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _websiteCtrl,
                  decoration: const InputDecoration(labelText: 'Website'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _locationCtrl,
                  decoration: const InputDecoration(labelText: 'Location'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _countryCtrl,
                  decoration: const InputDecoration(labelText: 'Country'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _languageCtrl,
                  decoration: const InputDecoration(labelText: 'Language'),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _bioCtrl,
                  maxLines: 3,
                  maxLength: 500,
                  decoration: const InputDecoration(labelText: 'Bio'),
                ),
                const SizedBox(height: AppSpacing.md),
                AppDropdown<String>(
                  label: 'Timezone',
                  value: _timezone,
                  items: const [
                    AppDropdownItem(value: 'Asia/Kolkata', label: 'Asia / Kolkata', subtitle: 'IST — UTC+5:30'),
                    AppDropdownItem(value: 'UTC', label: 'UTC', subtitle: 'Coordinated Universal Time'),
                    AppDropdownItem(value: 'Europe/London', label: 'Europe / London', subtitle: 'GMT / BST'),
                    AppDropdownItem(value: 'America/New_York', label: 'America / New York', subtitle: 'EST / EDT — UTC−5'),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _timezone = value);
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                AppDropdown<String>(
                  label: 'Currency',
                  value: _currency,
                  items: const [
                    AppDropdownItem(value: 'INR', label: 'INR — Indian Rupee', subtitle: '₹'),
                    AppDropdownItem(value: 'USD', label: 'USD — US Dollar', subtitle: '\$'),
                    AppDropdownItem(value: 'EUR', label: 'EUR — Euro', subtitle: '€'),
                    AppDropdownItem(value: 'GBP', label: 'GBP — British Pound', subtitle: '£'),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _currency = value);
                  },
                ),
                const SizedBox(height: AppSpacing.xl),
                FilledButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(_saving ? 'Saving...' : 'Save profile'),
                ),
                const SizedBox(height: AppSpacing.sm),
                const Text(
                  'These preferences sync with your web profile.',
                  style: AppTextStyles.bodySm,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
    );
  }

  Future<void> _load() async {
    final repo = ref.read(profileRepositoryProvider);
    try {
      final profile = await repo.getProfile();
      if (!mounted) return;
      if (profile != null) {
        _displayNameCtrl.text = profile.displayName ?? '';
        _fullNameCtrl.text = profile.fullName ?? '';
        _phoneCtrl.text = profile.phone ?? '';
        _companyCtrl.text = profile.company ?? '';
        _websiteCtrl.text = profile.website ?? '';
        _locationCtrl.text = profile.location ?? '';
        _countryCtrl.text = profile.country ?? '';
        _languageCtrl.text = profile.language ?? '';
        _bioCtrl.text = profile.bio ?? '';
        _timezone = profile.timezone;
        _currency = profile.currency;
        _avatarUrl = profile.avatarUrl;
        _coverImageUrl = profile.coverImageUrl;
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final repo = ref.read(profileRepositoryProvider);
    try {
      await repo.updateProfile({
        'display_name': _displayNameCtrl.text.trim(),
        'full_name': _fullNameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        'company': _companyCtrl.text.trim().isEmpty ? null : _companyCtrl.text.trim(),
        'website': _websiteCtrl.text.trim().isEmpty ? null : _websiteCtrl.text.trim(),
        'location': _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
        'country': _countryCtrl.text.trim().isEmpty ? null : _countryCtrl.text.trim(),
        'language': _languageCtrl.text.trim().isEmpty ? null : _languageCtrl.text.trim(),
        'bio': _bioCtrl.text.trim().isEmpty ? null : _bioCtrl.text.trim(),
        'timezone': _timezone,
        'currency': _currency,
      });
      if (mounted) {
        context.showSnackBar('Profile saved');
      }
    } catch (_) {
      if (mounted) {
        context.showErrorSnackBar('Unable to save profile');
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  Future<void> _uploadAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1200,
    );
    if (picked == null) return;

    setState(() => _uploadingAvatar = true);
    try {
      final bytes = await picked.readAsBytes();
      final repo = ref.read(profileRepositoryProvider);
      final fileName = 'avatar_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await repo.uploadAvatar(bytes, fileName);
      if (mounted) {
        setState(() => _avatarUrl = url);
      }
    } finally {
      if (mounted) {
        setState(() => _uploadingAvatar = false);
      }
    }
  }

  Future<void> _uploadCover() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (picked == null) return;

    setState(() => _uploadingCover = true);
    try {
      final bytes = await picked.readAsBytes();
      final repo = ref.read(profileRepositoryProvider);
      final fileName = 'cover_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await repo.uploadCoverImage(bytes, fileName);
      if (mounted) {
        setState(() => _coverImageUrl = url);
      }
    } finally {
      if (mounted) {
        setState(() => _uploadingCover = false);
      }
    }
  }
}

class _CoverAndAvatar extends StatelessWidget {
  const _CoverAndAvatar({
    required this.coverImageUrl,
    required this.avatarUrl,
    required this.uploadingAvatar,
    required this.uploadingCover,
    required this.onUploadAvatar,
    required this.onUploadCover,
  });

  final String? coverImageUrl;
  final String? avatarUrl;
  final bool uploadingAvatar;
  final bool uploadingCover;
  final VoidCallback onUploadAvatar;
  final VoidCallback onUploadCover;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppSurfaces.panel(context),
        borderRadius: BorderRadius.circular(18),
        border: AppSurfaces.cardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                height: 140,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(18),
                  ),
                  image: coverImageUrl != null && coverImageUrl!.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(coverImageUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                  gradient: coverImageUrl == null || coverImageUrl!.isEmpty
                      ? const LinearGradient(
                          colors: [AppColors.lavenderBg, Colors.white],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        )
                      : null,
                ),
                child: coverImageUrl == null || coverImageUrl!.isEmpty
                    ? Center(
                        child: Icon(
                          LucideIcons.image,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          size: 28,
                        ),
                      )
                    : null,
              ),
              Positioned(
                left: 16,
                bottom: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      coverImageUrl == null || coverImageUrl!.isEmpty
                          ? 'Add a cover photo'
                          : 'Update your cover photo',
                      style: AppTextStyles.body.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Give your profile a richer first impression.',
                      style: AppTextStyles.bodySm.copyWith(
                        color: Colors.white.withOpacity(0.84),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Transform.translate(
            offset: const Offset(0, -28),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 38,
                  backgroundColor: Colors.white,
                  child: CircleAvatar(
                    radius: 34,
                    backgroundColor: AppColors.primary.withOpacity(0.15),
                    backgroundImage: avatarUrl != null && avatarUrl!.isNotEmpty
                        ? NetworkImage(avatarUrl!)
                        : null,
                    child: avatarUrl == null || avatarUrl!.isEmpty
                        ? const Icon(LucideIcons.user, color: AppColors.primary)
                        : null,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    FilledButton.icon(
                      onPressed: uploadingCover ? null : onUploadCover,
                      icon: uploadingCover
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(LucideIcons.imagePlus, size: 14),
                      label: Text(
                        coverImageUrl == null || coverImageUrl!.isEmpty
                            ? 'Add cover photo'
                            : 'Update cover photo',
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: uploadingAvatar ? null : onUploadAvatar,
                      icon: uploadingAvatar
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(LucideIcons.camera, size: 14),
                      label: Text(
                        avatarUrl == null || avatarUrl!.isEmpty
                            ? 'Add avatar'
                            : 'Change avatar',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
