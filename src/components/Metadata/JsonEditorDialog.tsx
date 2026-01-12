import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useMetadataContext } from "../../context/MetadataContext";
import {
  validateFullMetadataAsync,
  formatValidationErrors,
} from "../../schemas/validateMetadata";
import {
  getCachedSchema,
  getReadOnlyFields,
} from "../../schemas/schemaService";
import { computeDiff } from "../../core/metadataDiff";

interface JsonEditorDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Filter out readOnly fields from metadata for editing
 */
function filterEditableFields(
  metadata: Record<string, unknown>,
  readOnlyFields: Set<string>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!readOnlyFields.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export function JsonEditorDialog({ open, onClose }: JsonEditorDialogProps) {
  const {
    versionInfo,
    modifiedMetadata,
    setModifiedMetadata
  } = useMetadataContext();

  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());

  // Initialize JSON text when dialog opens (filter out readOnly fields)
  useEffect(() => {
    if (open && versionInfo) {
      const currentMetadata = modifiedMetadata;
      if (currentMetadata) {
        // Get readOnly fields from schema
        const schema = getCachedSchema();
        const roFields = schema ? getReadOnlyFields(schema) : new Set<string>();
        setReadOnlyFields(roFields);

        // Filter out readOnly fields for editing
        const editableMetadata = filterEditableFields(
          currentMetadata as unknown as Record<string, unknown>,
          roFields
        );

        setJsonText(JSON.stringify(editableMetadata, null, 2));
        setParseError(null);
        setValidationErrors(null);
        setChangeCount(0);
      }
    }
  }, [open, versionInfo, modifiedMetadata]);

  // Validate JSON as user types
  const handleJsonChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setJsonText(text);

      // Try to parse
      try {
        const parsed = JSON.parse(text);
        setParseError(null);

        // Count changes against filtered original using shared diff utility
        // const original = versionInfo?.metadata;
        const startingMetadata = modifiedMetadata;
        if (startingMetadata) {
          const filteredStartingMetadata = filterEditableFields(
            startingMetadata as unknown as Record<string, unknown>,
            readOnlyFields
          );
          const diffs = computeDiff(filteredStartingMetadata, parsed);
          setChangeCount(diffs.length);
        }

        // Validate against schema (async to ensure schema is loaded)
        // Add back readOnly fields from starting for validation
        setIsValidating(true);
        try {
          const fullMetadata = startingMetadata
            ? { ...startingMetadata, ...parsed }
            : parsed;
          const validation = await validateFullMetadataAsync(fullMetadata);
          if (!validation.valid) {
            setValidationErrors(formatValidationErrors(validation.errors));
          } else {
            setValidationErrors(null);
          }
        } finally {
          setIsValidating(false);
        }
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Invalid JSON syntax"
        );
        setValidationErrors(null);
        setChangeCount(0);
      }
    },
    [versionInfo, readOnlyFields]
  );

  // Apply changes
  const handleApply = useCallback(() => {
    if (parseError || !versionInfo) return;

    try {
      const mergedMetadata = {
        ...(versionInfo.metadata as unknown as Record<string, unknown>),
        ...JSON.parse(jsonText),
      }
      setModifiedMetadata(mergedMetadata);

      onClose();
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Failed to apply changes"
      );
    }
  }, [
    parseError,
    versionInfo,
    jsonText,
    setModifiedMetadata,
    onClose
  ]);

  // Reset to starting (filtered)
  const handleReset = useCallback(() => {
    if (versionInfo?.metadata) {
      const editableMetadata = filterEditableFields(
        versionInfo.metadata as unknown as Record<string, unknown>,
        readOnlyFields
      );
      setJsonText(JSON.stringify(editableMetadata, null, 2));
      setParseError(null);
      setValidationErrors(null);
      setChangeCount(0);
    }
  }, [versionInfo, readOnlyFields]);

  const canApply = !parseError && !validationErrors && !isValidating && changeCount > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "80vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Edit Metadata JSON (editable fields only)</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", p: 0 }}
      >
        {/* Status bar */}
        <Box
          sx={{
            p: 1,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {parseError ? (
            <Alert severity="error" sx={{ py: 0, flex: 1 }}>
              {parseError}
            </Alert>
          ) : validationErrors ? (
            <Alert severity="error" sx={{ py: 0, flex: 1 }}>
              Schema validation failed: {validationErrors}
            </Alert>
          ) : isValidating ? (
            <Alert severity="info" sx={{ py: 0, flex: 1 }}>
              Validating...
            </Alert>
          ) : (
            <Alert severity="success" sx={{ py: 0, flex: 1 }}>
              Valid JSON
              {changeCount > 0 && ` - ${changeCount} field(s) modified`}
            </Alert>
          )}
        </Box>

        {/* JSON Editor */}
        <Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <textarea
            value={jsonText}
            onChange={handleJsonChange}
            spellCheck={false}
            style={{
              width: "100%",
              height: "100%",
              padding: "16px",
              fontFamily: "monospace",
              fontSize: "13px",
              border: "none",
              outline: "none",
              resize: "none",
              backgroundColor: parseError ? "#fff5f5" : "#fafafa",
              lineHeight: 1.5,
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={handleReset} color="inherit">
          Reset to Original
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!canApply}
          color="primary"
        >
          Apply Changes {changeCount > 0 && `(${changeCount})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
