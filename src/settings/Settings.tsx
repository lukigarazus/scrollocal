import Modal from "react-modal";
import CogIcon from "@heroicons/react/16/solid/CogIcon";
import { useState } from "react";

import { FeedControl } from "./FeedControl";
import { TagCreator } from "./TagCreator";
import { Section, Sections } from "../components/Section";

export function Settings({}: {}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 25,
        right: 25,
        color: "red",
        cursor: "pointer",
      }}
      title="Settings"
    >
      <button onClick={() => setOpen(true)}>
        Settings
        <CogIcon color="red" />
      </button>
      <Modal
        isOpen={open}
        style={{
          content: {
            color: "#f6f6f6",
            backgroundColor: "#2f2f2f",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        onRequestClose={() => setOpen(false)}
      >
        <Sections>
          <Section name="Feed controls">
            <FeedControl />
          </Section>
          <Section name="Misc">
            <TagCreator />
          </Section>
        </Sections>
      </Modal>
    </div>
  );
}
