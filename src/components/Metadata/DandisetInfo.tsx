import { Box, Typography, Paper, Chip, Divider, Link } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useMetadataContext } from '../../context/MetadataContext';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
        {label}:
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

export function DandisetInfo() {
  const { versionInfo, dandisetId } = useMetadataContext();

  if (!versionInfo) {
    return null;
  }

  const statusColor = versionInfo.status === 'Valid' ? 'success' : 'error';

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Link
          href={`https://dandiarchive.org/dandiset/${dandisetId}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'inherit',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Dandiset {dandisetId}
          </Typography>
          <OpenInNewIcon fontSize="small" sx={{ fontSize: '1rem' }} />
        </Link>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={versionInfo.status} size="small" color={statusColor} />
          {versionInfo.dandiset.embargo_status !== 'OPEN' && (
            <Chip label={versionInfo.dandiset.embargo_status} size="small" color="warning" />
          )}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {versionInfo.name}
      </Typography>

      <Divider sx={{ my: 1 }} />

      <InfoRow
        icon={<FolderIcon fontSize="small" />}
        label="Assets"
        value={`${versionInfo.asset_count} files`}
      />
      <InfoRow
        icon={<StorageIcon fontSize="small" />}
        label="Size"
        value={formatBytes(versionInfo.size)}
      />
      <InfoRow
        icon={<PersonIcon fontSize="small" />}
        label="Contact"
        value={versionInfo.contact_person}
      />
      <InfoRow
        icon={<CalendarTodayIcon fontSize="small" />}
        label="Created"
        value={formatDate(versionInfo.created)}
      />
      <InfoRow
        icon={<CalendarTodayIcon fontSize="small" />}
        label="Modified"
        value={formatDate(versionInfo.modified)}
      />

      {versionInfo.version_validation_errors.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {versionInfo.version_validation_errors.length} validation error(s)
          </Typography>
        </>
      )}
    </Paper>
  );
}
