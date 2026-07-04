import "@testing-library/jest-dom";

// Mock automation config
jest.mock(
  "../automation/config.json",
  () => ({
    __esModule: true,
    default: {
      storage: { baseUrl: "https://storage.epcnetwork.dev" },
      storageProviders: {
        default: {
          bucket: "default",
          usesCategory: true,
          consoleRootPrefix: "Promo",
          publicBaseUrl: "https://storage.5th-elementagency.com",
          publicPathPrefix: "files",
          publicRootPrefix: "Promo",
        },
        alphaone: {
          bucket: "alphaone",
          usesCategory: false,
          consoleRootPrefix: "promo",
          publicBaseUrl: "https://alphaonest.com",
          publicPathPrefix: "files",
          publicRootPrefix: "promo",
        },
        ttt: {
          bucket: "ttt",
          usesCategory: false,
          consoleRootPrefix: "creatives",
          publicBaseUrl: "https://ogfinstorage.com",
          publicPathPrefix: "files",
          publicRootPrefix: "creatives",
          folderPrefix: "creative-",
        },
      },
      browserProfiles: {
        default: { debugPort: 9222, userDataDir: "" },
        alphaone: { debugPort: 9223, userDataDir: "" },
        ttt: { debugPort: 9224, userDataDir: "" },
      },
    },
  }),
  { virtual: true }
);

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- installing a jsdom-missing global for tests
(globalThis as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- installing a jsdom-missing global for tests
(globalThis as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for W3C validator tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- installing a jsdom-missing global for tests
(globalThis as any).fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning: ReactDOM.render is no longer supported")) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && (args[0].includes("Warning: ReactDOM.render is no longer supported") || args[0].includes("Warning: componentWillReceiveProps"))) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
