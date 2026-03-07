import { useDebouncedEffect } from "@react-hookz/web";
import { LoadingCircle } from "@repo/design-system/components/loading-circle";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { handleError } from "@repo/design-system/lib/handle-error";
import { cn } from "@repo/design-system/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { useId, useReducer } from "react";
import { useConnectForm } from "../use-connect-form";
import { connectToJira } from "./connect-to-jira";
import type { SearchJiraIssuesResponse } from "./search-jira-issues";
import { searchJiraIssues } from "./search-jira-issues";

type JiraIssuePickerState = {
  data: SearchJiraIssuesResponse["issues"];
  loading: boolean;
  open: boolean;
  query: string;
  value: string | undefined;
};

type JiraIssuePickerAction =
  | { type: "set-data"; value: SearchJiraIssuesResponse["issues"] }
  | { type: "set-loading"; value: boolean }
  | { type: "set-open"; value: boolean }
  | { type: "set-query"; value: string }
  | { type: "set-value"; value: string | undefined };

const initialState: JiraIssuePickerState = {
  data: [],
  loading: false,
  open: false,
  query: "",
  value: undefined,
};

const jiraIssuePickerReducer = (
  state: JiraIssuePickerState,
  action: JiraIssuePickerAction
): JiraIssuePickerState => {
  switch (action.type) {
    case "set-data":
      return { ...state, data: action.value };
    case "set-loading":
      return { ...state, loading: action.value };
    case "set-open":
      return { ...state, open: action.value };
    case "set-query":
      return { ...state, query: action.value };
    case "set-value":
      return { ...state, value: action.value };
    default:
      return state;
  }
};

export const JiraIssuePicker = () => {
  const { featureId, hide } = useConnectForm();
  const [state, dispatch] = useReducer(jiraIssuePickerReducer, initialState);
  const { data, loading, open, query, value } = state;
  const id = useId();
  const selectedIssue = data.find((issue) => issue.id === value);
  const disabled = !featureId || loading || !value || !selectedIssue;

  const handleConnectJira = async () => {
    if (disabled) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const { error } = await connectToJira({
        featureId,
        externalId: value,
        href: selectedIssue.url,
      });

      if (error) {
        throw new Error(error);
      }

      hide();

      window.open(selectedIssue.url, "_blank");
      window.location.reload();
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  useDebouncedEffect(
    () => {
      dispatch({ type: "set-loading", value: true });

      if (!query) {
        dispatch({ type: "set-data", value: [] });
        dispatch({ type: "set-loading", value: false });
        return;
      }

      searchJiraIssues(query)
        .then((response) => {
          if ("error" in response) {
            throw new Error(response.error);
          }

          return response.issues;
        })
        .then((issues) => dispatch({ type: "set-data", value: issues }))
        .catch(handleError)
        .finally(() => {
          dispatch({ type: "set-loading", value: false });
        });
    },
    [query],
    200
  );

  return (
    <div className="flex items-end gap-4">
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor={id}>Select an existing issue</Label>
        <Popover
          onOpenChange={(nextOpen) =>
            dispatch({ type: "set-open", value: nextOpen })
          }
          open={open}
        >
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              className="w-full justify-between"
              variant="outline"
            >
              {selectedIssue ? (
                <div className="flex items-center gap-2">
                  <Image
                    alt=""
                    className="h-4 w-4 shrink-0 object-fit"
                    height={16}
                    src={selectedIssue.image}
                    unoptimized
                    width={16}
                  />
                  <span className="shrink-0">{selectedIssue.key}</span>
                  <span className="truncate text-muted-foreground">
                    {selectedIssue.title}
                  </span>
                </div>
              ) : (
                "Select issue..."
              )}
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[264px] p-0">
            <Command shouldFilter={false}>
              <div className="relative">
                <CommandInput
                  className="h-9"
                  onValueChange={(nextQuery) =>
                    dispatch({ type: "set-query", value: nextQuery })
                  }
                  placeholder="Search issues..."
                  value={query}
                />
                {loading ? (
                  <div className="absolute top-3 right-3">
                    <LoadingCircle />
                  </div>
                ) : null}
              </div>
              <CommandList>
                <CommandEmpty>No issue found.</CommandEmpty>
                <CommandGroup>
                  {data.map((issue) => (
                    <CommandItem
                      className="flex items-center gap-2"
                      key={issue.id}
                      onSelect={(currentValue) => {
                        dispatch({ type: "set-value", value: currentValue });
                        dispatch({ type: "set-open", value: false });
                      }}
                      value={issue.id}
                    >
                      <Image
                        alt=""
                        className="h-4 w-4 shrink-0 object-fit"
                        height={16}
                        src={issue.image}
                        unoptimized
                        width={16}
                      />
                      <span className="shrink-0">{issue.key}</span>
                      <span className="truncate text-muted-foreground">
                        {issue.title}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === issue.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        className="shrink-0"
        disabled={disabled}
        onClick={handleConnectJira}
        type="submit"
      >
        Sync feature
      </Button>
    </div>
  );
};
