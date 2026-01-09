import { Box, Typography, Button } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useMetadataContext } from '../../context/MetadataContext';

interface DandisetIndicatorProps {
  onChangeDandiset: () => void;
}

export function DandisetIndicator({ onChangeDandiset }: DandisetIndicatorProps) {
  const { dandisetId } = useMetadataContext();

  if (!dandisetId) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FolderOpenIcon sx={{ fontSize: 20, opacity: 0.8 }} />
      <Typography variant="body1" sx={{ fontWeight: 500, userSelect: 'none' }}>
        Dandiset {dandisetId}
      </Typography>
      <Button
        size="small"
        onClick={onChangeDandiset}
        startIcon={<SwapHorizIcon />}
        sx={{
          color: 'inherit',
          ml: 1,
          textTransform: 'none',
          fontSize: '0.8rem',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        Change
      </Button>
    </Box>
  );
}
