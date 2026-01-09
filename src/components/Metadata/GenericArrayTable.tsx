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
import { useMetadataContext } from '../../context/MetadataContext';

interface GenericItem {
  schemaKey?: string;
  name?: string;
  identifier?: string;
  [key: string]: unknown;
}

interface GenericRowProps {
  item: GenericItem;
  index: number;
  path: string;
  columns: ColumnDef[];
  hasChange: boolean;
  hasChildChanges: boolean;
  onRevert?: () => void;
}

interface ColumnDef {
  key: string;
  label: string;
  render?: (value: unknown, item: GenericItem) => React.ReactNode;
}

function GenericRow({ item, columns, hasChange, hasChildChanges, onRevert }: Omit<GenericRowProps, 'index' | 'path'>) {
  const [expanded, setExpanded] = useState(false);
  
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
  const rowHighlight = hasChange || hasChildChanges;

  return (
    <>
      <TableRow
        sx={{
          backgroundColor: rowHighlight ? 'success.lighter' : 'transparent',
          '&:hover': { backgroundColor: rowHighlight ? 'success.light' : 'action.hover' },
        }}
      >
        <TableCell sx={{ py: 0.75, width: 40 }}>
          {showExpand ? (
            <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ p: 0.25 }}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24 }} />
          )}
        </TableCell>
        {columns.map((col) => (
          <TableCell key={col.key} sx={{ py: 0.75 }}>
            {col.render 
              ? col.render(item[col.key], item)
              : formatValue(item[col.key])
            }
          </TableCell>
        ))}
        <TableCell sx={{ py: 0.75, width: 50 }}>
          {(hasChange || hasChildChanges) && onRevert && (
            <Tooltip title="Revert changes">
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
                    {extraFields.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell sx={{ width: 120, fontWeight: 500, color: 'text.secondary', border: 0, py: 0.5 }}>
                          {formatLabel(key)}
                        </TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {renderExpandedValue(value)}
                        </TableCell>
                      </TableRow>
                    ))}
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

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <Typography variant="body2" color="text.secondary">—</Typography>;
  if (typeof value === 'string') return <Typography variant="body2">{value || '—'}</Typography>;
  if (typeof value === 'boolean') return <Chip label={value ? 'Yes' : 'No'} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />;
  if (typeof value === 'number') return <Typography variant="body2">{value}</Typography>;
  if (Array.isArray(value)) return <Typography variant="body2" color="text.secondary">[{value.length} items]</Typography>;
  if (typeof value === 'object') return <Typography variant="body2" color="text.secondary">{'{...}'}</Typography>;
  return <Typography variant="body2">{String(value)}</Typography>;
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

function formatLabel(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

interface GenericArrayTableProps {
  path: string;
  items: GenericItem[] | undefined | null;
  columns: ColumnDef[];
  emptyMessage?: string;
}

export function GenericArrayTable({ path, items, columns, emptyMessage = 'No items' }: GenericArrayTableProps) {
  const { pendingChanges, removePendingChange, getPendingChangeForPath } = useMetadataContext();

  const displayItems = items || [];

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
                columns={columns}
                hasChange={hasDirectChange}
                hasChildChanges={hasChildChanges}
                onRevert={(hasDirectChange || hasChildChanges) ? handleRevert : undefined}
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
  const { versionInfo } = useMetadataContext();
  if (!versionInfo) return null;

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
      items={versionInfo.metadata.about as GenericItem[]}
      columns={columns}
      emptyMessage="No subject matter specified"
    />
  );
}

export function EthicsApprovalTable() {
  const { versionInfo } = useMetadataContext();
  if (!versionInfo) return null;

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
      items={versionInfo.metadata.ethicsApproval as GenericItem[]}
      columns={columns}
      emptyMessage="No ethics approvals"
    />
  );
}

export function ProjectsTable() {
  const { versionInfo } = useMetadataContext();
  if (!versionInfo) return null;

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
      items={versionInfo.metadata.wasGeneratedBy as GenericItem[]}
      columns={columns}
      emptyMessage="No associated projects"
    />
  );
}
