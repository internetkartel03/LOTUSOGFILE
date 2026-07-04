// AppSchema — The schema that defines an app
// Every app in LOTUS is defined by this schema structure

export interface AppSchema {
  name: string;
  description?: string;
  screens: Screen[];
  navigation: NavigationConfig;
  activeScreenId: string;
  theme: ThemeConfig;
  imageAssets: ImageAsset[];
  features: string[];
  generatedHtml?: string;
  lastGenerated?: string;
}

export interface Screen {
  id: string;
  name: string;
  title: string;
  components: ComponentDef[];
}

export interface ComponentDef {
  id?: string;
  type: string;
  props: Record<string, any>;
  [key: string]: any;
}

export interface NavigationConfig {
  type: 'none' | 'bottom-tabs' | 'drawer' | 'stack';
  items?: NavItem[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  screenId: string;
}

export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  secondaryColor?: string;
  darkMode?: boolean;
  cardStyle?: string;
}

export interface ImageAsset {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
}

export interface SchemaPatch {
  op: string;
  description?: string;
  screen?: Screen;
  screenId?: string;
  component?: ComponentDef;
}

const supportedComponentTypes = new Set([
  'header',
  'text',
  'button',
  'input',
  'card',
  'list',
  'image',
  'avatar',
  'badge',
  'tabs',
  'searchBar',
  'carousel',
  'chart',
  'progress',
  'progressRing',
  'divider',
  'fab',
  'bottomNav',
  'productGrid',
  'categoryGrid',
  'taskList',
  'statsRow',
  'sectionTitle',
  'workoutList',
  'cartList',
  'summary',
  'timer',
  'exerciseList',
  'rating',
  'datePicker',
  'select',
  'imageGallery',
]);

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

export function createEmptySchema(name = 'New App'): AppSchema {
  return {
    name,
    screens: [
      {
        id: 'home',
        name: 'Home',
        title: 'Home',
        components: [
          { id: 'welcome-title', type: 'text', props: {}, variant: 'title', content: 'Welcome to LOTUS' },
          { id: 'welcome-copy', type: 'text', props: {}, variant: 'body', content: 'Describe an app in chat and the live preview updates here.' },
          { id: 'welcome-action', type: 'button', props: {}, text: 'Start Building', variant: 'primary' },
        ],
      },
    ],
    navigation: { type: 'none' },
    activeScreenId: 'home',
    theme: {
      primaryColor: '#E3B26D',
      backgroundColor: '#0a0a0a',
      textColor: '#F5EDE3',
    },
    imageAssets: [],
    features: [],
  };
}

export const defaultAppSchema = createEmptySchema('LOTUS Demo');

export function validateAppSchema(schema: Partial<AppSchema> | null | undefined): SchemaValidationResult {
  const errors: string[] = [];
  if (!schema || typeof schema !== 'object') {
    return { valid: false, errors: ['schema is required'] };
  }
  if (!schema.name || typeof schema.name !== 'string') errors.push('name is required');
  if (!Array.isArray(schema.screens)) errors.push('screens must be an array');
  if (Array.isArray(schema.screens)) {
    schema.screens.forEach((screen, index) => {
      if (!screen.name || typeof screen.name !== 'string') errors.push(`screen ${index + 1} name is required`);
      if (!Array.isArray(screen.components)) errors.push(`screen ${screen.name || index + 1} components must be an array`);
      screen.components?.forEach((component, componentIndex) => {
        if (!component.type || !supportedComponentTypes.has(component.type)) {
          errors.push(`component ${componentIndex + 1} has unsupported type`);
        }
      });
    });
  }
  if (!schema.theme || typeof schema.theme.primaryColor !== 'string' || typeof schema.theme.backgroundColor !== 'string') {
    errors.push('theme with colors is required');
  }
  return { valid: errors.length === 0, errors };
}

export function mergeSchemaUpdates(base: AppSchema, updates: Partial<AppSchema>): AppSchema {
  return {
    ...base,
    ...updates,
    screens: updates.screens ?? base.screens,
    navigation: { ...base.navigation, ...(updates.navigation ?? {}) },
    theme: { ...base.theme, ...(updates.theme ?? {}) },
    imageAssets: updates.imageAssets ?? base.imageAssets,
    features: updates.features ?? base.features ?? [],
  };
}
