import React, { useState, useEffect, useRef } from "react";
import isEqual from "lodash-es/isEqual";
import {
  setTemporaryConfigValue,
  ConfigValue,
  Validator,
} from "@openmrs/esm-config";
import styles from "./editable-value.styles.css";
import ValueEditor from "./value-editor";
import { getStore, ImplementerToolsStore } from "../store";

export interface EditableValueProps {
  path: string[];
  element: ConfigValueDescriptor;
}

export interface ConfigValueDescriptor {
  _value: ConfigValue;
  _source: string;
  _default: ConfigValue;
  _description?: string;
  _validators?: Array<Validator>;
}

export default function EditableValue({ path, element }: EditableValueProps) {
  const [valueString, setValueString] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = getStore();
  const activeConfigRef = useRef<HTMLButtonElement>(null);

  const closeEditor = () => {
    setEditing(false);
    setError(null);
  };

  const focusOnConfigPathBeingEdited = () => {
    if (activeConfigRef && activeConfigRef.current) {
      setEditing(true);
      activeConfigRef.current.focus();
    }
  };

  useEffect(() => {
    const update = (state: ImplementerToolsStore) => {
      if (isEqual(state.configPathBeingEdited, path)) {
        focusOnConfigPathBeingEdited();
      }
    };
    update(store.getState());
    return store.subscribe((state) => update(state));
  }, [store]);

  useEffect(() => {
    const state = store.getState();
    if (editing && !isEqual(state.configPathBeingEdited, path)) {
      store.setState({
        configPathBeingEdited: path,
        activeItemDescription: {
          path: path,
          source: element._source,
          description: element._description,
          value: valueString,
        },
      });
    }
    if (!editing && isEqual(state.configPathBeingEdited, path)) {
      store.setState({ configPathBeingEdited: null });
    }
  }, [editing, store]);

  return (
    <>
      <div className={styles.line}>
        {editing ? (
          <>
            <ValueEditor
              element={element}
              handleClose={closeEditor}
              handleSave={(val) => {
                try {
                  const result = JSON.parse(val);
                  setTemporaryConfigValue(path, result);
                  setValueString(val);
                  closeEditor();
                } catch (e) {
                  console.warn(e);
                  setError("That's not formatted quite right. Try again.");
                }
              }}
            />
          </>
        ) : (
          <button
            className={`${styles.secretButton} ${
              element._source == "temporary config"
                ? styles.overriddenValue
                : ""
            }`}
            onClick={() => setEditing(true)}
            ref={activeConfigRef}
          >
            {valueString ?? JSON.stringify(element._value)}
          </button>
        )}
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </>
  );
}
