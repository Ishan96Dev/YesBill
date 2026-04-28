import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';

class PillSelectorOption<T> {
  const PillSelectorOption({
    required this.value,
    required this.label,
    this.subtitle,
  });

  final T value;
  final String label;
  final String? subtitle;
}

class PillSelectorChip<T> extends StatelessWidget {
  const PillSelectorChip({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.options,
    required this.onSelected,
    this.maxLabelWidth = 168,
    this.sheetTitle = 'Choose an option',
  });

  final IconData icon;
  final String label;
  final T? value;
  final List<PillSelectorOption<T>> options;
  final ValueChanged<T> onSelected;
  final double maxLabelWidth;
  final String sheetTitle;

  Future<void> _openPicker(BuildContext context) async {
    final selected = await showModalBottomSheet<T>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _PillSelectorSheet<T>(
        icon: icon,
        title: sheetTitle,
        options: options,
        currentValue: value,
      ),
    );

    if (selected != null) {
      onSelected(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: () => _openPicker(context),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: AppSurfaces.subtle(context),
            borderRadius: BorderRadius.circular(999),
            border: AppSurfaces.cardBorder(context),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: AppColors.primary),
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: BoxConstraints(maxWidth: maxLabelWidth),
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySm.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                LucideIcons.chevronDown,
                size: 13,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PillSelectorSheet<T> extends StatelessWidget {
  const _PillSelectorSheet({
    required this.icon,
    required this.title,
    required this.options,
    required this.currentValue,
  });

  final IconData icon;
  final String title;
  final List<PillSelectorOption<T>> options;
  final T? currentValue;

  @override
  Widget build(BuildContext context) {
    final isDark = AppSurfaces.isDark(context);

    // Compute an initial sheet height that fits all options without dead space.
    // Header (drag handle + title row) ≈ 100dp, each item ≈ 78dp (padding +
    // two-line option), bottom padding 24dp.  Clamp so we never go below 30 %
    // or above 90 % of screen height.
    final screenHeight = MediaQuery.of(context).size.height;
    const double headerHeight = 100.0;
    const double itemHeight = 78.0;
    const double bottomPadding = 24.0;
    final contentHeight =
        headerHeight + options.length * itemHeight + bottomPadding;
    final idealFraction =
        (contentHeight / screenHeight).clamp(0.30, 0.90);

    return DraggableScrollableSheet(
      initialChildSize: idealFraction,
      minChildSize: 0.25,
      maxChildSize: idealFraction.clamp(0.40, 0.92),
      expand: false,
      builder: (context, scrollCtrl) {
        return Container(
          decoration: BoxDecoration(
            color: AppSurfaces.panel(context,
                lightOpacity: 0.96, darkOpacity: 0.96),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: AppSurfaces.cardBorder(context),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context)
                      .colorScheme
                      .outlineVariant
                      .withOpacity(0.55),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Icon(icon, size: 16, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title,
                        style: AppTextStyles.h4.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(LucideIcons.x, size: 16),
                      style: IconButton.styleFrom(
                        backgroundColor: isDark
                            ? AppColors.surfaceDarkElevated
                            : const Color(0xFFF8FAFC),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.separated(
                  controller: scrollCtrl,
                  padding: EdgeInsets.fromLTRB(16, 0, 16, 24 + MediaQuery.of(context).padding.bottom),
                  itemCount: options.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final option = options[index];
                    final selected = option.value == currentValue;

                    return Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap: () => Navigator.of(context).pop(option.value),
                        child: Ink(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary.withOpacity(0.08)
                                : AppSurfaces.elevated(context),
                            borderRadius: BorderRadius.circular(18),
                            border: selected
                                ? Border.all(
                                    color: AppColors.primary.withOpacity(0.44),
                                    width: 1.4,
                                  )
                                : AppSurfaces.cardBorder(context),
                            boxShadow: selected
                                ? [
                                    BoxShadow(
                                      color:
                                          AppColors.primary.withOpacity(0.08),
                                      blurRadius: 16,
                                      offset: const Offset(0, 6),
                                    ),
                                  ]
                                : AppSurfaces.softShadow(context),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      option.label,
                                      style: AppTextStyles.body.copyWith(
                                        color: selected
                                            ? AppColors.primary
                                            : Theme.of(context)
                                                .colorScheme
                                                .onSurface,
                                        fontWeight: selected
                                            ? FontWeight.w700
                                            : FontWeight.w600,
                                      ),
                                    ),
                                    if (option.subtitle != null) ...[
                                      const SizedBox(height: 3),
                                      Text(
                                        option.subtitle!,
                                        style: AppTextStyles.bodySm.copyWith(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              if (selected)
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: const Icon(
                                    LucideIcons.check,
                                    size: 14,
                                    color: Colors.white,
                                  ),
                                ),
                            ],
                          ),
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
