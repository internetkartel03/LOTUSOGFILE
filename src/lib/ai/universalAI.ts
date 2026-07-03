// Universal AI Provider - Lotus Builder
// Automatically switches between local and cloud AI

import { detectAppType, buildAppTypeContext, type AppType } from './appTypeDetection';

export type AIProvider = 'local' | 'cloud';
export type BuilderMode = 'general' | 'ui-designer' | 'code-builder' | 'architect' | 'debug';

export interface AIGenerationRequest {
  prompt: string;
  projectContext?: {
    name?: string;
    appType?: AppType;
    description?: string;
    previousMessages?: string[];
  };
  mode?: BuilderMode;
}

export interface AIGenerationResponse {
  content: string;
  appType: AppType;
  provider: AIProvider;
  timestamp: string;
  suggestedNextSteps?: string[];
}

export interface GeneratorStatus {
  provider: AIProvider;
  isConnected: boolean;
  message: string;
  icon: string;
}

/**
 * Detect which provider to use based on environment
 */
function detectProvider(): AIProvider {
  if (typeof window === 'undefined') return 'cloud';

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  return isLocalhost ? 'local' : 'cloud';
}

/**
 * Get status indicator for current AI provider
 */
export function getProviderStatus(): GeneratorStatus {
  const provider = detectProvider();

  if (provider === 'local') {
    return {
      provider: 'local',
      isConnected: true,
      message: 'Local AI Connected',
      icon: '🟢'
    };
  }

  return {
    provider: 'cloud',
    isConnected: true,
    message: 'Cloud AI Connected',
    icon: '🟢'
  };
}

/**
 * Generate app using universal AI
 */
export async function generateApp(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  const provider = detectProvider();
  const appType = request.projectContext?.appType || detectAppType(request.prompt);

  try {
    if (provider === 'local') {
      return await generateWithLocalAI(request, appType);
    } else {
      return await generateWithCloudAI(request, appType);
    }
  } catch (error) {
    console.error('Generation failed, attempting fallback...');
    // If local fails, try cloud
    if (provider === 'local') {
      return generateWithCloudAI(request, appType);
    }
    throw error;
  }
}

/**
 * Generate with local AI (Ollama, LM Studio, etc.)
 */
async function generateWithLocalAI(
  request: AIGenerationRequest,
  appType: AppType
): Promise<AIGenerationResponse> {
  try {
    // Attempt to use local model
    const { chatWithLocalModel, DEFAULT_LOCAL_MODELS } = await import('./localModels');

    const context = buildAppTypeContext(appType, request.projectContext?.description);
    const fullPrompt = `${context}\n\n${request.prompt}`;

    // Use first available local model
    const model = DEFAULT_LOCAL_MODELS[0];
    if (!model) {
      throw new Error('No local models available');
    }

    const messages = [
      {
        role: 'system',
        content: 'Return only valid HTML for app previews. No markdown, no explanation, no code fences.'
      },
      {
        role: 'user',
        content: fullPrompt
      }
    ];

    const content = await chatWithLocalModel(model, messages, {
      temperature: 0.45,
      maxTokens: 8000
    });

    return {
      content,
      appType,
      provider: 'local',
      timestamp: new Date().toISOString(),
      suggestedNextSteps: generateSuggestions(appType)
    };
  } catch (error) {
    console.error('Local AI failed:', error);
    throw new Error('Local AI unavailable');
  }
}

/**
 * Generate with cloud AI (OpenRouter)
 */
async function generateWithCloudAI(
  request: AIGenerationRequest,
  appType: AppType
): Promise<AIGenerationResponse> {
  try {
    const context = buildAppTypeContext(appType, request.projectContext?.description);
    const projectContext = request.projectContext
      ? `Project: ${request.projectContext.name || 'Untitled'}\n${context}`
      : context;

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: request.prompt,
        appType,
        projectContext,
        mode: request.mode || 'general'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Cloud AI generation failed');
    }

    const data = await response.json();

    return {
      content: data.content,
      appType: data.appType || appType,
      provider: 'cloud',
      timestamp: data.timestamp,
      suggestedNextSteps: generateSuggestions(appType)
    };
  } catch (error) {
    console.error('Cloud AI failed:', error);
    throw new Error('Unable to connect to AI engine');
  }
}

/**
 * Generate contextual suggestions based on app type
 */
function generateSuggestions(appType: AppType): string[] {
  const suggestions: Record<AppType, string[]> = {
    fitness: [
      'Add meal tracking and nutrition logging',
      'Create a weekly workout calendar',
      'Add user accounts and progress sharing',
      'Include social features for challenges'
    ],
    education: [
      'Add quiz functionality at the end of each lesson',
      'Create a certificate system',
      'Add user progress tracking',
      'Include discussion forums'
    ],
    booking: [
      'Add payment integration',
      'Create user profiles',
      'Add confirmation emails',
      'Include calendar blocking for availability'
    ],
    dashboard: [
      'Add real-time data updates',
      'Create custom report generation',
      'Add user export options',
      'Include data filtering and search'
    ],
    ecommerce: [
      'Add shopping cart functionality',
      'Create checkout process',
      'Add payment integration',
      'Include user reviews and ratings'
    ],
    portfolio: [
      'Add project filtering by category',
      'Create case studies',
      'Add client testimonials',
      'Include contact form'
    ],
    'client-portal': [
      'Add file upload and download',
      'Create notification system',
      'Add user permissions',
      'Include audit logging'
    ],
    community: [
      'Add user profiles and reputation',
      'Create moderation tools',
      'Add search functionality',
      'Include activity notifications'
    ],
    'ai-assistant': [
      'Add conversation history management',
      'Create prompt templates',
      'Add export functionality',
      'Include conversation sharing'
    ],
    'design-studio': [
      'Add undo/redo functionality',
      'Create layer management',
      'Add export to multiple formats',
      'Include collaboration features'
    ],
    'content-generator': [
      'Add template library',
      'Create batch generation',
      'Add scheduling',
      'Include analytics'
    ],
    'habit-tracker': [
      'Add habit categories',
      'Create streak notifications',
      'Add data export',
      'Include habit suggestions'
    ],
    restaurant: [
      'Add online ordering',
      'Create reservation system',
      'Add special offers',
      'Include reviews and ratings'
    ],
    'service-business': [
      'Add service booking',
      'Create quote requests',
      'Add customer testimonials',
      'Include team profiles'
    ],
    custom: [
      'Refine the layout and design',
      'Add more features',
      'Customize the content',
      'Connect to real data'
    ]
  };

  return suggestions[appType] || suggestions.custom;
}

/**
 * Format natural response for user
 */
export function formatBuilderResponse(content: string, appType: AppType): string {
  if (content.includes('<')) {
    // This is HTML output
    return `I built the first version of your ${appType} app. I'm opening the live preview now.`;
  }

  return content;
}
