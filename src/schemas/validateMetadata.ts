/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import dandisetSchema from "./dandiset.schema.json";

// Initialize AJV with the DANDI schema
const ajv = new Ajv({
  allErrors: true, // Report all errors, not just the first one
  strict: false, // Allow additional keywords from Pydantic (nskey, etc.)
  validateFormats: true,
});

// Add format validators (uri, email, date, etc.)
addFormats(ajv);

// Compile the full Dandiset schema
const validateDandiset = ajv.compile(dandisetSchema);

// Extract sub-schemas for individual field types from $defs
const subSchemas: Record<string, any> = {};
const defs = (dandisetSchema as any).$defs || {};

// Pre-compile validators for common sub-schemas
// We need to include the $defs in each sub-schema so $ref works
for (const [name, schema] of Object.entries(defs)) {
  try {
    // Create a schema that includes all $defs so references resolve
    const schemaWithDefs = {
      ...(schema as any),
      $defs: defs,
    };
    subSchemas[name] = ajv.compile(schemaWithDefs);
  } catch (e) {
    // Some schemas may still fail, skip them
    console.warn(`Could not compile sub-schema for ${name}:`, e);
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params?: Record<string, any>;
}

/**
 * Convert AJV errors to a more user-friendly format
 */
function formatErrors(errors: ErrorObject[] | null | undefined): ValidationError[] {
  if (!errors) return [];

  return errors.map((err) => ({
    path: err.instancePath || "/",
    message: err.message || "Validation failed",
    keyword: err.keyword,
    params: err.params,
  }));
}

/**
 * Get the expected schema type for a given field path
 * Returns the schema name (e.g., "Resource", "Person", "Organization")
 */
export function getSchemaTypeForPath(path: string): string | null {
  // Map top-level fields to their schema types
  const fieldTypeMap: Record<string, string> = {
    relatedResource: "Resource",
    contributor: "Person|Organization", // discriminated union
    access: "AccessRequirements",
    wasGeneratedBy: "Project",
    about: "Disorder|Anatomy|GenericType",
    ethicsApproval: "EthicsApproval",
  };

  // Get the root field name
  const rootField = path.split(".")[0];

  // Check if this is an array field with an index
  if (fieldTypeMap[rootField]) {
    return fieldTypeMap[rootField];
  }

  return null;
}

/**
 * Validate a value against a specific sub-schema by name
 */
export function validateAgainstSubSchema(
  schemaName: string,
  value: any
): ValidationResult {
  const validator = subSchemas[schemaName];

  if (!validator) {
    // Schema not found - check if it's a union type
    if (schemaName.includes("|")) {
      const schemaNames = schemaName.split("|");
      // Try each schema in the union
      for (const name of schemaNames) {
        const result = validateAgainstSubSchema(name.trim(), value);
        if (result.valid) {
          return result;
        }
      }
      // None matched - return error
      return {
        valid: false,
        errors: [
          {
            path: "/",
            message: `Value must match one of: ${schemaName}`,
            keyword: "oneOf",
          },
        ],
      };
    }

    return {
      valid: false,
      errors: [
        {
          path: "/",
          message: `Unknown schema type: ${schemaName}`,
          keyword: "unknown",
        },
      ],
    };
  }

  const valid = validator(value);
  return {
    valid: valid as boolean,
    errors: formatErrors(validator.errors),
  };
}

/**
 * Validate a proposed metadata change
 *
 * @param path - The dot-notation path to the field being changed
 * @param newValue - The proposed new value
 * @param currentMetadata - The current full metadata object (optional, for context)
 * @returns ValidationResult with valid flag and any errors
 */
export function validateMetadataChange(
  path: string,
  newValue: any,
  currentMetadata?: any
): ValidationResult {
  // Determine if this is an array item or object field
  const pathParts = path.split(".");
  const rootField = pathParts[0];

  // Check if we're setting an array element (e.g., relatedResource.0)
  const isArrayElement = pathParts.length >= 2 && /^\d+$/.test(pathParts[1]);

  if (isArrayElement) {
    // Validate the array element against its schema type
    const schemaType = getSchemaTypeForPath(path);

    if (schemaType) {
      // If the value is an object, validate against the sub-schema
      if (typeof newValue === "object" && newValue !== null) {
        return validateAgainstSubSchema(schemaType, newValue);
      }
    }
  }

  // For nested paths within an array element (e.g., relatedResource.0.name),
  // we need to validate the full object after applying the change
  if (pathParts.length > 2 && /^\d+$/.test(pathParts[1])) {
    const schemaType = getSchemaTypeForPath(path);

    if (schemaType && currentMetadata) {
      // Get the current array element
      const arrayIndex = parseInt(pathParts[1], 10);
      const currentArray = currentMetadata[rootField] || [];
      const currentElement = currentArray[arrayIndex] || {};

      // Apply the change to create the new element
      const newElement = applyNestedChange(
        { ...currentElement },
        pathParts.slice(2),
        newValue
      );

      return validateAgainstSubSchema(schemaType, newElement);
    }
  }

  // For top-level simple fields, validate against the full schema
  // by creating a minimal object with just that field
  if (pathParts.length === 1 && currentMetadata) {
    const testMetadata = { ...currentMetadata, [rootField]: newValue };
    const valid = validateDandiset(testMetadata);

    if (!valid) {
      // Filter errors to only those related to the changed field
      const relevantErrors = (validateDandiset.errors || []).filter(
        (err) =>
          err.instancePath === `/${rootField}` ||
          err.instancePath.startsWith(`/${rootField}/`)
      );

      if (relevantErrors.length > 0) {
        return {
          valid: false,
          errors: formatErrors(relevantErrors),
        };
      }
    }
  }

  // Default: validation passed (or couldn't be performed)
  return { valid: true, errors: [] };
}

/**
 * Helper to apply a nested change to an object
 */
function applyNestedChange(obj: any, pathParts: string[], value: any): any {
  if (pathParts.length === 0) {
    return value;
  }

  const [first, ...rest] = pathParts;
  const isIndex = /^\d+$/.test(first);
  const key = isIndex ? parseInt(first, 10) : first;

  if (rest.length === 0) {
    obj[key] = value;
  } else {
    if (obj[key] === undefined) {
      obj[key] = isIndex ? [] : {};
    }
    obj[key] = applyNestedChange(obj[key], rest, value);
  }

  return obj;
}

/**
 * Validate an entire metadata object against the Dandiset schema
 */
export function validateFullMetadata(metadata: any): ValidationResult {
  const valid = validateDandiset(metadata);
  return {
    valid: valid as boolean,
    errors: formatErrors(validateDandiset.errors),
  };
}

/**
 * Get a human-readable description of validation errors
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return "";

  return errors
    .map((err) => {
      let msg = err.message;

      // Add more context based on error type
      if (err.keyword === "enum" && err.params?.allowedValues) {
        msg += `. Allowed values: ${err.params.allowedValues.join(", ")}`;
      }
      if (err.keyword === "required" && err.params?.missingProperty) {
        msg = `Missing required property: ${err.params.missingProperty}`;
      }
      if (err.keyword === "additionalProperties" && err.params?.additionalProperty) {
        msg = `Unknown property: ${err.params.additionalProperty}`;
      }

      const pathStr = err.path && err.path !== "/" ? ` at ${err.path}` : "";
      return `${msg}${pathStr}`;
    })
    .join("; ");
}
