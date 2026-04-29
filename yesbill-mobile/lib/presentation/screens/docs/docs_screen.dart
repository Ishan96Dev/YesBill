import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

class _DocItem {
  const _DocItem({required this.label, required this.asset});
  final String label;
  final String asset;
}

class _DocSection {
  const _DocSection({required this.title, required this.icon, required this.items});
  final String title;
  final IconData icon;
  final List<_DocItem> items;
}

const _sections = <_DocSection>[
  _DocSection(
    title: 'Overview',
    icon: LucideIcons.home,
    items: [
      _DocItem(label: 'Introduction', asset: 'assets/docs/intro.md'),
      _DocItem(label: 'Roadmap', asset: 'assets/docs/roadmap.md'),
    ],
  ),
  _DocSection(
    title: 'Getting Started',
    icon: LucideIcons.rocket,
    items: [
      _DocItem(label: 'Creating Account', asset: 'assets/docs/getting-started/creating-account.md'),
      _DocItem(label: 'Onboarding', asset: 'assets/docs/getting-started/onboarding.md'),
      _DocItem(label: 'First Service', asset: 'assets/docs/getting-started/first-service.md'),
      _DocItem(label: 'Dashboard', asset: 'assets/docs/getting-started/dashboard.md'),
    ],
  ),
  _DocSection(
    title: 'Services',
    icon: LucideIcons.briefcase,
    items: [
      _DocItem(label: 'Overview', asset: 'assets/docs/services/overview.md'),
      _DocItem(label: 'Home Delivery', asset: 'assets/docs/services/home-delivery.md'),
      _DocItem(label: 'Visit-Based', asset: 'assets/docs/services/visit-based.md'),
      _DocItem(label: 'Managing Services', asset: 'assets/docs/services/managing-services.md'),
      _DocItem(label: 'Payments', asset: 'assets/docs/services/payments.md'),
      _DocItem(label: 'Subscriptions', asset: 'assets/docs/services/subscriptions.md'),
      _DocItem(label: 'Utility Services', asset: 'assets/docs/services/utility-services.md'),
    ],
  ),
  _DocSection(
    title: 'Calendar',
    icon: LucideIcons.calendarDays,
    items: [
      _DocItem(label: 'Overview', asset: 'assets/docs/calendar/overview.md'),
      _DocItem(label: 'Daily Tracking', asset: 'assets/docs/calendar/daily-tracking.md'),
      _DocItem(label: 'Yearly View', asset: 'assets/docs/calendar/yearly-view.md'),
    ],
  ),
  _DocSection(
    title: 'Bills',
    icon: LucideIcons.receipt,
    items: [
      _DocItem(label: 'Understanding Bills', asset: 'assets/docs/bills/understanding-bills.md'),
      _DocItem(label: 'Auto-Generation', asset: 'assets/docs/bills/auto-generation.md'),
      _DocItem(label: 'Marking Paid', asset: 'assets/docs/bills/marking-paid.md'),
      _DocItem(label: 'Bill History', asset: 'assets/docs/bills/bill-history.md'),
    ],
  ),
  _DocSection(
    title: 'AI Features',
    icon: LucideIcons.sparkles,
    items: [
      _DocItem(label: 'Overview', asset: 'assets/docs/ai-features/overview.md'),
      _DocItem(label: 'Ask AI', asset: 'assets/docs/ai-features/ask-ai.md'),
      _DocItem(label: 'Agent Chatbot', asset: 'assets/docs/ai-features/agent-chatbot.md'),
      _DocItem(label: 'Agent Actions', asset: 'assets/docs/ai-features/agent-actions.md'),
      _DocItem(label: 'AI Bill Generation', asset: 'assets/docs/ai-features/ai-bill-generation.md'),
      _DocItem(label: 'AI Configuration', asset: 'assets/docs/ai-features/ai-configuration.md'),
      _DocItem(label: 'Analytics', asset: 'assets/docs/ai-features/analytics.md'),
    ],
  ),
  _DocSection(
    title: 'Settings',
    icon: LucideIcons.settings,
    items: [
      _DocItem(label: 'Profile', asset: 'assets/docs/settings/profile.md'),
      _DocItem(label: 'AI Configuration', asset: 'assets/docs/settings/ai-configuration.md'),
      _DocItem(label: 'Notifications', asset: 'assets/docs/settings/notifications.md'),
      _DocItem(label: 'Security', asset: 'assets/docs/settings/security.md'),
      _DocItem(label: 'Support', asset: 'assets/docs/settings/support.md'),
    ],
  ),
  _DocSection(
    title: 'Changelog',
    icon: LucideIcons.gitBranch,
    items: [
      _DocItem(label: 'v1.0.0', asset: 'assets/docs/changelog/v1.0.0.md'),
    ],
  ),
];

const _docsBaseUrl = 'https://ishan96dev.github.io/YesBill/docs';

/// Flat lookup: Docusaurus page path → _DocItem (for in-app link navigation)
Map<String, _DocItem> _buildDocPathMap() {
  final map = <String, _DocItem>{};
  for (final section in _sections) {
    for (final item in section.items) {
      final path = item.asset
          .replaceFirst('assets/docs', '')
          .replaceFirst('.md', '');
      map[path] = item;
    }
  }
  return map;
}

final _docPathMap = _buildDocPathMap();

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class DocsScreen extends StatefulWidget {
  const DocsScreen({super.key});

  @override
  State<DocsScreen> createState() => _DocsScreenState();
}

class _DocsScreenState extends State<DocsScreen> {
  String _selectedAsset = 'assets/docs/intro.md';
  String _selectedLabel = 'Introduction';

  void _select(_DocItem item) {
    setState(() {
      _selectedAsset = item.asset;
      _selectedLabel = item.label;
    });
    if (Scaffold.of(context).isDrawerOpen) {
      Navigator.of(context).pop(); // close drawer
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      drawer: _DocsDrawer(
        selectedAsset: _selectedAsset,
        onSelect: _select,
      ),
      body: _DocsBody(
        asset: _selectedAsset,
        label: _selectedLabel,
        isDark: isDark,
        onNavigateDoc: _select,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Drawer / nav sidebar
// ---------------------------------------------------------------------------

class _DocsDrawer extends StatefulWidget {
  const _DocsDrawer({required this.selectedAsset, required this.onSelect});
  final String selectedAsset;
  final void Function(_DocItem) onSelect;

  @override
  State<_DocsDrawer> createState() => _DocsDrawerState();
}

class _DocsDrawerState extends State<_DocsDrawer> {
  final Set<String> _expanded = {'Overview', 'Getting Started'};

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Drawer(
      backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Branded header ──────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.cardDark
                    : AppColors.primary.withAlpha(12),
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? AppColors.primary.withAlpha(45)
                        : AppColors.primary.withAlpha(28),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary,
                          AppColors.primaryDark,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(9),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(60),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(LucideIcons.bookOpen,
                        size: 16, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'YesBill Docs',
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black87,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.2,
                        ),
                      ),
                      Text(
                        'Documentation',
                        style: TextStyle(
                          color: isDark
                              ? Colors.white38
                              : Colors.black38,
                          fontSize: 11,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Close drawer button
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.white.withAlpha(14)
                            : Colors.black.withAlpha(8),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Icon(
                        LucideIcons.x,
                        size: 14,
                        color: isDark ? Colors.white54 : Colors.black38,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // ── Navigation list ─────────────────────────────────────────────
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(0, 10, 0, 20),
                itemCount: _sections.length,
                itemBuilder: (_, i) => _SectionTile(
                  section: _sections[i],
                  expanded: _expanded.contains(_sections[i].title),
                  selectedAsset: widget.selectedAsset,
                  onToggle: () => setState(() {
                    final t = _sections[i].title;
                    if (_expanded.contains(t)) {
                      _expanded.remove(t);
                    } else {
                      _expanded.add(t);
                    }
                  }),
                  onSelect: widget.onSelect,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  const _SectionTile({
    required this.section,
    required this.expanded,
    required this.selectedAsset,
    required this.onToggle,
    required this.onSelect,
  });

  final _DocSection section;
  final bool expanded;
  final String selectedAsset;
  final VoidCallback onToggle;
  final void Function(_DocItem) onSelect;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final headingColor =
        isDark ? Colors.white54 : const Color(0xFF6B7280);

    // Check if any child of this section is selected
    final hasSelected =
        section.items.any((item) => item.asset == selectedAsset);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: onToggle,
          splashColor: AppColors.primary.withAlpha(18),
          highlightColor: AppColors.primary.withAlpha(10),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 9, 14, 9),
            child: Row(
              children: [
                // Section icon badge
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: hasSelected
                        ? AppColors.primary.withAlpha(isDark ? 50 : 25)
                        : (isDark
                            ? Colors.white.withAlpha(12)
                            : Colors.black.withAlpha(6)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    section.icon,
                    size: 13,
                    color: hasSelected
                        ? AppColors.primary
                        : headingColor,
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    section.title,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: hasSelected
                          ? (isDark ? Colors.white : Colors.black87)
                          : headingColor,
                      letterSpacing: 0.1,
                    ),
                  ),
                ),
                AnimatedRotation(
                  turns: expanded ? 0.25 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    LucideIcons.chevronRight,
                    size: 13,
                    color: headingColor,
                  ),
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: const SizedBox(width: double.infinity),
          secondChild: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: section.items.map((item) {
              final selected = item.asset == selectedAsset;
              return _DocItemTile(
                item: item,
                selected: selected,
                onTap: () => onSelect(item),
              );
            }).toList(),
          ),
          crossFadeState: expanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
        const SizedBox(height: 2),
      ],
    );
  }
}

class _DocItemTile extends StatelessWidget {
  const _DocItemTile({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final _DocItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        splashColor: AppColors.primary.withAlpha(20),
        highlightColor: AppColors.primary.withAlpha(10),
        child: Container(
          margin: const EdgeInsets.fromLTRB(10, 1, 10, 1),
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.primary.withAlpha(isDark ? 40 : 18)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: selected
                ? Border.all(
                    color: AppColors.primary.withAlpha(isDark ? 60 : 35),
                    width: 1,
                  )
                : null,
          ),
          child: Row(
            children: [
              // Left accent indicator
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: selected ? 3 : 0,
                height: 14,
                margin: EdgeInsets.only(right: selected ? 8 : 0),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Dot for unselected
              if (!selected)
                Container(
                  width: 4,
                  height: 4,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withAlpha(35)
                        : Colors.black.withAlpha(25),
                    shape: BoxShape.circle,
                  ),
                ),
              Expanded(
                child: Text(
                  item.label,
                  style: TextStyle(
                    fontSize: 13,
                    color: selected
                        ? AppColors.primary
                        : (isDark ? Colors.white70 : const Color(0xFF374151)),
                    fontWeight:
                        selected ? FontWeight.w600 : FontWeight.w400,
                    letterSpacing: selected ? 0 : 0.1,
                  ),
                ),
              ),
              if (selected)
                Icon(
                  LucideIcons.chevronRight,
                  size: 12,
                  color: AppColors.primary.withAlpha(160),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Body — loads the markdown asset and renders it
// ---------------------------------------------------------------------------

class _DocsBody extends StatefulWidget {
  const _DocsBody({
    required this.asset,
    required this.label,
    required this.isDark,
    this.onNavigateDoc,
  });

  final String asset;
  final String label;
  final bool isDark;
  final void Function(_DocItem)? onNavigateDoc;

  @override
  State<_DocsBody> createState() => _DocsBodyState();
}

class _DocsBodyState extends State<_DocsBody> {
  String? _content;
  bool _loading = true;
  String? _error;
  String? _loadedAsset;

  @override
  void didUpdateWidget(_DocsBody oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.asset != widget.asset) {
      _loadDoc();
    }
  }

  @override
  void initState() {
    super.initState();
    _loadDoc();
  }

  /// Strips Docusaurus/Jekyll YAML frontmatter from markdown content.
  /// Removes the `---\n...\n---` block at the very start of the file.
  static String _stripFrontmatter(String raw) {
    final trimmed = raw.trimLeft();
    if (!trimmed.startsWith('---')) return raw;
    // Find the closing --- line after the opening one
    final closing = trimmed.indexOf('\n---', 3);
    if (closing == -1) return raw;
    // Skip past the closing --- and its trailing newline
    final afterNewline = trimmed.indexOf('\n', closing + 1);
    if (afterNewline == -1) return '';
    return trimmed.substring(afterNewline + 1).trimLeft();
  }

  /// Converts Docusaurus admonition blocks (:::type ... :::) into styled
  /// markdown blockquotes that flutter_markdown can render.
  static String _convertAdmonitions(String content) {
    return content.replaceAllMapped(
      RegExp(
        r':::(info|note|tip|warning|caution|danger)([^\n]*)?\ *\n([\s\S]*?):::',
        caseSensitive: false,
      ),
      (match) {
        final type = match.group(1)!.toLowerCase();
        final rawTitle = match.group(2)?.trim() ?? '';
        final body = match.group(3)!.trim();
        String emoji;
        String defaultLabel;
        if (type == 'tip') {
          emoji = '\u{1F4A1}';
          defaultLabel = 'Tip';
        } else if (type == 'warning' || type == 'caution') {
          emoji = '\u26A0\uFE0F';
          defaultLabel = 'Warning';
        } else if (type == 'danger') {
          emoji = '\u{1F6A8}';
          defaultLabel = 'Danger';
        } else if (type == 'note') {
          emoji = '\u{1F4DD}';
          defaultLabel = 'Note';
        } else {
          emoji = '\u2139\uFE0F';
          defaultLabel = 'Info';
        }
        final label = rawTitle.isNotEmpty ? rawTitle : defaultLabel;
        final lines = body.split('\n').map((l) => '> $l').join('\n');
        return '> **$emoji $label**\n>\n$lines';
      },
    );
  }

  Future<void> _loadDoc() async {
    setState(() {
      _loading = true;
      _error = null;
      _loadedAsset = widget.asset;
    });
    try {
      final raw = await DefaultAssetBundle.of(context).loadString(widget.asset);
      if (!mounted) return;
      if (_loadedAsset != widget.asset) return; // stale response
      setState(() {
        _content = _convertAdmonitions(_stripFrontmatter(raw));
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load document.';
        _loading = false;
      });
    }
  }

  /// Resolve image URIs that come from Docusaurus static paths.
  /// e.g. `/img/screenshots/Login-01.png` → full URL on docs site.
  Uri? _resolveImageUri(Uri uri) {
    if (uri.scheme.isEmpty || uri.host.isEmpty) {
      // Relative path from docs site
      final path = uri.path.startsWith('/') ? uri.path : '/${uri.path}';
      return Uri.parse('$_docsBaseUrl$path');
    }
    return uri;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final subColor = isDark ? Colors.white60 : Colors.black45;
    final codeBackground =
        isDark ? Colors.white.withAlpha(14) : Colors.black.withAlpha(8);
    final blockquoteBorder =
        isDark ? AppColors.primary.withAlpha(120) : AppColors.primary.withAlpha(80);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.fileX2, size: 48, color: subColor),
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: subColor)),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Doc title bar with hamburger
        _DocTitleBar(label: widget.label, isDark: isDark),
        // Markdown content
        Expanded(
          child: Markdown(
            data: _content!,
            selectable: true,
            imageBuilder: (uri, title, alt) {
              final resolved = _resolveImageUri(uri);
              if (resolved == null) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: resolved.toString(),
                    fit: BoxFit.contain,
                    placeholder: (_, __) => Container(
                      height: 160,
                      decoration: BoxDecoration(
                        color: codeBackground,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primary.withAlpha(150),
                          ),
                        ),
                      ),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: codeBackground,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isDark
                              ? Colors.white.withAlpha(18)
                              : Colors.black.withAlpha(12),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.imageOff, size: 16, color: subColor),
                          const SizedBox(width: 6),
                          Text(
                            alt?.isNotEmpty == true ? alt! : 'Image unavailable',
                            style: TextStyle(color: subColor, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
            onTapLink: (text, href, title) async {
              if (href == null) return;
              // Anchor-only links — can't scroll to heading in flutter_markdown
              if (href.startsWith('#')) return;
              // Internal doc links (relative or absolute paths, not http/mailto)
              if (!href.startsWith('http') && !href.startsWith('mailto:')) {
                final cleanPath = href
                    .replaceAll('.md', '')
                    .replaceAll(RegExp(r'#[^#]*$'), '')
                    .trim();
                final normalised =
                    cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
                final item = _docPathMap[normalised];
                if (item != null) {
                  widget.onNavigateDoc?.call(item);
                  return;
                }
              }
              final uri = Uri.tryParse(href);
              if (uri != null && await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            styleSheet: MarkdownStyleSheet(
              p: TextStyle(
                  color: textColor, fontSize: 14.5, height: 1.65),
              h1: TextStyle(
                  color: textColor,
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  height: 1.3),
              h2: TextStyle(
                  color: textColor,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  height: 1.35),
              h3: TextStyle(
                  color: textColor,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  height: 1.4),
              h4: TextStyle(
                  color: textColor,
                  fontSize: 15,
                  fontWeight: FontWeight.w600),
              strong: TextStyle(
                  color: textColor, fontWeight: FontWeight.w700),
              em: TextStyle(
                  color: textColor, fontStyle: FontStyle.italic),
              code: TextStyle(
                  color: isDark ? Colors.greenAccent.shade100 : Colors.indigo,
                  fontSize: 13,
                  fontFamily: 'monospace'),
              codeblockDecoration: BoxDecoration(
                color: codeBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              codeblockPadding: const EdgeInsets.all(12),
              blockquoteDecoration: BoxDecoration(
                border: Border(
                  left: BorderSide(color: blockquoteBorder, width: 4),
                ),
                color: isDark
                    ? AppColors.primary.withAlpha(18)
                    : AppColors.primary.withAlpha(10),
              ),
              blockquotePadding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              listBullet: TextStyle(color: AppColors.primary),
              a: TextStyle(
                  color: AppColors.primary,
                  decoration: TextDecoration.underline,
                  decorationColor: AppColors.primary),
              horizontalRuleDecoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                      color: isDark
                          ? Colors.white.withAlpha(20)
                          : Colors.black.withAlpha(14),
                      width: 1),
                ),
              ),
            ),
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Title bar row (hamburger + title)
// ---------------------------------------------------------------------------

class _DocTitleBar extends StatelessWidget {
  const _DocTitleBar({required this.label, required this.isDark});
  final String label;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final divider = isDark
        ? Colors.white.withAlpha(14)
        : Colors.black.withAlpha(10);

    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: divider, width: 1)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Open docs navigation',
            icon: Icon(
              LucideIcons.menuSquare,
              size: 20,
              color: isDark ? Colors.white70 : Colors.black54,
            ),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : Colors.black87,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          IconButton(
            tooltip: 'Open in browser',
            icon: Icon(
              LucideIcons.externalLink,
              size: 18,
              color: isDark ? Colors.white54 : Colors.black38,
            ),
            onPressed: () async {
              final uri = Uri.parse(_docsBaseUrl);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
        ],
      ),
    );
  }
}
