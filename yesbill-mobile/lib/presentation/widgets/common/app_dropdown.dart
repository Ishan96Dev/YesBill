import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';

/// A Stitch-themed custom dropdown that shows a bottom-sheet option picker.
///
/// Usage:
/// ```dart
/// AppDropdown<String>(
///   label: 'Timezone',
///   value: _timezone,
///   items: const [
///     AppDropdownItem(value: 'UTC', label: 'UTC'),
///     AppDropdownItem(value: 'Asia/Kolkata', label: 'Asia / Kolkata'),
///   ],
///   onChanged: (v) => setState(() => _timezone = v),
/// )
/// ```
class AppDropdownItem<T> {
  const AppDropdownItem({
    required this.value,
    required this.label,
    this.subtitle,
    this.leading,
  });

  final T value;
  final String label;
  final String? subtitle;
  final Widget? leading;
}

class AppDropdown<T> extends StatelessWidget {
  const AppDropdown({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.hint,
    this.enabled = true,
  });

  final String label;
  final T? value;
  final List<AppDropdownItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? hint;
  final bool enabled;

  String get _displayLabel {
    if (value == null) return hint ?? 'Select…';
    for (final item in items) {
      if (item.value == value) return item.label;
    }
    return value.toString();
  }

  Future<void> _openPicker(BuildContext context) async {
    if (!enabled) return;
    final selected = await showModalBottomSheet<T>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _AppDropdownSheet<T>(
        label: label,
        items: items,
        currentValue: value,
      ),
    );
    if (selected != null) onChanged(selected);
  }

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => _openPicker(context),
      child: Container(
        decoration: BoxDecoration(
          color: enabled
              ? AppSurfaces.elevated(context)
              : AppSurfaces.subtle(context),
          borderRadius: BorderRadius.circular(16),
          border: AppSurfaces.cardBorder(context),
          boxShadow: enabled ? AppSurfaces.softShadow(context) : null,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTextStyles.caption.copyWith(
                      color: hasValue
                          ? AppColors.primary
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _displayLabel,
                    style: AppTextStyles.body.copyWith(
                      color: hasValue
                          ? Theme.of(context).colorScheme.onSurface
                          : Theme.of(context)
                              .colorScheme
                              .onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              LucideIcons.chevronsUpDown,
              size: 16,
              color: enabled
                  ? Theme.of(context).colorScheme.onSurfaceVariant
                  : Theme.of(context)
                      .colorScheme
                      .onSurfaceVariant
                      .withOpacity(isDark ? 0.55 : 0.7),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Bottom-sheet picker ──────────────────────────────────────────────────────
class _AppDropdownSheet<T> extends StatelessWidget {
  const _AppDropdownSheet({
    required this.label,
    required this.items,
    required this.currentValue,
  });

  final String label;
  final List<AppDropdownItem<T>> items;
  final T? currentValue;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.45,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      expand: false,
      builder: (context, scrollCtrl) {
        return Container(
          decoration: BoxDecoration(
            color: AppSurfaces.panel(context, lightOpacity: 0.96, darkOpacity: 0.96),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: AppSurfaces.cardBorder(context),
          ),
          child: Column(
            children: [
              // ── Handle ──────────────────────────────────────────────────
              const SizedBox(height: 12),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFACB3B7).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              // ── Title ───────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: [
                    Text(
                      label,
                      style: AppTextStyles.h3.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppSurfaces.elevated(context),
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: AppSurfaces.softShadow(context),
                        ),
                        child: Icon(
                          LucideIcons.x,
                          size: 14,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // ── Options ─────────────────────────────────────────────────
              Expanded(
                child: ListView.separated(
                  controller: scrollCtrl,
                  padding: EdgeInsets.fromLTRB(16, 0, 16, 32 + MediaQuery.of(context).viewPadding.bottom),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isSelected = item.value == currentValue;

                    return GestureDetector(
                      onTap: () => Navigator.of(context).pop(item.value),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withOpacity(0.06)
                              : AppSurfaces.elevated(context),
                          borderRadius: BorderRadius.circular(14),
                          border: isSelected
                              ? Border.all(
                                  color: AppColors.primary,
                                  width: 1.5,
                                )
                              : Border.all(
                                  color: AppSurfaces.cardBorder(context).top.color,
                                  width: 1,
                                ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.08),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : [
                                  ...AppSurfaces.softShadow(context),
                                ],
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        child: Row(
                          children: [
                            if (item.leading != null) ...[
                              item.leading!,
                              const SizedBox(width: 12),
                            ],
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.label,
                                    style: AppTextStyles.body.copyWith(
                                      color: isSelected
                                          ? AppColors.primary
                                          : Theme.of(context)
                                              .colorScheme
                                              .onSurface,
                                      fontWeight: isSelected
                                          ? FontWeight.w600
                                          : FontWeight.w500,
                                    ),
                                  ),
                                  if (item.subtitle != null) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      item.subtitle!,
                                      style: AppTextStyles.caption.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            if (isSelected)
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  LucideIcons.check,
                                  size: 14,
                                  color: Colors.white,
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
        );
      },
    );
  }
}
