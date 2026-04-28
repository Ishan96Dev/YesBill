import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/ai_settings.dart';
import '../../../data/models/chat_conversation.dart';
import '../../../data/models/user_profile.dart';
import '../../../providers/agent_provider.dart';
import '../../../providers/ai_settings_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/shell_chrome_provider.dart';
import '../../widgets/common/chat_identity_widgets.dart';
import '../../widgets/common/empty_state_view.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/pill_selector.dart';
import '../../widgets/common/shell_header_actions.dart';

const _agentSuggestedPrompts = <String>[
  'Summarize my overdue bills and suggest the best order to fix them.',
  'Create a plan for today\'s pending services and reminders.',
  'Prepare the next billing actions for my monthly services.',
  'Tell me what needs urgent attention this week.',
];

const _reasoningOptions = <({String value, String label})>[
  (value: 'none', label: 'No reasoning'),
  (value: 'low', label: 'Low'),
  (value: 'medium', label: 'Medium'),
  (value: 'high', label: 'High'),
  (value: 'xhigh', label: 'Max'),
];

// Stitch MD3 color tokens
const _agentMd3Primary = AppColors.primary;
const _agentMd3PrimaryContainer = Color(0xFFE0E7FF);
const _agentMd3Secondary = AppColors.info;
const _agentMd3SurfaceContainerLowest = AppColors.cardLight;
const _agentMd3SurfaceContainerLow = Color(0xFFEFF3FF);
const _agentMd3OnSurface = AppColors.textPrimaryLight;
const _agentMd3OnSurfaceVariant = AppColors.textSecondaryLight;
const _agentMd3OutlineVariant = Color(0xFFCBD5E1);

class AgentScreen extends ConsumerStatefulWidget {
  const AgentScreen({super.key});

  @override
  ConsumerState<AgentScreen> createState() => _AgentScreenState();
}

class _AgentScreenState extends ConsumerState<AgentScreen> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _creatingConversation = false;
  bool _deletingAll = false;
  String? _selectedReasoningEffortOverride;

  @override
  void dispose() {
    ref.read(shellBottomNavVisibleProvider.notifier).state = true;
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final aiSettingsAsync = ref.watch(aiSettingsListProvider);
    final conversationsAsync = ref.watch(agentConversationsProvider);
    final activeConversationId = ref.watch(activeAgentConversationIdProvider);
    final authUser = ref.watch(authProvider).user;
    final profile = ref.watch(userProfileProvider).valueOrNull;
    final userLabel = _resolveUserDisplayLabel(profile, authUser);
    final userEmail = authUser?.email;
    final userAvatarUrl = profile?.avatarUrl;
    final agentConversations =
        conversationsAsync.valueOrNull ?? const <ChatConversation>[];
    final selectedConversation = _findConversation(
      agentConversations,
      activeConversationId,
    );

    if (activeConversationId != null &&
        selectedConversation == null &&
        conversationsAsync.hasValue &&
        !conversationsAsync.isLoading &&
        !_creatingConversation) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final current = ref.read(activeAgentConversationIdProvider);
        if (current == activeConversationId) {
          ref.read(activeAgentConversationIdProvider.notifier).state = null;
        }
      });
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.transparent,
      onDrawerChanged: (isOpen) {
        ref.read(shellBottomNavVisibleProvider.notifier).state = !isOpen;
      },
      appBar: AppBar(
        leadingWidth: 56,
        titleSpacing: 8,
        leading: IconButton(
          tooltip: 'Agent history',
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          icon: const Icon(LucideIcons.panelLeftOpen),
        ),
        title: ChatTitleIdentity(
          title: 'Agentic AI',
          userLabel: userLabel,
          userEmail: userEmail,
        ),
        actions: const [
          ShellHeaderActions(currentLocation: '/agent'),
        ],
      ),
      drawer: Drawer(
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
        child: SafeArea(
          child: conversationsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => ErrorRetryView(
              error: error,
              onRetry: () => ref.invalidate(agentConversationsProvider),
            ),
            data: (conversations) => _AgentConversationDrawer(
              conversations: conversations,
              selectedId: selectedConversation?.id,
              deletingAll: _deletingAll,
              onNewSession: _startNewSession,
              onSelected: _selectConversation,
              onDeleteConversation: (conversation) =>
                  _deleteConversation(conversation, conversations),
              onDeleteAllConversations: _deleteAllConversations,
            ),
          ),
        ),
      ),
      body: aiSettingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorRetryView(
          error: error,
          onRetry: () => ref.invalidate(aiSettingsListProvider),
        ),
        data: (settings) {
          final activeSetting = _resolveActiveSetting(settings);
          final configured = activeSetting != null;
          final reasoningEffort = _resolveReasoningEffort(activeSetting);

          if (!configured) {
            return EmptyStateView(
              title: 'AI provider setup required',
              description:
                  'Configure your AI provider in Settings before using Agentic AI.',
              icon: LucideIcons.lock,
              actionLabel: 'Open AI settings',
              action: () => context.push('/settings/ai'),
            );
          }

          return conversationsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => ErrorRetryView(
              error: error,
              onRetry: () => ref.invalidate(agentConversationsProvider),
            ),
            data: (conversations) {
              final activeId = ref.watch(activeAgentConversationIdProvider);
              final currentConversation =
                  _findConversation(conversations, activeId);

              if (currentConversation == null) {
                return _AgentLandingState(
                  creatingConversation: _creatingConversation,
                  hasHistory: conversations.isNotEmpty,
                  reasoningLabel: _reasoningLabel(reasoningEffort),
                  onOpenHistory: conversations.isEmpty
                      ? null
                      : () => _scaffoldKey.currentState?.openDrawer(),
                  onNewSession: _startNewSession,
                  onSuggestedPrompt: (prompt) => _sendMessage(
                    reasoningEffort: reasoningEffort,
                    presetContent: prompt,
                  ),
                  onSelectReasoning: (value) {
                    setState(() {
                      _selectedReasoningEffortOverride = value;
                    });
                  },
                  reasoningValue: reasoningEffort,
                );
              }

              final state = ref.watch(agentProvider(currentConversation.id));
              final messages = state.messages;
              final isBusy = state is AgentStreaming || _creatingConversation;
              final waitingForConfirmation = state is AgentAwaitingConfirmation;

              if (state is AgentStreaming ||
                  state is AgentAwaitingConfirmation) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  _scrollToBottom();
                });
              }

              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: _AgentSessionBanner(
                      sessionCount: conversations.length,
                      reasoningLabel: _reasoningLabel(reasoningEffort),
                      onNewSession: _startNewSession,
                      onSelectReasoning: (value) {
                        setState(() {
                          _selectedReasoningEffortOverride = value;
                        });
                      },
                      reasoningValue: reasoningEffort,
                    ),
                  ),
                  if (state is AgentError && messages.isEmpty)
                    Expanded(
                      child: ErrorRetryView(
                        error: state.message,
                        onRetry: () => ref
                            .read(
                                agentProvider(currentConversation.id).notifier)
                            .reload(),
                      ),
                    )
                  else ...[
                    if (state is AgentError)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                        child: _AgentErrorBanner(message: state.message),
                      ),
                    Expanded(
                      child: Builder(
                        builder: (context) {
                          final waitingForConfirmation =
                              state is AgentAwaitingConfirmation;

                          if (state is AgentLoading && messages.isEmpty) {
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          if (messages.isEmpty && !waitingForConfirmation) {
                            return _AgentConversationEmptyState(
                              onSuggestedPrompt: (prompt) => _sendMessage(
                                reasoningEffort: reasoningEffort,
                                conversationId: currentConversation.id,
                                presetContent: prompt,
                              ),
                            );
                          }

                          return ListView.builder(
                            controller: _scrollCtrl,
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                            itemCount: messages.length +
                                (waitingForConfirmation ? 1 : 0),
                            itemBuilder: (_, index) {
                              if (waitingForConfirmation &&
                                  index == messages.length) {
                                final awaitingState =
                                    state as AgentAwaitingConfirmation;
                                return Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: _AgentConfirmationCard(
                                    description: awaitingState.description,
                                    payload: awaitingState.payload,
                                    onApprove: () => ref
                                        .read(agentProvider(
                                                currentConversation.id)
                                            .notifier)
                                        .confirmAction(awaitingState.actionId),
                                    onCancel: () => ref
                                        .read(agentProvider(
                                                currentConversation.id)
                                            .notifier)
                                        .cancelAction(awaitingState.actionId),
                                  ),
                                );
                              }
                              final message = messages[index];
                              return _AgentMessageBubble(
                                key: ValueKey(message.id),
                                message: message,
                                userAvatarUrl: userAvatarUrl,
                                userLabel: userLabel,
                              );
                            },
                          );
                        },
                      ),
                    ),
                    _AgentComposer(
                      controller: _ctrl,
                      enabled: configured && !waitingForConfirmation,
                      busy: isBusy,
                      onSend: () => _sendMessage(
                        reasoningEffort: reasoningEffort,
                        conversationId: currentConversation.id,
                      ),
                      onNewConversation: _startNewSession,
                    ),
                  ],
                ],
              );
            },
          );
        },
      ),
    );
  }

  AiSettings? _resolveActiveSetting(List<AiSettings> settings) {
    final active = settings.where((setting) => setting.isActive).toList();
    if (active.isEmpty) return null;

    active.sort((a, b) {
      final aDate =
          a.updatedAt ?? a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate =
          b.updatedAt ?? b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bDate.compareTo(aDate);
    });

    return active.first;
  }

  String _resolveReasoningEffort(AiSettings? activeSetting) {
    return _selectedReasoningEffortOverride ??
        activeSetting?.defaultReasoningEffort ??
        'none';
  }

  String _reasoningLabel(String value) {
    for (final option in _reasoningOptions) {
      if (option.value == value) return option.label;
    }
    return 'No reasoning';
  }

  String _resolveUserDisplayLabel(UserProfile? profile, User? user) {
    final profileLabel = profile?.displayName?.trim().isNotEmpty == true
        ? profile!.displayName!.trim()
        : profile?.fullName?.trim().isNotEmpty == true
            ? profile!.fullName!.trim()
            : null;
    if (profileLabel != null) return profileLabel;

    final metadata = user?.userMetadata;
    for (final key in ['full_name', 'name', 'display_name']) {
      final value = metadata?[key];
      if (value is String && value.trim().isNotEmpty) return value.trim();
    }

    final email = user?.email;
    if (email != null && email.trim().isNotEmpty) {
      return email.split('@').first;
    }
    return 'You';
  }

  ChatConversation? _findConversation(
    List<ChatConversation> conversations,
    String? id,
  ) {
    if (id == null) return null;
    for (final conversation in conversations) {
      if (conversation.id == id) return conversation;
    }
    return null;
  }

  Future<void> _startNewSession() async {
    _ctrl.clear();
    _scaffoldKey.currentState?.closeDrawer();
    final conversationId = await _createAgentConversation();
    if (conversationId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
  }

  void _selectConversation(String id) {
    ref.read(activeAgentConversationIdProvider.notifier).state = id;
    _scaffoldKey.currentState?.closeDrawer();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  Future<String?> _ensureConversation() async {
    final existing = ref.read(activeAgentConversationIdProvider);
    if (existing != null) return existing;
    return _createAgentConversation();
  }

  Future<String?> _createAgentConversation() async {
    if (_creatingConversation) return null;

    setState(() => _creatingConversation = true);
    try {
      final conversation =
          await ref.read(chatRemoteDsProvider).createConversation(
                convType: 'agent',
                title: 'YesBill Assistant',
              );
      ref.read(activeAgentConversationIdProvider.notifier).state =
          conversation.id;
      // Invalidate the list and await the reload so the new conversation
      // is present before _creatingConversation is set to false.
      // This prevents the landing-state guard from clearing the active ID
      // while the list still shows stale (empty) data.
      ref.invalidate(agentConversationsProvider);
      try {
        await ref.read(agentConversationsProvider.future);
      } catch (_) {
        // Ignore list-reload failure; conversation was created successfully.
      }
      return conversation.id;
    } catch (_) {
      _showSnack('Unable to start agent session');
      return null;
    } finally {
      if (mounted) setState(() => _creatingConversation = false);
    }
  }

  Future<void> _sendMessage({
    required String reasoningEffort,
    String? conversationId,
    String? presetContent,
  }) async {
    final content = (presetContent ?? _ctrl.text).trim();
    if (content.isEmpty) return;

    final targetConversationId = conversationId ?? await _ensureConversation();
    if (targetConversationId == null) return;

    if (presetContent == null) {
      _ctrl.clear();
    }

    await ref.read(agentProvider(targetConversationId).notifier).sendMessage(
          content: content,
          reasoningEffort: reasoningEffort,
          userTimezone:
              ref.read(userProfileProvider).valueOrNull?.timezone ?? 'UTC',
        );

    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  Future<void> _deleteConversation(
    ChatConversation conversation,
    List<ChatConversation> conversations,
  ) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete session?'),
            content: Text(
              'This will permanently remove “${conversation.title.trim().isEmpty ? 'Untitled session' : conversation.title}”.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: FilledButton.styleFrom(backgroundColor: AppColors.error),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirmed || !mounted) return;

    try {
      await ref.read(chatRemoteDsProvider).deleteConversation(conversation.id);
      final activeId = ref.read(activeAgentConversationIdProvider);
      if (activeId == conversation.id) {
        ref.read(activeAgentConversationIdProvider.notifier).state = null;
      }
      ref.invalidate(agentConversationsProvider);
      _showSnack('Session deleted');

      if (conversations.length == 1) {
        _scaffoldKey.currentState?.closeDrawer();
      }
    } catch (_) {
      _showSnack('Unable to delete session');
    }
  }

  Future<void> _deleteAllConversations() async {
    if (_deletingAll) return;

    final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Clear all agent sessions?'),
            content: const Text(
              'This will permanently delete every Agentic AI conversation.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: FilledButton.styleFrom(backgroundColor: AppColors.error),
                child: const Text('Delete all'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirmed || !mounted) return;

    setState(() => _deletingAll = true);
    try {
      await ref
          .read(chatRemoteDsProvider)
          .deleteAllConversations(convType: 'agent');
      ref.read(activeAgentConversationIdProvider.notifier).state = null;
      ref.invalidate(agentConversationsProvider);
      _showSnack('All agent sessions deleted');
      _scaffoldKey.currentState?.closeDrawer();
    } catch (_) {
      _showSnack('Unable to clear agent sessions');
    } finally {
      if (mounted) setState(() => _deletingAll = false);
    }
  }

  void _scrollToBottom() {
    if (!_scrollCtrl.hasClients) return;
    _scrollCtrl.animateTo(
      _scrollCtrl.position.maxScrollExtent,
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOut,
    );
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _AgentLandingState extends StatelessWidget {
  const _AgentLandingState({
    required this.creatingConversation,
    required this.hasHistory,
    required this.reasoningLabel,
    required this.onNewSession,
    required this.onSuggestedPrompt,
    required this.onSelectReasoning,
    required this.reasoningValue,
    this.onOpenHistory,
  });

  final bool creatingConversation;
  final bool hasHistory;
  final String reasoningLabel;
  final VoidCallback onNewSession;
  final ValueChanged<String> onSuggestedPrompt;
  final ValueChanged<String> onSelectReasoning;
  final String reasoningValue;
  final VoidCallback? onOpenHistory;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: _agentMd3SurfaceContainerLowest,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F2D3337),
                blurRadius: 32,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const YesBillLogoAvatar(size: 52),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'YesBill Assistant',
                          style: AppTextStyles.h3.copyWith(
                            color: _agentMd3Primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF69F6B8),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Online and ready to plan actions',
                              style: AppTextStyles.bodySm.copyWith(
                                color: _agentMd3OnSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                'Use Agentic AI to plan service reminders, review bills, and confirm important actions safely.',
                style: AppTextStyles.body.copyWith(
                  color: _agentMd3OnSurfaceVariant,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _AgentMetaChip(
                    icon: LucideIcons.brain,
                    label: reasoningLabel,
                  ),
                  if (hasHistory && onOpenHistory != null)
                    _AgentMetaChip(
                      icon: LucideIcons.history,
                      label: 'Past sessions',
                      onTap: onOpenHistory,
                    ),
                ],
              ),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 420;

                  if (compact) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        FilledButton.icon(
                          onPressed: creatingConversation ? null : onNewSession,
                          style: FilledButton.styleFrom(
                            backgroundColor: _agentMd3Primary,
                            foregroundColor: Colors.white,
                            shape: const StadiumBorder(),
                          ),
                          icon: creatingConversation
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(LucideIcons.plus, size: 18),
                          label: const Text('New session'),
                        ),
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: _ReasoningSelectorChip(
                            label: reasoningLabel,
                            value: reasoningValue,
                            onSelected: onSelectReasoning,
                          ),
                        ),
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: creatingConversation ? null : onNewSession,
                          style: FilledButton.styleFrom(
                            backgroundColor: _agentMd3Primary,
                            foregroundColor: Colors.white,
                            shape: const StadiumBorder(),
                          ),
                          icon: creatingConversation
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(LucideIcons.plus, size: 18),
                          label: const Text('New session'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      _ReasoningSelectorChip(
                        label: reasoningLabel,
                        value: reasoningValue,
                        onSelected: onSelectReasoning,
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'SUGGESTED PROMPTS',
          style: AppTextStyles.labelSm.copyWith(
            color: _agentMd3OnSurfaceVariant,
            letterSpacing: 0.8,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        ..._agentSuggestedPrompts.map(
          (prompt) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => onSuggestedPrompt(prompt),
                child: Ink(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _agentMd3SurfaceContainerLowest,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: _agentMd3OutlineVariant.withOpacity(0.4)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x082D3337),
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: _agentMd3PrimaryContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(
                          LucideIcons.sparkles,
                          size: 16,
                          color: _agentMd3Primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          prompt,
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _agentMd3OnSurface,
                          ),
                        ),
                      ),
                      const Icon(LucideIcons.chevronRight,
                          size: 16, color: _agentMd3OnSurfaceVariant),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AgentSessionBanner extends StatelessWidget {
  const _AgentSessionBanner({
    required this.sessionCount,
    required this.reasoningLabel,
    required this.onNewSession,
    required this.onSelectReasoning,
    required this.reasoningValue,
  });

  final int sessionCount;
  final String reasoningLabel;
  final VoidCallback onNewSession;
  final ValueChanged<String> onSelectReasoning;
  final String reasoningValue;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _agentMd3SurfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _agentMd3OutlineVariant.withOpacity(0.28)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 18,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 460;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const YesBillLogoAvatar(size: 42),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Agentic AI session',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.w700,
                            color: _agentMd3OnSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$sessionCount saved session${sessionCount == 1 ? '' : 's'}',
                          style: AppTextStyles.bodySm.copyWith(
                            color: _agentMd3OnSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (compact) ...[
                _ReasoningSelectorChip(
                  label: reasoningLabel,
                  value: reasoningValue,
                  onSelected: onSelectReasoning,
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: onNewSession,
                    icon: const Icon(LucideIcons.plus, size: 16),
                    label: const Text('Start new session'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _agentMd3Primary,
                      side: BorderSide(
                        color: _agentMd3OutlineVariant.withOpacity(0.35),
                      ),
                    ),
                  ),
                ),
              ] else
                Row(
                  children: [
                    _ReasoningSelectorChip(
                      label: reasoningLabel,
                      value: reasoningValue,
                      onSelected: onSelectReasoning,
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: onNewSession,
                      icon: const Icon(LucideIcons.plus, size: 16),
                      label: const Text('New'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _agentMd3Primary,
                        side: BorderSide(
                          color: _agentMd3OutlineVariant.withOpacity(0.35),
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          );
        },
      ),
    );
  }
}

class _ReasoningSelectorChip extends StatelessWidget {
  const _ReasoningSelectorChip({
    required this.label,
    required this.value,
    required this.onSelected,
  });

  final String label;
  final String value;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return PillSelectorChip<String>(
      icon: LucideIcons.brain,
      label: label,
      value: value,
      sheetTitle: 'Choose reasoning level',
      onSelected: onSelected,
      options: _reasoningOptions
          .map(
            (option) => PillSelectorOption<String>(
              value: option.value,
              label: option.label,
            ),
          )
          .toList(),
    );
  }
}

class _AgentMetaChip extends StatelessWidget {
  const _AgentMetaChip({
    required this.icon,
    required this.label,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: _agentMd3SurfaceContainerLowest,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: _agentMd3OutlineVariant.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: _agentMd3Primary),
              const SizedBox(width: 6),
              Text(
                label,
                style: AppTextStyles.labelSm.copyWith(
                  color: _agentMd3OnSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AgentDrawerNavItem extends StatelessWidget {
  const _AgentDrawerNavItem({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor:
          active ? _agentMd3Primary.withOpacity(0.08) : Colors.transparent,
      leading: Icon(
        icon,
        size: 18,
        color: active ? _agentMd3Primary : _agentMd3OnSurfaceVariant,
      ),
      title: Text(
        label,
        style: AppTextStyles.body.copyWith(
          fontWeight: active ? FontWeight.w700 : FontWeight.w500,
          color: active ? _agentMd3Primary : _agentMd3OnSurface,
        ),
      ),
    );
  }
}

class _AgentConversationDrawer extends StatelessWidget {
  const _AgentConversationDrawer({
    required this.conversations,
    required this.selectedId,
    required this.deletingAll,
    required this.onNewSession,
    required this.onSelected,
    required this.onDeleteConversation,
    required this.onDeleteAllConversations,
  });

  final List<ChatConversation> conversations;
  final String? selectedId;
  final bool deletingAll;
  final VoidCallback onNewSession;
  final ValueChanged<String> onSelected;
  final Future<void> Function(ChatConversation conversation)
      onDeleteConversation;
  final Future<void> Function() onDeleteAllConversations;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 16, 16),
          color: Theme.of(context).colorScheme.surface,
          child: Row(
            children: [
              const YesBillLogoAvatar(size: 24),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Agentic AI',
                  style: TextStyle(
                    color: _agentMd3Primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 20,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 18),
                color: _agentMd3OnSurfaceVariant,
                onPressed: () => Navigator.of(context).pop(),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onNewSession,
                  style: FilledButton.styleFrom(
                    backgroundColor: _agentMd3Primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                    elevation: 0,
                    shadowColor: Colors.transparent,
                  ),
                  icon: const Icon(LucideIcons.plus, size: 16),
                  label: const Text('New session'),
                ),
              ),
              const SizedBox(height: 4),
              _AgentDrawerNavItem(
                icon: LucideIcons.history,
                label: 'History',
                active: true,
                onTap: () {},
              ),
              _AgentDrawerNavItem(
                icon: LucideIcons.messageSquare,
                label: 'Ask AI',
                active: false,
                onTap: () {
                  Navigator.of(context).pop();
                  context.go('/chat');
                },
              ),
              _AgentDrawerNavItem(
                icon: LucideIcons.settings2,
                label: 'Preferences',
                active: false,
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/settings/ai');
                },
              ),
            ],
          ),
        ),
        if (conversations.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Text(
              'RECENT',
              style: AppTextStyles.labelSm.copyWith(
                color: _agentMd3OnSurfaceVariant,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
              ),
            ),
          ),
        Expanded(
          child: conversations.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          LucideIcons.messageCircle,
                          size: 42,
                          color: _agentMd3OutlineVariant,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'No agent sessions yet',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _agentMd3OnSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Start a new session to plan actions with AI',
                          style: AppTextStyles.caption.copyWith(
                            color: _agentMd3OnSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                  itemCount: conversations.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (context, index) {
                    final conversation = conversations[index];
                    final selected = conversation.id == selectedId;

                    return Material(
                      color: selected
                          ? _agentMd3Primary.withOpacity(0.08)
                          : _agentMd3SurfaceContainerLow,
                      borderRadius: BorderRadius.circular(16),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => onSelected(conversation.id),
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(14, 12, 4, 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: selected
                                ? Border.all(
                                    color: _agentMd3Primary.withOpacity(0.28),
                                  )
                                : null,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      conversation.title.trim().isEmpty
                                          ? 'Untitled session'
                                          : conversation.title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTextStyles.body.copyWith(
                                        fontWeight: selected
                                            ? FontWeight.w700
                                            : FontWeight.w600,
                                        color: selected
                                            ? _agentMd3Primary
                                            : _agentMd3OnSurface,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      _agentRelativeTime(
                                        conversation.updatedAt ??
                                            conversation.createdAt,
                                      ),
                                      style: AppTextStyles.caption.copyWith(
                                        color: _agentMd3OnSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                tooltip: 'Delete session',
                                onPressed: () =>
                                    onDeleteConversation(conversation),
                                icon: const Icon(LucideIcons.trash2, size: 18),
                                color: _agentMd3OnSurfaceVariant,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
        Container(
          color: Theme.of(context).colorScheme.surface,
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: conversations.isEmpty || deletingAll
                  ? null
                  : onDeleteAllConversations,
              icon: deletingAll
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.trash2, size: 16),
              label: const Text('Clear all sessions'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: BorderSide(
                  color: AppColors.error.withOpacity(0.28),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AgentConversationEmptyState extends StatelessWidget {
  const _AgentConversationEmptyState({required this.onSuggestedPrompt});

  final ValueChanged<String> onSuggestedPrompt;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: _agentMd3SurfaceContainerLowest,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: _agentMd3OutlineVariant.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'What would you like the agent to do?',
                style: AppTextStyles.h3.copyWith(
                  fontWeight: FontWeight.w700,
                  color: _agentMd3OnSurface,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Try one of these actions to kick off the session.',
                style: AppTextStyles.body.copyWith(
                  color: _agentMd3OnSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        ..._agentSuggestedPrompts.map(
          (prompt) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => onSuggestedPrompt(prompt),
              child: Ink(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _agentMd3SurfaceContainerLowest,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: _agentMd3OutlineVariant.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _agentMd3PrimaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        LucideIcons.sparkles,
                        size: 16,
                        color: _agentMd3Primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        prompt,
                        style: AppTextStyles.body.copyWith(
                          fontWeight: FontWeight.w600,
                          color: _agentMd3OnSurface,
                        ),
                      ),
                    ),
                    const Icon(LucideIcons.chevronRight,
                        size: 16, color: _agentMd3OnSurfaceVariant),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AgentConfirmationCard extends StatelessWidget {
  const _AgentConfirmationCard({
    required this.description,
    required this.payload,
    required this.onApprove,
    required this.onCancel,
  });

  final String description;
  final Map<String, dynamic> payload;
  final Future<void> Function() onApprove;
  final Future<void> Function() onCancel;

  @override
  Widget build(BuildContext context) {
    final diff = payload['diff'] as Map<String, dynamic>?;
    final diffRows = diff?['rows'] as List<dynamic>?;

    // Normalize to list of row maps
    List<Map<String, dynamic>> rows = [];
    if (diffRows != null) {
      rows = diffRows.whereType<Map<String, dynamic>>().toList();
    } else if (diff != null) {
      rows = [diff];
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFCD34D)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  LucideIcons.shieldCheck,
                  color: Color(0xFFD97706),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Action Required',
                      style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Review this change before the agent executes it.',
                      style: AppTextStyles.bodySm.copyWith(
                        color: const Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: AppTextStyles.body.copyWith(
              color: const Color(0xFF78350F),
              height: 1.45,
            ),
          ),
          if (rows.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: rows.map((row) {
                  final label = row['label'] as String? ?? '';
                  final oldVal = row['old']?.toString() ?? '';
                  final newVal = row['new']?.toString() ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        if (label.isNotEmpty) ...[
                          Text(
                            label,
                            style: AppTextStyles.labelSm.copyWith(
                              color: const Color(0xFF92400E),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 10),
                        ],
                        if (oldVal.isNotEmpty) ...[
                          Text(
                            oldVal,
                            style: AppTextStyles.labelSm.copyWith(
                              color: AppColors.error,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 6),
                            child: Icon(
                              LucideIcons.arrowRight,
                              size: 12,
                              color: Color(0xFFB45309),
                            ),
                          ),
                        ],
                        Text(
                          newVal,
                          style: AppTextStyles.labelSm.copyWith(
                            color: AppColors.success,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: onApprove,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.success,
                  ),
                  icon: const Icon(LucideIcons.check, size: 16),
                  label: const Text('Confirm Changes'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onCancel,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: BorderSide(color: AppColors.error.withOpacity(0.35)),
                  ),
                  icon: const Icon(LucideIcons.x, size: 16),
                  label: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AgentErrorBanner extends StatelessWidget {
  const _AgentErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDA4AF)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: AppTextStyles.bodySm.copyWith(
                color: const Color(0xFFBE123C),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AgentMessageBubble extends StatelessWidget {
  const _AgentMessageBubble({
    super.key,
    required this.message,
    required this.userLabel,
    this.userAvatarUrl,
  });

  final ChatMessage message;
  final String userLabel;
  final String? userAvatarUrl;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final hasThought = (message.reasoning ?? '').trim().isNotEmpty ||
        message.thinkingDurationSeconds != null;
    final bubbleColor =
        isUser ? _agentMd3Primary : _agentMd3SurfaceContainerLowest;
    final textColor = isUser ? Colors.white : _agentMd3OnSurface;
    final radius = isUser
        ? const BorderRadius.only(
            topLeft: Radius.circular(18),
            bottomLeft: Radius.circular(18),
            bottomRight: Radius.circular(18),
            topRight: Radius.circular(4),
          )
        : const BorderRadius.only(
            topRight: Radius.circular(18),
            bottomLeft: Radius.circular(18),
            bottomRight: Radius.circular(18),
            topLeft: Radius.circular(4),
          );

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            const YesBillLogoAvatar(size: 32),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 340),
              child: Column(
                crossAxisAlignment:
                    isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (!isUser)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        'YesBill Assistant',
                        style: AppTextStyles.labelSm.copyWith(
                          color: _agentMd3OnSurfaceVariant,
                        ),
                      ),
                    ),
                  if (hasThought && !isUser)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: _AgentReasoningPanel(
                        reasoning: message.reasoning ?? '',
                        thinkingDurationSeconds: message.thinkingDurationSeconds,
                        autoExpand: message.isStreaming,
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      borderRadius: radius,
                      boxShadow: isUser
                          ? const [
                              BoxShadow(
                                color: const Color(0x404A4BD7),
                                blurRadius: 24,
                                offset: const Offset(0, 8),
                              ),
                            ]
                          : const [
                              BoxShadow(
                                color: Color(0x082D3337),
                                blurRadius: 12,
                                offset: Offset(0, 3),
                              ),
                            ],
                    ),
                    child: isUser
                        ? Text(
                            message.content,
                            style: AppTextStyles.body.copyWith(
                              color: textColor,
                              height: 1.45,
                            ),
                          )
                        : MarkdownBody(
                            data: message.content.isEmpty && message.isStreaming
                                ? 'Thinking…'
                                : message.content,
                            selectable: true,
                            onTapLink: (text, href, title) async {
                              if (href == null) return;
                              if (href.startsWith('/')) {
                                context.go(href);
                                return;
                              }
                              final uri = Uri.tryParse(href);
                              if (uri != null && await canLaunchUrl(uri)) {
                                await launchUrl(
                                  uri,
                                  mode: LaunchMode.externalApplication,
                                );
                              }
                            },
                            styleSheet: MarkdownStyleSheet.fromTheme(
                              Theme.of(context),
                            ).copyWith(
                              p: AppTextStyles.body.copyWith(
                                color: _agentMd3OnSurface,
                              ),
                              a: AppTextStyles.body.copyWith(
                                color: _agentMd3Primary,
                                decoration: TextDecoration.underline,
                              ),
                              code: AppTextStyles.body.copyWith(
                                color: _agentMd3OnSurface,
                                fontFamily: 'monospace',
                                backgroundColor: const Color(0x14ACB3B7),
                              ),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            ChatUserAvatar(
              userLabel: userLabel,
              avatarUrl: userAvatarUrl,
              size: 32,
            ),
          ],
        ],
      ),
    );
  }
}

class _AgentReasoningPanel extends StatefulWidget {
  const _AgentReasoningPanel(
      {required this.reasoning,
      this.thinkingDurationSeconds,
      this.autoExpand = false});

  final String reasoning;
  final int? thinkingDurationSeconds;
  final bool autoExpand;

  @override
  State<_AgentReasoningPanel> createState() => _AgentReasoningPanelState();
}

class _AgentReasoningPanelState extends State<_AgentReasoningPanel> {
  bool _expanded = false;
  bool _userToggled = false;

  @override
  void initState() {
    super.initState();
    _expanded = widget.autoExpand;
  }

  @override
  void didUpdateWidget(_AgentReasoningPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_userToggled && widget.autoExpand && !_expanded) {
      setState(() => _expanded = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasReasoningText = widget.reasoning.trim().isNotEmpty;

    if (!hasReasoningText && widget.thinkingDurationSeconds != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: _agentMd3SurfaceContainerLow.withOpacity(0.7),
          borderRadius: BorderRadius.circular(12),
          border: Border(
            left: BorderSide(
              color: _agentMd3Secondary.withOpacity(0.2),
              width: 2,
            ),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.brain, size: 14, color: _agentMd3Secondary),
            const SizedBox(width: 8),
            Text(
              'Thought · ${widget.thinkingDurationSeconds}s',
              style: AppTextStyles.labelSm.copyWith(
                color: _agentMd3Secondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: _agentMd3SurfaceContainerLow.withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(
            color: _agentMd3Secondary.withOpacity(0.2),
            width: 2,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => setState(() {
              _expanded = !_expanded;
              _userToggled = true;
            }),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    LucideIcons.brain,
                    size: 14,
                    color: _agentMd3Secondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _expanded ? 'Hide thoughts' : 'View thoughts',
                    style: AppTextStyles.labelSm.copyWith(
                      color: _agentMd3Secondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    _expanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 13,
                    color: _agentMd3Secondary,
                  ),
                ],
              ),
            ),
          ),
          if (_expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Text(
                widget.reasoning,
                style: AppTextStyles.caption.copyWith(
                  color: _agentMd3OnSurfaceVariant,
                  height: 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _AgentComposer extends StatelessWidget {
  const _AgentComposer({
    required this.controller,
    required this.enabled,
    required this.busy,
    required this.onSend,
    required this.onNewConversation,
  });

  final TextEditingController controller;
  final bool enabled;
  final bool busy;
  final VoidCallback onSend;
  final VoidCallback onNewConversation;

  @override
  Widget build(BuildContext context) {
    final canSend = enabled && !busy;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: _agentMd3SurfaceContainerLowest,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: _agentMd3OutlineVariant.withOpacity(0.3)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A2D3337),
                blurRadius: 18,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              IconButton(
                  onPressed: onNewConversation,
                  icon: const Icon(
                    LucideIcons.plusCircle,
                    size: 20,
                    color: _agentMd3OnSurfaceVariant,
                  ),
                  style: IconButton.styleFrom(
                    backgroundColor: _agentMd3SurfaceContainerLow,
                    fixedSize: const Size(42, 42),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: controller,
                  enabled: enabled,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: canSend ? (_) => onSend() : null,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    hintText: enabled
                        ? (busy
                            ? 'Thinking...'
                            : 'Ask the agent to plan or execute actions…')
                        : 'Confirm or cancel the pending action above…',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: canSend
                      ? _agentMd3Primary
                      : _agentMd3OutlineVariant.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: canSend
                      ? [
                          BoxShadow(
                            color: _agentMd3Primary.withOpacity(0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : [],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: canSend ? onSend : null,
                    child: Center(
                      child: busy
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Icon(
                              LucideIcons.send,
                              size: 16,
                              color: canSend
                                  ? Colors.white
                                  : _agentMd3OnSurfaceVariant,
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _agentRelativeTime(DateTime? time) {
  if (time == null) return 'Just now';
  final diff = DateTime.now().difference(time);
  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${time.day}/${time.month}/${time.year}';
}
