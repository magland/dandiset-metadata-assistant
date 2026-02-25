import { Select, MenuItem, FormControl, type SelectChangeEvent } from '@mui/material';
import { DANDI_INSTANCES } from '../../utils/dandiInstances';
import { useMetadataContext } from '../../context/MetadataContext';

export function InstanceSelector() {
  const { dandiInstance, setDandiInstance } = useMetadataContext();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selected = DANDI_INSTANCES.find((i) => i.apiUrl === event.target.value);
    if (selected) {
      setDandiInstance(selected);
    }
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <Select
        value={dandiInstance.apiUrl}
        onChange={handleChange}
        displayEmpty
        sx={{
          color: 'inherit',
          fontSize: '0.8rem',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
          '& .MuiSvgIcon-root': { color: 'inherit' },
        }}
      >
        {DANDI_INSTANCES.map((instance) => (
          <MenuItem key={instance.apiUrl} value={instance.apiUrl}>
            {instance.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
