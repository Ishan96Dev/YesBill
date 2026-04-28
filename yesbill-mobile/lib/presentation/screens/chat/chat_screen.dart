import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/ai_provider_info.dart';
import '../../../data/models/ai_settings.dart';
import '../../../data/models/chat_conversation.dart';
import '../../../data/models/user_profile.dart';
import '../../../providers/ai_settings_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/chat_provider.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/shell_chrome_provider.dart';
import '../../widgets/common/chat_identity_widgets.dart';
import '../../widgets/common/empty_state_view.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/pill_selector.dart';
import '../../widgets/common/shell_header_actions.dart';

const _suggestedPrompts = <String>[
  'What are my active services?',
  'Show me my latest bills',
  'What is my spending this month?',
  'Summarize my pending bills for this month',
];

const _reasoningOptions = <({String value, String label})>[
  (value: 'none', label: 'No reasoning'),
  (value: 'low', label: 'Low'),
  (value: 'medium', label: 'Medium'),
  (value: 'high', label: 'High'),
  (value: 'xhigh', label: 'Max'),
];

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, this.convId});
  final String? convId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _creatingConversation = false;
  bool _exportingAll = false;
  bool _deletingAll = false;
  bool _isDraftConversation = false;
  String? _selectedModelOverride;
  String? _selectedReasoningEffortOverride;

  @override
  void initState() {
    super.initState();
    if (widget.convId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(activeConversationIdProvider.notifier).state = widget.convId;
      });
    } else {
      // No specific conversation requested — always open as a fresh draft.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _isDraftConversation = true);
      });
    }
  }

  @override
  void dispose() {
    ref.read(shellBottomNavVisibleProvider.notifier).state = true;
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final aiSettingsAsync = ref.watch(aiSettingsListProvider);
    final aiCatalog = ref.watch(aiProviderCatalogProvider).valueOrNull ??
        const <AiProviderInfo>[];
    final convsAsync = ref.watch(conversationsProvider);
    final activeConvId = ref.watch(activeConversationIdProvider);
    final authUser = ref.watch(authProvider).user;
    final profile = ref.watch(userProfileProvider).valueOrNull;
    final userLabel = _resolveUserDisplayLabel(profile, authUser);
    final userEmail = authUser?.email;
    final userAvatarUrl = profile?.avatarUrl;
    final conversations = convsAsync.valueOrNull ?? const <ChatConversation>[];
    final selectedConv = !_isDraftConversation && conversations.isNotEmpty
        ? _resolveConversation(
            conversations: conversations,
            activeConvId: activeConvId,
          )
        : null;

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
          tooltip: 'Conversations',
          icon: const Icon(LucideIcons.panelLeftOpen),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: ChatTitleIdentity(
          title: 'Ask AI',
          userLabel: userLabel,
          userEmail: userEmail,
        ),
        actions: const [
          ShellHeaderActions(currentLocation: '/chat'),
        ],
      ),
      drawer: Drawer(
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
        child: SafeArea(
          child: _ConversationDrawer(
            conversations: conversations,
            selectedId: selectedConv?.id,
            creatingConversation: _creatingConversation,
            exportingAll: _exportingAll,
            deletingAll: _deletingAll,
            onSelected: (id) {
              setState(() => _isDraftConversation = false);
              ref.read(activeConversationIdProvider.notifier).state = id;
              _scaffoldKey.currentState?.closeDrawer();
            },
            onNewConversation: _startNewConversation,
            onRenameConversation: _renameConversation,
            onDeleteConversation: (conversation) =>
                _deleteConversation(conversation, conversations),
            onDownloadConversation: _downloadConversation,
            onDownloadAllConversations: _downloadAllConversations,
            onDeleteAllConversations: _deleteAllConversations,
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
          final activeProvider =
              _resolveActiveProvider(activeSetting, aiCatalog);
          final availableModels =
              activeProvider?.models ?? const <AiProviderModelInfo>[];
          final selectedModelId =
              _resolveSelectedModelId(activeSetting, availableModels);
          final selectedModel = _resolveSelectedModelInfo(
            selectedModelId,
            availableModels,
          );
          final modelSupportsReasoning =
              selectedModel?.reasoningSupported ?? false;
          final reasoningEffort = _resolveReasoningEffort(
            activeSetting,
            modelSupportsReasoning,
          );
          final configured = activeSetting != null;

          return convsAsync.when(
            skipLoadingOnReload: true,
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => ErrorRetryView(
              error: error,
              onRetry: () => ref.invalidate(conversationsProvider),
            ),
            data: (conversations) {
              if (conversations.isEmpty && !_isDraftConversation) {
                if (!configured) {
                  return EmptyStateView(
                    title: 'AI provider setup required',
                    description:
                        'Configure your AI provider in Settings to start using Ask AI.',
                    icon: LucideIcons.lock,
                    actionLabel: 'Open AI settings',
                    action: () => context.push('/settings/ai'),
                  );
                }

                return _AskAiLandingState(
                  creatingConversation: _creatingConversation,
                  onStartConversation: _startNewConversation,
                  onSuggestedPrompt: (prompt) => _sendMessage(
                    presetContent: prompt,
                    modelOverride: selectedModelId,
                    reasoningEffort: reasoningEffort,
                  ),
                );
              }

              final selectedConversation = _resolveConversation(
                conversations: conversations,
                activeConvId: activeConvId,
              );

              if (_isDraftConversation || selectedConversation == null) {
                return Column(
                  children: [
                    if (configured)
                      _ChatControlBar(
                        providerName:
                            activeProvider?.name ?? activeSetting.provider,
                        selectedModelLabel: selectedModel?.name ??
                            selectedModelId ??
                            'Default model',
                        selectedReasoningLabel:
                            _reasoningLabel(reasoningEffort),
                        showReasoning: modelSupportsReasoning,
                        modelOptions: availableModels,
                        reasoningValue: reasoningEffort,
                        selectedModelId: selectedModelId,
                        onSelectModel: (value) {
                          setState(() => _selectedModelOverride = value);
                        },
                        onSelectReasoning: (value) {
                          setState(
                            () => _selectedReasoningEffortOverride = value,
                          );
                        },
                      ),
                    Expanded(
                      child: _ConversationStarterState(
                        onSuggestedPrompt: (prompt) => _sendMessage(
                          presetContent: prompt,
                          modelOverride: selectedModelId,
                          reasoningEffort: reasoningEffort,
                        ),
                      ),
                    ),
                    _ChatComposer(
                      controller: _textCtrl,
                      enabled: configured,
                      onNewConversation: _startNewConversation,
                      onSend: () => _sendMessage(
                        modelOverride: selectedModelId,
                        reasoningEffort: reasoningEffort,
                      ),
                    ),
                  ],
                );
              }

              final messages =
                  ref.watch(chatMessagesProvider(selectedConversation.id));
              final messagesLoading = ref
                  .watch(chatMessagesLoadingProvider(selectedConversation.id));
              final messagesError =
                  ref.watch(chatMessagesErrorProvider(selectedConversation.id));

              return Column(
                children: [
                  if (configured)
                    _ChatControlBar(
                      providerName:
                          activeProvider?.name ?? activeSetting.provider,
                      selectedModelLabel: selectedModel?.name ??
                          selectedModelId ??
                          'Default model',
                      selectedReasoningLabel: _reasoningLabel(reasoningEffort),
                      showReasoning: modelSupportsReasoning,
                      modelOptions: availableModels,
                      reasoningValue: reasoningEffort,
                      selectedModelId: selectedModelId,
                      onSelectModel: (value) {
                        setState(() => _selectedModelOverride = value);
                      },
                      onSelectReasoning: (value) {
                        setState(
                            () => _selectedReasoningEffortOverride = value);
                      },
                    ),
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        if (messagesError != null && messages.isEmpty) {
                          return ErrorRetryView(
                            error: messagesError,
                            onRetry: () => ref
                                .read(chatMessagesProvider(
                                        selectedConversation.id)
                                    .notifier)
                                .reload(),
                          );
                        }

                        if (messagesLoading && messages.isEmpty) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }

                        if (messages.isEmpty) {
                          return _ConversationStarterState(
                            onSuggestedPrompt: (prompt) => _sendMessage(
                              conversationId: selectedConversation.id,
                              presetContent: prompt,
                              modelOverride: selectedModelId,
                              reasoningEffort: reasoningEffort,
                            ),
                          );
                        }

                        return ListView.builder(
                          controller: _scrollCtrl,
                          reverse: true,
                          padding: const EdgeInsets.fromLTRB(
                            AppSpacing.base,
                            AppSpacing.base,
                            AppSpacing.base,
                            AppSpacing.lg,
                          ),
                          itemCount: messages.length,
                          itemBuilder: (_, index) {
                            final message =
                                messages[messages.length - 1 - index];
                            return _ChatBubble(
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
                  if (!configured)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.base,
                        AppSpacing.sm,
                        AppSpacing.base,
                        0,
                      ),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.sm,
                        ),
                        decoration: BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .tertiaryContainer
                              .withOpacity(0.45),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Configure AI in Settings → AI Configuration to chat.',
                          style: AppTextStyles.caption,
                        ),
                      ),
                    ),
                  _ChatComposer(
                    controller: _textCtrl,
                    enabled: configured,
                    onNewConversation: _startNewConversation,
                    onSend: () => _sendMessage(
                      conversationId: selectedConversation.id,
                      modelOverride: selectedModelId,
                      reasoningEffort: reasoningEffort,
                    ),
                  ),
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

  AiProviderInfo? _resolveActiveProvider(
    AiSettings? setting,
    List<AiProviderInfo> catalog,
  ) {
    if (setting == null) return null;
    for (final provider in catalog) {
      if (provider.id == setting.provider) return provider;
    }
    return null;
  }

  ChatConversation? _resolveConversation({
    required List<ChatConversation> conversations,
    required String? activeConvId,
  }) {
    final preferredId = activeConvId ?? widget.convId;
    if (preferredId != null) {
      for (final conversation in conversations) {
        if (conversation.id == preferredId) return conversation;
      }
    }
    return conversations.isEmpty ? null : conversations.first;
  }

  String? _resolveSelectedModelId(
    AiSettings? activeSetting,
    List<AiProviderModelInfo> models,
  ) {
    if (_selectedModelOverride != null &&
        models.any((model) => model.id == _selectedModelOverride)) {
      return _selectedModelOverride;
    }

    final savedModel = activeSetting?.selectedModel;
    if (savedModel != null && models.any((model) => model.id == savedModel)) {
      return savedModel;
    }

    if (models.isEmpty) return savedModel ?? _selectedModelOverride;

    for (final model in models) {
      if (model.recommended) return model.id;
    }

    return models.first.id;
  }

  AiProviderModelInfo? _resolveSelectedModelInfo(
    String? selectedModelId,
    List<AiProviderModelInfo> models,
  ) {
    if (selectedModelId == null) return null;
    for (final model in models) {
      if (model.id == selectedModelId) return model;
    }
    return null;
  }

  String _resolveReasoningEffort(
    AiSettings? activeSetting,
    bool modelSupportsReasoning,
  ) {
    final selected = _selectedReasoningEffortOverride ??
        activeSetting?.defaultReasoningEffort ??
        'none';
    if (!modelSupportsReasoning) return 'none';
    return selected;
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

  void _startNewConversation() {
    _textCtrl.clear();
    setState(() => _isDraftConversation = true);
    ref.read(activeConversationIdProvider.notifier).state = null;
    _scaffoldKey.currentState?.closeDrawer();
  }

  Future<String?> _ensureConversation() async {
    final currentId = ref.read(activeConversationIdProvider);
    if (currentId != null && !_isDraftConversation) {
      return currentId;
    }

    final conversation = await _createConversation();
    return conversation?.id;
  }

  Future<ChatConversation?> _createConversation() async {
    if (_creatingConversation) return null;

    final configured =
        ref.read(aiSettingsListProvider).valueOrNull?.any((s) => s.isActive) ??
            false;
    if (!configured) {
      _showSnack('Configure AI in Settings before creating a chat.');
      return null;
    }

    setState(() => _creatingConversation = true);
    try {
      final conversation =
          await ref.read(chatRemoteDsProvider).createConversation(
                convType: 'main',
                title: 'New conversation',
              );
      ref.invalidate(conversationsProvider);
      ref.read(activeConversationIdProvider.notifier).state = conversation.id;
      if (mounted) {
        setState(() => _isDraftConversation = false);
      }
      try {
        await ref.read(conversationsProvider.future);
      } catch (_) {}
      return conversation;
    } catch (_) {
      _showSnack('Could not create conversation');
      return null;
    } finally {
      if (mounted) setState(() => _creatingConversation = false);
    }
  }

  Future<void> _sendMessage({
    String? conversationId,
    String? presetContent,
    String? modelOverride,
    required String reasoningEffort,
  }) async {
    final content = (presetContent ?? _textCtrl.text).trim();
    if (content.isEmpty) return;

    final convId = conversationId ?? await _ensureConversation();
    if (convId == null) return;

    if (presetContent == null) {
      _textCtrl.clear();
    }

    await ref.read(chatMessagesProvider(convId).notifier).sendMessage(
          content: content,
          reasoningEffort: reasoningEffort,
          modelOverride: modelOverride,
          userTimezone:
              ref.read(userProfileProvider).valueOrNull?.timezone ?? 'UTC',
        );

    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(
        0,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _renameConversation(ChatConversation conversation) async {
    final controller = TextEditingController(text: conversation.title);
    final title = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename conversation'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Conversation title',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (!mounted) return;
    if (title == null || title.isEmpty || title == conversation.title.trim()) {
      return;
    }

    try {
      await ref
          .read(chatRemoteDsProvider)
          .renameConversation(conversation.id, title);
      ref.invalidate(conversationsProvider);
      _showSnack('Conversation renamed');
    } catch (_) {
      _showSnack('Could not rename conversation');
    }
  }

  Future<void> _deleteConversation(
    ChatConversation conversation,
    List<ChatConversation> conversations,
  ) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete conversation?'),
            content: Text(
              'This will permanently delete “${conversation.title.trim().isEmpty ? 'Untitled' : conversation.title}”.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: FilledButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirmed || !mounted) return;

    try {
      await ref.read(chatRemoteDsProvider).deleteConversation(conversation.id);
      final remaining =
          conversations.where((c) => c.id != conversation.id).toList();
      final currentActive = ref.read(activeConversationIdProvider);
      if (currentActive == conversation.id) {
        ref.read(activeConversationIdProvider.notifier).state =
            remaining.isEmpty ? null : remaining.first.id;
      }
      ref.invalidate(conversationsProvider);
      _showSnack('Conversation deleted');
    } catch (_) {
      _showSnack('Could not delete conversation');
    }
  }

  Future<void> _deleteAllConversations() async {
    if (_deletingAll) return;

    final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete all conversations?'),
            content: const Text(
              'This will permanently remove all Ask AI conversations.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: FilledButton.styleFrom(backgroundColor: Colors.red),
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
          .deleteAllConversations(convType: 'main');
      ref.read(activeConversationIdProvider.notifier).state = null;
      ref.invalidate(conversationsProvider);
      _showSnack('All conversations deleted');
    } catch (_) {
      _showSnack('Could not delete all conversations');
    } finally {
      if (mounted) setState(() => _deletingAll = false);
    }
  }

  Future<void> _downloadConversation(ChatConversation conversation) async {
    try {
      final bytes = await ref
          .read(chatRemoteDsProvider)
          .exportConversation(conversation.id);
      final filename = '${_safeFilename(conversation.title)}.md';
      await _shareMarkdownFile(
        filename: filename,
        bytes: bytes,
        subject: conversation.title.trim().isEmpty
            ? 'Ask AI conversation export'
            : conversation.title,
      );
    } catch (_) {
      _showSnack('Could not download conversation');
    }
  }

  Future<void> _downloadAllConversations() async {
    if (_exportingAll) return;

    setState(() => _exportingAll = true);
    try {
      final bytes =
          await ref.read(chatRemoteDsProvider).exportAllConversations();
      await _shareMarkdownFile(
        filename: 'yesbill_all_conversations.md',
        bytes: bytes,
        subject: 'Ask AI conversation export',
      );
    } catch (_) {
      _showSnack('Could not download all conversations');
    } finally {
      if (mounted) setState(() => _exportingAll = false);
    }
  }

  Future<void> _shareMarkdownFile({
    required String filename,
    required List<int> bytes,
    required String subject,
  }) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$filename');
    await file.writeAsBytes(bytes, flush: true);
    await Share.shareXFiles(
      [XFile(file.path)],
      subject: subject,
      text: subject,
    );
  }

  String _safeFilename(String value) {
    final trimmed = value.trim().isEmpty ? 'conversation' : value.trim();
    return trimmed.replaceAll(RegExp(r'[<>:"/\\|?*]'), '_');
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }
}

class _AskAiLandingState extends StatelessWidget {
  const _AskAiLandingState({
    required this.creatingConversation,
    required this.onStartConversation,
    required this.onSuggestedPrompt,
  });

  final bool creatingConversation;
  final VoidCallback onStartConversation;
  final ValueChanged<String> onSuggestedPrompt;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 120),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: _chatMd3SurfaceContainerLowest,
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
              const YesBillLogoAvatar(size: 52),
              const SizedBox(height: 16),
              const Text(
                'YesBill',
                style: TextStyle(
                  color: _chatMd3Primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 24,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Ask anything about your services, bills, renewals, and monthly spending.',
                style: AppTextStyles.body.copyWith(
                  color: _chatMd3OnSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: creatingConversation ? null : onStartConversation,
                style: FilledButton.styleFrom(
                  backgroundColor: _chatMd3Primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(999),
                  ),
                  elevation: 0,
                ),
                icon: creatingConversation
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(LucideIcons.messageSquarePlus, size: 18),
                label: const Text('Start a new chat'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _SuggestedPromptGrid(onTap: onSuggestedPrompt),
      ],
    );
  }
}

class _ConversationStarterState extends StatelessWidget {
  const _ConversationStarterState({required this.onSuggestedPrompt});

  final ValueChanged<String> onSuggestedPrompt;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 120),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: _chatMd3SurfaceContainerLowest,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A2D3337),
                blurRadius: 24,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              const YesBillLogoAvatar(size: 44),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'What would you like to ask?',
                      style: TextStyle(
                        color: _chatMd3OnSurface,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Try one of these prompts below.',
                      style: AppTextStyles.caption.copyWith(
                        color: _chatMd3OnSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _SuggestedPromptGrid(onTap: onSuggestedPrompt),
      ],
    );
  }
}

class _SuggestedPromptGrid extends StatelessWidget {
  const _SuggestedPromptGrid({required this.onTap});

  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SUGGESTED PROMPTS',
          style: AppTextStyles.labelSm.copyWith(
            color: _chatMd3OnSurfaceVariant,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 12),
        ..._suggestedPrompts.map(
          (prompt) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              onTap: () => onTap(prompt),
              borderRadius: BorderRadius.circular(16),
              child: Ink(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _chatMd3SurfaceContainerLowest,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: _chatMd3OutlineVariant.withOpacity(0.4)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x072D3337),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _chatMd3PrimaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        LucideIcons.sparkles,
                        size: 16,
                        color: _chatMd3Primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        prompt,
                        style: AppTextStyles.body.copyWith(
                          fontWeight: FontWeight.w600,
                          color: _chatMd3OnSurface,
                        ),
                      ),
                    ),
                    const Icon(
                      LucideIcons.chevronRight,
                      size: 16,
                      color: _chatMd3OnSurfaceVariant,
                    ),
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

class _ChatControlBar extends StatelessWidget {
  const _ChatControlBar({
    required this.providerName,
    required this.selectedModelLabel,
    required this.selectedReasoningLabel,
    required this.showReasoning,
    required this.modelOptions,
    required this.reasoningValue,
    required this.selectedModelId,
    required this.onSelectModel,
    required this.onSelectReasoning,
  });

  final String providerName;
  final String selectedModelLabel;
  final String selectedReasoningLabel;
  final bool showReasoning;
  final List<AiProviderModelInfo> modelOptions;
  final String reasoningValue;
  final String? selectedModelId;
  final ValueChanged<String> onSelectModel;
  final ValueChanged<String> onSelectReasoning;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          _StaticInfoChip(
            icon: LucideIcons.brain,
            label: providerName,
          ),
          PillSelectorChip<String>(
            icon: LucideIcons.settings2,
            label: selectedModelLabel,
            value: selectedModelId,
            sheetTitle: 'Choose AI model',
            options: modelOptions
                .map(
                  (model) => PillSelectorOption<String>(
                    value: model.id,
                    label: model.name,
                    subtitle: model.reasoningSupported
                        ? 'Reasoning supported'
                        : 'Standard model',
                  ),
                )
                .toList(),
            onSelected: onSelectModel,
          ),
          if (showReasoning)
            PillSelectorChip<String>(
              icon: LucideIcons.sparkles,
              label: selectedReasoningLabel,
              value: reasoningValue,
              sheetTitle: 'Choose reasoning level',
              options: _reasoningOptions
                  .map(
                    (option) => PillSelectorOption<String>(
                      value: option.value,
                      label: option.label,
                    ),
                  )
                  .toList(),
              onSelected: onSelectReasoning,
            ),
        ],
      ),
    );
  }
}

class _StaticInfoChip extends StatelessWidget {
  const _StaticInfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: _chatMd3SurfaceContainerLowest,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: _chatMd3OutlineVariant.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: _chatMd3Primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTextStyles.bodySm.copyWith(
              fontWeight: FontWeight.w600,
              color: _chatMd3OnSurface,
            ),
          ),
        ],
      ),
    );
  }
}

class _ConversationDrawer extends StatelessWidget {
  const _ConversationDrawer({
    required this.conversations,
    required this.selectedId,
    required this.creatingConversation,
    required this.exportingAll,
    required this.deletingAll,
    required this.onSelected,
    required this.onNewConversation,
    required this.onRenameConversation,
    required this.onDeleteConversation,
    required this.onDownloadConversation,
    required this.onDownloadAllConversations,
    required this.onDeleteAllConversations,
  });

  final List<ChatConversation> conversations;
  final String? selectedId;
  final bool creatingConversation;
  final bool exportingAll;
  final bool deletingAll;
  final ValueChanged<String> onSelected;
  final VoidCallback onNewConversation;
  final Future<void> Function(ChatConversation conversation)
      onRenameConversation;
  final Future<void> Function(ChatConversation conversation)
      onDeleteConversation;
  final Future<void> Function(ChatConversation conversation)
      onDownloadConversation;
  final Future<void> Function() onDownloadAllConversations;
  final Future<void> Function() onDeleteAllConversations;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 16, 16),
          color: Theme.of(context).colorScheme.surface,
          child: Row(
            children: [
              const YesBillLogoAvatar(size: 24),
              const SizedBox(width: 10),
              const Text(
                'Ask AI',
                style: TextStyle(
                  color: _chatMd3Primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 18),
                color: _chatMd3OnSurfaceVariant,
                onPressed: () => Navigator.of(context).pop(),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              ),
            ],
          ),
        ),
        // Nav links
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
          child: Column(
            children: [
              // New Chat — filled primary pill
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: creatingConversation ? null : onNewConversation,
                  style: FilledButton.styleFrom(
                    backgroundColor: _chatMd3Primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                    elevation: 0,
                    shadowColor: Colors.transparent,
                  ).copyWith(
                    elevation: WidgetStateProperty.all(0),
                  ),
                  icon: creatingConversation
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(LucideIcons.messageSquarePlus, size: 16),
                  label: const Text('New Chat'),
                ),
              ),
              const SizedBox(height: 4),
              // History — active nav item
              _DrawerNavItem(
                icon: LucideIcons.history,
                label: 'History',
                active: true,
                onTap: () {},
              ),
              // Agents — link to agent screen
              _DrawerNavItem(
                icon: LucideIcons.cpu,
                label: 'Agents',
                active: false,
                onTap: () {
                  Navigator.of(context).pop();
                  context.go('/agent');
                },
              ),
              _DrawerNavItem(
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
        if (conversations.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Text(
              'RECENT',
              style: AppTextStyles.labelSm.copyWith(
                color: _chatMd3OnSurfaceVariant,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ],
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
                          color: _chatMd3OutlineVariant,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'No conversations yet',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _chatMd3OnSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Start a new chat to get going',
                          style: AppTextStyles.caption.copyWith(
                            color: _chatMd3OnSurfaceVariant,
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
                          ? _chatMd3Primary.withOpacity(0.08)
                          : _chatMd3SurfaceContainerLow,
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
                                    color: _chatMd3Primary.withOpacity(0.28),
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
                                          ? 'Untitled conversation'
                                          : conversation.title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTextStyles.body.copyWith(
                                        fontWeight: selected
                                            ? FontWeight.w700
                                            : FontWeight.w600,
                                        color: selected
                                            ? _chatMd3Primary
                                            : _chatMd3OnSurface,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      _timeAgo(conversation.updatedAt ??
                                          conversation.createdAt),
                                      style: AppTextStyles.caption.copyWith(
                                        color: _chatMd3OnSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              PopupMenuButton<_ConversationMenuAction>(
                                color: Theme.of(context).colorScheme.surface,
                                surfaceTintColor: Colors.transparent,
                                position: PopupMenuPosition.under,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(
                                    color: _chatMd3OutlineVariant
                                        .withOpacity(0.35),
                                  ),
                                ),
                                onSelected: (value) {
                                  switch (value) {
                                    case _ConversationMenuAction.rename:
                                      onRenameConversation(conversation);
                                      break;
                                    case _ConversationMenuAction.download:
                                      onDownloadConversation(conversation);
                                      break;
                                    case _ConversationMenuAction.delete:
                                      onDeleteConversation(conversation);
                                      break;
                                  }
                                },
                                itemBuilder: (context) => const [
                                  PopupMenuItem<_ConversationMenuAction>(
                                    value: _ConversationMenuAction.rename,
                                    child: _ConversationMenuRow(
                                      icon: LucideIcons.pencil,
                                      label: 'Edit title',
                                    ),
                                  ),
                                  PopupMenuItem<_ConversationMenuAction>(
                                    value: _ConversationMenuAction.download,
                                    child: _ConversationMenuRow(
                                      icon: LucideIcons.download,
                                      label: 'Download',
                                    ),
                                  ),
                                  PopupMenuItem<_ConversationMenuAction>(
                                    value: _ConversationMenuAction.delete,
                                    child: _ConversationMenuRow(
                                      icon: LucideIcons.trash2,
                                      label: 'Delete',
                                      destructive: true,
                                    ),
                                  ),
                                ],
                                icon: const Icon(
                                  LucideIcons.moreVertical,
                                  size: 16,
                                  color: _chatMd3OnSurfaceVariant,
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
        // Footer actions
        Container(
          color: Theme.of(context).colorScheme.surface,
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: conversations.isEmpty || exportingAll
                      ? null
                      : onDownloadAllConversations,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                        color: _chatMd3OutlineVariant.withOpacity(0.5)),
                    foregroundColor: _chatMd3OnSurfaceVariant,
                  ),
                  icon: exportingAll
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.download, size: 14),
                  label: const Text('Export'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: conversations.isEmpty || deletingAll
                      ? null
                      : onDeleteAllConversations,
                  icon: deletingAll
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.trash2, size: 14),
                  label: const Text('Clear all'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: BorderSide(color: Colors.red.withOpacity(0.24)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _timeAgo(DateTime? time) {
    if (time == null) return 'Just now';
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${time.day}/${time.month}/${time.year}';
  }
}

class _DrawerNavItem extends StatelessWidget {
  const _DrawerNavItem({
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
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor:
          active ? _chatMd3Primary.withOpacity(0.08) : Colors.transparent,
      leading: Icon(
        icon,
        size: 18,
        color: active ? _chatMd3Primary : _chatMd3OnSurfaceVariant,
      ),
      title: Text(
        label,
        style: AppTextStyles.body.copyWith(
          fontWeight: active ? FontWeight.w700 : FontWeight.w500,
          color: active ? _chatMd3Primary : _chatMd3OnSurface,
        ),
      ),
    );
  }
}

class _ConversationMenuRow extends StatelessWidget {
  const _ConversationMenuRow({
    required this.icon,
    required this.label,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? Colors.red : null;
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(color: color),
        ),
      ],
    );
  }
}

// Stitch MD3 design tokens (local to chat UI)
const _chatMd3Primary = AppColors.primary;
const _chatMd3PrimaryContainer = Color(0xFFE0E7FF);
const _chatMd3Secondary = AppColors.info;
const _chatMd3SurfaceContainerLowest = AppColors.cardLight;
const _chatMd3SurfaceContainerLow = Color(0xFFEFF3FF);
const _chatMd3OnSurface = AppColors.textPrimaryLight;
const _chatMd3OnSurfaceVariant = AppColors.textSecondaryLight;
const _chatMd3OutlineVariant = Color(0xFFCBD5E1);

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({
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

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            const YesBillLogoAvatar(size: 30),
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
                        'YesBill',
                        style: AppTextStyles.labelSm.copyWith(
                          color: _chatMd3OnSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  if (hasThought && !isUser)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: _ReasoningPanel(
                        reasoning: message.reasoning ?? '',
                        thinkingDurationSeconds: message.thinkingDurationSeconds,
                        autoExpand: message.isStreaming,
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      color: isUser
                          ? _chatMd3Primary
                          : _chatMd3SurfaceContainerLowest,
                      borderRadius: isUser
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
                            ),
                      boxShadow: isUser
                          ? const [
                              BoxShadow(
                                color: Color(0x404A4BD7),
                                blurRadius: 24,
                                offset: Offset(0, 8),
                              ),
                            ]
                          : const [
                              BoxShadow(
                                color: Color(0x0A2D3337),
                                blurRadius: 12,
                                offset: Offset(0, 3),
                              ),
                            ],
                    ),
                    child: isUser
                        ? Text(
                            message.content,
                            style: AppTextStyles.body.copyWith(
                              color: Colors.white,
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
                                await launchUrl(uri,
                                    mode: LaunchMode.externalApplication);
                              }
                            },
                            styleSheet:
                                MarkdownStyleSheet.fromTheme(Theme.of(context))
                                    .copyWith(
                              p: AppTextStyles.body
                                  .copyWith(color: _chatMd3OnSurface),
                              a: AppTextStyles.body.copyWith(
                                color: _chatMd3Primary,
                                decoration: TextDecoration.underline,
                              ),
                              code: AppTextStyles.body.copyWith(
                                color: _chatMd3OnSurface,
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
              size: 30,
            ),
          ],
        ],
      ),
    );
  }
}

class _ReasoningPanel extends StatefulWidget {
  const _ReasoningPanel(
      {required this.reasoning,
      this.thinkingDurationSeconds,
      this.autoExpand = false});

  final String reasoning;
  final int? thinkingDurationSeconds;
  final bool autoExpand;

  @override
  State<_ReasoningPanel> createState() => _ReasoningPanelState();
}

class _ReasoningPanelState extends State<_ReasoningPanel> {
  bool _expanded = false;
  bool _userToggled = false;

  @override
  void initState() {
    super.initState();
    _expanded = widget.autoExpand;
  }

  @override
  void didUpdateWidget(_ReasoningPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_userToggled && widget.autoExpand && !_expanded) {
      setState(() => _expanded = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasReasoningText = widget.reasoning.trim().isNotEmpty;

    // Duration-only chip (no expandable reasoning text)
    if (!hasReasoningText && widget.thinkingDurationSeconds != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: _chatMd3SurfaceContainerLow.withOpacity(0.7),
          borderRadius: BorderRadius.circular(12),
          border: Border(
            left: BorderSide(
              color: _chatMd3Secondary.withOpacity(0.2),
              width: 2,
            ),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.brain, size: 14, color: _chatMd3Secondary),
            const SizedBox(width: 8),
            Text(
              'Thought · ${widget.thinkingDurationSeconds}s',
              style: AppTextStyles.labelSm.copyWith(
                color: _chatMd3Secondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: _chatMd3SurfaceContainerLow.withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(
            color: _chatMd3Secondary.withOpacity(0.2),
            width: 2,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(12),
              topRight: Radius.circular(12),
              bottomLeft: Radius.circular(12),
              bottomRight: Radius.circular(12),
            ),
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
                    color: _chatMd3Secondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _expanded ? 'Hide reasoning' : 'View reasoning',
                    style: AppTextStyles.labelSm.copyWith(
                      color: _chatMd3Secondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    _expanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 13,
                    color: _chatMd3Secondary,
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
                  color: _chatMd3OnSurfaceVariant,
                  height: 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ChatComposer extends StatelessWidget {
  const _ChatComposer({
    required this.controller,
    required this.enabled,
    required this.onSend,
    this.onNewConversation,
  });

  final TextEditingController controller;
  final bool enabled;
  final VoidCallback onSend;
  final VoidCallback? onNewConversation;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: _chatMd3SurfaceContainerLowest,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: _chatMd3OutlineVariant.withOpacity(0.3),
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F2D3337),
                blurRadius: 32,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: onNewConversation,
                style: IconButton.styleFrom(
                  backgroundColor: _chatMd3SurfaceContainerLow,
                  minimumSize: const Size(42, 42),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: EdgeInsets.zero,
                ),
                icon: const Icon(
                  LucideIcons.plusCircle,
                  size: 20,
                  color: _chatMd3OnSurfaceVariant,
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
                  onSubmitted: enabled ? (_) => onSend() : null,
                  decoration: InputDecoration(
                    hintText: enabled
                        ? 'Ask anything about your bills…'
                        : 'Configure AI in Settings to start chatting…',
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    hintStyle: AppTextStyles.body.copyWith(
                      color: _chatMd3OnSurfaceVariant,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: enabled ? onSend : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: enabled
                        ? _chatMd3Primary
                        : _chatMd3OutlineVariant.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: enabled
                        ? const [
                            BoxShadow(
                              color: Color(0x404A4BD7),
                              blurRadius: 12,
                              offset: Offset(0, 4),
                            ),
                          ]
                        : [],
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    LucideIcons.send,
                    size: 16,
                    color: Colors.white,
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

enum _ConversationMenuAction {
  rename,
  download,
  delete,
}
