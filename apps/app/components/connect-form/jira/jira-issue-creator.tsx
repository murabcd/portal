import { Select } from "@repo/design-system/components/precomposed/select";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import Image from "next/image";
import { useEffect, useReducer } from "react";
import { useConnectForm } from "../use-connect-form";
import { connectToJira } from "./connect-to-jira";
import { createJiraIssue } from "./create-jira-issue";
import type { GetJiraProjectsResponse } from "./get-jira-projects";
import { getJiraProjects } from "./get-jira-projects";
import type { GetJiraTypesResponse } from "./get-jira-types";
import { getJiraTypes } from "./get-jira-types";

type JiraIssueCreatorState = {
  loading: boolean;
  projectsFetched: boolean;
  projects: GetJiraProjectsResponse["projects"];
  typesFetchedForProject: string | undefined;
  types: GetJiraTypesResponse["types"];
  project: string | undefined;
  type: string | undefined;
};

type JiraIssueCreatorAction =
  | { type: "set-loading"; value: boolean }
  | { type: "set-projects"; value: GetJiraProjectsResponse["projects"] }
  | { type: "set-projects-fetched"; value: boolean }
  | { type: "set-project"; value: string | undefined }
  | { type: "set-types"; value: GetJiraTypesResponse["types"] }
  | { type: "set-types-fetched-for-project"; value: string | undefined }
  | { type: "set-type"; value: string | undefined };

const initialState: JiraIssueCreatorState = {
  loading: false,
  projectsFetched: false,
  projects: [],
  typesFetchedForProject: undefined,
  types: [],
  project: undefined,
  type: undefined,
};

const jiraIssueCreatorReducer = (
  state: JiraIssueCreatorState,
  action: JiraIssueCreatorAction
): JiraIssueCreatorState => {
  switch (action.type) {
    case "set-loading":
      return { ...state, loading: action.value };
    case "set-projects":
      return { ...state, projects: action.value };
    case "set-projects-fetched":
      return { ...state, projectsFetched: action.value };
    case "set-project":
      return {
        ...state,
        project: action.value,
        type: undefined,
        typesFetchedForProject: undefined,
        types: [],
      };
    case "set-types":
      return { ...state, types: action.value };
    case "set-types-fetched-for-project":
      return { ...state, typesFetchedForProject: action.value };
    case "set-type":
      return { ...state, type: action.value };
    default:
      return state;
  }
};

export const JiraIssueCreator = () => {
  const { hide, featureId } = useConnectForm();
  const [state, dispatch] = useReducer(jiraIssueCreatorReducer, initialState);
  const {
    loading,
    project,
    projects,
    projectsFetched,
    type,
    types,
    typesFetchedForProject,
  } = state;

  useEffect(() => {
    if (projectsFetched || loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    getJiraProjects()
      .then((response) => {
        if ("error" in response) {
          throw new Error(response.error);
        }

        return response.projects;
      })
      .then((projectsResponse) =>
        dispatch({ type: "set-projects", value: projectsResponse })
      )
      .catch(handleError)
      .finally(() => {
        dispatch({ type: "set-loading", value: false });
        dispatch({ type: "set-projects-fetched", value: true });
      });
  }, [loading, projectsFetched]);

  useEffect(() => {
    if (!project || typesFetchedForProject === project || loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    getJiraTypes(project)
      .then((response) => {
        if ("error" in response) {
          throw new Error(response.error);
        }

        return response.types;
      })
      .then((typesResponse) =>
        dispatch({ type: "set-types", value: typesResponse })
      )
      .catch(handleError)
      .finally(() => {
        dispatch({ type: "set-loading", value: false });
        dispatch({ type: "set-types-fetched-for-project", value: project });
      });
  }, [loading, project, typesFetchedForProject]);

  const handleCreateJiraIssue = async () => {
    if (loading || !featureId || !project || !type) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const issueResponse = await createJiraIssue({
        projectId: project,
        typeId: type,
        featureId,
      });

      if (issueResponse.error) {
        throw new Error(issueResponse.error);
      }

      if (!(issueResponse.id && issueResponse.href)) {
        throw new Error("Issue not found");
      }

      const { error } = await connectToJira({
        featureId,
        externalId: issueResponse.id,
        href: issueResponse.href,
      });

      if (error) {
        throw new Error(error);
      }

      hide();

      window.open(issueResponse.href, "_blank");
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  return (
    <div className="space-y-4">
      <Select
        data={projects.map((projectItem) => ({
          value: `${projectItem.id}`,
          label: projectItem.title,
        }))}
        disabled={projects.length === 0}
        label="Select a project"
        onChange={(value) => dispatch({ type: "set-project", value })}
        renderItem={(item) => {
          const projectItem = projects.find(
            ({ id }) => id === Number(item.value)
          );

          if (!projectItem) {
            return null;
          }

          return (
            <div className="flex items-center gap-2">
              <Image
                alt=""
                className="h-4 w-4 object-fit"
                height={16}
                src={projectItem.image}
                unoptimized
                width={16}
              />
              <span>{item.label}</span>
              <span className="text-muted-foreground text-xs">
                {projectItem.key}
              </span>
            </div>
          );
        }}
        type="project"
        value={project}
      />
      <Select
        data={types.map((typeItem) => ({
          value: typeItem.id,
          label: typeItem.title,
        }))}
        disabled={!project || types.length === 0}
        label="Select a type"
        onChange={(value) => dispatch({ type: "set-type", value })}
        renderItem={(item) => {
          const typeItem = types.find(({ id }) => id === item.value);

          if (!typeItem) {
            return null;
          }

          return (
            <div className="flex items-center gap-2">
              <Image
                alt=""
                className="h-4 w-4 object-fit"
                height={16}
                src={typeItem.image}
                unoptimized
                width={16}
              />
              <span>{item.label}</span>
            </div>
          );
        }}
        type="type"
        value={type}
      />
      <Button
        className="shrink-0"
        disabled={loading}
        onClick={handleCreateJiraIssue}
        variant="secondary"
      >
        Create new issue
      </Button>
    </div>
  );
};
