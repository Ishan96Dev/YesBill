/// FastAPI endpoint path constants.
/// All paths are relative to [AppConfig.apiBaseUrl].
class ApiConstants {
  ApiConstants._();

  // Auth
  static const authLogin = '/auth/login';
  static const authRegister = '/auth/register';
  static const authLogout = '/auth/logout';
  static const authProfile = '/auth/profile';
    static const authDeleteAccount = '/auth/account';

  // Bills
  static const billsGenerate = '/bills/generate';
  static const billsGenerated = '/bills/generated';
  static const billsRecords = '/bills/records';

  static String billsGeneratedById(String id) => '/bills/generated/$id';
  static String billsGeneratedByMonth(String yearMonth) =>
      '/bills/generated/month/$yearMonth';
  static String billMarkPaid(String id) => '/bills/generated/$id/paid';

  // Chat
  static const chatConversations = '/chat/conversations';
    static const chatExportAllConversations = '/chat/conversations/export-all';
  static const chatModels = '/chat/models';
  static const chatModelsProbe = '/chat/models/probe';
  static const chatRephrase = '/chat/rephrase';
  static const chatAnalyticsSummary = '/chat/analytics/summary';

  static String chatConvMessages(String convId) =>
      '/chat/conversations/$convId/messages';
  static String agentConvMessages(String convId) =>
      '/chat/agent/conversations/$convId/messages';
  static const agentExecute = '/chat/agent/execute';
  static String chatConvById(String id) => '/chat/conversations/$id';
  static String chatConvExport(String id) => '/chat/conversations/$id/export';

  // AI Settings
  static const aiSettings = '/ai/settings';
  static const aiProviders = '/ai/providers';
  static const aiValidateKey = '/ai/validate-key';
  static const aiOllamaModels = '/ai/ollama/models';

  static String aiSettingsByProvider(String provider) =>
      '/ai/settings/$provider';

  // Notifications
  static const notificationsRegisterToken = '/notifications/register-token';

  // Health
  static const health = '/health';
}
