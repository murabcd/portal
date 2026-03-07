import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/design-system/components/ui/resizable";
import type { ReactNode } from "react";
import { FeedbackSidebar } from "./components/feedback-sidebar";

type FeedbackLayoutProperties = {
  readonly children: ReactNode;
};

const FeedbackLayout = ({ children }: FeedbackLayoutProperties) => (
  <ResizablePanelGroup
    className="min-w-0 flex-1"
    direction="horizontal"
    style={{ overflow: "unset" }}
  >
    <ResizablePanel
      className="sticky top-0 h-screen min-w-80"
      defaultSize={30}
      maxSize={35}
      minSize={25}
      style={{ overflow: "auto" }}
    >
      <FeedbackSidebar />
    </ResizablePanel>
    <ResizableHandle />
    <ResizablePanel
      className="flex min-h-screen min-w-0 flex-col self-start"
      defaultSize={70}
      style={{ overflow: "unset" }}
    >
      {children}
    </ResizablePanel>
  </ResizablePanelGroup>
);

export default FeedbackLayout;
