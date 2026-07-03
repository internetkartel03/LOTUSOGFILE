import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBuilderStore } from "../../../src/state/builderStore";

vi.mock("../../../src/lib/ai/localModels", () => ({
  discoverLocalModels: vi.fn(async () => [
    {
      id: "qwen-coder",
      label: "Qwen Coder",
      detail: "Default local builder · 1.5B",
      model: "qwen2.5-coder:1.5b",
      backend: "ollama",
      installed: true,
      setup: "ollama pull qwen2.5-coder:1.5b",
    },
  ]),
  chatWithLocalModel: vi.fn(async () =>
    JSON.stringify({
      name: "Fitness Flow",
      description: "A local-first fitness app",
      screens: [
        {
          id: "home",
          name: "Home",
          title: "Fitness Home",
          components: [{ type: "header", props: { title: "Fitness Home" } }],
        },
      ],
      navigation: { type: "bottom", items: [] },
      activeScreenId: "home",
      theme: { mode: "dark" },
      imageAssets: [],
      features: ["tracking"],
    }),
  ),
}));

describe("Builder Store - Initial State", () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useBuilderStore.getState();
    store.resetStore();
  });

  it("has correct initial state", () => {
    const state = useBuilderStore.getState();
    expect(state.project).toBeNull();
    expect(state.messages).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.activePanel).toBe("chat");
    expect(state.showPreview).toBe(true);
  });

  it("active panel defaults to chat", () => {
    const state = useBuilderStore.getState();
    expect(state.activePanel).toBe("chat");
  });

  it("preview is visible by default", () => {
    const state = useBuilderStore.getState();
    expect(state.showPreview).toBe(true);
  });

  it("has no messages initially", () => {
    const state = useBuilderStore.getState();
    expect(state.messages).toHaveLength(0);
  });
});

describe("Builder Store - Project Management", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("can create a new project", () => {
    const store = useBuilderStore.getState();
    store.createProject("TestProject");

    const state = useBuilderStore.getState();
    expect(state.project).not.toBeNull();
    expect(state.project?.name).toBe("TestProject");
  });

  it("can set current project", () => {
    const store = useBuilderStore.getState();
    const project = {
      id: "1",
      name: "MyApp",
      schema: { name: "MyApp", screens: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setCurrentProject(project);
    expect(useBuilderStore.getState().project?.name).toBe("MyApp");
  });

  it("can update project schema", () => {
    const store = useBuilderStore.getState();
    store.createProject("Test");

    const newSchema = {
      name: "Test",
      screens: [{ name: "Home", components: [] }],
    };

    store.updateSchema(newSchema);
    expect(useBuilderStore.getState().project?.schema).toEqual(newSchema);
  });

  it("can clear current project", () => {
    const store = useBuilderStore.getState();
    store.createProject("Test");
    store.clearProject();

    expect(useBuilderStore.getState().project).toBeNull();
  });
});

describe("Builder Store - Messages", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("can add a user message", () => {
    const store = useBuilderStore.getState();
    store.addMessage({
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });

    const messages = useBuilderStore.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("Hello");
  });

  it("can add an assistant message", () => {
    const store = useBuilderStore.getState();
    store.addMessage({
      role: "assistant",
      content: "Hi there!",
      timestamp: Date.now(),
    });

    const messages = useBuilderStore.getState().messages;
    expect(messages[0].role).toBe("assistant");
  });

  it("can clear messages", () => {
    const store = useBuilderStore.getState();
    store.addMessage({
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });
    store.clearMessages();

    expect(useBuilderStore.getState().messages).toHaveLength(0);
  });

  it("can set loading state", () => {
    const store = useBuilderStore.getState();
    store.setLoading(true);
    expect(useBuilderStore.getState().isLoading).toBe(true);

    store.setLoading(false);
    expect(useBuilderStore.getState().isLoading).toBe(false);
  });

  it("local provider updates the message flow without mock fallback", async () => {
    const store = useBuilderStore.getState();
    await store.sendMessage("Build a fitness app");

    const state = useBuilderStore.getState();
    expect(state.generationStatus).toBe("success");
    expect(state.schema.name).toBe("Fitness Flow");
    expect(state.appliedChanges[0]?.text).toContain("screen");
    expect(state.messages.some((message) => message.role === "assistant" && message.error)).toBe(false);
  });
});

describe("Builder Store - UI State", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("can toggle preview visibility", () => {
    const store = useBuilderStore.getState();
    expect(store.showPreview).toBe(true);

    store.togglePreview();
    expect(useBuilderStore.getState().showPreview).toBe(false);

    store.togglePreview();
    expect(useBuilderStore.getState().showPreview).toBe(true);
  });

  it("can set active panel", () => {
    const store = useBuilderStore.getState();
    store.setActivePanel("settings");
    expect(useBuilderStore.getState().activePanel).toBe("settings");

    store.setActivePanel("github");
    expect(useBuilderStore.getState().activePanel).toBe("github");
  });

  it("can toggle sidebar", () => {
    const store = useBuilderStore.getState();
    const initial = store.isSidebarOpen;

    store.toggleSidebar();
    expect(useBuilderStore.getState().isSidebarOpen).toBe(!initial);
  });
});

describe("Builder Store - Provider State", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("has qwen local provider by default with no mock fallback", () => {
    const state = useBuilderStore.getState();
    expect(state.selectedProvider).toBe("qwen-coder");
    expect(state.providers.some((provider) => provider.id === "mock")).toBe(false);
  });

  it("can change provider", () => {
    const store = useBuilderStore.getState();
    store.setProvider("qwen-coder");
    expect(useBuilderStore.getState().selectedProvider).toBe("qwen-coder");
  });

  it("can set API key", () => {
    const store = useBuilderStore.getState();
    store.setApiKey("qwen-coder", "test-key-123");
    expect(useBuilderStore.getState().apiKeys["qwen-coder"]).toBe("test-key-123");
  });
});

describe("Builder Store - Reset", () => {
  it("reset returns to initial state", () => {
    const store = useBuilderStore.getState();

    // Modify state
    store.createProject("Test");
    store.addMessage({ role: "user", content: "Hello", timestamp: Date.now() });
    store.setLoading(true);
    store.setActivePanel("settings");

    // Reset
    store.resetStore();

    const state = useBuilderStore.getState();
    expect(state.project).toBeNull();
    expect(state.messages).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.activePanel).toBe("chat");
  });
});

describe("Builder Store - Theme", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("has default theme", () => {
    const state = useBuilderStore.getState();
    expect(state.theme).toBeDefined();
  });

  it("can set theme", () => {
    const store = useBuilderStore.getState();
    store.setTheme("dark");
    expect(useBuilderStore.getState().theme).toBe("dark");
  });
});

describe("Builder Store - Export Settings", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("has default export format", () => {
    const state = useBuilderStore.getState();
    expect(state.exportFormat).toBeDefined();
  });

  it("can set export format", () => {
    const store = useBuilderStore.getState();
    store.setExportFormat("expo");
    expect(useBuilderStore.getState().exportFormat).toBe("expo");
  });
});

describe("Builder Store - Error Handling", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("can set error state", () => {
    const store = useBuilderStore.getState();
    store.setError("Something went wrong");
    expect(useBuilderStore.getState().error).toBe("Something went wrong");
  });

  it("can clear error state", () => {
    const store = useBuilderStore.getState();
    store.setError("Error");
    store.clearError();
    expect(useBuilderStore.getState().error).toBeNull();
  });
});

describe("Builder Store - Project List", () => {
  beforeEach(() => {
    useBuilderStore.getState().resetStore();
  });

  it("can add project to list", () => {
    const store = useBuilderStore.getState();
    const project = {
      id: "1",
      name: "Test",
      schema: { name: "Test", screens: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.addProject(project);
    expect(useBuilderStore.getState().projects).toHaveLength(1);
  });

  it("can remove project from list", () => {
    const store = useBuilderStore.getState();
    const project = {
      id: "1",
      name: "Test",
      schema: { name: "Test", screens: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.addProject(project);
    store.removeProject("1");
    expect(useBuilderStore.getState().projects).toHaveLength(0);
  });
});
