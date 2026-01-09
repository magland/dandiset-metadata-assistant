import { Box, Typography, Paper, Divider } from '@mui/material';
import { useMetadataContext } from '../../context/MetadataContext';
import { SimpleFieldsTable } from './SimpleFieldsTable';
import { ContributorsTable } from './ContributorsTable';
import { RelatedResourcesTable } from './RelatedResourcesTable';
import { StringArrayField } from './StringArrayField';
import { AboutTable, EthicsApprovalTable, ProjectsTable } from './GenericArrayTable';
import { ReadOnlySection } from './ReadOnlySection';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600, 
          color: 'text.secondary', 
          mb: 1,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function MetadataDisplay() {
  const { versionInfo } = useMetadataContext();

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
          Load a dandiset to view its metadata
        </Typography>
      </Paper>
    );
  }

  const metadata = versionInfo.metadata;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        Editable Metadata
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Basic Information */}
      <Section title="Basic Information">
        <SimpleFieldsTable />
      </Section>

      {/* License */}
      <Section title="License">
        <StringArrayField 
          label="License" 
          path="license" 
          values={metadata.license?.map(l => l.replace('spdx:', ''))} 
        />
      </Section>

      {/* Keywords & Study Targets */}
      <Section title="Keywords & Study">
        <StringArrayField 
          label="Keywords" 
          path="keywords" 
          values={metadata.keywords} 
        />
        <StringArrayField 
          label="Study Target" 
          path="studyTarget" 
          values={metadata.studyTarget as string[] | undefined} 
        />
        <StringArrayField 
          label="Protocol" 
          path="protocol" 
          values={metadata.protocol}
          isUrl
        />
      </Section>

      {/* Subject Matter (About) */}
      <Section title="Subject Matter">
        <AboutTable />
      </Section>

      {/* Contributors */}
      <Section title="Contributors">
        <ContributorsTable />
      </Section>

      {/* Related Resources */}
      <Section title="Related Resources">
        <RelatedResourcesTable />
      </Section>

      {/* Ethics Approval */}
      <Section title="Ethics Approvals">
        <EthicsApprovalTable />
      </Section>

      {/* Projects */}
      <Section title="Associated Projects">
        <ProjectsTable />
      </Section>

      <Divider sx={{ my: 2 }} />

      {/* Read-only Fields */}
      <ReadOnlySection />
    </Paper>
  );
}
