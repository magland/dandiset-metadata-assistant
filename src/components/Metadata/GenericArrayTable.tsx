import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Collapse,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import { useMetadataContext } from '../../context/MetadataContext';
import type { PendingChange } from '../../types/dandiset';

interface GenericItem {
  schemaKey?: string;
  name?: string;
  identifier?: string;
  [key: string]: unknown;
}

interface GenericRowProps {
  item: GenericItem;
  originalItem: GenericItem | null;  // null if this is a new item
  path: string;
  columns: ColumnDef[];
  hasChange: boolean;
  hasChildChanges: boolean;
  isNewItem: boolean;
  onRevert?: () => void;
  getPendingChangeForPath: (path: string) => PendingChange | undefined;
}

interface ColumnDef {
  key: string;
  label: string;
  render?: (value: unknown, item: GenericItem) => React.ReactNode;
}

function GenericRow({ item, originalItem, path, columns, hasChange, hasChildChanges, isNewItem, onRevert, getPendingChangeForPath }: GenericRowProps) {
  const [expanded, setExpanded] = useState(false);

  // Guard against null/undefined items
  if (!item) {
    return null;
  }
  
  // Get extra fields not shown in columns
  const columnKeys = columns.map(c => c.key);
  const extraFields = Object.entries(item).filter(
    ([key, value]) => 
      !columnKeys.includes(key) && 
      key !== 'schemaKey' && 
      key !== 'id' &&
      value !== null && 
      value !== undefined &&
      value !== ''
  );
  
  const showExpand = extraFields.length > 0;
  const rowHighlight = hasChange || hasChildChanges || isNewItem;

  return (
    <>
      <TableRow
        sx={{
          backgroundColor: rowHighlight ? 'success.lighter' : 'transparent',
          '&:hover': { backgroundColor: rowHighlight ? 'success.light' : 'action.hover' },
        }}
      >
        <TableCell sx={{ py: 0.75, width: 40 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isNewItem && (
              <Tooltip title="New item">
                <AddIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
              </Tooltip>
            )}
            {showExpand ? (
              <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ p: 0.25 }}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            ) : (
              !isNewItem && <Box sx={{ width: 24 }} />
            )}
          </Box>
        </TableCell>
        {columns.map((col) => {
          const fieldPath = `${path}.${col.key}`;
          const fieldChange = getPendingChangeForPath(fieldPath);
          const displayValue = item[col.key];
          // For diff display, use original item if available, otherwise check the pending change
          const originalValue = originalItem ? originalItem[col.key] : (fieldChange ? fieldChange.oldValue : undefined);
          const hasFieldChange = fieldChange !== undefined || (originalItem && originalItem[col.key] !== item[col.key]);
          
          return (
            <TableCell key={col.key} sx={{ py: 0.75 }}>
              <Box>
                {/* Show old value crossed out if changed */}
                {hasFieldChange && !isNewItem && originalValue !== undefined && originalValue !== null && originalValue !== displayValue && (
                  <Box sx={{ mb: 0.25 }}>
                    {col.render ? (
                      <Box sx={{ opacity: 0.7, '& *': { textDecoration: 'line-through', color: 'error.main !important' } }}>
                        {col.render(originalValue, originalItem || item)}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.75rem' }}>
                        {formatValueAsString(originalValue)}
                      </Typography>
                    )}
                  </Box>
                )}
                {/* Show current/new value */}
                <Box sx={{ '& *': { color: (hasFieldChange || isNewItem) ? 'success.dark' : undefined } }}>
                  {col.render 
                    ? col.render(displayValue, item)
                    : formatValue(displayValue, hasFieldChange || isNewItem)
                  }
                </Box>
              </Box>
            </TableCell>
          );
        })}
        <TableCell sx={{ py: 0.75, width: 50 }}>
          {(hasChange || hasChildChanges || isNewItem) && onRevert && (
            <Tooltip title={isNewItem ? "Remove new item" : "Revert changes"}>
              <IconButton size="small" onClick={onRevert} color="warning" sx={{ p: 0.25 }}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {showExpand && (
        <TableRow>
          <TableCell colSpan={columns.length + 2} sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
            <Collapse in={expanded}>
              <Box sx={{ py: 1, pl: 6, pr: 2 }}>
                <Table size="small" sx={{ backgroundColor: 'grey.50' }}>
                  <TableBody>
                    {extraFields.map(([key, value]) => {
                      const fieldPath = `${path}.${key}`;
                      const fieldChange = getPendingChangeForPath(fieldPath);
                      const originalValue = originalItem ? originalItem[key] : (fieldChange?.oldValue ?? undefined);
                      const hasFieldChange = fieldChange !== undefined || (originalItem && originalItem[key] !== value);
                      
                      return (
                        <TableRow 
                          key={key}
                          sx={{ backgroundColor: (hasFieldChange || isNewItem) ? 'success.lighter' : 'transparent' }}
                        >
                          <TableCell sx={{ width: 120, fontWeight: 500, color: (hasFieldChange || isNewItem) ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>
                            {formatLabel(key)}
                          </TableCell>
                          <TableCell sx={{ border: 0, py: 0.5 }}>
                            {hasFieldChange && !isNewItem && originalValue !== undefined && originalValue !== null && originalValue !== value && (
                              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.8rem', mb: 0.25 }}>
                                {renderExpandedValueString(originalValue)}
                              </Typography>
                            )}
                            <Box sx={{ color: (hasFieldChange || isNewItem) ? 'success.dark' : 'text.primary' }}>
                              {renderExpandedValue(value)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function formatValue(value: unknown, hasChange?: boolean): React.ReactNode {
  const color = hasChange ? 'success.dark' : 'text.primary';
  if (value === null || value === undefined) return <Typography variant="body2" color="text.secondary">—</Typography>;
  if (typeof value === 'string') return <Typography variant="body2" sx={{ color }}>{value || '—'}</Typography>;
  if (typeof value === 'boolean') return <Chip label={value ? 'Yes' : 'No'} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />;
  if (typeof value === 'number') return <Typography variant="body2" sx={{ color }}>{value}</Typography>;
  if (Array.isArray(value)) return <Typography variant="body2" color="text.secondary">[{value.length} items]</Typography>;
  if (typeof value === 'object') return <Typography variant="body2" color="text.secondary">{'{...}'}</Typography>;
  return <Typography variant="body2" sx={{ color }}>{String(value)}</Typography>;
}

function formatValueAsString(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

function renderExpandedValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {value.map((item, i) => (
          <Typography key={i} variant="body2">
            {typeof item === 'object' && item !== null
              ? ('name' in item ? (item as { name: string }).name : JSON.stringify(item))
              : String(item)}
          </Typography>
        ))}
      </Box>
    );
  }
  if (typeof value === 'object') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {Object.entries(value as Record<string, unknown>)
          .filter(([k, v]) => k !== 'schemaKey' && k !== 'id' && v !== null && v !== undefined)
          .map(([k, v]) => (
            <Typography key={k} variant="body2">
              <strong>{formatLabel(k)}:</strong> {typeof v === 'string' ? v : JSON.stringify(v)}
            </Typography>
          ))
        }
      </Box>
    );
  }
  return String(value);
}

function renderExpandedValueString(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => 
      typeof item === 'object' && item !== null
        ? ('name' in item ? (item as { name: string }).name : JSON.stringify(item))
        : String(item)
    ).join(', ');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([k, v]) => k !== 'schemaKey' && k !== 'id' && v !== null && v !== undefined)
      .map(([k, v]) => `${formatLabel(k)}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(', ');
  }
  return String(value);
}

function formatLabel(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

interface GenericArrayTableProps {
  path: string;
  items: GenericItem[] | undefined | null;  // Modified items (with pending changes applied)
  originalItems: GenericItem[] | undefined | null;  // Original items from versionInfo
  columns: ColumnDef[];
  emptyMessage?: string;
}

export function GenericArrayTable({ path, items, originalItems, columns, emptyMessage = 'No items' }: GenericArrayTableProps) {
  const { pendingChanges, removePendingChange, getPendingChangeForPath } = useMetadataContext();

  const displayItems = items || [];
  const origItems = originalItems || [];

  if (displayItems.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.100' }}>
            <TableCell sx={{ py: 0.75, width: 40 }} />
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ py: 0.75, fontWeight: 600 }}>
                {col.label}
              </TableCell>
            ))}
            <TableCell sx={{ py: 0.75, width: 50 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {displayItems.map((item, index) => {
            const itemPath = `${path}.${index}`;
            const hasDirectChange = !!getPendingChangeForPath(itemPath);
            const hasChildChanges = pendingChanges.some(c => 
              c.path.startsWith(`${itemPath}.`)
            );
            
            // Check if this is a new item (index >= original items length)
            const isNewItem = index >= origItems.length;
            const originalItem = isNewItem ? null : origItems[index];

            const handleRevert = () => {
              removePendingChange(itemPath);
              pendingChanges
                .filter(c => c.path.startsWith(`${itemPath}.`))
                .forEach(c => removePendingChange(c.path));
            };

            return (
              <GenericRow
                key={index}
                item={item}
                originalItem={originalItem}
                path={itemPath}
                columns={columns}
                hasChange={hasDirectChange}
                hasChildChanges={hasChildChanges}
                isNewItem={isNewItem}
                onRevert={(hasDirectChange || hasChildChanges || isNewItem) ? handleRevert : undefined}
                getPendingChangeForPath={getPendingChangeForPath}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Pre-configured tables for specific types

export function AboutTable() {
  const { versionInfo, getModifiedMetadata } = useMetadataContext();
  if (!versionInfo) return null;

  // Get both original and modified items
  const originalItems = versionInfo.metadata.about;
  const modifiedMetadata = getModifiedMetadata();
  const modifiedItems = modifiedMetadata?.about ?? originalItems;

  const columns: ColumnDef[] = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {(value as string) || '—'}
        </Typography>
      )
    },
    {
      key: 'identifier',
      label: 'Identifier',
      render: (value) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {(value as string) || '—'}
        </Typography>
      )
    },
    {
      key: 'schemaKey',
      label: 'Type',
      render: (value) => (
        <Chip
          label={(value as string)?.replace('Type', '') || 'Unknown'}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      )
    },
  ];

  return (
    <GenericArrayTable
      path="about"
      items={modifiedItems as GenericItem[]}
      originalItems={originalItems as GenericItem[]}
      columns={columns}
      emptyMessage="No subject matter specified"
    />
  );
}

export function EthicsApprovalTable() {
  const { versionInfo, getModifiedMetadata } = useMetadataContext();
  if (!versionInfo) return null;

  // Get both original and modified items
  const originalItems = versionInfo.metadata.ethicsApproval;
  const modifiedMetadata = getModifiedMetadata();
  const modifiedItems = modifiedMetadata?.ethicsApproval ?? originalItems;

  const columns: ColumnDef[] = [
    {
      key: 'identifier',
      label: 'Protocol Identifier',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {(value as string) || '—'}
        </Typography>
      )
    },
  ];

  return (
    <GenericArrayTable
      path="ethicsApproval"
      items={modifiedItems as GenericItem[]}
      originalItems={originalItems as GenericItem[]}
      columns={columns}
      emptyMessage="No ethics approvals"
    />
  );
}

export function ProjectsTable() {
  const { versionInfo, getModifiedMetadata } = useMetadataContext();
  if (!versionInfo) return null;

  // Get both original and modified items
  const originalItems = versionInfo.metadata.wasGeneratedBy;
  const modifiedMetadata = getModifiedMetadata();
  const modifiedItems = modifiedMetadata?.wasGeneratedBy ?? originalItems;

  const columns: ColumnDef[] = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {(value as string) || '—'}
        </Typography>
      )
    },
    {
      key: 'identifier',
      label: 'Identifier',
      render: (value) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {(value as string) || '—'}
        </Typography>
      )
    },
  ];

  return (
    <GenericArrayTable
      path="wasGeneratedBy"
      items={modifiedItems as GenericItem[]}
      originalItems={originalItems as GenericItem[]}
      columns={columns}
      emptyMessage="No associated projects"
    />
  );
}
