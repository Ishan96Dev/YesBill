import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/theme_provider.dart';

class AppearanceSettingsScreen extends ConsumerStatefulWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  ConsumerState<AppearanceSettingsScreen> createState() =>
      _AppearanceSettingsScreenState();
}

class _AppearanceSettingsScreenState extends ConsumerState<AppearanceSettingsScreen> {
  bool _saving = false;

  Future<void> _setTheme(ThemeMode mode) async {
    setState(() => _saving = true);
    try {
      await ref.read(themeProvider.notifier).setTheme(mode);
      final profileRepo = ref.read(profileRepositoryProvider);
      final themeValue = switch (mode) {
        ThemeMode.dark => 'dark',
        ThemeMode.light => 'light',
        ThemeMode.system => 'system',
      };
      await profileRepo.updateProfile({'theme': themeValue});
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        title: const Text('Appearance'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 132),
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppSurfaces.panel(context),
              borderRadius: BorderRadius.circular(22),
              border: AppSurfaces.cardBorder(context),
              boxShadow: AppSurfaces.softShadow(context),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    LucideIcons.palette,
                    color: AppColors.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Make the app feel like your space',
                        style: AppTextStyles.h4.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Pick a theme that matches your device, your eyes, or your current chaos level.',
                        style: AppTextStyles.bodySm.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            decoration: BoxDecoration(
              color: AppSurfaces.panel(context),
              borderRadius: BorderRadius.circular(18),
              border: AppSurfaces.cardBorder(context),
              boxShadow: AppSurfaces.softShadow(context),
            ),
            child: Column(
              children: [
                _ThemeChoiceTile(
                  value: ThemeMode.system,
                  groupValue: themeMode,
                  icon: LucideIcons.smartphone,
                  title: 'System default',
                  subtitle: 'Follow your device preference automatically.',
                  onChanged: _setTheme,
                ),
                const Divider(height: 1, indent: 64, endIndent: 16),
                _ThemeChoiceTile(
                  value: ThemeMode.dark,
                  groupValue: themeMode,
                  icon: LucideIcons.moonStar,
                  title: 'Dark',
                  subtitle: 'A richer, high-contrast look inspired by the web app.',
                  onChanged: _setTheme,
                ),
                const Divider(height: 1, indent: 64, endIndent: 16),
                _ThemeChoiceTile(
                  value: ThemeMode.light,
                  groupValue: themeMode,
                  icon: LucideIcons.sunMedium,
                  title: 'Light',
                  subtitle: 'Clean, bright, and easy on daytime eyeballs.',
                  onChanged: _setTheme,
                ),
              ],
            ),
          ),
          if (_saving)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.md),
              child: Center(
                child: Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 10),
                    Text(
                      'Updating appearance…',
                      style: AppTextStyles.bodySm.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ThemeChoiceTile extends StatelessWidget {
  const _ThemeChoiceTile({
    required this.value,
    required this.groupValue,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onChanged,
  });

  final ThemeMode value;
  final ThemeMode groupValue;
  final IconData icon;
  final String title;
  final String subtitle;
  final ValueChanged<ThemeMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => onChanged(value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: selected
                    ? AppColors.primary.withOpacity(0.12)
                    : AppSurfaces.elevated(context),
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Icon(
                icon,
                size: 18,
                color: selected
                    ? AppColors.primary
                    : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.body.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: AppTextStyles.bodySm.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Radio<ThemeMode>(
              value: value,
              groupValue: groupValue,
              activeColor: AppColors.primary,
              onChanged: (selectedValue) {
                if (selectedValue != null) onChanged(selectedValue);
              },
            ),
          ],
        ),
      ),
    );
  }
}
