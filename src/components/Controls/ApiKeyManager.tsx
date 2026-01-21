import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useMetadataContext } from '../../context/MetadataContext';
import { getCurrentStorageType, type StorageType } from '../../utils/dandiApiKeyStorage';
import { ApiKeyPersistCheckbox } from './ApiKeyPersistCheckbox';

export function ApiKeyManager() {
  const { apiKey, setApiKey } = useMetadataContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [persistKey, setPersistKey] = useState(getCurrentStorageType());
  const [showKey, setShowKey] = useState(false);

  const hasApiKey = !!apiKey;

  const handleOpen = () => {
    setLocalApiKey(apiKey || '');
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setLocalApiKey('');
    setShowKey(false);
  };

  const handleSave = () => {
    const storageType: StorageType = persistKey ? 'local' : 'session';
    setApiKey(localApiKey.trim() || null, storageType);
    handleClose();
  };

  const handleClear = () => {
    setApiKey(null);
    setLocalApiKey('');
  };

  return (
    <>
      <Tooltip title={hasApiKey ? 'API Key configured' : 'No API Key - Click to configure'}>
        <Chip
          icon={hasApiKey ? <CheckCircleIcon /> : <ErrorIcon />}
          label={hasApiKey ? 'API Key Set' : 'No API Key'}
          color={hasApiKey ? 'success' : 'default'}
          variant={hasApiKey ? 'filled' : 'outlined'}
          onClick={handleOpen}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>

      <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyIcon />
          DANDI API Key
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your DANDI API key to enable committing changes.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="API Key"
              type={showKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="Enter your DANDI API key"
              autoComplete="off"
            />
            <IconButton onClick={() => setShowKey(!showKey)}>
              {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Box>
          <ApiKeyPersistCheckbox
            checked={persistKey === 'local'}
            onChange={(checked) => setPersistKey(checked ? 'local' : 'session')}
          />
        </DialogContent>
        <DialogActions>
          {hasApiKey && (
            <Button onClick={handleClear} color="error">
              Clear Key
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
