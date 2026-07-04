import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactElement, ReactNode } from 'react';
import {
  Bot,
  ChevronLeft,
  CirclePlay,
  Cloud,
  Code2,
  CreditCard,
  Database,
  Folder,
  Grid3X3,
  Github,
  LayoutTemplate,
  Lock,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  User,
  Wand2,
  Zap,
} from 'lucide-react';
import { DEFAULT_LOCAL_MODELS, discoverLocalModels, chatWithLocalModel, LocalModelError, type LocalModel } from '@/lib/ai/localModels';
import { LOCAL_HTML_SYSTEM_PROMPT, sanitizeHtmlDocument, type PreviewStatus } from '@/lib/builder/localHtmlPreview';
import { generateApp } from '@/lib/ai/universalAI';
import { detectAppType } from '@/lib/ai/appTypeDetection';
import { subscribeToProjectUpdates } from '@/lib/supabase/realtimeSubscription';
import type { AppSchema } from '@/lib/builder/appSchema';
import { createEmptySchema } from '@/lib/builder/appSchema';
import { starterTemplates } from '@/lib/templates/templates';
import type { StarterTemplate } from '@/lib/templates/templates';
import lotusFlower from '@/assets/lotus-flower.png';
import lotusLogo from '@/assets/lotus-logo.png';
import UniversityHub from './components/UniversityHub';
import './App.css';

type ScreenName = 'home' | 'projects' | 'preview' | 'settings';
type SheetName = 'connectors' | 'templates' | 'agents' | 'advanced' | 'github' | 'profile' | 'newProject';
type LocalModelId = string;
type PreviewDeviceId = 'phone' | 'tablet';
type PublicPath = '/' | '/about' | '/privacy' | '/terms' | '/subscriptions' | '/university';
type LegalDoc = 'terms' | 'privacy';
type AppRoute = { kind: 'builder' } | { kind: 'public'; path: PublicPath };

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  suggestions?: string[];
};

type LocalProject = {
  id: string;
  name: string;
  schema: AppSchema;
  createdAt: number;
  updatedAt: number;
};

const screens: ScreenName[] = ['home', 'projects', 'preview', 'settings'];
const hasSupabaseEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const assetBase = import.meta.env.BASE_URL;
const BUILDER_ROUTE = '/builder';
const builderOnlyDeploy = import.meta.env.VITE_LOTUS_DEPLOY_TARGET === 'builder';
const builderDeployUrl = import.meta.env.VITE_LOTUS_BUILDER_URL || 'https://lotus-builder-studio.vercel.app';
const landingLinks: Array<{ label: string; path: PublicPath }> = [
  { label: 'About', path: '/about' },
  { label: 'Lotus University', path: '/university' },
  { label: 'Subscriptions', path: '/subscriptions' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' },
];
const publicPaths: PublicPath[] = ['/', '/about', '/privacy', '/terms', '/subscriptions', '/university'];
const legalDocs: Record<LegalDoc, { title: string; updated: string; sections: Array<{ heading: string; body: ReactNode }> }> = {
  terms: {
    title: 'LOTUS Terms of Service',
    updated: 'July 1, 2026',
    sections: [
      { heading: 'Important Note', body: <p>This is a business draft for beta launch and should be reviewed by an attorney before relying on it for legal enforcement.</p> },
      { heading: '1. Acceptance', body: <p>By using LOTUS, you agree to be bound by these Terms. If you do not agree, do not use the platform.</p> },
      { heading: '2. Description of Service', body: <p>LOTUS is an AI-powered application builder that allows users to generate, preview, and export software projects using artificial intelligence. Features, pricing, and functionality may change over time as the platform evolves.</p> },
      { heading: '3. Accounts', body: <p>Some features may be available through anonymous or registered accounts. You are responsible for maintaining the security of your account and local project data.</p> },
      { heading: '4. Subscription Plans', body: <p>LOTUS currently offers Free Plan, LOTUS Pro Monthly, and LOTUS Builder Max Yearly. Subscription features, limits, and pricing may change with advance notice. Subscriptions automatically renew unless canceled before the next billing cycle where applicable.</p> },
      { heading: '5. User Content', body: <p>You retain ownership of the prompts, text, images, and other content you submit to LOTUS. You grant LOTUS a limited license to process that content solely to provide and improve the service.</p> },
      { heading: '6. Ownership of LOTUS', body: <p>LOTUS, its software, source code, user interface, workflows, designs, templates, documentation, branding, logos, graphics, prompts, AI agents, systems, and related intellectual property are owned by Metallic.v1 and its licensors. Using LOTUS does not transfer ownership of any part of the platform. Users may not copy, redistribute, sell, sublicense, reverse engineer, remove ownership notices, copy substantial proprietary portions, or use LOTUS branding without written permission.</p> },
      { heading: '7. Exported Projects', body: <p>Applications and code generated by LOTUS for your projects are intended for your own business or personal use. Ownership of exported project content is subject to the licenses of any third-party libraries, frameworks, models, or services used within those exports. The LOTUS platform itself remains the exclusive property of Metallic.v1.</p> },
      { heading: '8. Local Models', body: <p>This version is designed for local model runtimes such as Ollama and LM Studio. You are responsible for installed model licenses, local runtime setup, and device performance.</p> },
      { heading: '9. Acceptable Use', body: <p>You agree not to use LOTUS to violate applicable laws, infringe intellectual property rights, distribute malware, access systems without authorization, abuse or interfere with the platform, or generate unlawful or fraudulent content.</p> },
      { heading: '10. Availability', body: <p>LOTUS is provided on an as available basis. We do not guarantee uninterrupted availability, specific AI responses, or error-free operation.</p> },
      { heading: '11. Limitation of Liability', body: <p>To the fullest extent permitted by law, Metallic.v1 shall not be liable for indirect, incidental, consequential, special, or punitive damages arising from the use of LOTUS.</p> },
      { heading: '12. Changes', body: <p>We may modify these Terms from time to time. Continued use of LOTUS constitutes acceptance of any updated Terms.</p> },
      { heading: '13. Contact', body: <p>Questions regarding these Terms may be directed to the contact information provided on the LOTUS website.</p> },
    ],
  },
  privacy: {
    title: 'LOTUS Privacy Policy',
    updated: 'July 1, 2026',
    sections: [
      { heading: 'Overview', body: <p>LOTUS, powered by Metallic.v1, respects your privacy.</p> },
      { heading: 'Information We Collect', body: <p>Depending on how you use LOTUS, we may collect account information, anonymous session identifiers, project information, AI prompts, generated application data, device and browser information, usage analytics, and payment information through third-party payment providers when available.</p> },
      { heading: 'How We Use Information', body: <p>We use information to operate LOTUS, generate AI responses, save projects, improve platform performance, prevent abuse and fraud, and provide customer support.</p> },
      { heading: 'Local AI Models', body: <p>Builder prompts are intended to run through local runtimes on your device, such as Ollama or LM Studio, when you start those services.</p> },
      { heading: 'Model Files', body: <p>Local model files remain on your machine unless you choose to move, upload, or share them outside LOTUS.</p> },
      { heading: 'Cookies and Local Storage', body: <p>LOTUS may use cookies and browser storage to remember preferences, maintain sessions, save local projects, and improve performance.</p> },
      { heading: 'Data Sharing', body: <p>Metallic.v1 does not sell your personal information. Information may be shared only with trusted service providers necessary to operate the platform or when required by law.</p> },
      { heading: 'Data Security', body: <p>Reasonable administrative, technical, and organizational safeguards are used to protect user information, but no system can guarantee absolute security.</p> },
      { heading: 'Your Choices', body: <p>You may delete locally stored data, stop local runtimes, or stop using the service at any time.</p> },
      { heading: "Children's Privacy", body: <p>LOTUS is not intended for children under 13 or the minimum age required in your jurisdiction.</p> },
      { heading: 'Policy Updates', body: <p>This Privacy Policy may be updated periodically. Continued use of LOTUS indicates acceptance of any revisions.</p> },
      { heading: 'Contact', body: <p>Privacy questions may be directed through the contact information listed on the LOTUS website.</p> },
    ],
  },
};
const subscriptionPlans = [
  {
    name: 'Free',
    price: '$0',
    features: ['50 credits/month', 'Basic preview only', 'No tools', 'No extras', 'No export'],
  },
  {
    name: 'Pro Monthly',
    price: '$49/month',
    features: ['Full builder access', 'Templates', 'Tools', 'Exports', 'Project saving', 'Live preview'],
  },
  {
    name: 'Builder Max Yearly',
    price: '$300+/year',
    features: ['Everything in Pro', 'Local model selection', 'Higher usage', 'Premium templates', 'Advanced tools', 'Early access'],
  },
];
const previewDevices = [
  { id: 'phone', label: 'iPhone 15 Pro' },
  { id: 'tablet', label: 'iPad Pro' },
] as const;
const lotusAgents = [
  {
    icon: Wand2,
    title: 'Builder Agent',
    detail: 'Turns an app idea into a complete mobile UI.',
    tag: 'Build',
    prompt: 'Build a polished mobile app from this concept. Include a home screen, one core workflow, useful empty states, and a bottom navigation.',
  },
  {
    icon: Shield,
    title: 'QA Agent',
    detail: 'Hardens layout, accessibility, and missing states.',
    tag: 'Audit',
    prompt: 'Audit and improve the current app schema for accessibility, layout stability, missing states, labels, and tappable controls. Return the corrected schema.',
  },
  {
    icon: Database,
    title: 'Supabase Agent',
    detail: 'Adds auth, storage, and saved user data screens.',
    tag: 'Data',
    prompt: 'Add real Supabase-ready product behavior to this app: profile, saved records, settings, loading states, and database-backed language in the UI.',
  },
  {
    icon: Github,
    title: 'Import Agent',
    detail: 'Shapes GitHub projects into LOTUS screens.',
    tag: 'Import',
    prompt: 'Convert a GitHub-imported app idea into a LOTUS mobile interface with project overview, files, activity, and deploy status screens.',
  },
  {
    icon: Sparkles,
    title: 'Launch Agent',
    detail: 'Creates launch-ready monetization flows.',
    tag: 'Launch',
    prompt: 'Turn the current app into a launch-ready app with onboarding, pricing or upgrade moments, support states, and polished conversion copy.',
  },
];

const defaultFollowUpSuggestions = [
  'Create the next screen in this flow.',
  'Tighten the layout and spacing for iPad.',
  'Add richer visuals with inline SVG artwork.',
];

function requiresLocalRuntimeBridge(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname)
  );
}

function getPublicPath(pathname = window.location.pathname): PublicPath {
  const path = pathname as PublicPath;
  return publicPaths.includes(path) ? path : '/';
}

function getAppRoute(pathname = window.location.pathname): AppRoute {
  if (builderOnlyDeploy) return { kind: 'builder' };
  if (pathname === BUILDER_ROUTE || pathname.startsWith(`${BUILDER_ROUTE}/`)) return { kind: 'builder' };
  return { kind: 'public', path: getPublicPath(pathname) };
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => getAppRoute());
  const [paymentToast, setPaymentToast] = useState('');
  const [landingMenuOpen, setLandingMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [openSheet, setOpenSheet] = useState<SheetName | null>(null);
  const [templateCreatesNewProject, setTemplateCreatesNewProject] = useState(false);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [lightMode, setLightMode] = useState(true);
  const [maxTokens, setMaxTokens] = useState(() => readStoredNumber('lotus_max_tokens', 1800));
  const [temperature, setTemperature] = useState(() => readStoredNumber('lotus_temperature', 0.7));
  const [systemPrompt, setSystemPrompt] = useState(() => readStoredString('lotus_system_prompt', ''));
  const [previewDevice, setPreviewDevice] = useState<PreviewDeviceId>(() => readStoredPreviewDevice());
  const [canvasGrid, setCanvasGrid] = useState(() => readStoredBool('lotus_canvas_grid', true));
  const [autoSave, setAutoSave] = useState(() => readStoredBool('lotus_auto_save', true));
  const [defaultLocation, setDefaultLocation] = useState(() => readStoredString('lotus_default_location', 'Supabase / Lotus Projects'));
  const [settingsStatus, setSettingsStatus] = useState('');
  const [cacheSize, setCacheSize] = useState(() => getLocalCacheSize());
  const [sessionStatus, setSessionStatus] = useState(hasSupabaseEnv ? 'Connecting' : 'Local-only');
  const [storageUserId, setStorageUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('Guest');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubRef, setGithubRef] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubStatus, setGithubStatus] = useState('');
  const [chatModelId, setChatModelId] = useState<LocalModelId>(() => readStoredString('lotus_chat_model', 'qwen-coder'));
  const [availableModels, setAvailableModels] = useState<LocalModel[]>(DEFAULT_LOCAL_MODELS);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('empty');
  const [lastPrompt, setLastPrompt] = useState('');
  const [generationStatusText, setGenerationStatusText] = useState('');
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);

  const currentProject = projects.find((project) => project.id === currentProjectId) ?? projects[0] ?? null;
  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projectSearch, projects]);
  const activeModel = availableModels.find((model) => model.id === chatModelId) ?? availableModels[0] ?? null;
  const activePreviewDevice = previewDevices.find((device) => device.id === previewDevice) ?? previewDevices[0];

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    let cancelled = false;
    void import('@/lib/supabase/auth')
      .then(async ({ getCurrentUser }) => {
        const user = await getCurrentUser();
        if (!user || cancelled) {
          if (!cancelled) setSessionStatus('Guest - Supabase Ready');
          return;
        }
        setStorageUserId(user.id);
        setProfileName(user.name || 'Guest');
        setProfileEmail(user.email || '');
        setSessionStatus('Guest - Supabase');
        await syncStore((store) => store.setCurrentUser(user));
        const [{ loadUserProjects }] = await Promise.all([import('@/lib/supabase/projectStorage')]);
        const remote = await loadUserProjects(user.id);
        if (cancelled) return;
        if (remote.length > 0) {
          const hydrated = remote.map((project) => ({
            id: project.id,
            name: project.name,
            schema: project.schema ?? createEmptySchema(project.name),
            createdAt: new Date(project.created_at).getTime(),
            updatedAt: new Date(project.updated_at).getTime(),
          }));
          setProjects(hydrated);
          setCurrentProjectId(hydrated[0]?.id ?? null);
          await syncStore((store) => {
            store.setCurrentUser(user);
            if (hydrated[0]) store.setCurrentProject({ ...hydrated[0], history: [] });
          });
        } else {
          setProjects([]);
          setCurrentProjectId(null);
          await syncStore((store) => {
            store.setCurrentUser(user);
            store.clearProject();
          });
        }
      })
      .catch(() => {
        if (!cancelled) setSessionStatus('Local-only');
      });
    return () => {
      cancelled = true;
    };
  }, []);



  const refreshAvailableModels = async () => {
    const models = await discoverLocalModels();
    setAvailableModels(models);
    setChatModelId((current) => {
      if (models.some((model) => model.id === current)) return current;
      return models.find((model) => model.id === 'qwen-coder')?.id ?? models[0]?.id ?? 'qwen-coder';
    });
    return models;
  };

  useEffect(() => {
    const updatePath = () => setRoute(getAppRoute());
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  useEffect(() => {
    if (!paymentToast) return;
    const timeout = window.setTimeout(() => setPaymentToast(''), 1600);
    return () => window.clearTimeout(timeout);
  }, [paymentToast]);

  useEffect(() => {
    if (!landingMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLandingMenuOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [landingMenuOpen]);

  useEffect(() => {
    localStorage.setItem('lotus_max_tokens', String(maxTokens));
  }, [maxTokens]);

  useEffect(() => {
    localStorage.setItem('lotus_temperature', String(temperature));
  }, [temperature]);

  useEffect(() => {
    if (systemPrompt.trim()) localStorage.setItem('lotus_system_prompt', systemPrompt);
    else localStorage.removeItem('lotus_system_prompt');
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('lotus_preview_device', previewDevice);
    void syncStore((store) => store.setPreviewDevice(previewDevice));
  }, [previewDevice]);

  useEffect(() => {
    localStorage.setItem('lotus_canvas_grid', String(canvasGrid));
  }, [canvasGrid]);

  useEffect(() => {
    localStorage.setItem('lotus_auto_save', String(autoSave));
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem('lotus_default_location', defaultLocation);
  }, [defaultLocation]);

  useEffect(() => {
    if (!autoSave || !currentProject) return;
    const timer = window.setInterval(() => {
      void persistProject(currentProject);
      void syncStore((store) => store.saveCurrentProject());
    }, 30000);
    return () => window.clearInterval(timer);
  }, [autoSave, currentProject, storageUserId]);

  useEffect(() => {
    if (!currentProject || !hasSupabaseEnv) return;

    console.log('[Realtime] Setting up subscription for project:', currentProject.id);

    const unsubscribe = subscribeToProjectUpdates(
      currentProject.id,
      (updatedSchema) => {
        console.log('[Realtime] Received schema update:', updatedSchema);

        if (!updatedSchema.generatedHtml) {
          console.warn('[Realtime] No generatedHtml in schema');
          return;
        }

        setProjects((prev) =>
          prev.map((p) =>
            p.id === currentProject.id ? { ...p, schema: updatedSchema } : p
          )
        );

        try {
          const html = sanitizeHtmlDocument(updatedSchema.generatedHtml);
          if (html) {
            console.log('[Preview] Refreshing preview from Realtime event');
            setPreviewHtml(html);
            setPreviewStatus('success');
            setGenerationStatusText('Live preview updated.');
            setMessages((current) =>
              current.map((msg) =>
                msg.role === 'assistant' && msg.content.includes('Opening the live preview')
                  ? { ...msg, content: 'Preview is now live and updating in real-time.' }
                  : msg
              )
            );
          } else {
            console.warn('[Preview] Sanitized HTML is empty');
          }
        } catch (error) {
          console.error('[Preview] Error updating preview:', error);
          setGenerationStatusText('Preview update failed.');
        }
      },
      (error) => {
        console.error('[Realtime] Subscription error:', error);
        setGenerationStatusText('Realtime connection unavailable.');
      }
    );

    return () => {
      console.log('[Realtime] Unsubscribing from project updates');
      unsubscribe();
    };
  }, [currentProject?.id, hasSupabaseEnv]);

  const go = (screen: ScreenName) => {
    setPopoverOpen(false);
    setOpenSheet(null);
    setActiveScreen(screen);
  };

  const navigatePublicRoute = (path: PublicPath) => {
    setLandingMenuOpen(false);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setRoute({ kind: 'public', path });
  };

  const navigateBuilderRoute = () => {
    setLandingMenuOpen(false);
    if (builderOnlyDeploy) {
      if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
      setRoute({ kind: 'builder' });
      return;
    }
    window.location.href = builderDeployUrl;
  };

  const returnToSplash = () => {
    setLandingMenuOpen(false);
    setActiveScreen('home');
    setOpenSheet(null);
    setPopoverOpen(false);
    if (builderOnlyDeploy) return;
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    setRoute({ kind: 'public', path: '/' });
  };

  const openBottomSheet = (sheet: SheetName) => {
    setPopoverOpen(false);
    setOpenSheet(sheet);
  };

  const openTemplates = (createsNewProject: boolean) => {
    setTemplateCreatesNewProject(createsNewProject);
    openBottomSheet('templates');
  };

  const persistProject = async (project: LocalProject) => {
    if (!hasSupabaseEnv || !storageUserId) return;
    const { saveProject } = await import('@/lib/supabase/projectStorage');
    await saveProject(storageUserId, { id: project.id, name: project.name, schema: project.schema }).catch(() => undefined);
  };

  const toggleLightMode = () => {
    setLightMode((value) => {
      const next = !value;
      if (storageUserId) {
        void import('@/lib/supabase/profileStorage')
          .then(({ setThemeMode }) => setThemeMode(storageUserId, next ? 'light' : 'dark'))
          .catch(() => undefined);
      }
      return next;
    });
  };

  const cyclePreviewDevice = () => {
    const currentIndex = previewDevices.findIndex((device) => device.id === previewDevice);
    const next = previewDevices[(currentIndex + 1) % previewDevices.length];
    setPreviewDevice(next.id);
    setSettingsStatus(`Preview device set to ${next.label}.`);
  };

  const editMaxTokens = () => {
    const value = window.prompt('Maximum tokens per request', String(maxTokens));
    if (value === null) return;
    const next = Math.min(8000, Math.max(256, Number(value)));
    if (!Number.isFinite(next)) return;
    setMaxTokens(Math.round(next));
    setSettingsStatus(`Max tokens set to ${Math.round(next)}.`);
  };

  const editTemperature = () => {
    const value = window.prompt('Temperature, 0 to 2', String(temperature));
    if (value === null) return;
    const next = Math.min(2, Math.max(0, Number(value)));
    if (!Number.isFinite(next)) return;
    setTemperature(Number(next.toFixed(2)));
    setSettingsStatus(`Temperature set to ${Number(next.toFixed(2))}.`);
  };

  const editSystemPrompt = () => {
    const value = window.prompt('Custom system prompt. Leave blank to use default.', systemPrompt);
    if (value === null) return;
    setSystemPrompt(value.trim());
    setSettingsStatus(value.trim() ? 'Custom system prompt saved.' : 'System prompt reset to default.');
  };

  const editDefaultLocation = () => {
    const value = window.prompt('Default project location', defaultLocation);
    if (value === null) return;
    setDefaultLocation(value.trim() || 'Supabase / Lotus Projects');
    setSettingsStatus('Default project location updated.');
  };

  const backupProjects = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      location: defaultLocation,
      projects,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `lotus-projects-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSettingsStatus(`Backed up ${projects.length} project${projects.length === 1 ? '' : 's'}.`);
  };

  const clearCache = () => {
    if (!window.confirm('Clear local LOTUS cache? Supabase projects stay saved.')) return;
    ['lotus-builder', 'lotus_provider_count', 'lotus_github_projects', 'github_token'].forEach((key) => localStorage.removeItem(key));
    setCacheSize(getLocalCacheSize());
    setSettingsStatus('Local cache cleared.');
  };

  const sendPasswordReset = async () => {
    const email = window.prompt('Send password reset to', profileEmail);
    if (!email) return;
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setSettingsStatus(error ? error.message : `Password reset sent to ${email}.`);
    } catch (error) {
      setSettingsStatus(error instanceof Error ? error.message : 'Password reset failed.');
    }
  };

  const signOutUser = async () => {
    if (!window.confirm('Sign out of LOTUS?')) return;
    const { signOut } = await import('@/lib/supabase/auth');
    await signOut();
    setStorageUserId(null);
    setProfileName('Guest');
    setProfileEmail('');
    setSessionStatus(hasSupabaseEnv ? 'Guest - Supabase Ready' : 'Local-only');
    await syncStore((store) => store.setCurrentUser(null));
    setSettingsStatus('Signed out.');
  };

  const deleteStoredProject = async (id: string) => {
    if (!hasSupabaseEnv || !storageUserId) return;
    const { deleteProject } = await import('@/lib/supabase/projectStorage');
    await deleteProject(id).catch(() => undefined);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!storageUserId) {
      setProfileStatus('Connect Supabase first.');
      return;
    }
    const name = profileName.trim() || 'Guest';
    setProfileStatus('Saving...');
    try {
      const { updateProfile } = await import('@/lib/supabase/profileStorage');
      await updateProfile(storageUserId, { full_name: name, email: profileEmail.trim() || null });
      await syncStore((store) => store.setCurrentUser({ id: storageUserId, email: profileEmail.trim(), name }));
      setProfileStatus('Profile saved to Supabase.');
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : 'Profile save failed.');
    }
  };

  const importGitHubProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const owner = githubOwner.trim();
    const repo = githubRepo.trim();
    if (!owner || !repo) {
      setGithubStatus('Owner and repo are required.');
      return;
    }
    setGithubStatus('Importing...');
    try {
      const { loadProjectFromGitHub, saveGitHubToken } = await import('@/lib/github/githubStorage');
      if (githubToken.trim()) await saveGitHubToken(storageUserId ?? undefined, githubToken.trim());
      const schema = (await loadProjectFromGitHub(owner, repo, githubRef.trim() || undefined)) as AppSchema;
      const project = {
        id: crypto.randomUUID(),
        name: schema.name || repo,
        schema,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProjects((current) => [project, ...current]);
      setCurrentProjectId(project.id);
      await persistProject(project);
      await syncStore((store) => store.setCurrentProject({ ...project, history: [] }));
      setGithubStatus(`Imported ${project.name}.`);
      setOpenSheet(null);
      go('projects');
    } catch (error) {
      setGithubStatus(error instanceof Error ? error.message : 'GitHub import failed.');
    }
  };

  const handleHomeTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (!touchStart.current || openSheet) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? 'projects' : 'preview');
  };

  const createProject = async (name = 'Untitled App') => {
    const project = makeProject(name);
    setProjects((current) => [project, ...current]);
    setCurrentProjectId(project.id);
    go('home');
    await persistProject(project);
    await syncStore((store) => {
      store.setCurrentProject({ ...project, history: [] });
      void store.saveCurrentProject();
    });
  };

  const useTemplate = async (template: StarterTemplate) => {
    const schema = cloneSchema(template.schema);
    const now = Date.now();
    const targetProject: LocalProject =
      templateCreatesNewProject || !currentProject
        ? {
            id: crypto.randomUUID(),
            name: schema.name || template.name,
            schema,
            createdAt: now,
            updatedAt: now,
          }
        : {
            ...currentProject,
            name: schema.name || currentProject.name,
            schema,
            updatedAt: now,
          };

    setProjects((current) =>
      current.some((project) => project.id === targetProject.id)
        ? current.map((project) => (project.id === targetProject.id ? targetProject : project))
        : [targetProject, ...current],
    );
    setCurrentProjectId(targetProject.id);
    setOpenSheet(null);
    setPopoverOpen(false);
    setActiveScreen('preview');
    await persistProject(targetProject);
    await syncStore((store) => {
      store.setCurrentProject({ ...targetProject, history: [] });
      store.replaceSchema(schema);
      void store.saveCurrentProject();
    });
  };

  const openProject = (id: string) => {
    setCurrentProjectId(id);
    go('home');
    const project = projects.find((item) => item.id === id);
    if (project) void syncStore((store) => store.setCurrentProject({ ...project, history: [] }));
  };

  const renameProject = (id: string) => {
    const project = projects.find((item) => item.id === id);
    const name = window.prompt('Project name', project?.name ?? 'Untitled App')?.trim();
    if (!name) return;
    setProjects((current) =>
      current.map((item) =>
        item.id === id ? { ...item, name, updatedAt: Date.now(), schema: { ...item.schema, name } } : item,
      ),
    );
    const updated = projects.find((item) => item.id === id);
    if (updated) void persistProject({ ...updated, name, updatedAt: Date.now(), schema: { ...updated.schema, name } });
    void syncStore((store) => store.renameProject(id, name));
  };

  const deleteProject = (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    setProjects((current) => current.filter((project) => project.id !== id));
    if (currentProjectId === id) setCurrentProjectId(projects.find((project) => project.id !== id)?.id ?? null);
    void deleteStoredProject(id);
    void syncStore((store) => store.deleteProject(id));
  };

  const selectChatModel = (id: LocalModelId) => {
    setChatModelId(id);
    localStorage.setItem('lotus_chat_model', id);
    const selected = availableModels.find((model) => model.id === id);
    if (selected) {
      setSettingsStatus(
        selected.installed
          ? `Model set to ${selected.label} ${selected.detail}.`
          : `${selected.label} is selected. Start the local runtime first: ${selected.setup}`,
      );
    }
    void syncStore((store) => {
      store.setProviderId(id);
      store.setProvider(id);
    });
  };

  const exportCurrentPreview = () => {
    if (!previewHtml) {
      setSettingsStatus('Generate a preview first, then export the HTML.');
      return;
    }
    const projectName = (currentProject?.name || 'lotus-app')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const url = URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'lotus-app'}-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setSettingsStatus('Preview HTML exported.');
  };

  const stopGeneration = () => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setIsLoading(false);
    setPreviewStatus((current) => (current === 'success' ? current : 'empty'));
    setGenerationStatusText('Builder stopped. Your last preview stays in place.');
    setMessages((current) =>
      current.map((message) =>
        message.isLoading ? { ...message, content: 'Builder paused. Ask for the next move whenever you are ready.', isLoading: false } : message,
      ),
    );
  };

  // Local flow: a downloadable Ollama model running on this machine returns
  // one complete HTML document, which is sanitized and injected into the
  // phone-frame iframe. No cloud APIs or keys involved.
  const generateFromPrompt = async (content: string) => {
    if (!content || isLoading) return;

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;
    setInput('');
    setPopoverOpen(false);
    setOpenSheet(null);
    setIsLoading(true);
    setLastPrompt(content);
    setPreviewStatus('generating');
    setGenerationStatusText("Planning...");
    setActiveScreen("preview");
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "I am building your application now...", isLoading: true },
    ]);

    try {
      const appType = detectAppType(content);

      setGenerationStatusText("Generating...");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: "I am generating the core screens and layout..." }
            : message,
        ),
      );

      const result = await generateApp({
        prompt: content,
        projectContext: {
          name: currentProject?.name || "Untitled",
          appType,
        },
      });

      const html = sanitizeHtmlDocument(result.content);
      if (!html) throw new Error("Failed to generate app.");

      setGenerationStatusText("Building...");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: "I created the core screens and layout. Opening the live preview now..." }
            : message,
        ),
      );

      setPreviewHtml(html);
      setPreviewStatus("success");

      // Save generated code to Supabase for Realtime sync
      if (currentProject && storageUserId) {
        console.log('[Save] Saving generated code to Supabase for project:', currentProject.id);
        try {
          const { saveProject } = await import('@/lib/supabase/projectStorage');
          const updatedProject = {
            ...currentProject,
            updatedAt: Date.now(),
            schema: {
              ...currentProject.schema,
              generatedHtml: html,
              lastGenerated: new Date().toISOString(),
            },
          };
          await saveProject(storageUserId, updatedProject);
          console.log('[Save] Project saved to Supabase, Realtime event should trigger');
        } catch (error) {
          console.error('[Save] Error saving to Supabase:', error);
        }
      }

      const displayAppType = appType === "custom" ? "custom app" : appType;
      const responseText = "I built the first version of your " + displayAppType + ". The core screens and layout are ready. Here is what I can add next:";

      setGenerationStatusText("Ready.");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: responseText,
                isLoading: false,
                suggestions: result.suggestedNextSteps,
              }
            : message,
        ),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;

      // Log technical details for debugging
      console.error('Generation error:', error);

      // Show user-friendly error message
      const userMessage = 'We couldn\'t generate your app right now. Please try again.';
      setPreviewStatus('error');
      setGenerationStatusText('Generation failed.');
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: userMessage, isLoading: false }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
      if (generationAbortRef.current === controller) generationAbortRef.current = null;
    }
  };

  const regeneratePreview = () => {
    if (lastPrompt) void generateFromPrompt(lastPrompt);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await generateFromPrompt(input.trim());
  };

  const runAgent = (prompt: string) => {
    void generateFromPrompt(prompt);
  };

  const resetAppData = () => {
    if (!window.confirm('Reset local app data?')) return;
    setProjects([]);
    setCurrentProjectId(null);
    setMessages([]);
    setProjectSearch('');
    void syncStore((store) => {
      store.resetStore();
    });
  };

  const builderExperience = (
    <div className={`lotus-page ${lightMode ? '' : 'dark-mode-page'}`} onClick={() => setPopoverOpen(false)}>
      <div className={`lotus-app ${lightMode ? '' : 'dark-mode'}`} data-active-screen={activeScreen}>
        <section
          id="home"
          className={`lotus-screen ${activeScreen === 'home' ? 'active' : ''}`}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={handleHomeTouchEnd}
        >
          <div className="toprow">
            <button className="iconbtn plain" type="button" aria-label="Settings" onClick={() => go('settings')}>
              <Settings aria-hidden="true" />
            </button>
            <button className="iconbtn" type="button" aria-label="Preview" onClick={() => go('preview')}>
              <Play aria-hidden="true" fill="currentColor" strokeWidth={2.2} />
            </button>
          </div>
          <div className="home-hero">
            <img src={lotusLogo} alt="LOTUS" />
          </div>
          <ChatLog messages={messages} onOpenPreview={() => go('preview')} onSuggestion={(prompt) => void generateFromPrompt(prompt)} />
        </section>

        <section
          id="projects"
          className={`lotus-screen ${activeScreen === 'projects' ? 'active' : ''}`}
        >
          <div className="pagehead">
            <h1 className="serif title">Projects</h1>
            <div className="page-actions">
              <button className="newproj ghost" type="button" onClick={() => openBottomSheet('github')}>
                <Github aria-hidden="true" />
                Import
              </button>
              <button className="newproj" type="button" onClick={() => openBottomSheet('newProject')}>
                <Plus aria-hidden="true" />
                New
              </button>
            </div>
          </div>
          <div className="searchrow">
            <div className="searchbar">
              <Search aria-hidden="true" />
              <input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </div>
            <button className="filterbtn" type="button" aria-label="Project filters">
              <SlidersHorizontal aria-hidden="true" />
            </button>
          </div>
          <div className="projlist">
            {filteredProjects.length === 0 && (
              <div className="empty-projects">
                <Folder aria-hidden="true" />
                <b>Your builder workspace is ready</b>
                <span>Start a fresh project or pull one in from GitHub to keep building.</span>
              </div>
            )}
            {filteredProjects.map((project, index) => (
              <article className="projcard" key={project.id}>
                <button type="button" className={`thumb t-${index % 4}`} onClick={() => openProject(project.id)} aria-label={`Open ${project.name}`}>
                  <span className="bar" />
                  <span className="blob" />
                  <span className="blob2" />
                </button>
                <button type="button" className="meta" onClick={() => openProject(project.id)}>
                  <b>{project.name}</b>
                  <span>{currentProject && project.id === currentProject.id ? 'Current project' : 'Saved in Supabase'}</span>
                </button>
                <button type="button" className="dots" aria-label={`Rename ${project.name}`} onClick={() => renameProject(project.id)}>
                  <MoreHorizontal aria-hidden="true" />
                </button>
                <button type="button" className="trash" aria-label={`Delete ${project.name}`} onClick={() => deleteProject(project.id)}>
                  <Trash2 aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="preview"
          className={`lotus-screen ${activeScreen === 'preview' ? 'active' : ''}`}
        >
          <div className="toprow">
            <button className="iconbtn plain" type="button" aria-label="Settings" onClick={() => go('settings')}>
              <Settings aria-hidden="true" />
            </button>
            <button className="iconbtn" type="button" aria-label="Preview">
              <Play aria-hidden="true" fill="currentColor" strokeWidth={2.2} />
            </button>
          </div>
          <div className="headtext">
            <h2 className="serif">Preview</h2>
            <p>Live preview of your app, ready to keep iterating or export as HTML.</p>
          </div>
          <div className="phone-stage">
            <div className="phone-frame">
              <div className="phone-screen">
                {previewStatus === 'success' && previewHtml ? (
                  <iframe
                    title="App preview"
                    sandbox="allow-scripts"
                    srcDoc={previewHtml}
                  />
                ) : previewStatus === 'generating' ? (
                  <div className="phone-state">
                    <span className="spinner" aria-hidden="true" />
                    <span>{generationStatusText || 'Building preview locally...'}</span>
                    <button type="button" className="preview-regenerate secondary" onClick={stopGeneration}>
                      Stop
                    </button>
                  </div>
                ) : previewStatus === 'error' ? (
                  <div className="phone-state">
                    <span>Preview could not render. Try simplifying the request.</span>
                    <button type="button" className="preview-regenerate" onClick={regeneratePreview}>
                      Regenerate
                    </button>
                  </div>
                ) : (
                  <div className="phone-state">
                    <span>Start with a screen, a full flow, or a visual direction and the builder will shape it live.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="preview-actions">
            <button type="button" className="preview-regenerate" onClick={regeneratePreview} disabled={!lastPrompt || isLoading}>
              Rebuild
            </button>
            <button type="button" className="preview-regenerate secondary" onClick={exportCurrentPreview} disabled={!previewHtml || isLoading}>
              Export HTML
            </button>
          </div>
        </section>

        <section
          id="settings"
          className={`lotus-screen ${activeScreen === 'settings' ? 'active' : ''}`}
        >
          <div className="toprow">
            <button className="iconbtn" type="button" aria-label="Back" onClick={() => go('home')}>
              <ChevronLeft aria-hidden="true" />
            </button>
          </div>
          <div className="settings-head">
            <div>
              <h1 className="serif">Settings</h1>
              <div className="settings-sub">Customize your Lotus App Builder experience</div>
            </div>
            <img src={lotusLogo} alt="" aria-hidden="true" />
          </div>
          <SettingsSection label="Appearance">
            <SettingsRow icon={<Sun />} title="Light Mode" detail="Use a light interface" onClick={toggleLightMode} control={<span className={`toggle ${lightMode ? 'on' : ''}`} />} />
          </SettingsSection>
          <SettingsSection label="Profile">
            <SettingsRow
              icon={<User />}
              title={profileName || 'Default User'}
              detail={profileEmail || 'default@lotus.app'}
              badge="Free Plan"
              onClick={() => setOpenSheet('profile')}
              avatar
            />
            <SettingsRow icon={<User />} title="Edit Profile" detail="Update your name and email" onClick={() => setOpenSheet('profile')} />
            <SettingsRow icon={<Lock />} title="Change Password" detail="Send a Supabase reset email" onClick={sendPasswordReset} />
          </SettingsSection>
          <SettingsSection label="AI & Models">
            <SettingsRow icon={<Bot />} title="Local Model" detail="Optimized around one dependable local builder today" value={activeModel ? `${activeModel.label}${activeModel.installed ? '' : ' (setup)'}` : 'Qwen Coder'} onClick={() => setOpenSheet('advanced')} />
            <SettingsRow icon={<Settings />} title="Max Tokens" detail="Maximum tokens per request" value={String(maxTokens)} onClick={editMaxTokens} />
            <SettingsRow icon={<Zap />} title="Temperature" detail="Controls randomness of responses" value={String(temperature)} onClick={editTemperature} />
            <SettingsRow icon={<SlidersHorizontal />} title="System Prompt" detail="Customize the builder behavior" value={systemPrompt ? 'Custom' : 'Default'} onClick={editSystemPrompt} />
          </SettingsSection>
          <SettingsSection label="Builder Settings">
            <SettingsRow icon={<Smartphone />} title="Preview Device" detail="Default device for app previews" value={activePreviewDevice.label} onClick={cyclePreviewDevice} />
            <SettingsRow icon={<Grid3X3 />} title="Canvas Grid" detail="Show grid in the builder preview" onClick={() => setCanvasGrid((value) => !value)} control={<span className={`toggle ${canvasGrid ? 'on' : ''}`} />} />
            <SettingsRow icon={<Moon />} title="Auto Save" detail="Automatically save your work" value={autoSave ? 'Every 30 seconds' : 'Off'} onClick={() => setAutoSave((value) => !value)} />
            <SettingsRow icon={<Folder />} title="Default Project Location" detail="Where new projects are saved" value={defaultLocation} onClick={editDefaultLocation} />
            <SettingsRow icon={<ChevronLeft />} title="Open Public Site" detail="Jump back to the LOTUS landing experience" onClick={returnToSplash} />
          </SettingsSection>
          <SettingsSection label="Data & Account">
            <SettingsRow icon={<Cloud />} title="Back Up Projects" value={`${projects.length} project${projects.length === 1 ? '' : 's'}`} onClick={backupProjects} />
            <SettingsRow icon={<Database />} title={sessionStatus} detail={hasSupabaseEnv ? 'Supabase storage is configured; AI stays local' : 'Working locally until Supabase env vars are set'} value={storageUserId ? 'Active' : 'Guest'} onClick={() => setSettingsStatus(sessionStatus)} />
            <SettingsRow icon={<Trash2 />} title="Clear Cache" value={cacheSize} onClick={clearCache} danger />
            <SettingsRow icon={<LogOut />} title="Sign Out" onClick={signOutUser} danger />
            <SettingsRow icon={<Trash2 />} title="Reset App Data" detail="Clear local project state" onClick={resetAppData} danger />
          </SettingsSection>
          {settingsStatus && <div className="settings-status">{settingsStatus}</div>}
          <div className="footer">Lotus App Builder v1.0.0</div>
        </section>

        <ChatControls
          activeScreen={activeScreen}
          input={input}
          isLoading={isLoading}
          isPopoverOpen={isPopoverOpen}
          setInput={setInput}
          setPopoverOpen={setPopoverOpen}
          stopGeneration={stopGeneration}
          handleSubmit={handleSubmit}
        />

        <div className={`popover ${isPopoverOpen ? 'show' : ''}`} onClick={(event) => event.stopPropagation()}>
          <div className="pop-models" aria-label="Chat model">
            {availableModels.map((model) => (
              <button
                key={model.id}
                type="button"
                className={`model-chip ${chatModelId === model.id ? 'active' : ''}`}
                onClick={() => selectChatModel(model.id)}
              >
                <span>{model.label}</span>
                <small>{model.detail}</small>
              </button>
            ))}
          </div>
          <PopoverButton icon={<Sparkles />} title="Builder Model" detail="Qwen local today, API models later" onClick={() => { void refreshAvailableModels(); openBottomSheet('advanced'); }} />
          <PopoverButton icon={<LayoutTemplate />} title="Templates" detail="Start from a template" onClick={() => openTemplates(false)} />
          <PopoverButton icon={<Bot />} title="Agents" detail="AI agents & skills" onClick={() => openBottomSheet('agents')} />
        </div>

        <button type="button" className={`scrim ${openSheet ? 'show' : ''}`} aria-label="Close sheet" onClick={() => setOpenSheet(null)} />
        <BottomSheet name="connectors" openSheet={openSheet}>
          <SheetRow icon={<Database />} title="Supabase Storage" detail={hasSupabaseEnv ? 'Project storage is active' : 'Add Supabase env vars to activate'} tag={hasSupabaseEnv ? 'On' : 'Env'} />
          <SheetRow icon={<Github />} title="GitHub Import" detail="Import lotus-app.json from a repository" onClick={() => setOpenSheet('github')} />
          <SheetRow icon={<Code2 />} title="Local Model Runtime" detail="Use Ollama or LM Studio only. No cloud API keys for this version." tag="Local" />
          <SheetRow icon={<CreditCard />} title="Payments" detail="Stripe, subscriptions, checkout" tag="1" />
          <SheetRow icon={<Shield />} title="Auth & Services" detail="OAuth, email, storage" tag="4" />
        </BottomSheet>
        <BottomSheet name="newProject" openSheet={openSheet}>
          <SheetRow icon={<Plus />} title="Blank Project" detail="Start with an empty LOTUS app." onClick={() => createProject()} />
          <SheetRow icon={<LayoutTemplate />} title="Start From Template" detail="Choose a schema-backed starter app." onClick={() => openTemplates(true)} />
        </BottomSheet>
        <BottomSheet name="templates" openSheet={openSheet}>
          <div className="template-grid">
            {starterTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onUse={() => void useTemplate(template)} />
            ))}
          </div>
        </BottomSheet>
        <BottomSheet name="agents" openSheet={openSheet}>
          {lotusAgents.map((agent) => {
            const Icon = agent.icon;
            return (
              <SheetRow
                key={agent.title}
                icon={<Icon />}
                title={agent.title}
                detail={agent.detail}
                tag={agent.tag}
                onClick={() => runAgent(agent.prompt)}
              />
            );
          })}
        </BottomSheet>
        <BottomSheet name="advanced" openSheet={openSheet}>
          {requiresLocalRuntimeBridge() && (
            <div className="form-status">
              This public builder deploy is great for navigation and review, but local generation needs the app running on localhost because browsers block direct HTTPS-to-localhost model calls.
            </div>
          )}
          {availableModels.every((model) => !model.installed) && (
            <div className="form-status">
              Recommended setup: ollama pull qwen2.5-coder:1.5b. This build is tuned around one dependable local model today. API-key model slots can come in a later pass.
            </div>
          )}
          {availableModels.map((model) => (
            <SheetRow
              key={model.id}
              icon={<Bot />}
              title={`${model.label} ${model.detail}`}
              detail={model.installed ? 'Ready via Ollama' : model.setup}
              tag={chatModelId === model.id ? 'Active' : model.installed ? 'Ready' : 'Setup'}
              onClick={() => {
                selectChatModel(model.id);
                if (model.installed) setOpenSheet(null);
              }}
            />
          ))}
        </BottomSheet>
        <BottomSheet name="github" openSheet={openSheet}>
          <form className="sheet-form" onSubmit={importGitHubProject}>
            <label>
              GitHub token
              <input value={githubToken} onChange={(event) => setGithubToken(event.target.value)} type="password" autoComplete="off" />
            </label>
            <div className="form-grid">
              <label>
                Owner
                <input value={githubOwner} onChange={(event) => setGithubOwner(event.target.value)} />
              </label>
              <label>
                Repo
                <input value={githubRepo} onChange={(event) => setGithubRepo(event.target.value)} />
              </label>
            </div>
            <label>
              Branch or SHA
              <input value={githubRef} onChange={(event) => setGithubRef(event.target.value)} />
            </label>
            <button type="submit" className="sheet-submit">Import Project</button>
            {githubStatus && <div className="form-status">{githubStatus}</div>}
          </form>
        </BottomSheet>
        <BottomSheet name="profile" openSheet={openSheet}>
          <form className="sheet-form" onSubmit={saveProfile}>
            <label>
              Display name
              <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </label>
            <label>
              Email
              <input value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} type="email" />
            </label>
            <button type="submit" className="sheet-submit">Save Profile</button>
            {profileStatus && <div className="form-status">{profileStatus}</div>}
          </form>
        </BottomSheet>
        <nav id="nav" aria-label="Primary">
          {screens.map((screen) => (
            <button
              key={screen}
              type="button"
              className={`nav-item ${activeScreen === screen ? 'active' : ''}`}
              onClick={() => go(screen)}
              aria-current={activeScreen === screen ? 'page' : undefined}
            >
              {screen === 'home' && <img src={lotusFlower} alt="" aria-hidden="true" />}
              {screen === 'projects' && <Folder aria-hidden="true" strokeWidth={1.8} />}
              {screen === 'preview' && <CirclePlay aria-hidden="true" strokeWidth={1.8} />}
              {screen === 'settings' && <Settings aria-hidden="true" strokeWidth={1.8} />}
              {screen[0].toUpperCase() + screen.slice(1)}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
  const isBuilderRoute = route.kind === 'builder';
  const publicPath = route.kind === 'public' ? route.path : '/';
  const isHomeRoute = publicPath === '/';

  if (isBuilderRoute) {
    return builderExperience;
  }

  return (
    <main className={`landing-page ${isHomeRoute ? '' : 'public-page'}`}>
      {isHomeRoute && <div className="landing-video" aria-hidden="true" />}

      <header className={`landing-header ${isHomeRoute ? '' : 'public-header'}`}>
        <button
          className="landing-menu-button"
          type="button"
          aria-label={landingMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={landingMenuOpen}
          aria-controls="landing-menu"
          onClick={() => setLandingMenuOpen((open) => !open)}
        >
          <Menu aria-hidden="true" />
          <span>Menu</span>
        </button>
        {landingMenuOpen && (
          <nav id="landing-menu" className="landing-menu show">
            <button
              type="button"
              className="landing-menu-action"
              onClick={() => navigatePublicRoute('/about')}
            >
              About
            </button>
            <button
              type="button"
              className="landing-menu-action"
              onClick={() => {
                navigateBuilderRoute();
              }}
            >
              App Builder
            </button>
            {landingLinks.slice(1).map((link) => (
              <button
                key={link.path}
                type="button"
                className="landing-menu-action"
                onClick={() => {
                  setLandingMenuOpen(false);
                  navigatePublicRoute(link.path);
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {!isHomeRoute && (
        <PublicLandingPage path={publicPath} onHome={() => navigatePublicRoute('/')} onPayment={() => setPaymentToast('Payments coming soon')} />
      )}

      {paymentToast && <div className="landing-toast" role="status">{paymentToast}</div>}

    </main>
  );
}

function PublicLandingPage({ path, onHome, onPayment }: { path: PublicPath; onHome: () => void; onPayment: () => void }) {
  const legalDoc = path === '/terms' ? legalDocs.terms : path === '/privacy' ? legalDocs.privacy : null;
  const [legalOpen, setLegalOpen] = useState(false);

  if (path === '/subscriptions') {
    return (
      <section className="public-route-page subscriptions-page">
        <button className="public-brand" type="button" onClick={onHome}>LOTUS</button>
        <div className="subscriptions-hero">
          <div>
            <p className="public-kicker">Subscriptions</p>
            <h1>Choose how much power LOTUS should unlock.</h1>
            <p className="public-lede">Start with previews, move into full exports, then scale with richer local models and production-ready workflows.</p>
          </div>
          <img className="subscription-product-image" src={`${assetBase}lotus-subscription-box.png`} alt="LOTUS software box" />
        </div>
        <div className="pricing-grid">
          {subscriptionPlans.map((plan) => (
            <article className="pricing-card" key={plan.name}>
              <h2>{plan.name}</h2>
              <div className="price">{plan.price}</div>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <button type="button" onClick={onPayment}>Select Plan</button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (legalDoc) {
    const docKind = path === '/terms' ? 'Terms' : 'Policy';
    return (
      <section className="public-route-page legal-route-page legal-about-background">
        <button className="public-brand" type="button" onClick={onHome}>LOTUS</button>
        <article className="legal-entry-card">
          <p className="public-kicker">{docKind}</p>
          <h1>{legalDoc.title}</h1>
          <p className="public-lede">Review the {docKind.toLowerCase()} when you need it. The page stays calm until you open the full document.</p>
          <button type="button" className="public-pill-button" onClick={() => setLegalOpen(true)}>
            Show {docKind}
          </button>
        </article>
        {legalOpen && (
          <section className="legal-reader" role="dialog" aria-modal="true" aria-label={legalDoc.title}>
            <article className="legal-document">
              <button type="button" className="legal-close" onClick={() => setLegalOpen(false)}>Close</button>
              <h1>{legalDoc.title}</h1>
              <p className="legal-updated">Last Updated: {legalDoc.updated}</p>
              {legalDoc.sections.map((section) => (
                <section key={section.heading} className="legal-section">
                  <h2>{section.heading}</h2>
                  {section.body}
                </section>
              ))}
              <p className="legal-copyright">© 2026 Metallic.v1. All rights reserved.</p>
            </article>
          </section>
        )}
      </section>
    );
  }

  if (path === '/university') {
    return <UniversityHub />;
  }

  return (
    <section className="public-route-page about-page legal-about-background">
      <button className="public-brand" type="button" onClick={onHome}>LOTUS</button>
      <article className="about-document">
        <p className="public-kicker">About</p>
        <h1>LOTUS is a focused AI app builder for turning ideas into working software.</h1>
        <p className="public-lede">
          LOTUS gives creators, founders, and teams a clean way to generate mobile-first apps, preview interfaces, save projects, run local models, and prepare exports without losing control of their own work.
        </p>
        <div className="about-section-grid">
          <section>
            <h2>What LOTUS does</h2>
            <p>LOTUS helps users describe an app, shape the result, preview screens, manage projects, connect tools, and move toward a production-ready export flow.</p>
          </section>
          <section>
            <h2>What stays separate</h2>
            <p>The public landing pages are separate from the builder. About, Privacy, Terms, Subscriptions, and Lotus University do not use the builder bottom navigation or alter builder screens.</p>
          </section>
          <section>
            <h2>Who owns LOTUS</h2>
            <p>LOTUS is powered by Metallic.v1. The platform, brand, interface, workflows, templates, and proprietary systems remain owned by Metallic.v1 and its licensors.</p>
          </section>
          <section>
            <h2>What users own</h2>
            <p>Users retain ownership of their prompts, submitted content, and project ideas. Exported projects remain subject to any third-party libraries, services, or model terms used within those exports.</p>
          </section>
        </div>
      </article>
    </section>
  );
}

function ChatControls({
  activeScreen,
  input,
  isLoading,
  isPopoverOpen,
  setInput,
  setPopoverOpen,
  stopGeneration,
  handleSubmit,
}: {
  activeScreen: ScreenName;
  input: string;
  isLoading: boolean;
  isPopoverOpen: boolean;
  setInput: (value: string) => void;
  setPopoverOpen: (updater: (open: boolean) => boolean) => void;
  stopGeneration: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className={`chatwrap ${activeScreen === 'home' || activeScreen === 'preview' ? '' : 'hidden'}`} onClick={(event) => event.stopPropagation()}>
      <form className="chatbar" onSubmit={handleSubmit}>
        <button
          type="button"
          className={`pill ${isPopoverOpen ? 'open' : ''}`}
          aria-label="Add"
          aria-expanded={isPopoverOpen}
          onClick={() => setPopoverOpen((open) => !open)}
        >
          <Plus aria-hidden="true" />
        </button>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask for a screen, brand pass, image-rich hero, or full app flow..." aria-label="Build prompt" />
        {isLoading && (
          <button type="button" className="pill ghost" aria-label="Stop" onClick={stopGeneration}>
            Stop
          </button>
        )}
        <button type="submit" className="pill" aria-label="Send" disabled={!input.trim() || isLoading}>
          <Send aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function ChatLog({
  messages,
  onOpenPreview,
  onSuggestion,
}: {
  messages: ChatMessage[];
  onOpenPreview: () => void;
  onSuggestion: (prompt: string) => void;
}) {
  const lastUser = messages.slice().reverse().find((message) => message.role === 'user');
  const lastAssistant = messages.slice().reverse().find((message) => message.role === 'assistant');
  const followUpSuggestions = lastAssistant?.suggestions?.length ? lastAssistant.suggestions : defaultFollowUpSuggestions;
  if (!lastUser && !lastAssistant) return null;

  return (
    <section className="chat-log" aria-live="polite">
      {lastUser && (
        <div className="chat-log-row">
          <span>Prompt</span>
          <p>{lastUser.content}</p>
        </div>
      )}
      {lastAssistant && (
        <div className="chat-log-row">
          <span>{lastAssistant.isLoading ? 'Builder Live' : 'Build Update'}</span>
          {lastAssistant.isLoading ? (
            <div className="typing-line" aria-label="Generating" />
          ) : (
            <div className="result-card">
              <p>{lastAssistant.content}</p>
              <div className="chat-followups">
                {followUpSuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" className="followup-chip" onClick={() => onSuggestion(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
              <button type="button" className="sheet-submit" onClick={onOpenPreview}>
                Keep Building in Preview
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TemplateCard({ template, onUse }: { template: StarterTemplate; onUse: () => void }) {
  return (
    <article className="template-card">
      <TemplateThumbnail type={template.thumbnailType} />
      <div className="template-card-body">
        <span>{template.category}</span>
        <b>{template.name}</b>
        <p>{template.description}</p>
        <button type="button" onClick={onUse}>
          Use Template
        </button>
      </div>
    </article>
  );
}

function TemplateThumbnail({ type }: { type: StarterTemplate['thumbnailType'] }) {
  return (
    <div className={`template-thumb ${type}`} aria-hidden="true">
      <span className="tt-bar" />
      <span className="tt-hero" />
      <span className="tt-line one" />
      <span className="tt-line two" />
      <span className="tt-chip a" />
      <span className="tt-chip b" />
      <span className="tt-chip c" />
    </div>
  );
}

function PopoverButton({ icon, title, detail, onClick }: { icon: ReactElement; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" className="pop-item" onClick={onClick}>
      {icon}
      <span>
        <b>{title}</b>
        <small>{detail}</small>
      </span>
    </button>
  );
}

function SettingsRow({
  icon,
  title,
  detail,
  value,
  badge,
  control,
  onClick,
  danger = false,
  avatar = false,
}: {
  icon: ReactElement;
  title: string;
  detail?: string;
  value?: string;
  badge?: string;
  control?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  avatar?: boolean;
}) {
  const content = (
    <>
      <span className={avatar ? 'settings-avatar' : 'settings-icon'}>{icon}</span>
      <span className="rt">
        <b>{title}</b>
        {detail && <small>{detail}</small>}
        {badge && <em>{badge}</em>}
      </span>
      {control ?? (
        <>
          {value && <span className="settings-value">{value}</span>}
          <span className="chev">›</span>
        </>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`settings-row ${danger ? 'danger' : ''}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={`settings-row ${danger ? 'danger' : ''}`}>{content}</div>;
}

function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="sec">
      <div className="sec-label">{label}</div>
      <div className="settings-group">{children}</div>
    </section>
  );
}

function BottomSheet({ name, openSheet, children }: { name: SheetName; openSheet: SheetName | null; children: ReactNode }) {
  const title = name[0].toUpperCase() + name.slice(1);
  const subtitles: Record<SheetName, string> = {
    connectors: 'Connect storage, imports, and local runtime helpers.',
    templates: 'Choose a starting point for your app.',
    agents: 'Create AI agents to assist your app.',
    advanced: 'Model controls stay out of the main settings surface.',
    github: 'Import an existing LOTUS project from GitHub.',
    profile: 'Manage the user profile saved in Supabase.',
    newProject: 'Choose how this project should start.',
  };

  return (
    <section className={`sheet ${openSheet === name ? 'show' : ''}`} aria-hidden={openSheet !== name}>
      <div className="grab" />
      <h3 className="serif">{title}</h3>
      <div className="sh-sub">{subtitles[name]}</div>
      <div className="sheet-group">{children}</div>
    </section>
  );
}

function SheetRow({ icon, title, detail, tag, onClick }: { icon: ReactElement; title: string; detail: string; tag?: string; onClick?: () => void }) {
  return (
    <button type="button" className="sheet-row" onClick={onClick}>
      {icon}
      <span className="rt">
        <b>{title}</b>
        <small>{detail}</small>
      </span>
      {tag ? <span className="tag">{tag}</span> : <span className="chev">›</span>}
    </button>
  );
}

async function withStore<T>(callback: (store: Awaited<ReturnType<typeof importStore>>) => T | Promise<T>): Promise<T> {
  if (!hasSupabaseEnv) throw new Error('Supabase env is unavailable.');
  const store = await importStore();
  return callback(store);
}

async function syncStore<T>(callback: (store: Awaited<ReturnType<typeof importStore>>) => T | Promise<T>): Promise<void> {
  if (!hasSupabaseEnv) return;
  await withStore(callback).catch(() => undefined);
}

async function importStore() {
  const module = await import('@/state/builderStore');
  return module.useBuilderStore.getState();
}

function makeProject(name: string): LocalProject {
  const schema = createEmptySchema(name);
  return {
    id: crypto.randomUUID(),
    name,
    schema,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function cloneSchema(schema: AppSchema): AppSchema {
  return structuredClone(schema);
}

function readStoredString(key: string, fallback: string): string {
  if (typeof localStorage === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

function readStoredNumber(key: string, fallback: number): number {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  // value > 0 also heals storage corrupted by the old Number(null) === 0 bug
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readStoredBool(key: string, fallback: boolean): boolean {
  if (typeof localStorage === 'undefined') return fallback;
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

function readStoredPreviewDevice(): PreviewDeviceId {
  const value = readStoredString('lotus_preview_device', 'phone');
  return value === 'tablet' ? value : 'phone';
}


function getLocalCacheSize(): string {
  if (typeof localStorage === 'undefined') return '0 KB';
  let bytes = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) ?? '';
    bytes += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default App;
