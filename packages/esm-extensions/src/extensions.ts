import { mountRootParcel } from "single-spa";
import { pathToRegexp, Key } from "path-to-regexp";
import { createGlobalStore } from "@openmrs/esm-api";
import { getExtensionSlotConfig } from "@openmrs/esm-config";

export interface ExtensionDefinition {
  name: string;
  load(): Promise<any>;
}

interface ExtensionRegistration extends ExtensionDefinition {
  moduleName: string;
}

export interface ExtensionStore {
  slots: Record<string, ExtensionSlotInfo>;
  extensions: Record<string, ExtensionRegistration>;
}

export interface ExtensionSlotInfo {
  /**
   * The name under which the extension slot has been registered.
   */
  name: string;
  /**
   * The set of modules where the extension slot has been used.
   */
  modules: Array<string>;
  /**
   * The set of extension IDs which have been attached to this slot.
   * This is essentially a complete history of `attach` calls to this specific slot.
   * However, not all of these extension IDs should be rendered.
   * `assignedIds` is the set defining those.
   */
  attachedIds: Array<string>;
  /**
   * The set of extensions IDs which should be rendered into this slot at the current point in time.
   */
  assignedIds: Array<string>;
  /**
   * A set of additional extension IDs which have been added to to this slot despite not being
   * explicitly `attach`ed to it.
   * An example may be an extension which is added to the slot via the configuration.
   */
  addedIds: Array<string>;
  /**
   * A set of extension IDs which have been removed/hidden from this slot, even though they have
   * previously been `attach`ed/added to it.
   * An example may be an extension which is removed from the slot via the configuration.
   */
  removedIds: Array<string>;
  /**
   * A set allowing explicit ordering of the `assignedIds`.
   */
  idOrder: Array<string>;
  /**
   * Returns whether the given extension slot name corresponds to this ExtensionSlotInfo.
   * @param actualExtensionSlotName The actual extension slot name into which the extensions might be rendered.
   * For URL like extension slots, this should be the name where parameters have been replaced with actual values
   * (e.g. `/mySlot/213da954-87a2-432d-91f6-a3c441851726`).
   */
  matches(actualExtensionSlotName: string): boolean;
}

export interface PageDefinition {
  route: string;
  load(): Promise<any>;
}

export interface Lifecycle {
  bootstrap(): void;
  mount(): void;
  unmount(): void;
  update?(): void;
}

export interface CancelLoading {
  (): void;
}

export const extensionStore = createGlobalStore<ExtensionStore>("extensions", {
  slots: {},
  extensions: {},
});

function updateStore<U extends keyof ExtensionStore>(
  updater: (state: ExtensionStore) => Pick<ExtensionStore, U>
) {
  const state = extensionStore.getState();
  extensionStore.setState(updater(state));
}

function createNewExtensionSlot(extensionSlotName: string) {
  return {
    name: extensionSlotName,
    attachedIds: [],
    assignedIds: [],
    modules: [],
    addedIds: [],
    removedIds: [],
    idOrder: [],
    matches: (actualExtensionSlotName) =>
      slotNamesMatch(extensionSlotName, actualExtensionSlotName),
  };
}

export function getExtensionRegistration(
  extensionId: string
): ExtensionRegistration | undefined {
  const state = extensionStore.getState();
  const extensionName = extensionId.split("#")[0];
  return state.extensions[extensionName];
}

export const registerExtension: (
  moduleName: string,
  name: string,
  load: () => Promise<any>
) => void = extensionStore.action(
  (state, moduleName: string, name: string, load: () => Promise<any>) => {
    state.extensions[name] = {
      name,
      load,
      moduleName,
    };
  }
);

export function attach(extensionSlotName: string, extensionId: string) {
  updateStore((state) => {
    const existingSlot = state.slots[extensionSlotName];

    if (!existingSlot) {
      return {
        slots: {
          ...state.slots,
          [extensionSlotName]: {
            ...createNewExtensionSlot(extensionSlotName),
            attachedIds: [extensionId],
            assignedIds: [extensionId],
          },
        },
      };
    } else {
      return {
        slots: {
          ...state.slots,
          [extensionSlotName]: {
            ...existingSlot,
            attachedIds: [...existingSlot.attachedIds, extensionId],
            assignedIds: [...existingSlot.assignedIds, extensionId],
          },
        },
      };
    }
  });
}

function slotNamesMatch(
  attachedExtensionSlotName: string,
  actualExtensionSlotName: string
) {
  return (
    attachedExtensionSlotName === actualExtensionSlotName ||
    (attachedExtensionSlotName.startsWith("/") &&
      !!getActualRouteProps(attachedExtensionSlotName, actualExtensionSlotName))
  );
}

/**
 * Mounts into a DOM node (representing an extension slot)
 * a lazy-loaded component from *any* microfrontend
 * that registered an extension component for this slot.
 */
export function renderExtension(
  domElement: HTMLElement,
  actualExtensionSlotName: string,
  attachedExtensionSlotName: string,
  extensionSlotModuleName: string,
  extensionId: string,
  renderFunction: (lifecycle: Lifecycle) => Lifecycle = (x) => x,
  additionalProps: Record<string, any> = {}
): CancelLoading {
  const extensionName = extensionId.split("#")[0];
  const extensionRegistration = getExtensionRegistration(extensionId);
  let active = true;

  if (domElement) {
    if (extensionRegistration) {
      const routeProps = getActualRouteProps(
        actualExtensionSlotName,
        attachedExtensionSlotName
      );
      const extensionContextProps = {
        _extensionContext: {
          extensionId,
          actualExtensionSlotName,
          attachedExtensionSlotName,
          extensionSlotModuleName,
          extensionModuleName: extensionRegistration.moduleName,
        },
      };

      extensionRegistration.load().then(
        ({ default: result, ...lifecycle }) =>
          active &&
          mountRootParcel(renderFunction(result ?? lifecycle) as any, {
            ...additionalProps,
            ...extensionContextProps,
            ...routeProps,
            domElement,
          })
      );
    } else {
      throw Error(
        `Couldn't find extension '${extensionName}' to attach to '${actualExtensionSlotName}'`
      );
    }
  }

  return () => {
    active = false;
  };
}

function getActualRouteProps(
  pathTemplate: string,
  url: string
): object | undefined {
  const keys: Array<Key> = [];
  const ptr = pathToRegexp(pathTemplate, keys);
  const result = ptr.exec(url);

  if (result) {
    return keys.reduce((p, c, i) => {
      p[c.name] = result[i + 1];
      return p;
    }, {} as Record<string, string>);
  }

  return undefined;
}

/**
 * This is only used to inform tooling about the extension slot. Extension slots
 * do not have to be registered to mount extensions.
 *
 * @param moduleName The name of the module that contains the extension slot
 * @param extensionSlotName The extension slot name
 */
export function registerExtensionSlot(
  moduleName: string,
  extensionSlotName: string
) {
  updateStore((state) => {
    const existingSlot = state.slots[extensionSlotName];

    if (existingSlot) {
      return {
        slots: {
          ...state.slots,
          [extensionSlotName]: {
            ...existingSlot,
            modules: [...existingSlot.modules, moduleName],
          },
        },
      };
    } else {
      return {
        slots: {
          ...state.slots,
          [extensionSlotName]: {
            ...createNewExtensionSlot(extensionSlotName),
            modules: [moduleName],
          },
        },
      };
    }
  });
}

export function unregisterExtensionSlot(moduleName: string, name: string) {
  updateStore((state) => {
    if (name in state.slots) {
      return {
        ...state,
        slots: {
          ...state.slots,
          [name]: {
            ...state.slots[name],
            modules: state.slots[name].modules.filter((m) => m !== moduleName),
          },
        },
      };
    } else {
      return state;
    }
  });
}

export function getExtensionSlotsForModule(moduleName: string) {
  const state = extensionStore.getState();
  return Object.keys(state.slots).filter((name) =>
    state.slots[name].modules.includes(moduleName)
  );
}

export function getIsUIEditorEnabled(): boolean {
  return JSON.parse(
    localStorage.getItem("openmrs:isUIEditorEnabled") ?? "false"
  );
}

export function setIsUIEditorEnabled(enabled: boolean): void {
  localStorage.setItem("openmrs:isUIEditorEnabled", JSON.stringify(enabled));
}

/**
 * @internal
 * Just for testing.
 */
export const reset: () => void = extensionStore.action(() => {
  return {
    slots: {},
    extensions: {},
  };
});

/**
 * Returns information describing all extensions which can be rendered into an extension slot with
 * the specified name.
 * The returned information describe the extension itself, as well as the extension slot name(s)
 * with which it has been attached.
 * @param actualExtensionSlotName The extension slot name for which matching extension info should be returned.
 * For URL like extension slots, this should be the name where parameters have been replaced with actual values
 * (e.g. `/mySlot/213da954-87a2-432d-91f6-a3c441851726`).
 * @param moduleName The module name. Used for applying extension-specific config values to the result.
 */
export async function getAttachedExtensionInfoForSlotAndConfig(
  actualExtensionSlotName: string,
  moduleName: string
): Promise<Array<AttachedExtensionInfo>> {
  const config = await getExtensionSlotConfig(
    actualExtensionSlotName,
    moduleName
  );
  let extensionIds = getAttachedExtensionInfoForSlot(actualExtensionSlotName);

  if (config.add) {
    extensionIds = extensionIds.concat(
      config.add.map((id) => ({
        extensionId: id,
        attachedExtensionSlotName: actualExtensionSlotName,
        actualExtensionSlotName,
      }))
    );
  }

  if (config.remove) {
    extensionIds = extensionIds.filter(
      (n) => !config.remove?.includes(n.extensionId)
    );
  }

  if (config.order) {
    extensionIds = extensionIds.sort((a, b) =>
      config.order?.includes(a.extensionId)
        ? config.order.includes(b.extensionId)
          ? config.order.indexOf(a.extensionId) -
            config.order.indexOf(b.extensionId)
          : -1
        : config.order?.includes(b.extensionId)
        ? 1
        : 0
    );
  }

  return extensionIds;
}
