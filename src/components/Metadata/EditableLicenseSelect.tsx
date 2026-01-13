import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

// License options from schema
const LICENSE_OPTIONS = [
  {
    value: 'spdx:CC0-1.0',
    label: 'CC0 1.0 Universal (Public Domain)',
    description: 'No rights reserved. You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.',
  },
  {
    value: 'spdx:CC-BY-4.0',
    label: 'CC BY 4.0 (Attribution)',
    description: 'Allows others to distribute, remix, adapt, and build upon your work, even commercially, as long as they credit you.',
  },
];

interface EditableLicenseSelectProps {
  value: string[] | null | undefined;
  onSave: (value: string[]) => void;
}

/**
 * Editable license selector with radio buttons in a dialog
 * Allows selecting from available SPDX license options
 */
export function EditableLicenseSelect({ value, onSave }: EditableLicenseSelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<string>('');

  const currentLicense = value && value.length > 0 ? value[0] : '';

  const handleStartEdit = () => {
    setSelectedLicense(currentLicense);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedLicense) {
      onSave([selectedLicense]);
    }
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setSelectedLicense('');
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip title="Edit license">
        <IconButton
          size="small"
          onClick={handleStartEdit}
          sx={{
            ml: 0.5,
            p: 0.25,
            opacity: 0.6,
            '&:hover': { opacity: 1 },
          }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Select License
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            DANDI supports a subset of Creative Commons licenses applicable to datasets.
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
            >
              {LICENSE_OPTIONS.map((option) => (
                <Box
                  key={option.value}
                  sx={{
                    border: 1,
                    borderColor: selectedLicense === option.value ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1,
                    backgroundColor: selectedLicense === option.value ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: selectedLicense === option.value 
                        ? 'primary.main' 
                        : 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  <FormControlLabel
                    value={option.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            color: selectedLicense === option.value ? 'primary.contrastText' : 'text.primary',
                          }}
                        >
                          {option.label}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: selectedLicense === option.value ? 'primary.contrastText' : 'text.secondary',
                            opacity: selectedLicense === option.value ? 0.9 : 1,
                          }}
                        >
                          {option.description}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            mt: 0.5,
                            fontFamily: 'monospace',
                            color: selectedLicense === option.value ? 'primary.contrastText' : 'text.disabled',
                            opacity: selectedLicense === option.value ? 0.8 : 1,
                          }}
                        >
                          {option.value}
                        </Typography>
                      </Box>
                    }
                    sx={{ 
                      alignItems: 'flex-start', 
                      m: 0, 
                      width: '100%',
                      '& .MuiRadio-root': {
                        color: selectedLicense === option.value ? 'primary.contrastText' : undefined,
                      },
                    }}
                  />
                </Box>
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!selectedLicense}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export { LICENSE_OPTIONS };
