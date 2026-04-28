import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  static Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  static const _bugUrl =
      'https://github.com/Ishan96Dev/YesBill/issues/new?template=bug_report.yml';
  static const _featureUrl =
      'https://github.com/Ishan96Dev/YesBill/issues/new?template=feature_request.yml';
  static const _aiIssueUrl =
      'https://github.com/Ishan96Dev/YesBill/issues/new?template=ai_issue.yml';
  static const _allIssuesUrl =
      'https://github.com/Ishan96Dev/YesBill/issues';
  static const _discussionsUrl =
      'https://github.com/Ishan96Dev/YesBill/discussions';
  static const _emailUrl = 'mailto:support@yesbill.com';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.base, 12, AppSpacing.base, 120),
        children: [
          // ── Page Title ─────────────────────────────────────────────────
          Text(
            'Support',
            style: AppTextStyles.h1.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(delay: 50.ms),
          const SizedBox(height: 4),
          Text(
            "We're here to help. Report bugs, request features, or reach out directly.",
            style: AppTextStyles.body.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ).animate().fadeIn(delay: 80.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── GET HELP VIA GITHUB ─────────────────────────────────────────
          _SectionLabel(label: 'GET HELP VIA GITHUB'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: _GitHubCard(
                  icon: LucideIcons.bug,
                  iconColor: AppColors.error,
                  iconBg: AppColors.error.withOpacity(0.1),
                  title: 'Raise a Bug',
                  description: 'Found something broken? Open a GitHub issue.',
                  actionLabel: 'Open Bug Report',
                  onTap: () => _open(_bugUrl),
                ).animate().fadeIn(delay: 100.ms),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _GitHubCard(
                  icon: LucideIcons.lightbulb,
                  iconColor: AppColors.primary,
                  iconBg: AppColors.primary.withOpacity(0.1),
                  title: 'Request a Feature',
                  description:
                      'Have an idea to make YesBill better?',
                  actionLabel: 'Request Feature',
                  onTap: () => _open(_featureUrl),
                ).animate().fadeIn(delay: 130.ms),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          _GitHubCard(
            icon: LucideIcons.brain,
            iconColor: AppColors.purple,
            iconBg: AppColors.purple.withOpacity(0.1),
            title: 'AI Issue',
            description:
                'AI behaving unexpectedly? Report AI-specific issues like wrong outputs or broken prompts.',
            actionLabel: 'Report AI Issue',
            onTap: () => _open(_aiIssueUrl),
            horizontal: true,
          ).animate().fadeIn(delay: 160.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── MORE WAYS TO GET SUPPORT ────────────────────────────────────
          _SectionLabel(label: 'MORE WAYS TO GET SUPPORT'),
          const SizedBox(height: AppSpacing.sm),
          _SupportGroup(
            tiles: [
              _SupportTileData(
                icon: LucideIcons.gitBranch,
                label: 'View All Issues',
                subtitle: 'Browse open bugs and feature requests on GitHub',
                onTap: () => _open(_allIssuesUrl),
                trailing: LucideIcons.externalLink,
              ),
              _SupportTileData(
                icon: LucideIcons.messageCircle,
                label: 'GitHub Discussions',
                subtitle: 'Join the community, ask questions, share ideas',
                onTap: () => _open(_discussionsUrl),
                trailing: LucideIcons.externalLink,
              ),
              _SupportTileData(
                icon: LucideIcons.mail,
                label: 'Email Support',
                subtitle: 'support@yesbill.com',
                onTap: () => _open(_emailUrl),
                trailing: LucideIcons.chevronRight,
              ),
            ],
          ).animate().fadeIn(delay: 200.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── QUICK RESPONSE COMMITMENT ───────────────────────────────────
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.18),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(LucideIcons.zap,
                      color: Colors.white, size: 16),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quick Response Commitment',
                        style: AppTextStyles.body.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      RichText(
                        text: TextSpan(
                          style: AppTextStyles.bodySm.copyWith(
                              color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant),
                          children: const [
                            TextSpan(
                                text:
                                    'Bug reports are triaged within '),
                            TextSpan(
                              text: '24 hours',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF2D3337)),
                            ),
                            TextSpan(
                                text:
                                    '. Feature requests are reviewed weekly. For urgent issues, email us directly at '),
                            TextSpan(
                              text: 'support@yesbill.com',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextSpan(text: '.'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 240.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── TIPS FOR A GREAT BUG REPORT ─────────────────────────────────
          _SectionLabel(label: 'TIPS FOR A GREAT BUG REPORT'),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppSurfaces.panel(context),
              borderRadius: BorderRadius.circular(16),
              border: AppSurfaces.cardBorder(context),
              boxShadow: AppSurfaces.softShadow(context),
            ),
            child: Column(
              children: [
                _TipRow(
                  number: 1,
                  text:
                      'Describe what happened — What did you expect vs. what actually occurred?',
                ),
                const Divider(height: 20, thickness: 0.5),
                _TipRow(
                  number: 2,
                  text:
                      'Include steps to reproduce — How can we trigger this bug consistently?',
                ),
                const Divider(height: 20, thickness: 0.5),
                _TipRow(
                  number: 3,
                  text:
                      'Add screenshots or recordings — Visual evidence speeds up debugging significantly.',
                ),
                const Divider(height: 20, thickness: 0.5),
                _TipRow(
                  number: 4,
                  text:
                      'Mention your device / OS version — This matters for Android-specific issues.',
                ),
              ],
            ),
          ).animate().fadeIn(delay: 280.ms),
        ],
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: AppTextStyles.labelSm.copyWith(
        color: Theme.of(context).colorScheme.onSurfaceVariant,
        letterSpacing: 0.6,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _GitHubCard extends StatelessWidget {
  const _GitHubCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onTap,
    this.horizontal = false,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onTap;
  final bool horizontal;

  @override
  Widget build(BuildContext context) {
    final content = horizontal
        ? _buildHorizontal(context)
        : _buildVertical(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppSurfaces.panel(context),
          borderRadius: BorderRadius.circular(16),
          border: AppSurfaces.cardBorder(context),
          boxShadow: AppSurfaces.softShadow(context),
        ),
        child: content,
      ),
    );
  }

  Widget _buildVertical(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          title,
          style: AppTextStyles.body.copyWith(
              fontWeight: FontWeight.w700, color: const Color(0xFF2D3337)),
        ),
        const SizedBox(height: 4),
        Text(
          description,
          style: AppTextStyles.bodySm.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Text(
              actionLabel,
              style: AppTextStyles.bodySm.copyWith(
                  color: iconColor, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 4),
            Icon(LucideIcons.arrowRight, size: 12, color: iconColor),
          ],
        ),
      ],
    );
  }

  Widget _buildHorizontal(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration:
              BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.w700, color: const Color(0xFF2D3337)),
              ),
              Text(
                description,
                style: AppTextStyles.bodySm.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Row(
          children: [
            Text(
              actionLabel,
              style: AppTextStyles.bodySm.copyWith(
                  color: iconColor, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 4),
            Icon(LucideIcons.chevronRight, size: 12, color: iconColor),
          ],
        ),
      ],
    );
  }
}

class _SupportTileData {
  const _SupportTileData({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
    required this.trailing,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  final IconData trailing;
}

class _SupportGroup extends StatelessWidget {
  const _SupportGroup({required this.tiles});
  final List<_SupportTileData> tiles;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppSurfaces.panel(context),
        borderRadius: BorderRadius.circular(16),
        border: AppSurfaces.cardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        children: [
          for (int i = 0; i < tiles.length; i++) ...[
            _SupportTile(data: tiles[i]),
            if (i < tiles.length - 1)
              const Divider(height: 1, indent: 56, endIndent: 16),
          ],
        ],
      ),
    );
  }
}

class _SupportTile extends StatelessWidget {
  const _SupportTile({required this.data});
  final _SupportTileData data;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: data.onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppSurfaces.elevated(context),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                data.icon,
                size: 16,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    data.label,
                    style: AppTextStyles.body.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  Text(
                    data.subtitle,
                    style: AppTextStyles.bodySm.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(data.trailing, size: 14, color: const Color(0xFFACB3B7)),
          ],
        ),
      ),
    );
  }
}

class _TipRow extends StatelessWidget {
  const _TipRow({required this.number, required this.text});
  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            '$number',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.bodySm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }
}
