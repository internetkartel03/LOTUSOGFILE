// App Type Detection for Universal Lotus Builder

export type AppType =
  | 'fitness'
  | 'education'
  | 'booking'
  | 'dashboard'
  | 'ecommerce'
  | 'portfolio'
  | 'client-portal'
  | 'community'
  | 'ai-assistant'
  | 'design-studio'
  | 'content-generator'
  | 'habit-tracker'
  | 'restaurant'
  | 'service-business'
  | 'custom';

export interface AppTypeConfig {
  type: AppType;
  name: string;
  description: string;
  starterScreens: string[];
  keywords: string[];
  defaultLayout: 'single-page' | 'multi-page' | 'dashboard' | 'portfolio';
}

export const APP_TYPE_CONFIGS: Record<AppType, AppTypeConfig> = {
  fitness: {
    type: 'fitness',
    name: 'Fitness & Wellness',
    description: 'Workout plans, progress tracking, nutrition goals',
    starterScreens: ['Dashboard', 'Workout Plans', 'Progress Tracker', 'Nutrition', 'Profile'],
    keywords: ['fitness', 'workout', 'gym', 'health', 'exercise', 'training', 'wellness'],
    defaultLayout: 'multi-page'
  },
  education: {
    type: 'education',
    name: 'Education Platform',
    description: 'Courses, lessons, progress tracking, resources',
    starterScreens: ['Course Library', 'Lesson Page', 'Progress Tracker', 'Resources', 'Profile'],
    keywords: ['education', 'course', 'learning', 'training', 'school', 'university', 'lesson'],
    defaultLayout: 'multi-page'
  },
  booking: {
    type: 'booking',
    name: 'Booking & Appointments',
    description: 'Service selection, calendar, booking form, confirmations',
    starterScreens: ['Service List', 'Calendar View', 'Booking Form', 'Confirmation', 'Admin Overview'],
    keywords: ['booking', 'appointment', 'schedule', 'calendar', 'reservation', 'salon', 'clinic'],
    defaultLayout: 'multi-page'
  },
  dashboard: {
    type: 'dashboard',
    name: 'Dashboard & Analytics',
    description: 'Metrics, charts, activity feed, insights',
    starterScreens: ['Overview', 'Metrics Cards', 'Charts', 'Activity Feed', 'Settings'],
    keywords: ['dashboard', 'analytics', 'metrics', 'data', 'chart', 'graph', 'report'],
    defaultLayout: 'dashboard'
  },
  ecommerce: {
    type: 'ecommerce',
    name: 'Product Catalog',
    description: 'Products, details, cart, checkout',
    starterScreens: ['Product Grid', 'Product Detail', 'Cart Preview', 'Checkout', 'Customer Info'],
    keywords: ['shop', 'store', 'product', 'catalog', 'ecommerce', 'sell', 'marketplace'],
    defaultLayout: 'multi-page'
  },
  portfolio: {
    type: 'portfolio',
    name: 'Portfolio Site',
    description: 'Hero, projects, about, services, contact',
    starterScreens: ['Hero Section', 'Work/Projects', 'About', 'Services', 'Contact'],
    keywords: ['portfolio', 'freelance', 'agency', 'designer', 'developer', 'artist', 'creator'],
    defaultLayout: 'portfolio'
  },
  'client-portal': {
    type: 'client-portal',
    name: 'Client Portal',
    description: 'Dashboard, messages, files, tasks, account',
    starterScreens: ['Dashboard', 'Messages', 'Files', 'Tasks', 'Account'],
    keywords: ['client', 'portal', 'admin', 'management', 'access', 'project'],
    defaultLayout: 'dashboard'
  },
  community: {
    type: 'community',
    name: 'Community Platform',
    description: 'Feed, profiles, discussions, groups',
    starterScreens: ['Feed', 'Profiles', 'Discussions', 'Groups', 'Messaging'],
    keywords: ['community', 'social', 'forum', 'network', 'group', 'members'],
    defaultLayout: 'multi-page'
  },
  'ai-assistant': {
    type: 'ai-assistant',
    name: 'AI Assistant App',
    description: 'Chat interface, prompts, outputs, settings',
    starterScreens: ['Chat Interface', 'Prompt Library', 'Output Preview', 'History', 'Settings'],
    keywords: ['ai', 'chat', 'assistant', 'chatbot', 'gpt', 'prompt', 'agent'],
    defaultLayout: 'single-page'
  },
  'design-studio': {
    type: 'design-studio',
    name: 'Design Studio',
    description: 'Canvas, assets, controls, preview, export',
    starterScreens: ['Canvas/Workspace', 'Asset Library', 'Style Controls', 'Preview Panel', 'Export Area'],
    keywords: ['design', 'studio', 'editor', 'canvas', 'creative', 'tool'],
    defaultLayout: 'dashboard'
  },
  'content-generator': {
    type: 'content-generator',
    name: 'Content Generator',
    description: 'Input forms, generated output, templates',
    starterScreens: ['Input Form', 'Generated Output', 'Templates', 'History', 'Download'],
    keywords: ['generator', 'content', 'create', 'write', 'generate', 'template'],
    defaultLayout: 'single-page'
  },
  'habit-tracker': {
    type: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Daily dashboard, habit list, streaks, calendar',
    starterScreens: ['Daily Dashboard', 'Habit List', 'Streak Tracker', 'Progress Calendar', 'Profile'],
    keywords: ['habit', 'tracker', 'daily', 'streak', 'goal', 'progress'],
    defaultLayout: 'multi-page'
  },
  restaurant: {
    type: 'restaurant',
    name: 'Restaurant Menu',
    description: 'Menu categories, items, ordering, location',
    starterScreens: ['Menu Categories', 'Item Details', 'Order Preview', 'Location/Contact', 'Specials'],
    keywords: ['restaurant', 'menu', 'food', 'cafe', 'bar', 'dining', 'order'],
    defaultLayout: 'multi-page'
  },
  'service-business': {
    type: 'service-business',
    name: 'Service Business Site',
    description: 'Home, services, packages, about, contact',
    starterScreens: ['Home', 'Services', 'Packages', 'About', 'Contact'],
    keywords: ['service', 'business', 'professional', 'company', 'website'],
    defaultLayout: 'portfolio'
  },
  custom: {
    type: 'custom',
    name: 'Custom App',
    description: 'Flexible app for unique ideas',
    starterScreens: [],
    keywords: [],
    defaultLayout: 'single-page'
  }
};

/**
 * Detect app type from user prompt
 */
export function detectAppType(prompt: string): AppType {
  const lowerPrompt = prompt.toLowerCase();

  for (const [type, config] of Object.entries(APP_TYPE_CONFIGS)) {
    if (type === 'custom') continue;

    const typeConfig = config as AppTypeConfig;
    const hasMatch = typeConfig.keywords.some(keyword =>
      lowerPrompt.includes(keyword)
    );

    if (hasMatch) {
      return typeConfig.type;
    }
  }

  return 'custom';
}

/**
 * Get app type config
 */
export function getAppTypeConfig(appType: AppType): AppTypeConfig {
  return APP_TYPE_CONFIGS[appType];
}

/**
 * Build contextual prompt for app type
 */
export function buildAppTypeContext(appType: AppType, customDescription?: string): string {
  const config = getAppTypeConfig(appType);

  if (appType === 'custom' && customDescription) {
    return `Building: ${customDescription}`;
  }

  let context = `Building a ${config.name}: ${config.description}`;

  if (config.starterScreens.length > 0) {
    context += `\n\nCore screens to include: ${config.starterScreens.join(', ')}`;
  }

  return context;
}
