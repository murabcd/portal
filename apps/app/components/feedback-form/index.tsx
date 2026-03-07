"use client";

import type { JsonValue } from "@repo/backend/drizzle/schema";
import { createSupabaseBrowserClient } from "@repo/backend/supabase/client";
import type { FeedbackOrganization, FeedbackUser } from "@repo/backend/types";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@repo/design-system/components/kibo-ui/dropzone";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { cn } from "@repo/design-system/lib/utils";
import type { EditorInstance } from "@repo/editor";
import { QueryClient } from "@tanstack/react-query";
import {
  AudioLinesIcon,
  LanguagesIcon,
  UndoIcon,
  VideoIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { KeyboardEventHandler } from "react";
import { useEffect, useState } from "react";
import { createFeedback } from "@/actions/feedback/create";
import { staticify } from "@/lib/staticify";
import { FeedbackOrganizationPicker } from "./feedback-organization-picker";
import { FeedbackUserPicker } from "./feedback-user-picker";
import { useFeedbackForm } from "./use-feedback-form";

const Editor = dynamic(
  async () => {
    const Module = await import(
      /* webpackChunkName: "editor" */
      "@/components/editor"
    );

    return Module.Editor;
  },
  {
    ssr: false,
  }
);

type FeedbackFormProperties = {
  readonly users: Pick<
    FeedbackUser,
    "email" | "feedbackOrganizationId" | "id" | "imageUrl" | "name"
  >[];
  readonly organizations: Pick<
    FeedbackOrganization,
    "domain" | "id" | "name"
  >[];
  readonly userEmail: string | undefined;
};

const getDefaultFeedbackUserId = (
  users: FeedbackFormProperties["users"],
  userEmail: string | undefined
) => users.find(({ email }) => email === userEmail)?.id ?? null;

const getDefaultFeedbackOrganizationId = (
  users: FeedbackFormProperties["users"],
  userEmail: string | undefined
) =>
  users.find(({ email }) => email === userEmail)?.feedbackOrganizationId ??
  null;

const getInitialFeedbackType = () => undefined;

const getFeedbackFormDisabled = ({
  feedbackUserId,
  loading,
  type,
  title,
  content,
  audio,
  video,
}: {
  feedbackUserId: string | null;
  loading: boolean;
  type: string | undefined;
  title: string;
  content: object | undefined;
  audio: File | undefined;
  video: File | undefined;
}) =>
  !feedbackUserId ||
  loading ||
  !type ||
  !title.trim() ||
  (type === "text" && !content) ||
  (type === "audio" && !audio) ||
  (type === "video" && !video);

const types = [
  {
    id: "text",
    label: "Text",
    description: "Write your feedback in a text editor.",
    icon: LanguagesIcon,
  },
  {
    id: "audio",
    label: "Audio",
    description: "Upload an audio file and transcribe it with AI.",
    icon: AudioLinesIcon,
  },
  {
    id: "video",
    label: "Video",
    description: "Upload a video file and transcribe it with AI.",
    icon: VideoIcon,
  },
];

type FeedbackFormFooterProperties = Pick<
  FeedbackFormProperties,
  "organizations" | "users"
> & {
  readonly feedbackOrganization: string | null;
  readonly feedbackUserId: string | null;
  readonly onOrganizationChange: (value: string | null) => void;
  readonly onUserChange: (value: string | null) => void;
};

const FeedbackFormFooter = ({
  feedbackOrganization,
  feedbackUserId,
  onOrganizationChange,
  onUserChange,
  organizations,
  users,
}: FeedbackFormFooterProperties) => (
  <div className="flex items-center gap-2">
    <FeedbackUserPicker
      onChange={onUserChange}
      usersData={users.map((user) => ({
        value: user.id,
        label: user.name,
        image: user.imageUrl,
        email: user.email,
      }))}
      value={feedbackUserId}
    />
    {feedbackUserId ? (
      <FeedbackOrganizationPicker
        feedbackUser={feedbackUserId}
        onChange={onOrganizationChange}
        organizationsData={organizations.map((organization) => ({
          value: organization.id,
          label: organization.name,
          image: organization.domain,
        }))}
        value={feedbackOrganization}
      />
    ) : null}
  </div>
);

type FeedbackTypePickerProperties = {
  readonly onSelect: (type: (typeof types)[number]["id"]) => void;
  readonly selectedType: string | undefined;
};

const FeedbackTypePicker = ({
  onSelect,
  selectedType,
}: FeedbackTypePickerProperties) => (
  <div className="grid w-full grid-cols-3 gap-4">
    {types.map((option) => (
      <button
        className={cn(
          "space-y-2 rounded border bg-card p-4",
          option.id === selectedType ? "bg-secondary" : "bg-background"
        )}
        key={option.id}
        onClick={() => onSelect(option.id)}
        type="button"
      >
        <option.icon
          className="pointer-events-none mx-auto select-none text-muted-foreground"
          size={24}
        />
        <span className="pointer-events-none mt-2 block select-none font-medium text-sm">
          {option.label}
        </span>
        <span className="pointer-events-none block select-none text-muted-foreground text-sm">
          {option.description}
        </span>
      </button>
    ))}
  </div>
);

type FeedbackContentProperties = {
  readonly audioSource: File[] | undefined;
  readonly onAudioDrop: (file: File) => void;
  readonly onEditorUpdate: (editor?: EditorInstance | undefined) => void;
  readonly onVideoDrop: (file: File) => void;
  readonly type: string | undefined;
  readonly videoSource: File[] | undefined;
};

const FeedbackContent = ({
  audioSource,
  onAudioDrop,
  onEditorUpdate,
  onVideoDrop,
  type,
  videoSource,
}: FeedbackContentProperties) => {
  if (type === "audio") {
    return (
      <Dropzone
        accept={{ "audio/*": [] }}
        maxFiles={1}
        onDrop={([file]) => onAudioDrop(file)}
        onError={handleError}
        src={audioSource}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    );
  }

  if (type === "video") {
    return (
      <Dropzone
        accept={{ "video/*": [] }}
        maxFiles={1}
        onDrop={([file]) => onVideoDrop(file)}
        onError={handleError}
        src={videoSource}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    );
  }

  if (type === "text") {
    return (
      <div
        className={cn(
          "prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-h4:text-base prose-h5:text-base prose-h6:text-base",
          "prose-h1:font-medium prose-h2:font-medium prose-h3:font-medium prose-h4:font-medium prose-h5:font-medium prose-h6:font-medium",
          "prose-h1:mb-0.5 prose-h2:mb-0.5 prose-h3:mb-0.5 prose-h4:mb-0.5 prose-h5:mb-0.5 prose-h6:mb-0.5"
        )}
      >
        <Editor onUpdate={onEditorUpdate} />
      </div>
    );
  }

  return null;
};

type FeedbackUndoButtonProperties = {
  readonly onUndo: () => void;
};

const FeedbackUndoButton = ({ onUndo }: FeedbackUndoButtonProperties) => (
  <Button
    className="absolute top-1.5 right-8"
    onClick={onUndo}
    size="icon"
    variant="link"
  >
    <UndoIcon className="text-muted-foreground" size={14} />
  </Button>
);

export const FeedbackForm = ({
  users,
  organizations,
  userEmail,
}: FeedbackFormProperties) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object | undefined>();
  const [feedbackUserId, setFeedbackUserId] = useState<string | null>(() =>
    getDefaultFeedbackUserId(users, userEmail)
  );
  const [feedbackOrganization, setFeedbackOrganization] = useState<
    string | null
  >(() => getDefaultFeedbackOrganizationId(users, userEmail));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [type, setType] = useState<string | undefined>(() =>
    getInitialFeedbackType()
  );
  const [audio, setAudio] = useState<File | undefined>();
  const [video, setVideo] = useState<File | undefined>();
  const disabled = getFeedbackFormDisabled({
    feedbackUserId,
    loading,
    type,
    title,
    content,
    audio,
    video,
  });
  const { isOpen, toggle } = useFeedbackForm();
  const { hide } = useFeedbackForm();
  const queryClient = new QueryClient();
  const showUndo = Boolean(type);
  const showTypePicker = !type;
  const audioSource = audio ? [audio] : undefined;
  const videoSource = video ? [video] : undefined;

  useEffect(() => {
    if (!feedbackUserId) {
      return;
    }

    const user = users.find(({ id }) => id === feedbackUserId);

    if (user?.feedbackOrganizationId) {
      setFeedbackOrganization(user.feedbackOrganizationId);
    } else {
      setFeedbackOrganization("");
    }
  }, [feedbackUserId, users]);

  const handleCreateAudio = async () => {
    if (!audio) {
      throw new Error("Audio file is missing.");
    }

    const supabase = createSupabaseBrowserClient();

    const id = nanoid(36);
    const { data, error } = await supabase.storage
      .from("files")
      .upload(id, audio);

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(data.path);

    const response = await createFeedback({
      title,
      feedbackUserId,
      audioUrl: publicUrl,
    });

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response.id ?? null;
  };

  const handleCreateVideo = async () => {
    if (!video) {
      throw new Error("Video file is missing.");
    }

    const supabase = createSupabaseBrowserClient();

    const id = nanoid(36);
    const { data, error } = await supabase.storage
      .from("files")
      .upload(id, video);

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(data.path);

    const response = await createFeedback({
      title,
      feedbackUserId,
      videoUrl: publicUrl,
    });

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response.id ?? null;
  };

  const handleCreateText = async () => {
    const response = await createFeedback({
      title,
      content: staticify(content) as JsonValue,
      feedbackUserId,
    });

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response.id ?? null;
  };

  const handleCreate = async () => {
    if (disabled) {
      return;
    }

    setLoading(true);

    try {
      let id: string | null = null;

      if (type === "text") {
        id = await handleCreateText();
      } else if (type === "audio") {
        id = await handleCreateAudio();
      } else if (type === "video") {
        id = await handleCreateVideo();
      }

      if (!id) {
        throw new Error("Feedback ID is missing.");
      }

      hide();

      setTitle("");
      setContent(undefined);
      setType(undefined);
      setAudio(undefined);
      setVideo(undefined);
      setFeedbackUserId(null);
      setFeedbackOrganization(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feedback"] }),
        queryClient.invalidateQueries({ queryKey: ["feedbackUsers"] }),
        queryClient.invalidateQueries({ queryKey: ["feedbackCompanies"] }),
      ]);

      router.push(`/feedback/${id}`);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (editor?: EditorInstance | undefined) => {
    if (!editor) {
      return;
    }

    setContent(editor.getJSON());
  };

  const handleUndo = () => {
    setType(undefined);
    setAudio(undefined);
    setVideo(undefined);
    setContent(undefined);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog
      className="sm:max-w-2xl"
      cta="Create feedback"
      disabled={disabled}
      footer={
        <FeedbackFormFooter
          feedbackOrganization={feedbackOrganization}
          feedbackUserId={feedbackUserId}
          onOrganizationChange={setFeedbackOrganization}
          onUserChange={setFeedbackUserId}
          organizations={organizations}
          users={users}
        />
      }
      modal={false}
      onClick={handleCreate}
      onOpenChange={toggle}
      open={isOpen}
      title={
        <p className="font-medium text-muted-foreground text-sm tracking-tight">
          Create feedback
        </p>
      }
    >
      {showUndo ? <FeedbackUndoButton onUndo={handleUndo} /> : null}

      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        <Input
          autoComplete="off"
          className="border-none p-0 font-medium shadow-none focus-visible:ring-0 md:text-lg"
          onChangeText={setTitle}
          onKeyDown={handleKeyDown}
          placeholder="Add ability to customize dashboard"
          value={title}
        />

        {showTypePicker ? (
          <FeedbackTypePicker onSelect={setType} selectedType={type} />
        ) : null}

        <FeedbackContent
          audioSource={audioSource}
          onAudioDrop={setAudio}
          onEditorUpdate={handleUpdate}
          onVideoDrop={setVideo}
          type={type}
          videoSource={videoSource}
        />
      </div>
    </Dialog>
  );
};
