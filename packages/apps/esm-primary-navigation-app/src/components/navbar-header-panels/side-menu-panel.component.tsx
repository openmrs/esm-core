import React, { useEffect } from "react";
import { ExtensionSlot } from "@openmrs/esm-framework";
import { SideNav } from "carbon-components-react/es/components/UIShell";
import { SideNavProps } from "carbon-components-react";
import styles from "./side-menu-panel.component.scss";
import { useHistory } from "react-router-dom";

interface SideMenuPanelProps extends SideNavProps {
  hidePanel: Function;
}

const SideMenuPanel: React.FC<SideMenuPanelProps> = ({
  expanded,
  hidePanel,
}) => {
  const menuRef = React.useRef(null);
  const current = menuRef?.current;
  const history = useHistory();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (current && !current.contains(event.target)) {
        hidePanel();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [current, hidePanel]);

  React.useEffect(() => {
    const unlisten = history.listen(
      (location, action) => action === "POP" && hidePanel()
    );
    return () => unlisten();
  }, []);

  return (
    expanded && (
      <SideNav
        ref={menuRef}
        expanded
        aria-label="Menu"
        isChildOfHeader={expanded}
        className={styles.link}
      >
        <ExtensionSlot extensionSlotName="nav-menu-slot" />
      </SideNav>
    )
  );
};

export default SideMenuPanel;
