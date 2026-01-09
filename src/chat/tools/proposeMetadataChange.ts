/* eslint-disable @typescript-eslint/no-explicit-any */
import { QPTool, ToolExecutionContext } from "../types";
import {
  validateMetadataChange,
  formatValidationErrors,
} from "../../schemas/validateMetadata";
import { getReadOnlyFieldsSync } from "../../schemas/schemaService";

/**
 * Helper function to get a value at a path in an object using dot notation
 */
const getValueAtPath = (obj: any, path: string): any => {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    // Handle array indices
    if (part.match(/^\d+$/)) {
      current = current[parseInt(part, 10)];
    } else {
      current = current[part];
    }
  }
  return current;
};

export const proposeMetadataChangeTool: QPTool = {
  toolFunction: {
    name: "propose_metadata_change",
    description:
      "Propose a change to a specific field in the dandiset metadata. The change will be added to the pending changes list for user review before committing.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "The dot-notation path to the field to change (e.g., 'name', 'description', 'contributor.0.name', 'keywords.2')",
        },
        newValue: {
          description:
            "The new value to set. Can be a string, number, boolean, array, or object depending on the field type.",
        },
        explanation: {
          type: "string",
          description:
            "A brief explanation of why this change is being proposed (for user context).",
        },
      },
      required: ["path", "newValue"],
    },
  },

  execute: async (
    params: { path: string; newValue: any; explanation?: string },
    context: ToolExecutionContext,
  ) => {
    const { path, newValue, explanation } = params;

    // Get current metadata
    const metadata = context.getMetadata();
    if (!metadata) {
      return {
        result: JSON.stringify({
          success: false,
          error: "No metadata is currently loaded. Please load a dandiset first.",
        }),
      };
    }

    // Check if the field is readOnly
    const rootField = path.split(".")[0];
    const readOnlyFields = getReadOnlyFieldsSync();
    if (readOnlyFields.has(rootField)) {
      return {
        result: JSON.stringify({
          success: false,
          error: `The field "${rootField}" is read-only and cannot be modified. Read-only fields are automatically managed by the DANDI system.`,
        }),
      };
    }

    // Get the old value at the path
    const oldValue = getValueAtPath(metadata, path);

    // Validate that the path exists in the metadata (for updates) or parent exists (for additions)
    const pathParts = path.split(".");
    if (pathParts.length > 1) {
      const parentPath = pathParts.slice(0, -1).join(".");
      const parentValue = getValueAtPath(metadata, parentPath);

      // Special case: if parent is undefined but is a top-level array field being created,
      // allow setting index 0 to initialize the array
      const lastPart = pathParts[pathParts.length - 1];
      const isArrayIndex = /^\d+$/.test(lastPart);
      const isTopLevelArray = pathParts.length === 2 && isArrayIndex;

      if (parentValue === undefined && !isTopLevelArray) {
        return {
          result: JSON.stringify({
            success: false,
            error: `Parent path "${parentPath}" does not exist in the metadata.`,
          }),
        };
      }
    }

    // Validate the proposed change against the DANDI schema
    const validationResult = validateMetadataChange(path, newValue, metadata);
    if (!validationResult.valid) {
      const errorMessage = formatValidationErrors(validationResult.errors);
      return {
        result: JSON.stringify({
          success: false,
          error: `Schema validation failed: ${errorMessage}`,
          validationErrors: validationResult.errors,
        }),
      };
    }

    // Add the pending change
    context.addPendingChange(path, oldValue, newValue);

    const response: any = {
      success: true,
      path,
      oldValue: oldValue !== undefined ? oldValue : "(not set)",
      newValue,
      message: `Successfully proposed change to "${path}". The change is now pending user review.`,
    };

    if (explanation) {
      response.explanation = explanation;
    }

    return {
      result: JSON.stringify(response),
    };
  },

  getDetailedDescription: () => {
    return `Use this tool to propose changes to the dandiset metadata.

**Usage:**
- Specify the field path using dot notation (e.g., "name", "description", "contributor.0.affiliation")
- Provide the new value for the field
- Optionally include an explanation for the change

**Examples:**
- Change the name: { "path": "name", "newValue": "New Dandiset Name" }
- Update a contributor's affiliation: { "path": "contributor.0.affiliation.0.name", "newValue": "University of Science" }
- Add a keyword: { "path": "keywords.3", "newValue": "neural-data" }

**Notes:**
- Changes are not applied immediately; they are added to a pending changes list
- Users can review all pending changes before committing them
- The old value (if any) will be preserved for diff display

**Read-only fields (cannot be modified):**
The following fields are managed by the DANDI system and cannot be changed:
id, schemaVersion, url, repository, identifier, dateCreated, dateModified,
citation, assetsSummary, manifestLocation, version, access`;
  },
};
