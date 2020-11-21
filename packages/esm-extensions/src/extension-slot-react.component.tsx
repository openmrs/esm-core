import React, {
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { TooltipIcon } from "carbon-components-react";
import { ModuleNameContext, ExtensionContext } from "@openmrs/esm-context";
import { configCacheNotifier } from "@openmrs/esm-config";
import {
  renderExtension,
  getAttachedExtensionInfoForSlotAndConfig,
  getIsUIEditorEnabled,
  getExtensionRegistration,
  registerExtensionSlot,
  unregisterExtensionSlot,
  AttachedExtensionInfo,
} from "./extensions";
import styles from "./ui-editor.styles.css";

interface ExtensionSlotBaseProps {
  extensionSlotName: string;
  children?: ReactNode;
  state?: Record<string, any>;
  className?: string;
}

// remainder of props are for the top-level <div>
export type ExtensionSlotReactProps<T = {}> = ExtensionSlotBaseProps & T;

export const ExtensionSlotReact: React.FC<ExtensionSlotReactProps> = ({
  extensionSlotName,
  children,
  state,
  className,
  ...divProps
}: ExtensionSlotReactProps) => {
  const [attachedExtensionInfos, setAttachedExtensionInfos] = useState<
    Array<AttachedExtensionInfo>
  >([]);
  const slotModuleName = useContext(ModuleNameContext);

  if (!slotModuleName) {
    throw Error(
      "ModuleNameContext has not been provided. This should come from openmrs-react-root-decorator"
    );
  }

  const getAttachedExtensionInfos = useCallback(() => {
    getAttachedExtensionInfoForSlotAndConfig(
      extensionSlotName,
      slotModuleName
    ).then((ids) => setAttachedExtensionInfos(ids));
  }, [
    getAttachedExtensionInfoForSlotAndConfig,
    extensionSlotName,
    slotModuleName,
  ]);

  useEffect(() => {
    getAttachedExtensionInfos();
  }, [getAttachedExtensionInfos, extensionSlotName, slotModuleName]);

  useEffect(() => {
    registerExtensionSlot(slotModuleName, extensionSlotName);
    return () => unregisterExtensionSlot(slotModuleName, extensionSlotName);
  }, []);

  useEffect(() => {
    const sub = configCacheNotifier.subscribe(() => {
      getAttachedExtensionInfos();
    });
    return () => sub.unsubscribe();
  }, [extensionSlotName]);

  const divClassName = `${className ?? ""} ${
    getIsUIEditorEnabled() ? styles.slot : ""
  }`;

  return (
    <div className={divClassName} {...divProps}>
      {attachedExtensionInfos.map(
        ({
          extensionId,
          actualExtensionSlotName,
          attachedExtensionSlotName,
        }) => {
          const extensionRegistration = getExtensionRegistration(extensionId);
          return (
            <ExtensionContext.Provider
              key={extensionId}
              value={{
                actualExtensionSlotName,
                attachedExtensionSlotName,
                extensionId,
                extensionModuleName: extensionRegistration.moduleName,
              }}
            >
              {children ?? <ExtensionReact state={state} />}
            </ExtensionContext.Provider>
          );
        }
      )}
      {getIsUIEditorEnabled() && (
        <div className={styles.slotName}>{extensionSlotName}</div>
      )}
    </div>
  );
};

export interface ExtensionReactProps {
  state?: Record<string, any>;
}

export const ExtensionReact: React.FC<ExtensionReactProps> = ({ state }) => {
  const ref = React.useRef<HTMLSlotElement>(null);
  const {
    actualExtensionSlotName,
    attachedExtensionSlotName,
    extensionId,
  } = useContext(ExtensionContext);
  // TODO: handle error if Extension not wrapped in ExtensionSlot

  React.useEffect(() => {
    if (ref.current) {
      return renderExtension(
        ref.current,
        actualExtensionSlotName,
        attachedExtensionSlotName,
        extensionId,
        undefined,
        state
      );
    }
  }, [actualExtensionSlotName, attachedExtensionSlotName, extensionId]);

  return getIsUIEditorEnabled() ? (
    <TooltipIcon tooltipText={extensionId} align="center" direction="top">
      <div className={styles.extension}>
        <slot ref={ref} />
      </div>
    </TooltipIcon>
  ) : (
    <slot ref={ref} />
  );
};
