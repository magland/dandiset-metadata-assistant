import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Typography, 
  IconButton, 
  Tooltip,
  Box 
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import { useMetadataContext } from '../../context/MetadataContext';

// Field definitions with display labels
const SIMPLE_FIELDS = [
  { key: 'name', label: 'Title', description: 'A title associated with the Dandiset' },
  { key: 'description', label: 'Description', description: 'A description of the Dandiset' },
  { key: 'acknowledgement', label: 'Acknowledgement', description: 'Any acknowledgments not covered by contributors or external resources' },
] as const;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '—';
  return String(value);
}

export function SimpleFieldsTable() {
  const { versionInfo, getPendingChangeForPath, removePendingChange } = useMetadataContext();

  if (!versionInfo) return null;

  const metadata = versionInfo.metadata;

  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          {SIMPLE_FIELDS.map(({ key, label }) => {
            const value = metadata[key as keyof typeof metadata];
            const pendingChange = getPendingChangeForPath(key);
            const hasChange = !!pendingChange;
            const displayValue = hasChange ? pendingChange.newValue : value;

            return (
              <TableRow 
                key={key}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  backgroundColor: hasChange ? 'success.lighter' : 'transparent',
                }}
              >
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ 
                    width: 140,
                    fontWeight: 500,
                    color: hasChange ? 'primary.main' : 'text.secondary',
                    verticalAlign: 'top',
                    py: 1,
                  }}
                >
                  {label}
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {hasChange && pendingChange.oldValue !== undefined && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'error.main',
                            textDecoration: 'line-through',
                            fontSize: '0.8rem',
                            mb: 0.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {formatValue(pendingChange.oldValue)}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          color: hasChange ? 'success.dark' : 'text.primary',
                        }}
                      >
                        {formatValue(displayValue)}
                      </Typography>
                    </Box>
                    {hasChange && (
                      <Tooltip title="Revert change">
                        <IconButton 
                          size="small" 
                          onClick={() => removePendingChange(key)}
                          color="warning"
                          sx={{ flexShrink: 0 }}
                        >
                          <UndoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
