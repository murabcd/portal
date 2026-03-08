import type { Feedback } from "@repo/backend/types";

export const adminFormsKey = "/api/forms/admin";
export const adminMetaKey = "/api/forms/admin-meta";
export const feedbackFormsKey = "/api/forms/feedback";
export const feedbackLinkKeyPrefix = "/__swr__/feedback-link";

export const getFeedbackLinkKey = (id: Feedback["id"]) =>
  `${feedbackLinkKeyPrefix}/${id}`;
