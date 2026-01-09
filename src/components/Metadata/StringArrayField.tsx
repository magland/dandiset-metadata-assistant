import {
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import { useMetadataContext } from '../../context/MetadataContext';

interface StringArrayFieldProps {
  label: string;
  path: string;
  values: string[] | undefined | null;
  isUrl?: boolean;
}

export function StringArrayField({ label, path, values, isUrl = false }: StringArrayFieldProps) {
  const { getPendingChangeForPath, removePendingChange, pendingChanges } = useMetadataContext();
  
  const pendingChange = getPendingChangeForPath(path);
  const hasChange = !!pendingChange;
  
  // Check for item-level changes (e.g., keywords.0)
  const itemChanges = pendingChanges.filter(c => 
    c.path.startsWith(`${path}.`) && !c.path.slice(path.length + 1).includes('.')
  );
  const hasItemChanges = itemChanges.length > 0;
  
  const displayValues = hasChange 
    ? (pendingChange.newValue as string[] | null) || []
    : values || [];

  const handleRevert = () => {
    removePendingChange(path);
    itemChanges.forEach(c => removePendingChange(c.path));
  };

  const isEmpty = displayValues.length === 0 && !hasChange && !hasItemChanges;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        py: 0.75,
        backgroundColor: (hasChange || hasItemChanges) ? 'success.lighter' : 'transparent',
        px: 1,
        borderRadius: 1,
        mb: 0.5,
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 500, 
          color: (hasChange || hasItemChanges) ? 'primary.main' : 'text.secondary',
          minWidth: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.secondary">—</Typography>
        ) : isUrl ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {displayValues.map((value, i) => (
              <Link 
                key={i} 
                href={value} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ fontSize: '0.85rem' }}
              >
                {value}
              </Link>
            ))}
          </Box>
        ) : (
          displayValues.map((value, i) => (
            <Chip
              key={i}
              label={value}
              size="small"
              variant="outlined"
              sx={{ 
                height: 22, 
                fontSize: '0.75rem',
                backgroundColor: itemChanges.some(c => c.path === `${path}.${i}`) ? 'success.light' : undefined,
              }}
            />
          ))
        )}
      </Box>
      {(hasChange || hasItemChanges) && (
        <Tooltip title="Revert changes">
          <IconButton 
            size="small" 
            onClick={handleRevert}
            color="warning"
            sx={{ flexShrink: 0, ml: 1 }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
