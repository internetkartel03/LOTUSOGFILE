/**
 * App Renderer
 * 
 * Renders app schemas into live React components for the preview pane.
 * Converts JSON schema definitions into actual JSX components.
 */

import React, { useState, useEffect } from "react";
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Plus,
  ChevronLeft,
  Star,
  Heart,
  Share2,
  Menu,
  Bell,
  Settings,
  Check,
  Trash2,
  X,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Flame,
  Timer,
  Dumbbell,
  Apple,
  Coffee,
  Moon,
  Sun,
  Droplets,
  Footprints,
  Bike,
  Waves,
  TrendingUp,
  Award,
  Target,
  Zap,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Filter,
  MoreHorizontal,
  ChevronRight,
  Minus,
  Edit3,
  Bookmark,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Truck,
  Package,
  Percent,
  Gift,
  Tag,
  QrCode,
  Scan,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
  LogOut,
  KeyRound,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Camera,
  Image,
  Video,
  Mic,
  Send,
  Paperclip,
  Smile,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Flag,
  Ban,
  CircleUser,
  Users,
  UserPlus,
  UserMinus,
  Group,
  Store,
  Building2,
  Briefcase,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  Receipt,
  Wallet,
  PiggyBank,
  Landmark,
  CircleDollarSign,
  Banknote,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  History,
  Layers,
  Grid3X3,
  LayoutList,
  LayoutGrid,
  Rows3,
  Columns3,
  SplitSquareVertical,
  PanelLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  Link2,
  Unlink,
  Move,
  GripVertical,
  Navigation,
  Compass,
  Map,
  Locate,
  LocateFixed,
  Crosshair,
  PlusCircle,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { CarouselRenderer } from "./renderers/CarouselRenderer";
import { TabsRenderer } from "./renderers/TabsRenderer";
import { TaskListRenderer } from "./renderers/TaskListRenderer";

// Icon mapping for dynamic icon lookup
const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  search: Search,
  cart: ShoppingCart,
  user: User,
  plus: Plus,
  chevronLeft: ChevronLeft,
  star: Star,
  heart: Heart,
  share: Share2,
  menu: Menu,
  bell: Bell,
  settings: Settings,
  check: Check,
  trash: Trash2,
  x: X,
  play: Play,
  pause: Pause,
  rotate: RotateCcw,
  trophy: Trophy,
  flame: Flame,
  timer: Timer,
  dumbbell: Dumbbell,
  apple: Apple,
  coffee: Coffee,
  moon: Moon,
  sun: Sun,
  droplets: Droplets,
  footprints: Footprints,
  bike: Bike,
  swim: Waves,
  trending: TrendingUp,
  award: Award,
  target: Target,
  zap: Zap,
  activity: Activity,
  chart: BarChart3,
  calendar: Calendar,
  clock: Clock,
  filter: Filter,
  more: MoreHorizontal,
  chevronRight: ChevronRight,
  minus: Minus,
  edit: Edit3,
  bookmark: Bookmark,
  mapPin: MapPin,
  phone: Phone,
  mail: Mail,
  globe: Globe,
  creditCard: CreditCard,
  truck: Truck,
  package: Package,
  percent: Percent,
  gift: Gift,
  tag: Tag,
  qrCode: QrCode,
  scan: Scan,
  copy: Copy,
  checkCircle: CheckCircle2,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle,
  logout: LogOut,
  key: KeyRound,
  shield: Shield,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,
  camera: Camera,
  image: Image,
  video: Video,
  mic: Mic,
  send: Send,
  paperclip: Paperclip,
  smile: Smile,
  thumbsUp: ThumbsUp,
  message: MessageCircle,
  repeat: Repeat2,
  flag: Flag,
  ban: Ban,
  circleUser: CircleUser,
  users: Users,
  userPlus: UserPlus,
  userMinus: UserMinus,
  group: Group,
  store: Store,
  building: Building2,
  briefcase: Briefcase,
  graduation: GraduationCap,
  book: BookOpen,
  file: FileText,
  clipboard: ClipboardList,
  receipt: Receipt,
  wallet: Wallet,
  piggyBank: PiggyBank,
  landmark: Landmark,
  circleDollar: CircleDollarSign,
  banknote: Banknote,
  coins: Coins,
  arrowUp: ArrowUpRight,
  arrowDown: ArrowDownRight,
  arrowLeftRight: ArrowLeftRight,
  history: History,
  layers: Layers,
  grid: Grid3X3,
  layoutList: LayoutList,
  layoutGrid: LayoutGrid,
  rows3: Rows3,
  columns3: Columns3,
  split: SplitSquareVertical,
  panelLeft: PanelLeft,
  maximize: Maximize2,
  minimize: Minimize2,
  refresh: RefreshCw,
  download: Download,
  upload: Upload,
  externalLink: ExternalLink,
  link: Link2,
  unlink: Unlink,
  move: Move,
  grip: GripVertical,
  navigation: Navigation,
  compass: Compass,
  map: Map,
  locate: Locate,
  locateFixed: LocateFixed,
  crosshair: Crosshair,
  plusCircle: PlusCircle,
  minusCircle: MinusCircle,
  xCircle: XCircle,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Star;
}

function getComponentValue(component: any, field: string) {
  return component?.[field] ?? component?.props?.[field];
}

export function getActiveScreen(schema: any) {
  if (!Array.isArray(schema?.screens) || schema.screens.length === 0) return null;
  return (
    schema.screens.find((screen: any) => screen.id === schema.activeScreenId) ||
    schema.screens.find((screen: any) => screen.name === schema.activeScreenId) ||
    schema.screens[0]
  );
}

function resolveImageSource(component: any, schema?: any): string | undefined {
  const direct = getComponentValue(component, "src");
  if (typeof direct === "string" && direct.startsWith("data:")) return direct;

  const image = getComponentValue(component, "image");
  if (typeof image === "string" && image.startsWith("data:")) return image;

  const assetId =
    getComponentValue(component, "assetId") ||
    getComponentValue(component, "imageAssetId") ||
    (typeof direct === "string" ? direct : undefined) ||
    (typeof image === "string" ? image : undefined);

  const asset = schema?.imageAssets?.find((item: any) => item.id === assetId || item.name === assetId);
  return asset?.dataUrl;
}

function ImageAssetFrame({
  src,
  alt = "Uploaded image",
  height = 192,
}: {
  src?: string;
  alt?: string;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="w-full rounded-2xl object-cover bg-gray-100"
        style={{ height }}
      />
    );
  }

  return (
    <div
      className="w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center"
      style={{ height }}
    >
      <ImageIcon className="w-10 h-10 text-gray-300" />
    </div>
  );
}

// Component renderers
function HeaderComponent({
  title,
  showBackButton = false,
  showAddButton = false,
  onBack,
  onAdd,
}: {
  title: string;
  showBackButton?: boolean;
  showAddButton?: boolean;
  onBack?: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      {showAddButton && (
        <button
          onClick={onAdd}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function TextComponent({
  content,
  variant = "body",
}: {
  content: string;
  variant?: string;
}) {
  const variantClasses: Record<string, string> = {
    title: "text-2xl font-bold text-gray-900",
    subtitle: "text-lg font-semibold text-gray-700",
    body: "text-sm text-gray-600 leading-relaxed",
    caption: "text-xs text-gray-400",
    price: "text-xl font-bold text-primary",
    label: "text-xs font-medium text-gray-500 uppercase tracking-wide",
  };

  return <p className={variantClasses[variant] || variantClasses.body}>{content}</p>;
}

function ButtonComponent({
  text,
  variant = "primary",
  icon,
  onClick,
}: {
  text: string;
  variant?: string;
  icon?: string;
  onClick?: () => void;
}) {
  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "text-primary hover:bg-primary/10",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  const Icon = icon ? getIcon(icon) : null;

  return (
    <button
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
        variantClasses[variant] || variantClasses.primary
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {text}
    </button>
  );
}

function InputComponent({
  label,
  placeholder,
  type = "text",
}: {
  label?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
    </div>
  );
}

function CardComponent({
  image,
  title,
  description,
  price,
  rating,
  onPress,
}: {
  image?: string;
  title: string;
  description?: string;
  price?: string;
  rating?: number;
  onPress?: () => void;
}) {
  return (
    <div
      onClick={onPress}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
    >
      {image && (
        <ImageAssetFrame src={image} alt={title} height={160} />
      )}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {price && (
            <span className="text-lg font-bold text-primary">{price}</span>
          )}
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm text-gray-600">{rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGrid({ title }: { title?: string }) {
  const products = [
    { title: "Wireless Earbuds", price: "$79.99", rating: 4.5 },
    { title: "Smart Watch", price: "$199.99", rating: 4.8 },
    { title: "Phone Case", price: "$24.99", rating: 4.2 },
    { title: "USB-C Cable", price: "$14.99", rating: 4.6 },
  ];

  return (
    <div className="space-y-3">
      {title && <h3 className="font-semibold text-gray-900 px-1">{title}</h3>}
      <div className="grid grid-cols-2 gap-3">
        {products.map((p, i) => (
          <CardComponent key={i} {...p} />
        ))}
      </div>
    </div>
  );
}

function CategoryGrid({ categories }: { categories?: string[] }) {
  const cats = categories || ["Electronics", "Fashion", "Home", "Sports"];
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-cyan-500 to-cyan-600",
    "from-red-500 to-red-600",
    "from-teal-500 to-teal-600",
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cats.map((cat, i) => (
        <button
          key={i}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center shadow-lg`}
          >
            <Grid3X3 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-600 text-center leading-tight">
            {cat}
          </span>
        </button>
      ))}
    </div>
  );
}

function SearchBarComponent({ placeholder = "Search..." }: { placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

// TabsComponent is extracted to renderers/TabsRenderer.tsx
const TabsComponent = TabsRenderer;

// CarouselComponent is extracted to renderers/CarouselRenderer.tsx
const CarouselComponent = CarouselRenderer;

// TaskListComponent is extracted to renderers/TaskListRenderer.tsx
const TaskListComponent = TaskListRenderer;

function StatsRowComponent({ stats }: { stats?: Array<{ label: string; value: string }> }) {
  const defaultStats = [
    { label: "Steps", value: "8,432" },
    { label: "Calories", value: "420" },
    { label: "Active", value: "45m" },
  ];

  const displayStats = stats || defaultStats;

  return (
    <div className="flex justify-around py-4">
      {displayStats.map((stat, i) => (
        <div key={i} className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function ProgressRingComponent({
  title,
  percentage = 75,
}: {
  title?: string;
  percentage?: number;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-4">
      {title && <p className="text-sm font-medium text-gray-600 mb-3">{title}</p>}
      <div className="relative">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

function BottomNavComponent({
  items,
  activeScreenId,
  onNavigate,
}: {
  items?: Array<{ icon: string; label: string; id?: string; screenId?: string }>;
  activeScreenId?: string;
  onNavigate?: (screenId: string) => void;
}) {
  const [active, setActive] = useState(0);
  const navItems = items || [
    { icon: "home", label: "Home", screenId: "home" },
    { icon: "search", label: "Search", screenId: "search" },
    { icon: "cart", label: "Cart", screenId: "cart" },
    { icon: "user", label: "Profile", screenId: "profile" },
  ];
  const schemaActiveIndex = navItems.findIndex((item) => (item.screenId || item.id) === activeScreenId);

  return (
    <div className="flex justify-around items-center py-2 bg-white border-t border-gray-100">
      {navItems.map((item, i) => {
        const Icon = getIcon(item.icon);
        const isActive = schemaActiveIndex >= 0 ? schemaActiveIndex === i : active === i;
        return (
          <button
            key={i}
            onClick={() => {
              setActive(i);
              const targetScreenId = item.screenId || item.id;
              if (targetScreenId) onNavigate?.(targetScreenId);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
              isActive ? "text-primary" : "text-gray-400"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FABComponent({ icon, onClick }: { icon?: string; onClick?: () => void }) {
  const Icon = getIcon(icon || "plus");
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition-transform"
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}

function DividerComponent() {
  return <hr className="border-gray-100" />;
}

function SectionTitleComponent({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold text-gray-900">{title}</h3>;
}

function WorkoutListComponent() {
  const workouts = [
    { name: "Morning Run", duration: "30 min", calories: "320", completed: false },
    { name: "Upper Body", duration: "45 min", calories: "280", completed: true },
  ];

  return (
    <div className="space-y-2">
      {workouts.map((w, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              w.completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
            }`}
          >
            {w.completed ? (
              <Check className="w-5 h-5" />
            ) : (
              <Dumbbell className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{w.name}</p>
            <p className="text-xs text-gray-500">
              {w.duration} · {w.calories} cal
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartListComponent() {
  const [items, setItems] = useState([
    { id: 1, name: "Wireless Earbuds", price: 79.99, qty: 1 },
    { id: 2, name: "Phone Case", price: 24.99, qty: 2 },
  ]);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(0, item.qty + delta) }
          : item
      ).filter((item) => item.qty > 0)
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-sm font-bold text-primary">
              ${item.price.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQty(item.id, -1)}
              className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-medium w-4 text-center">
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item.id, 1)}
              className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className="font-medium text-green-600">Free</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryComponent({ items }: { items?: string[] }) {
  const summaryItems = items || ["Subtotal", "Shipping", "Total"];
  return (
    <div className="space-y-2 py-3">
      {summaryItems.map((item, i) => (
        <div
          key={i}
          className={`flex justify-between ${
            item === "Total" ? "text-base font-bold pt-2 border-t" : "text-sm"
          }`}
        >
          <span className="text-gray-500">{item}</span>
          <span>{item === "Total" ? "$99.99" : "$0.00"}</span>
        </div>
      ))}
    </div>
  );
}

// Accept every field name the AI may use for a video link so URLs survive parsing.
function resolveVideoSource(component: any): string | undefined {
  const candidates = [
    component.videoUrl,
    component.video_url,
    component.videoSrc,
    component.lessonVideoUrl,
    component.src,
    component.url,
    component.video,
    getComponentValue(component, "videoUrl"),
    getComponentValue(component, "src"),
  ];
  const found = candidates.find((value) => typeof value === "string" && /^(https?:\/\/|\/|data:)/.test(value.trim()));
  return typeof found === "string" ? found.trim() : undefined;
}

function VideoBlock({
  src,
  title,
  onEnded,
}: {
  src?: string;
  title?: string;
  onEnded?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="h-48 rounded-2xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
        <Video className="w-10 h-10" />
        <span className="text-sm font-medium">Video coming soon</span>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="h-48 rounded-2xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
        <Video className="w-10 h-10" />
        <span className="text-sm font-medium">Video unavailable</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-black">
      {title && (
        <p className="px-4 pt-3 pb-1 text-sm font-medium text-white/80">{title}</p>
      )}
      <video
        controls
        playsInline
        preload="metadata"
        src={src}
        className="w-full max-h-64 block"
        onError={() => setFailed(true)}
        onEnded={onEnded}
      />
    </div>
  );
}

// Main renderer
export function renderComponent(
  component: any,
  index: number,
  schema?: any,
  onNavigate?: (screenId: string) => void,
  videoState?: { ended: boolean; onEnded: () => void }
): React.ReactNode {
  if (!component || !component.type) return null;

  const key = component.id ? `component-${component.id}` : `${component.type}-${index}`;

  switch (component.type) {
    case "header":
      return (
        <HeaderComponent
          key={key}
          title={component.title}
          showBackButton={component.showBackButton}
          showAddButton={component.showAddButton}
        />
      );

    case "text":
      return (
        <TextComponent
          key={key}
          content={component.content}
          variant={component.variant}
        />
      );

    case "button": {
      const isQuizButton = /quiz|assessment/i.test(component.text || "");
      const gated = Boolean(videoState && isQuizButton && !videoState.ended);
      return (
        <div
          key={key}
          className={gated ? "opacity-50 pointer-events-none" : undefined}
          title={gated ? "Finish the video to unlock" : undefined}
        >
          <ButtonComponent
            text={component.text}
            variant={component.variant}
            icon={component.icon}
          />
        </div>
      );
    }

    case "input":
      return (
        <InputComponent
          key={key}
          label={component.label}
          placeholder={component.placeholder}
          type={component.inputType}
        />
      );

    case "card":
      return (
        <CardComponent
          key={key}
          image={resolveImageSource(component, schema) || component.image}
          title={component.title}
          description={component.description}
          price={component.price}
          rating={component.rating}
        />
      );

    case "productGrid":
      return <ProductGrid key={key} title={component.title} />;

    case "categoryGrid":
      return <CategoryGrid key={key} categories={component.categories} />;

    case "searchBar":
      return <SearchBarComponent key={key} placeholder={component.placeholder} />;

    case "tabs":
      return <TabsComponent key={key} tabs={component.tabs} />;

    case "carousel":
      return <CarouselComponent key={key} items={component.items} />;

    case "taskList":
      return <TaskListComponent key={key} emptyState={component.emptyState} />;

    case "statsRow":
      return <StatsRowComponent key={key} stats={component.stats} />;

    case "progressRing":
      return (
        <ProgressRingComponent
          key={key}
          title={component.title}
          percentage={component.percentage}
        />
      );

    case "chart":
      return (
        <div
          key={key}
          className="h-48 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl flex items-center justify-center"
        >
          <BarChart3 className="w-12 h-12 text-primary/30" />
        </div>
      );

    case "bottomNav":
      return <BottomNavComponent key={key} items={component.items} activeScreenId={schema?.activeScreenId} onNavigate={onNavigate} />;

    case "fab":
      return (
        <div key={key} className="flex justify-end">
          <FABComponent icon={component.icon} />
        </div>
      );

    case "divider":
      return <DividerComponent key={key} />;

    case "sectionTitle":
      return <SectionTitleComponent key={key} title={component.title} />;

    case "workoutList":
      return <WorkoutListComponent key={key} />;

    case "cartList":
      return <CartListComponent key={key} />;

    case "summary":
      return <SummaryComponent key={key} items={component.items} />;

    case "timer":
      return (
        <div
          key={key}
          className="text-center py-8"
        >
          <div className="text-6xl font-mono font-bold text-primary tracking-wider">
            00:00
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Play className="w-6 h-6 ml-0.5" />
            </button>
            <button className="w-14 h-14 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <Pause className="w-6 h-6" />
            </button>
            <button className="w-14 h-14 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>
      );

    case "exerciseList":
      return (
        <div key={key} className="space-y-2">
          {["Push-ups", "Squats", "Plank"].map((ex, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <span className="flex-1 text-sm font-medium">{ex}</span>
              {component.showCheckboxes && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}
            </div>
          ))}
        </div>
      );

    case "rating":
      return (
        <div key={key} className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= (component.value || 0)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }`}
            />
          ))}
        </div>
      );

    case "datePicker":
      return (
        <div key={key} className="space-y-1.5">
          {component.label && (
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {component.label}
            </label>
          )}
          <button className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-left text-sm text-gray-600 flex items-center justify-between">
            <span>Select date</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      );

    case "select":
      return (
        <div key={key} className="space-y-1.5">
          {component.label && (
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {component.label}
            </label>
          )}
          <button className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-left text-sm text-gray-600 flex items-center justify-between">
            <span>{component.options?.[0] || "Select"}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 -rotate-90" />
          </button>
        </div>
      );

    case "badge":
      return (
        <span
          key={key}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          {component.text || "Badge"}
        </span>
      );

    case "avatar":
      return (
        <div key={key} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
            {component.initials || "U"}
          </div>
          {component.name && (
            <div>
              <p className="text-sm font-medium">{component.name}</p>
              {component.subtitle && (
                <p className="text-xs text-gray-500">{component.subtitle}</p>
              )}
            </div>
          )}
        </div>
      );

    case "video":
    case "videoPlayer":
    case "lessonVideo":
      return (
        <VideoBlock
          key={key}
          src={resolveVideoSource(component)}
          title={component.title}
          onEnded={videoState?.onEnded}
        />
      );

    case "image":
      return (
        <ImageAssetFrame
          key={key}
          src={resolveImageSource(component, schema)}
          alt={component.alt || component.title || "Uploaded image"}
          height={component.height || 192}
        />
      );

    case "imageGallery":
      return (
        <ImageAssetFrame
          key={key}
          src={resolveImageSource(component, schema)}
          alt={component.alt || component.title || "Uploaded image gallery"}
          height={component.height || 250}
        />
      );

    case "list":
      return (
        <div key={key} className="divide-y divide-gray-100">
          {(component.items || ["Item 1", "Item 2", "Item 3"]).map(
            (item: string, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-1"
              >
                <span className="text-sm text-gray-700">{item}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            )
          )}
        </div>
      );

    default:
      return (
        <div
          key={key}
          className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-700"
        >
          Unknown component: {component.type}
        </div>
      );
  }
}

// Need to import Image separately since we use it in multiple places
function ImageIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

// Render full app schema
export function renderAppSchema(schema: any, onNavigate?: (screenId: string) => void): React.ReactNode {
  if (!schema || !schema.screens) {
    return (
      <div className="p-8 text-center text-gray-400">
        No app schema to render
      </div>
    );
  }

  const screen = getActiveScreen(schema);
  if (!screen) {
    return (
      <div className="p-8 text-center text-gray-400">
        No screens to render
      </div>
    );
  }
  const bottomNavComponent = screen.components?.find((c: any) => c.type === "bottomNav");
  const navigationItems = bottomNavComponent?.items || schema.navigation?.items;

  return (
    <ScreenBody
      key={schema.activeScreenId || screen.id || screen.name}
      screen={screen}
      schema={schema}
      onNavigate={onNavigate}
      navigationItems={navigationItems}
    />
  );
}

function ScreenBody({
  screen,
  schema,
  onNavigate,
  navigationItems,
}: {
  screen: any;
  schema: any;
  onNavigate?: (screenId: string) => void;
  navigationItems: any;
}) {
  const [videoEnded, setVideoEnded] = useState(false);
  const hasVideo = Boolean(
    screen.components?.some((c: any) => ["video", "videoPlayer", "lessonVideo"].includes(c.type))
  );
  const videoState = hasVideo
    ? { ended: videoEnded, onEnded: () => setVideoEnded(true) }
    : undefined;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Screen content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {screen.components?.map((component: any, i: number) =>
            renderComponent(component, i, schema, onNavigate, videoState)
          ) || <p className="text-center text-gray-400 py-8">Empty screen</p>}
        </div>
      </div>

      {/* FAB if present */}
      {screen.components?.some((c: any) => c.type === "fab") && (
        <div className="absolute bottom-20 right-4">
          <FABComponent />
        </div>
      )}

      {/* Bottom nav if present */}
      {screen.components?.some((c: any) => c.type === "bottomNav") && (
        <div className="shrink-0">
          <BottomNavComponent items={navigationItems} activeScreenId={schema.activeScreenId} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}

export function AppRenderer({
  schema,
  onNavigate,
  isDesktop,
}: {
  schema: any;
  onNavigate?: (screenId: string) => void;
  isDesktop?: boolean;
}) {
  return (
    <div className={isDesktop ? 'h-full w-full' : 'h-full w-full'}>
      {renderAppSchema(schema, onNavigate)}
    </div>
  );
}

// Extract theme from schema
export function extractTheme(schema: any) {
  if (!schema?.theme) return null;

  return {
    primaryColor: schema.theme.primaryColor || "#6366f1",
    secondaryColor: schema.theme.secondaryColor,
    backgroundColor: schema.theme.backgroundColor || "#ffffff",
    darkMode: schema.theme.darkMode || false,
    cardStyle: schema.theme.cardStyle || "rounded-xl",
  };
}

// Get screen names from schema
export function getScreenNames(schema: any): string[] {
  if (!schema?.screens) return [];
  return schema.screens.map((s: any) => s.name);
}
