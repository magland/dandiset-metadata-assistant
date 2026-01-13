import { useState, useEffect, useCallback, useMemo } from "react";
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
  validateFullMetadata,
  formatValidationErrors,
} from "../../schemas/validateMetadata";
import {
  getCachedSchema,
  getReadOnlyFields,
} from "../../schemas/schemaService";

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
      }
    }
  }, [open, versionInfo, modifiedMetadata]);

  // Compute parse error and parsed JSON from jsonText
  const { parseError, parsedJson } = useMemo(() => {
    if (!jsonText) {
      return { parseError: null, parsedJson: null };
    }
    try {
      const parsed = JSON.parse(jsonText);
      return { parseError: null, parsedJson: parsed as Record<string, unknown> };
    } catch (err) {
      return {
        parseError: err instanceof Error ? err.message : "Invalid JSON syntax",
        parsedJson: null
      };
    }
  }, [jsonText]);

  // Compute validation errors from parsed JSON
  const validationErrors = useMemo(() => {
    if (parseError || !parsedJson || !modifiedMetadata) {
      return null;
    }
    // Combine with existing metadata for full validation
    const fullMetadata = { ...modifiedMetadata, ...parsedJson };
    const validation = validateFullMetadata(fullMetadata);
    if (!validation.valid) {
      return formatValidationErrors(validation.errors);
    }
    return null;
  }, [parseError, parsedJson, modifiedMetadata]);

  // Handle text change (just update state, validation happens via useMemo)
  const handleJsonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJsonText(e.target.value);
    },
    []
  );

  // Apply changes
  const handleApply = useCallback(() => {
    if (parseError || !versionInfo || !parsedJson) return;

    const mergedMetadata = {
      ...(versionInfo.metadata as unknown as Record<string, unknown>),
      ...parsedJson,
    } as unknown as typeof versionInfo.metadata;
    setModifiedMetadata(mergedMetadata);
    onClose();
  }, [
    parseError,
    parsedJson,
    versionInfo,
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
    }
  }, [versionInfo, readOnlyFields]);

  const canApply = !parseError && !validationErrors;

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
          ) : (
            <Alert severity="success" sx={{ py: 0, flex: 1 }}>
              Valid JSON
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
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
