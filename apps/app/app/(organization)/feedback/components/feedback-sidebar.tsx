"use client";

import { Header } from "@/components/header";
import { CreateFeedbackButton } from "./create-feedback-button";
import { FeedbackList } from "./feedback-list";
import { ToggleProcessedButton } from "./toggle-processed-button";

export const FeedbackSidebar = () => (
  <div className="h-full border-r">
    <Header title="Feedback">
      <div className="-m-2 flex items-center gap-px">
        <ToggleProcessedButton />
        <CreateFeedbackButton />
      </div>
    </Header>
    <FeedbackList />
  </div>
);
