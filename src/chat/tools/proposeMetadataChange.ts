/* eslint-disable @typescript-eslint/no-explicit-any */
import { getReadOnlyFieldsSync } from "../../schemas/schemaService";
import { QPTool, ToolExecutionContext, MetadataOperationType } from "../types";

interface SingleChange {
  operation: MetadataOperationType;
  path: string;
  value?: any;
}

export const proposeMetadataChangeTool: QPTool = {
  toolFunction: {
    name: "propose_metadata_change",
    description:
      "Propose one or more changes to the dandiset metadata. Supports setting values, deleting array items, inserting into arrays, and appending to arrays. Changes are added to the pending changes list for user review before committing. Use the 'changes' array to apply multiple changes in one call.",
    parameters: {
      type: "object",
      properties: {
        changes: {
          type: "array",
          description:
            "An array of changes to apply. Each change should have 'operation', 'path', and optionally 'value'. " +
            "Use this to apply multiple changes in a single tool call.",
          items: {
            type: "object",
            properties: {
              operation: {
                type: "string",
                enum: ["set", "delete", "insert", "append"],
                description: "The type of operation to perform.",
              },
              path: {
                type: "string",
                description: "The dot-notation path to the field.",
              },
              value: {
                description: "The value to set, insert, or append.",
              },
            },
            required: ["operation", "path"],
          },
        },
        operation: {
          type: "string",
          enum: ["set", "delete", "insert", "append"],
          description:
            "(For single change) The type of operation to perform:\n" +
            "- 'set': Set a value at the specified path (create or update)\n" +
            "- 'delete': Delete an item from an array by index\n" +
            "- 'insert': Insert a value at a specific array index (shifts others right)\n" +
            "- 'append': Add a value to the end of an array",
        },
        path: {
          type: "string",
          description:
            "(For single change) The dot-notation path to the field (e.g., 'name', 'contributor.0.name', 'keywords.2').\n" +
            "For 'delete' and 'insert': path must end with an array index.\n" +
            "For 'append': path should point to the array itself (e.g., 'keywords').",
        },
        value: {
          description:
            "(For single change) The value to set, insert, or append. Required for 'set', 'insert', and 'append' operations. " +
            "Can be a string, number, boolean, array, or object depending on the field type.",
        },
        explanation: {
          type: "string",
          description:
            "A brief explanation of why these changes are being proposed (for user context).",
        },
      },
      required: [],
    },
  },

  execute: async (
    params: {
      changes?: SingleChange[];
      operation?: MetadataOperationType;
      path?: string;
      value?: any;
      // Legacy support
      newValue?: any;
      explanation?: string
    },
    context: ToolExecutionContext,
  ) => {
    const { explanation } = params;
    const readOnlyFields = getReadOnlyFieldsSync();
    const validOperations: MetadataOperationType[] = ['set', 'delete', 'insert', 'append'];

    // Build the list of changes to apply
    let changes: SingleChange[];
    
    if (params.changes && params.changes.length > 0) {
      // Use the changes array
      changes = params.changes;
    } else if (params.path) {
      // Backward compatibility: single change via individual params
      const value = params.value ?? params.newValue;
      const operation: MetadataOperationType = params.operation ?? 'set';
      changes = [{ operation, path: params.path, value }];
    } else {
      return {
        result: JSON.stringify({
          success: false,
          error: "Either 'changes' array or 'path' must be provided.",
        }),
      };
    }

    const results: any[] = [];
    let allSucceeded = true;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const { operation = 'set', path, value } = change;

      // Validate operation
      if (!validOperations.includes(operation)) {
        results.push({
          success: false,
          index: i,
          path,
          error: `Invalid operation "${operation}". Must be one of: ${validOperations.join(', ')}`,
        });
        allSucceeded = false;
        continue;
      }

      // Check if the field is readOnly
      const rootField = path.split(".")[0];
      if (readOnlyFields.has(rootField)) {
        results.push({
          success: false,
          index: i,
          path,
          error: `The field "${rootField}" is read-only and cannot be modified.`,
        });
        allSucceeded = false;
        continue;
      }

      // Validate that value is provided for operations that require it
      if ((operation === 'set' || operation === 'insert' || operation === 'append') && value === undefined) {
        results.push({
          success: false,
          index: i,
          path,
          error: `The "${operation}" operation requires a value to be provided.`,
        });
        allSucceeded = false;
        continue;
      }

      // Apply the operation
      const modifyResult = context.modifyMetadata(operation, path, value);

      if (!modifyResult.success) {
        results.push({
          success: false,
          index: i,
          path,
          error: modifyResult.error || `Failed to apply ${operation} operation at path "${path}".`,
        });
        allSucceeded = false;
        continue;
      }

      const result: any = {
        success: true,
        index: i,
        operation,
        path,
        message: getSuccessMessage(operation, path),
      };

      if (value !== undefined) {
        result.value = value;
      }

      results.push(result);
    }

    // Build response
    const response: any = {
      success: allSucceeded,
      totalChanges: changes.length,
      successfulChanges: results.filter(r => r.success).length,
      failedChanges: results.filter(r => !r.success).length,
    };

    if (changes.length === 1) {
      // Single change: return flat response for backward compatibility
      const singleResult = results[0];
      if (explanation) {
        singleResult.explanation = explanation;
      }
      return { result: JSON.stringify(singleResult) };
    }

    // Multiple changes: return full results
    response.results = results;
    if (explanation) {
      response.explanation = explanation;
    }

    return {
      result: JSON.stringify(response),
    };
  },

  getDetailedDescription: () => {
    return `Use this tool to propose changes to the dandiset metadata.

**Multiple Changes:**

You can apply multiple changes in a single call using the 'changes' array:
{ "changes": [
    { "operation": "set", "path": "name", "value": "New Name" },
    { "operation": "append", "path": "keywords", "value": "neuroscience" },
    { "operation": "delete", "path": "keywords.0" }
  ],
  "explanation": "Update name and keywords"
}

**Operations:**

1. **set** - Set or update a value at any path
   - Path: Any valid path (e.g., "name", "contributor.0.email")
   - Requires: value

2. **delete** - Remove an item from an array
   - Path: Must end with an array index (e.g., "keywords.2", "contributor.1")
   - No value required

3. **insert** - Insert an item at a specific array position
   - Path: Must end with an array index where item will be inserted
   - Requires: value
   - Items at and after this index shift right

4. **append** - Add an item to the end of an array
   - Path: Points to the array itself (e.g., "keywords", "contributor")
   - Requires: value

**Single Change Examples:**

- Set the name:
  { "operation": "set", "path": "name", "value": "New Dandiset Name" }

- Update a contributor's email:
  { "operation": "set", "path": "contributor.0.email", "value": "new@example.com" }

- Delete the third keyword:
  { "operation": "delete", "path": "keywords.2" }

- Append a new keyword:
  { "operation": "append", "path": "keywords", "value": "electrophysiology" }

**Batch Change Example:**

Apply multiple keyword changes at once:
{ "changes": [
    { "operation": "append", "path": "keywords", "value": "electrophysiology" },
    { "operation": "append", "path": "keywords", "value": "calcium-imaging" },
    { "operation": "append", "path": "keywords", "value": "mouse" }
  ]
}

**Notes:**
- Changes are not applied immediately; they are added to a pending changes list
- Users can review all pending changes before committing them
- For backward compatibility, single change params (operation, path, value) are still supported
- When using 'changes' array, each change is validated and applied independently

**Read-only fields (cannot be modified):**
id, schemaVersion, url, repository, identifier, dateCreated, dateModified,
citation, assetsSummary, manifestLocation, version, access`;
  },
};

function getSuccessMessage(operation: MetadataOperationType, path: string): string {
  switch (operation) {
    case 'set':
      return `Successfully proposed setting "${path}". The change is now pending user review.`;
    case 'delete':
      return `Successfully proposed deleting item at "${path}". The change is now pending user review.`;
    case 'insert':
      return `Successfully proposed inserting item at "${path}". The change is now pending user review.`;
    case 'append':
      return `Successfully proposed appending item to "${path}". The change is now pending user review.`;
    default:
      return `Successfully proposed change to "${path}". The change is now pending user review.`;
  }
}
