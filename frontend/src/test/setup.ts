import "@testing-library/jest-dom";

// jsdom ships no PointerEvent, which long-press gestures listen for. MouseEvent
// carries everything they read (`button`), so a bare subclass is enough.
if (!("PointerEvent" in window)) {
  Object.defineProperty(window, "PointerEvent", {
    writable: true,
    value: class extends MouseEvent {},
  });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
