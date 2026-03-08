import type { Feedback } from "@repo/backend/types";
import { handleError } from "@repo/design-system/lib/handle-error";
import { NodeViewWrapper } from "@repo/editor";
import useSWR from "swr";
import { FeedbackItem } from "@/app/(organization)/feedback/components/feedback-item";
import { getFeedbackLinkKey } from "@/lib/swr-keys";
import type { FetchLinkResponse } from "./fetch-link";
import { fetchLink } from "./fetch-link";

type FeedbackLinkComponentProperties = {
  readonly id: Feedback["id"];
};

export const FeedbackLinkComponent = ({
  id,
}: FeedbackLinkComponentProperties) => {
  const { data } = useSWR<FetchLinkResponse>(
    getFeedbackLinkKey(id),
    async () => {
      const response = await fetchLink(id);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error("No data");
      }

      return response.data;
    },
    {
      onError: handleError,
    }
  );

  if (!data) {
    return null;
  }

  return (
    <NodeViewWrapper className="not-prose w-full overflow-hidden rounded-lg border bg-card text-foreground text-sm">
      <FeedbackItem feedback={data} />
    </NodeViewWrapper>
  );
};
