import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useMetadataContext } from '../../context/MetadataContext';
import { JsonDiffTree } from './JsonDiffTree';
import { generateDiffTree, countChanges } from './jsonDiffUtils';

export function JsonComparisonView() {
  const { versionInfo, getModifiedMetadata, pendingChanges } = useMetadataContext();
  const [showUnchanged, setShowUnchanged] = useState(false);

  const changeCount = useMemo(() => {
    if (!versionInfo) return 0;
    const original = versionInfo.metadata;
    const modified = getModifiedMetadata();
    if (!modified) return 0;
    const diffTree = generateDiffTree(original, modified, 'root', '');
    return countChanges(diffTree);
  }, [versionInfo, getModifiedMetadata]);

  if (!versionInfo) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'grey.50',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Load a dandiset to view changes
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrowsIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold">
            JSON Diff
          </Typography>
          {changeCount > 0 && (
            <Typography
              variant="caption"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Show all fields
            </Typography>
          }
        />
      </Box>
      <Divider sx={{ mb: 2 }} />

      {pendingChanges.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No pending changes. Use the AI assistant or edit fields directly to make changes.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: 'calc(100vh - 350px)',
            overflow: 'auto',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <JsonDiffTree showUnchanged={showUnchanged} />
        </Box>
      )}
    </Paper>
  );
}
