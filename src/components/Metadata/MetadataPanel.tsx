import { useState } from 'react';
import { Box, Typography, CircularProgress, IconButton, Tooltip, Tabs, Tab, Badge } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import { useMetadataContext } from '../../context/MetadataContext';
import { DandisetInfo } from './DandisetInfo';
import { ChangesSummary } from './ChangesSummary';
import { MetadataDisplay } from './MetadataDisplay';
import { JsonComparisonView } from './JsonComparisonView';
import { CommitButton } from '../Controls/CommitButton';
import { JsonEditorDialog } from './JsonEditorDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ display: value === index ? 'block' : 'none' }}
    >
      {value === index && children}
    </Box>
  );
}

export function MetadataPanel() {
  const { versionInfo, isLoading, pendingChanges } = useMetadataContext();
  const [editorOpen, setEditorOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

      {/* Tabs - only show when data is loaded */}
      {versionInfo && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontSize: '0.875rem',
              },
            }}
          >
            <Tab label="Overview" />
            <Tab
              label={
                <Badge
                  badgeContent={pendingChanges.length}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: -12,
                      top: 2,
                    },
                  }}
                >
                  JSON Diff
                </Badge>
              }
            />
          </Tabs>
        </Box>
      )}

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
            <TabPanel value={tabValue} index={0}>
              <DandisetInfo />
              <ChangesSummary />
              <MetadataDisplay />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <JsonComparisonView />
            </TabPanel>
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
