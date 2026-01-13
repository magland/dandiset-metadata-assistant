import { useMemo, useEffect } from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { format as formatHtmlDiff, hideUnchanged } from 'jsondiffpatch/formatters/html';
import { computeDelta, deltaToChanges } from '../../core/metadataDiff';

// Import jsondiffpatch formatters CSS
import 'jsondiffpatch/formatters/styles/html.css';

interface ChangesSummaryProps {
  original: unknown;
  modified: unknown;
}

export function ChangesSummary({ original, modified }: ChangesSummaryProps) {
  const delta = useMemo(() => computeDelta(original, modified), [original, modified]);

  // Convert delta to changes for counting
  const changes = useMemo(() => deltaToChanges(delta), [delta]);
  
  // Generate HTML diff visualization
  const diffHtml = useMemo(() => {
    if (!delta) return '';
    return formatHtmlDiff(delta, original) || '';
  }, [delta, original]);
  
  // Initialize the show/hide unchanged functionality
  useEffect(() => {
    if (diffHtml) {
      hideUnchanged();
    }
  }, [diffHtml]);
  
  if (!delta) {
    return null;
  }

  // Group changes by type for summary
  const added = changes.filter(c => c.type === 'added').length;
  const removed = changes.filter(c => c.type === 'removed').length;
  const modified_ = changes.filter(c => c.type === 'modified').length;

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        mb: 2,
        borderColor: 'warning.main',
        borderWidth: 2,
      }}
    >
      <Box 
        sx={{ 
          p: 1.5, 
          backgroundColor: 'warning.main',
          color: 'warning.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          📝 Pending Changes ({changes.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {added > 0 && (
            <Chip 
              icon={<AddCircleIcon fontSize="small" />}
              label={added} 
              size="small" 
              color="success"
              sx={{ height: 22 }}
            />
          )}
          {removed > 0 && (
            <Chip 
              icon={<RemoveCircleIcon fontSize="small" />}
              label={removed} 
              size="small" 
              color="error"
              sx={{ height: 22 }}
            />
          )}
          {modified_ > 0 && (
            <Chip 
              icon={<EditIcon fontSize="small" />}
              label={modified_} 
              size="small" 
              color="primary"
              sx={{ height: 22 }}
            />
          )}
        </Box>
      </Box>
      
      <Box
        sx={{
          p: 1,
          '& .jsondiffpatch-delta': {
            fontFamily: 'monospace',
            fontSize: '0.85rem',
          },
          '& .jsondiffpatch-added .jsondiffpatch-property-name, & .jsondiffpatch-added .jsondiffpatch-value pre, & .jsondiffpatch-modified .jsondiffpatch-right-value pre, & .jsondiffpatch-textdiff-added': {
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
          },
          '& .jsondiffpatch-deleted .jsondiffpatch-property-name, & .jsondiffpatch-deleted .jsondiffpatch-value pre, & .jsondiffpatch-modified .jsondiffpatch-left-value pre, & .jsondiffpatch-textdiff-deleted': {
            backgroundColor: 'rgba(244, 67, 54, 0.15)',
            textDecoration: 'line-through',
          },
          '& .jsondiffpatch-unchanged': {
            display: 'none',
          },
          '& .jsondiffpatch-value pre': {
            margin: 0,
            padding: '2px 4px',
            borderRadius: '4px',
          },
        }}
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    </Paper>
  );
}
