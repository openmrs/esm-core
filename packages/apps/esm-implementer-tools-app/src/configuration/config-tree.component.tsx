import React from "react";
import styles from "./configuration.styles.css";
import Accordion, {
  AccordionItem,
} from "carbon-components-react/es/components/Accordion";
import { ConfigTreeForModule } from "./config-tree-for-module.component";
import { ExtensionStore, useExtensionStore } from "@openmrs/esm-framework";

function hasSlot(store: ExtensionStore, moduleName: string) {
  return Object.values(store.slots).some((slot) =>
    Object.keys(slot.instances).includes(moduleName)
  );
}

export interface ConfigTreeProps {
  config: Record<string, any>;
}

export function ConfigTree({ config }: ConfigTreeProps) {
  const store = useExtensionStore();

  return (
    <div>
      <Accordion align="start">
        {config &&
          Object.keys(config)
            .sort()
            .map((moduleName) => {
              const moduleConfig = config[moduleName];
              return Object.keys(moduleConfig).length ||
                hasSlot(store, moduleName) ? (
                <AccordionItem
                  title={<h6 className={styles.moduleName}>{moduleName}</h6>}
                  className={styles.fullWidthAccordion}
                  key={`accordion-${moduleName}`}
                >
                  <div key={`${moduleName}-config`}>
                    <ConfigTreeForModule
                      config={moduleConfig}
                      moduleName={moduleName}
                    />
                  </div>
                </AccordionItem>
              ) : null;
            })}
      </Accordion>
    </div>
  );
}
