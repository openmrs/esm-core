import { setupPaths, SpaConfig } from "@openmrs/esm-globals";
import "@openmrs/esm-styleguide/dist/openmrs-esm-styleguide.css";

declare var __webpack_public_path__: string;

function wireSpaPaths() {
  const baseElement = document.createElement("base");
  const baseHref = window.getOpenmrsSpaBase();
  baseElement.href = baseHref;
  document.head.appendChild(baseElement);
  __webpack_public_path__ = baseHref;
}

function setupUtils() {
  window.copyText = (source: HTMLElement) => {
    const sel = window.getSelection();

    if (sel) {
      const r = document.createRange();
      r.selectNode(source);
      sel.removeAllRanges();
      sel.addRange(r);
      document.execCommand("copy");
      sel.removeAllRanges();
    }
  };
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(
        `${window.getOpenmrsSpaBase()}service-worker.js`
      );
    });
  }
}

function runSpa(config: SpaConfig) {
  const { configUrls = [] } = config;
  const { run } = require("./run");
  return run(configUrls);
}

/**
 * Initializes the OpenMRS Microfrontend App Shell.
 * @param config The global configuration to apply.
 */
export function initializeSpa(config: SpaConfig) {
  setupUtils();
  setupPaths(config);
  wireSpaPaths();
  registerServiceWorker();
  return runSpa(config);
}
