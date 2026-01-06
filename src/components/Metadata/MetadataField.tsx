import { Box, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import { useMetadataContext } from '../../context/MetadataContext';

interface MetadataFieldProps {
  label: string;
  path: string;
  value: unknown;
  depth?: number;
}

/**
 * Normalize a path to use consistent dot notation for array indices.
 * Converts "foo[0].bar" to "foo.0.bar" and handles mixed notations.
 */
function normalizePath(path: string): string {
  return path.replace(/\[(\d+)\]/g, '.$1');
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    return '{...}';
  }
  return String(value);
}

function isExpandable(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
  return false;
}

export function MetadataField({ label, path, value, depth = 0 }: MetadataFieldProps) {
  const { getPendingChangeForPath, removePendingChange, pendingChanges } = useMetadataContext();
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const normalizedPath = normalizePath(path);
  const pendingChange = getPendingChangeForPath(path);
  const hasChange = !!pendingChange;

  // Check if there are any pending changes for child paths (e.g., relatedResource.0 when we're at relatedResource)
  const childChanges = pendingChanges.filter(c =>
    c.path.startsWith(normalizedPath + '.') && c.path !== normalizedPath
  );
  const hasChildChanges = childChanges.length > 0;

  const expandable = isExpandable(value) || (hasChange && isExpandable(pendingChange.newValue)) || hasChildChanges;

  const handleRevert = () => {
    removePendingChange(path);
  };

  const renderValue = (val: unknown, isOld: boolean = false) => {
    const formatted = formatValue(val);
    const isLong = typeof val === 'string' && val.length > 100;

    return (
      <Typography
        component="span"
        variant="body2"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          backgroundColor: isOld ? 'error.lighter' : hasChange ? 'success.lighter' : 'transparent',
          textDecoration: isOld ? 'line-through' : 'none',
          color: isOld ? 'error.main' : hasChange ? 'success.dark' : 'text.primary',
          px: 0.5,
          borderRadius: 0.5,
          wordBreak: 'break-word',
          display: isLong ? 'block' : 'inline',
          whiteSpace: isLong ? 'pre-wrap' : 'normal',
        }}
      >
        {formatted}
      </Typography>
    );
  };

  const renderExpandedContent = () => {
    const displayValue = hasChange ? pendingChange.newValue : value;

    if (Array.isArray(displayValue) || (Array.isArray(value) && hasChildChanges)) {
      const baseArray = Array.isArray(displayValue) ? displayValue : (value as unknown[]);

      // Find the highest index from pending child changes to show new items being added
      let maxIndex = baseArray.length - 1;
      for (const change of childChanges) {
        const match = change.path.match(new RegExp(`^${normalizedPath}\\.(\\d+)`));
        if (match) {
          const idx = parseInt(match[1], 10);
          if (idx > maxIndex) maxIndex = idx;
        }
      }

      // Generate indices to render (original items + any new pending items)
      const indicesToRender = Array.from({ length: maxIndex + 1 }, (_, i) => i);

      return (
        <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider', ml: 1, mt: 1 }}>
          {indicesToRender.map((index) => {
            const itemValue = index < baseArray.length ? baseArray[index] : undefined;
            return (
              <MetadataField
                key={index}
                label={`[${index}]`}
                path={`${path}[${index}]`}
                value={itemValue}
                depth={depth + 1}
              />
            );
          })}
          {indicesToRender.length === 0 && !hasChildChanges && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Empty array
            </Typography>
          )}
        </Box>
      );
    }

    if (typeof displayValue === 'object' && displayValue !== null) {
      return (
        <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider', ml: 1, mt: 1 }}>
          {Object.entries(displayValue).map(([key, val]) => (
            <MetadataField
              key={key}
              label={key}
              path={`${path}.${key}`}
              value={val}
              depth={depth + 1}
            />
          ))}
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {/* Expand/Collapse button */}
        {expandable && (
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ p: 0, mt: 0.25 }}
          >
            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
        {!expandable && <Box sx={{ width: 24 }} />}

        {/* Label */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: hasChange || hasChildChanges ? 'primary.main' : 'text.secondary',
            minWidth: 120,
            flexShrink: 0,
          }}
        >
          {label}:
        </Typography>

        {/* Value(s) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {hasChange ? (
            <Box>
              {/* Old value - strikethrough (or "(new)" for additions) */}
              {pendingChange.oldValue === undefined ? (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                  }}
                >
                  (new)
                </Typography>
              ) : (
                renderValue(pendingChange.oldValue, true)
              )}
              {/* Arrow */}
              <Typography component="span" sx={{ mx: 1, color: 'text.secondary' }}>
                →
              </Typography>
              {/* New value - highlighted */}
              {renderValue(pendingChange.newValue, false)}
            </Box>
          ) : (
            renderValue(value)
          )}
        </Box>

        {/* Revert button */}
        {hasChange && (
          <Tooltip title="Revert change">
            <IconButton size="small" onClick={handleRevert} color="warning">
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Expanded content */}
      {expandable && (
        <Collapse in={isExpanded}>
          {renderExpandedContent()}
        </Collapse>
      )}
    </Box>
  );
}
