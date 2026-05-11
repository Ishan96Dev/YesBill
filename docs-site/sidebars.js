/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/creating-account',
        'getting-started/onboarding',
        'getting-started/first-service',
        'getting-started/dashboard',
      ],
    },
    {
      type: 'category',
      label: 'Services',
      items: [
        'services/overview',
        'services/home-delivery',
        'services/visit-based',
        'services/utility-services',
        'services/subscriptions',
        'services/payments',
      ],
    },
    {
      type: 'category',
      label: 'Calendar',
      items: [
        'calendar/overview',
        'calendar/daily-tracking',
        'calendar/yearly-view',
      ],
    },
    {
      type: 'category',
      label: 'Bills',
      items: [
        'bills/understanding-bills',
        'bills/auto-generation',
        'bills/marking-paid',
        'bills/bill-history',
      ],
    },
    {
      type: 'category',
      label: 'AI Features',
      items: [
        'ai-features/overview',
        'ai-features/ask-ai',
        'ai-features/agent-chatbot',
        'ai-features/agent-actions',
        'ai-features/ai-bill-generation',
        'ai-features/ai-configuration',
      ],
    },
    {
      type: 'category',
      label: 'Settings',
      items: [
        'settings/profile',
        'settings/notifications',
        'settings/security',
        'settings/ai-configuration',
        'settings/ollama-setup',
        'settings/support',
      ],
    },
    {
      type: 'category',
      label: 'Release Notes',
      items: ['changelog/v1.0.0'],
    },
    'roadmap',
  ],

  mobileSidebar: [
    'mobile/intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'mobile/getting-started/creating-account',
        'mobile/getting-started/onboarding',
        'mobile/getting-started/dashboard',
      ],
    },
    {
      type: 'category',
      label: 'Services',
      items: [
        'mobile/services/managing-services',
      ],
    },
    {
      type: 'category',
      label: 'Calendar',
      items: [
        'mobile/calendar/overview',
      ],
    },
    {
      type: 'category',
      label: 'Bills',
      items: [
        'mobile/bills/understanding-bills',
        'mobile/bills/auto-generation',
      ],
    },
    {
      type: 'category',
      label: 'AI Features',
      items: [
        'mobile/ai-features/ask-ai',
        'mobile/ai-features/agent-chatbot',
        'mobile/ai-features/analytics',
      ],
    },
    {
      type: 'category',
      label: 'Settings',
      items: [
        'mobile/settings/overview',
        'mobile/settings/profile',
        'mobile/settings/notifications',
        'mobile/settings/security',
        'mobile/settings/ai-configuration',
        'mobile/settings/support',
      ],
    },
  ],
};

module.exports = sidebars;

