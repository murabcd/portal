"use client";

import schema from "@atlaskit/adf-schema/dist/json-schema/v1/full.json";
import { convertToAdf } from "@repo/editor/lib/jira";
import Ajv from "ajv-draft-04";
import betterAjvErrors from "better-ajv-errors";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const emptyDoc = {
  version: 1,
  type: "doc",
  content: [],
};

const ajv = new Ajv({ allErrors: true });
const validateAdf = ajv.compile(schema);
const initialSource = JSON.stringify(emptyDoc, null, 2);
const initialAdf = {
  version: 1,
  ...convertToAdf(emptyDoc),
};

export const Validator = () => {
  const [source, setSource] = useState(() => initialSource);
  const { adf, adfError, validationErrors } = useMemo(() => {
    try {
      const parsedSource = JSON.parse(source);
      const nextAdf = {
        version: 1,
        ...convertToAdf(parsedSource),
      };
      const isValid = validateAdf(nextAdf);
      const nextValidationErrors =
        !isValid && validateAdf.errors
          ? betterAjvErrors(schema, nextAdf, validateAdf.errors, {
              indent: 2,
            })
          : "";

      return {
        adf: nextAdf,
        adfError: null,
        validationErrors: nextValidationErrors,
      };
    } catch (error: unknown) {
      return {
        adf: initialAdf,
        adfError:
          error instanceof Error
            ? error
            : new Error("Failed to parse source JSON."),
        validationErrors: "",
      };
    }
  }, [source]);

  return (
    <div className="grid h-screen grid-rows-2 bg-backdrop">
      <main className="mx-4 grid h-full grid-cols-2 gap-4">
        <MonacoEditor
          className="my-4 overflow-hidden rounded-lg border bg-background"
          height="100%"
          language="json"
          onChange={(value) => setSource(value ?? "")}
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
          }}
          theme="vs-dark"
          value={source}
        />
        {adfError ? (
          <div>{adfError.message}</div>
        ) : (
          <MonacoEditor
            className="my-4 overflow-hidden rounded-lg border bg-background"
            height="100%"
            language="json"
            options={{
              wordWrap: "on",
              minimap: { enabled: false },
              readOnly: true,
            }}
            theme="vs-dark"
            value={JSON.stringify(adf, null, 2)}
          />
        )}
      </main>
      <div className="m-4 flex flex-col gap-4 overflow-auto whitespace-pre rounded-lg border bg-background p-4 font-mono text-foreground">
        {validationErrors}
      </div>
    </div>
  );
};
