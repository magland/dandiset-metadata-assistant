import { useState } from 'react';
import { Box, Typography, CircularProgress, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import { useMetadataContext } from '../../context/MetadataContext';
import { DandisetInfo } from './DandisetInfo';
import { ChangesSummary } from './ChangesSummary';
import { MetadataDisplay } from './MetadataDisplay';
import { CommitButton } from '../Controls/CommitButton';
import { JsonEditorDialog } from './JsonEditorDialog';

export function MetadataPanel() {
  const { versionInfo, isLoading } = useMetadataContext();
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, userSelect: 'none' }}>
          <DescriptionIcon color="primary" />
          Metadata
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {versionInfo && (
            <Tooltip title="Edit JSON directly">
              <IconButton
                onClick={() => setEditorOpen(true)}
                size="small"
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          <CommitButton />
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        ) : versionInfo ? (
          <>
            <DandisetInfo />
            <ChangesSummary />
            <MetadataDisplay />
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <DescriptionIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading Dandiset...
            </Typography>
          </Box>
        )}
      </Box>

      {/* JSON Editor Dialog */}
      <JsonEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </Box>
  );
}
