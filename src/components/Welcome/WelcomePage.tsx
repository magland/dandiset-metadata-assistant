import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ScienceIcon from '@mui/icons-material/Science';
import KeyIcon from '@mui/icons-material/Key';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { useMetadataContext } from '../../context/MetadataContext';
import {
  fetchDandisetVersionInfo,
  fetchOwnedDandisets,
  type OwnedDandiset,
  type DandisetSortOrder,
} from '../../utils/api';

interface WelcomePageProps {
  onDandisetLoaded: (dandisetId: string) => void;
}

export function WelcomePage({ onDandisetLoaded }: WelcomePageProps) {
  const {
    setDandisetId,
    setVersion,
    setVersionInfo,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearPendingChanges,
    apiKey,
    setApiKey,
  } = useMetadataContext();

  const [localDandisetId, setLocalDandisetId] = useState('');
  const [localApiKey, setLocalApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [ownedDandisets, setOwnedDandisets] = useState<OwnedDandiset[]>([]);
  const [sortOrder, setSortOrder] = useState<DandisetSortOrder>('-modified');
  const [isLoadingDandisets, setIsLoadingDandisets] = useState(false);

  // Fetch owned dandisets when API key is present
  useEffect(() => {
    if (apiKey) {
      setIsLoadingDandisets(true);
      fetchOwnedDandisets(apiKey, sortOrder)
        .then((dandisets) => {
          setOwnedDandisets(dandisets);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch dandisets');
          setOwnedDandisets([]);
        })
        .finally(() => {
          setIsLoadingDandisets(false);
        });
    }
  }, [apiKey, sortOrder, setError]);

  const handleSaveApiKey = () => {
    if (localApiKey.trim()) {
      setApiKey(localApiKey.trim());
      setLocalApiKey('');
    }
  };

  const handleApiKeyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveApiKey();
    }
  };

  const handleLoadDandiset = async (dandisetIdToLoad: string) => {
    if (!dandisetIdToLoad.trim()) {
      setError('Please enter a Dandiset ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    clearPendingChanges();

    try {
      const info = await fetchDandisetVersionInfo(dandisetIdToLoad.trim(), 'draft', apiKey);
      setVersionInfo(info);
      setDandisetId(dandisetIdToLoad.trim());
      setVersion('draft');
      onDandisetLoaded(dandisetIdToLoad.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dandiset');
      setVersionInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLoad = () => {
    handleLoadDandiset(localDandisetId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualLoad();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // No API key - show prompt to enter one
  if (!apiKey) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.50',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <ScienceIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Dandiset Metadata Assistant
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your DANDI API key to get started
            </Typography>
          </Box>

          {/* API Key Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="DANDI API Key"
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              onKeyPress={handleApiKeyKeyPress}
              fullWidth
              autoFocus
              placeholder="Enter your API key"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                      {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleSaveApiKey}
              disabled={!localApiKey.trim()}
              startIcon={<KeyIcon />}
            >
              Save API Key
            </Button>

            <Typography variant="body2" color="text.secondary">
              You can get your API key from your{' '}
              <a
                href="https://dandiarchive.org/account/settings"
                target="_blank"
                rel="noopener noreferrer"
              >
                DANDI account settings
              </a>
              .
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>
    );
  }

  // Has API key - show owned dandisets list
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'grey.50',
        p: 3,
        overflow: 'auto',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <ScienceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" gutterBottom>
            Dandiset Metadata Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a dandiset to edit or enter an ID manually
          </Typography>
        </Box>

        {/* Manual ID Entry */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            label="Dandiset ID"
            placeholder="e.g., 000003"
            value={localDandisetId}
            onChange={(e) => setLocalDandisetId(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            fullWidth
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={handleManualLoad}
            disabled={isLoading || !localDandisetId.trim()}
            startIcon={isLoading ? <CircularProgress size={16} /> : <SearchIcon />}
          >
            Load
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Sort Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Your Dandisets ({ownedDandisets.length})
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SortIcon fontSize="small" color="action" />
            <ToggleButtonGroup
              value={sortOrder}
              exclusive
              onChange={(_, value) => value && setSortOrder(value)}
              size="small"
            >
              <ToggleButton value="-modified">Recent</ToggleButton>
              <ToggleButton value="id">ID ↑</ToggleButton>
              <ToggleButton value="-id">ID ↓</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Dandisets List */}
        {isLoadingDandisets ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : ownedDandisets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No dandisets found. Create one on{' '}
            <a href="https://dandiarchive.org" target="_blank" rel="noopener noreferrer">
              dandiarchive.org
            </a>
          </Typography>
        ) : (
          <List sx={{ overflow: 'auto', flex: '1 1 auto', minHeight: 0 }}>
            {ownedDandisets.map((dandiset) => (
              <ListItemButton
                key={dandiset.identifier}
                onClick={() => handleLoadDandiset(dandiset.identifier)}
                disabled={isLoading}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {dandiset.identifier}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          backgroundColor:
                            dandiset.draft_version.status === 'Valid'
                              ? 'success.light'
                              : 'error.light',
                          color: 'white',
                        }}
                      >
                        {dandiset.draft_version.status}
                      </Typography>
                      {dandiset.embargo_status === 'EMBARGOED' && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            backgroundColor: 'warning.light',
                            color: 'white',
                          }}
                        >
                          <LockIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">Embargoed</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dandiset.draft_version.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Modified: {formatDate(dandiset.modified)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
