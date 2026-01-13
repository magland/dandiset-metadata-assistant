import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UndoIcon from '@mui/icons-material/Undo';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import LabelIcon from '@mui/icons-material/Label';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import LinkIcon from '@mui/icons-material/Link';
import VerifiedIcon from '@mui/icons-material/Verified';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useMetadataContext } from '../../context/MetadataContext';
import { computeDelta, deltaToChanges } from '../../core/metadataDiff';

// Field definition type
interface FieldDef {
  key: string;
  title: string;
  type: 'string' | 'string[]' | 'array';
  icon: React.ComponentType<{ sx?: object }>;
}

// Section definition type
interface SectionDef {
  title: string;
  icon: React.ComponentType<{ sx?: object }>;
  fields: FieldDef[];
}

// Section groupings for better organization
const FIELD_SECTIONS: SectionDef[] = [
  {
    title: 'Basic Information',
    icon: DescriptionIcon,
    fields: [
      { key: 'name', title: 'Title', type: 'string', icon: TitleIcon },
      { key: 'description', title: 'Description', type: 'string', icon: DescriptionIcon },
      { key: 'keywords', title: 'Keywords', type: 'string[]', icon: LabelIcon },
      { key: 'license', title: 'License', type: 'string[]', icon: GavelIcon },
    ],
  },
  {
    title: 'People & Organizations',
    icon: PeopleIcon,
    fields: [
      { key: 'contributor', title: 'Contributors', type: 'array', icon: PeopleIcon },
    ],
  },
  {
    title: 'Study Details',
    icon: CategoryIcon,
    fields: [
      { key: 'about', title: 'Subject Matter', type: 'array', icon: CategoryIcon },
      { key: 'studyTarget', title: 'Study Target', type: 'string[]', icon: TrackChangesIcon },
      { key: 'protocol', title: 'Protocols', type: 'string[]', icon: LinkIcon },
    ],
  },
  {
    title: 'Compliance & Acknowledgements',
    icon: VerifiedIcon,
    fields: [
      { key: 'ethicsApproval', title: 'Ethics Approvals', type: 'array', icon: VerifiedIcon },
      { key: 'acknowledgement', title: 'Acknowledgement', type: 'string', icon: ThumbUpIcon },
    ],
  },
  {
    title: 'Related Items',
    icon: LibraryBooksIcon,
    fields: [
      { key: 'relatedResource', title: 'Related Resources', type: 'array', icon: LibraryBooksIcon },
      { key: 'wasGeneratedBy', title: 'Projects', type: 'array', icon: AccountTreeIcon },
    ],
  },
];

// Theme colors
const MODIFIED_BG = 'rgba(255, 193, 7, 0.12)';
const MODIFIED_BORDER = '#ffc107';
const SECTION_HEADER_BG = 'rgba(25, 118, 210, 0.08)';

interface FieldDisplayProps {
  fieldKey: string;
  title: string;
  value: unknown;
  isModified: boolean;
  type: string;
  icon?: React.ComponentType<{ sx?: object }>;
  onRevert?: () => void;
}

/**
 * Formats a primitive value for display
 */
function formatPrimitiveValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  return String(value);
}

/**
 * Renders a string array as chips
 */
function StringArrayDisplay({ values, isModified }: { values: string[]; isModified: boolean }) {
  if (!values || values.length === 0) {
    return <Typography variant="body2" color="text.secondary">None</Typography>;
  }
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, overflow: 'hidden' }}>
      {values.map((value, idx) => (
        <Chip
          key={idx}
          label={value}
          size="small"
          sx={{
            backgroundColor: isModified ? MODIFIED_BG : undefined,
            borderColor: isModified ? MODIFIED_BORDER : undefined,
            maxWidth: '100%',
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }}
          variant={isModified ? 'outlined' : 'filled'}
        />
      ))}
    </Box>
  );
}

/**
 * Extracts identifiers (like ROR IDs) from a URL or returns the identifier as-is
 */
function formatIdentifier(identifier: string): string {
  // Extract ROR ID from URL like https://ror.org/0190ak572
  const rorMatch = identifier.match(/ror\.org\/([a-z0-9]+)/i);
  if (rorMatch) return `ROR:${rorMatch[1]}`;
  return identifier;
}

/**
 * Formats an affiliation object showing both name and identifier
 */
function formatAffiliation(obj: Record<string, unknown>): string {
  const name = typeof obj.name === 'string' ? obj.name : '';
  const identifier = typeof obj.identifier === 'string' ? obj.identifier : '';
  
  if (name && identifier) {
    return `${name} (${formatIdentifier(identifier)})`;
  }
  return name || identifier || '—';
}

/**
 * Extracts a display name from a complex object
 */
function getObjectDisplayName(obj: Record<string, unknown>): string {
  // Try common name fields
  if (typeof obj.name === 'string' && obj.name) return obj.name;
  if (typeof obj.identifier === 'string' && obj.identifier) return obj.identifier;
  if (typeof obj.url === 'string' && obj.url) return obj.url;
  
  // For contributors, might have schemaKey to distinguish Person vs Organization
  const schemaKey = obj.schemaKey as string | undefined;
  if (schemaKey === 'Person' && obj.name) return obj.name as string;
  if (schemaKey === 'Organization' && obj.name) return obj.name as string;
  
  return JSON.stringify(obj).slice(0, 50) + '...';
}

/**
 * Renders a single object's key-value pairs
 */
function ObjectDisplay({ obj, modifiedPaths }: { obj: Record<string, unknown>; modifiedPaths: Set<string> }) {
  // Filter out schemaKey and id fields
  const entries = Object.entries(obj).filter(
    ([key]) => !['schemaKey', 'id'].includes(key) && obj[key] !== null && obj[key] !== undefined
  );
  
  if (entries.length === 0) {
    return <Typography variant="body2" color="text.secondary">Empty</Typography>;
  }
  
  return (
    <Box sx={{ pl: 1 }}>
      {entries.map(([key, value]) => {
        const isFieldModified = modifiedPaths.has(key);
        return (
          <Box
            key={key}
            sx={{
              py: 0.25,
              backgroundColor: isFieldModified ? MODIFIED_BG : undefined,
              borderRadius: 0.5,
              px: 0.5,
              mb: 0.25,
            }}
          >
            <Typography variant="body2" color="text.secondary" component="span">
              {formatFieldLabel(key)}:{' '}
            </Typography>
            <Typography
              variant="body2"
              component="span"
              sx={{
                wordBreak: 'break-word',
              }}
            >
              {Array.isArray(value) ? (
                value.length > 0 ? (
                  typeof value[0] === 'object' ? (
                    (value as Record<string, unknown>[])
                      .map((item) => {
                        // Use formatAffiliation for affiliation arrays
                        if (key === 'affiliation' || item.schemaKey === 'Affiliation') {
                          return formatAffiliation(item);
                        }
                        return getObjectDisplayName(item);
                      })
                      .join(', ')
                  ) : (
                    value.join(', ')
                  )
                ) : (
                  '—'
                )
              ) : typeof value === 'object' && value !== null ? (
                getObjectDisplayName(value as Record<string, unknown>)
              ) : (
                formatPrimitiveValue(value)
              )}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Renders an array of complex objects with expandable items
 */
function ComplexArrayDisplay({
  items,
  fieldKey,
  changedPaths,
}: {
  items: unknown[];
  fieldKey: string;
  changedPaths: Set<string>;
}) {
  const [expanded, setExpanded] = useState<number | false>(false);
  
  if (!items || items.length === 0) {
    return <Typography variant="body2" color="text.secondary">None</Typography>;
  }
  
  return (
    <Box>
      {items.map((item, idx) => {
        const itemPath = `${fieldKey}[${idx}]`;
        // Check if any path starts with this item's path
        const isItemModified = Array.from(changedPaths).some(
          (p) => p === itemPath || p.startsWith(`${itemPath}.`) || p.startsWith(`${itemPath}[`)
        );
        
        const obj = item as Record<string, unknown>;
        const displayName = getObjectDisplayName(obj);
        const schemaKey = obj.schemaKey as string | undefined;
        
        // Get modified paths relative to this item
        const itemModifiedPaths = new Set<string>();
        changedPaths.forEach((p) => {
          if (p.startsWith(`${itemPath}.`)) {
            itemModifiedPaths.add(p.slice(itemPath.length + 1));
          }
        });
        
        return (
          <Accordion
            key={idx}
            expanded={expanded === idx}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? idx : false)}
            sx={{
              backgroundColor: isItemModified ? MODIFIED_BG : 'background.paper',
              border: isItemModified ? `1px solid ${MODIFIED_BORDER}` : undefined,
              '&:before': { display: 'none' },
              boxShadow: 'none',
              '&.Mui-expanded': { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, width: '100%' }}>
                {schemaKey && (
                  <Chip label={schemaKey} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                )}
                {isItemModified && (
                  <Chip label="modified" size="small" color="warning" sx={{ fontSize: '0.65rem', height: 18 }} />
                )}
                <Typography variant="body2" sx={{ width: '100%', wordBreak: 'break-word' }}>
                  {displayName}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <ObjectDisplay obj={obj} modifiedPaths={itemModifiedPaths} />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

/**
 * Convert camelCase to Title Case
 */
function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Single field display component
 */
function FieldDisplay({ title, value, isModified, type, icon: Icon, onRevert }: FieldDisplayProps) {
  const isEmpty =
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'string' && !value);

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        backgroundColor: isModified ? MODIFIED_BG : 'transparent',
        borderLeft: isModified ? `3px solid ${MODIFIED_BORDER}` : '3px solid transparent',
        borderRadius: 1,
        mb: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isModified ? MODIFIED_BG : 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        {Icon && <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '0.85rem',
          }}
        >
          {title}
        </Typography>
        {isModified && (
          <>
            <Chip
              label="modified"
              size="small"
              color="warning"
              sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
            />
            <Tooltip title="Revert to original">
              <IconButton size="small" onClick={onRevert} sx={{ p: 0.25, ml: 0.5 }}>
                <UndoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      
      {isEmpty ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          Not specified
        </Typography>
      ) : type === 'string' ? (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            color: 'text.primary',
          }}
        >
          {formatPrimitiveValue(value)}
        </Typography>
      ) : type === 'string[]' ? (
        <StringArrayDisplay values={value as string[]} isModified={isModified} />
      ) : (
        <Typography variant="body2">{JSON.stringify(value)}</Typography>
      )}
    </Box>
  );
}

/**
 * Renders a single section with its fields
 */
function SectionDisplay({
  section,
  modifiedMetadata,
  changedPaths,
  isFieldModified,
  revertField,
}: {
  section: SectionDef;
  modifiedMetadata: Record<string, unknown>;
  changedPaths: Set<string>;
  isFieldModified: (key: string) => boolean;
  revertField: (key: string) => void;
}) {
  const SectionIcon = section.icon;
  
  // Check if section has any modified fields
  const sectionHasModifications = section.fields.some((field) => isFieldModified(field.key));
  
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: sectionHasModifications ? MODIFIED_BORDER : 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Section Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          backgroundColor: SECTION_HEADER_BG,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SectionIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {section.title}
        </Typography>
        {sectionHasModifications && (
          <Chip
            label="has changes"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 22, ml: 'auto' }}
          />
        )}
      </Box>
      
      {/* Section Fields */}
      <Box sx={{ p: 1.5 }}>
        {section.fields.map((field, idx) => {
          const value = modifiedMetadata[field.key];
          const modified = isFieldModified(field.key);
          const FieldIcon = field.icon;
          
          if (field.type === 'array') {
            return (
              <Box key={field.key}>
                {idx > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box
                  sx={{
                    py: 1,
                    px: 2,
                    backgroundColor: modified ? MODIFIED_BG : 'transparent',
                    borderLeft: modified ? `3px solid ${MODIFIED_BORDER}` : '3px solid transparent',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <FieldIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.85rem',
                      }}
                    >
                      {field.title}
                    </Typography>
                    {modified && (
                      <>
                        <Chip
                          label="modified"
                          size="small"
                          color="warning"
                          sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
                        />
                        <Tooltip title="Revert to original">
                          <IconButton size="small" onClick={() => revertField(field.key)} sx={{ p: 0.25, ml: 0.5 }}>
                            <UndoIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {Array.isArray(value) && (
                      <Chip
                        label={`${value.length} item${value.length !== 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20, ml: 'auto' }}
                      />
                    )}
                  </Box>
                  <ComplexArrayDisplay
                    items={value as unknown[]}
                    fieldKey={field.key}
                    changedPaths={changedPaths}
                  />
                </Box>
              </Box>
            );
          }
          
          return (
            <Box key={field.key}>
              {idx > 0 && <Divider sx={{ my: 1.5 }} />}
              <FieldDisplay
                fieldKey={field.key}
                title={field.title}
                value={value}
                isModified={modified}
                type={field.type}
                icon={FieldIcon}
                onRevert={() => revertField(field.key)}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

/**
 * Main component for displaying editable metadata with change highlighting
 */
export function EditableMetadataView() {
  const { originalMetadata, modifiedMetadata, revertField } = useMetadataContext();
  
  // Compute changed paths
  const changedPaths = useMemo(() => {
    const paths = new Set<string>();
    if (!originalMetadata || !modifiedMetadata) return paths;
    
    const delta = computeDelta(originalMetadata, modifiedMetadata);
    if (!delta) return paths;
    
    const changes = deltaToChanges(delta);
    changes.forEach((change) => paths.add(change.path));
    
    return paths;
  }, [originalMetadata, modifiedMetadata]);
  
  if (!modifiedMetadata) {
    return null;
  }
  
  // Check if a field or any of its nested paths are modified
  const isFieldModified = (fieldKey: string): boolean => {
    return Array.from(changedPaths).some(
      (p) => p === fieldKey || p.startsWith(`${fieldKey}.`) || p.startsWith(`${fieldKey}[`)
    );
  };
  
  // Count total modifications
  const modifiedCount = FIELD_SECTIONS.flatMap((s) => s.fields)
    .filter((f) => isFieldModified(f.key)).length;
  
  return (
    <Box sx={{ mt: 2 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Editable Metadata
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review the metadata fields below. Fields highlighted in{' '}
          <Box
            component="span"
            sx={{
              backgroundColor: MODIFIED_BG,
              border: `1px solid ${MODIFIED_BORDER}`,
              borderRadius: 0.5,
              px: 0.75,
              py: 0.25,
            }}
          >
            yellow
          </Box>{' '}
          have been modified from the original.
        </Typography>
        {modifiedCount > 0 && (
          <Chip
            label={`${modifiedCount} field${modifiedCount !== 1 ? 's' : ''} modified`}
            color="warning"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Paper>
      
      {/* Sections */}
      {FIELD_SECTIONS.map((section) => (
        <SectionDisplay
          key={section.title}
          section={section}
          modifiedMetadata={modifiedMetadata as unknown as Record<string, unknown>}
          changedPaths={changedPaths}
          isFieldModified={isFieldModified}
          revertField={revertField}
        />
      ))}
    </Box>
  );
}
