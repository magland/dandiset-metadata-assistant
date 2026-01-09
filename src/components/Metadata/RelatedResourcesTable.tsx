import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Collapse,
  Link,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LinkIcon from '@mui/icons-material/Link';
import { useMetadataContext } from '../../context/MetadataContext';
import type { RelatedResource } from '../../types/dandiset';

interface ResourceRowProps {
  resource: RelatedResource;
  index: number;
  hasChange: boolean;
  hasChildChanges: boolean;
  onRevert?: () => void;
}

function formatRelation(relation: string): string {
  return relation.replace('dcite:', '');
}

function formatResourceType(type?: string): string {
  if (!type) return '';
  return type.replace('dcite:', '');
}

function ResourceRow({ resource, index, hasChange, hasChildChanges, onRevert }: ResourceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { removePendingChange, getPendingChangeForPath } = useMetadataContext();

  // Get pending changes for specific fields
  const nameChange = getPendingChangeForPath(`relatedResource.${index}.name`);
  const urlChange = getPendingChangeForPath(`relatedResource.${index}.url`);
  const relationChange = getPendingChangeForPath(`relatedResource.${index}.relation`);
  const identifierChange = getPendingChangeForPath(`relatedResource.${index}.identifier`);
  const repositoryChange = getPendingChangeForPath(`relatedResource.${index}.repository`);
  const resourceTypeChange = getPendingChangeForPath(`relatedResource.${index}.resourceType`);

  // Get display values (pending change or original)
  const displayName = nameChange ? (nameChange.newValue as string) : resource.name;
  const displayUrl = urlChange ? (urlChange.newValue as string) : resource.url;
  const displayRelation = relationChange ? (relationChange.newValue as string) : resource.relation;
  const displayIdentifier = identifierChange ? (identifierChange.newValue as string) : resource.identifier;
  const displayRepository = repositoryChange ? (repositoryChange.newValue as string) : resource.repository;
  const displayResourceType = resourceTypeChange ? (resourceTypeChange.newValue as string) : resource.resourceType;

  const showExpand = displayIdentifier || displayRepository || displayResourceType;

  const rowHighlight = hasChange || hasChildChanges;

  return (
    <>
      <TableRow
        sx={{
          backgroundColor: rowHighlight ? 'success.lighter' : 'transparent',
          '&:hover': { backgroundColor: rowHighlight ? 'success.light' : 'action.hover' },
        }}
      >
        <TableCell sx={{ py: 0.75, width: 40 }}>
          {showExpand ? (
            <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ p: 0.25 }}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24 }} />
          )}
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinkIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Box>
              {nameChange && resource.name && (
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.75rem' }}>
                  {resource.name}
                </Typography>
              )}
              <Typography variant="body2" sx={{ fontWeight: 500, color: nameChange ? 'success.dark' : 'text.primary' }}>
                {displayName || '(unnamed)'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ py: 0.75, maxWidth: 200 }}>
          <Box>
            {urlChange && resource.url && (
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.7rem' }}>
                {resource.url}
              </Typography>
            )}
            {displayUrl ? (
              <Link 
                href={displayUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  fontSize: '0.8rem', 
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: urlChange ? 'success.dark' : 'primary.main',
                }}
              >
                {displayUrl}
              </Link>
            ) : (
              <Typography variant="body2" color="text.secondary">—</Typography>
            )}
          </Box>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Box>
            {relationChange && (
              <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'error.main', mr: 0.5 }}>
                {formatRelation(resource.relation)}
              </Typography>
            )}
            <Chip 
              label={formatRelation(displayRelation)} 
              size="small" 
              variant="outlined"
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                borderColor: relationChange ? 'success.main' : undefined,
              }} 
            />
          </Box>
        </TableCell>
        <TableCell sx={{ py: 0.75, width: 50 }}>
          {(hasChange || hasChildChanges) && onRevert && (
            <Tooltip title="Revert all changes to this resource">
              <IconButton size="small" onClick={onRevert} color="warning" sx={{ p: 0.25 }}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {showExpand && (
        <TableRow>
          <TableCell colSpan={5} sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
            <Collapse in={expanded}>
              <Box sx={{ py: 1, pl: 6, pr: 2 }}>
                <Table size="small" sx={{ backgroundColor: 'grey.50' }}>
                  <TableBody>
                    {(resource.identifier || identifierChange) && (
                      <TableRow sx={{ backgroundColor: identifierChange ? 'success.lighter' : 'transparent' }}>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: identifierChange ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>Identifier</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {identifierChange && resource.identifier && (
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.8rem' }}>
                              {resource.identifier}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ color: identifierChange ? 'success.dark' : 'text.primary' }}>
                            {displayIdentifier || '—'}
                          </Typography>
                        </TableCell>
                        {identifierChange && (
                          <TableCell sx={{ border: 0, py: 0.5, width: 40 }}>
                            <IconButton size="small" onClick={() => removePendingChange(`relatedResource.${index}.identifier`)} color="warning">
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                    {(resource.repository || repositoryChange) && (
                      <TableRow sx={{ backgroundColor: repositoryChange ? 'success.lighter' : 'transparent' }}>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: repositoryChange ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>Repository</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {repositoryChange && resource.repository && (
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.8rem' }}>
                              {resource.repository}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ color: repositoryChange ? 'success.dark' : 'text.primary' }}>
                            {displayRepository || '—'}
                          </Typography>
                        </TableCell>
                        {repositoryChange && (
                          <TableCell sx={{ border: 0, py: 0.5, width: 40 }}>
                            <IconButton size="small" onClick={() => removePendingChange(`relatedResource.${index}.repository`)} color="warning">
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                    {(resource.resourceType || resourceTypeChange) && (
                      <TableRow sx={{ backgroundColor: resourceTypeChange ? 'success.lighter' : 'transparent' }}>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: resourceTypeChange ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>Type</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {resourceTypeChange && resource.resourceType && (
                            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'error.main', mr: 0.5 }}>
                              {formatResourceType(resource.resourceType)}
                            </Typography>
                          )}
                          <Chip 
                            label={formatResourceType(displayResourceType)} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              borderColor: resourceTypeChange ? 'success.main' : undefined,
                            }} 
                          />
                        </TableCell>
                        {resourceTypeChange && (
                          <TableCell sx={{ border: 0, py: 0.5, width: 40 }}>
                            <IconButton size="small" onClick={() => removePendingChange(`relatedResource.${index}.resourceType`)} color="warning">
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function RelatedResourcesTable() {
  const { versionInfo, pendingChanges, removePendingChange, getPendingChangeForPath } = useMetadataContext();

  if (!versionInfo) return null;

  const resources = versionInfo.metadata.relatedResource || [];

  if (resources.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        No related resources
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.100' }}>
            <TableCell sx={{ py: 0.75, width: 40 }} />
            <TableCell sx={{ py: 0.75, fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ py: 0.75, fontWeight: 600 }}>URL</TableCell>
            <TableCell sx={{ py: 0.75, fontWeight: 600 }}>Relation</TableCell>
            <TableCell sx={{ py: 0.75, width: 50 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {resources.map((resource, index) => {
            const hasDirectChange = !!getPendingChangeForPath(`relatedResource.${index}`);
            const hasChildChanges = pendingChanges.some(c => 
              c.path.startsWith(`relatedResource.${index}.`)
            );

            const handleRevert = () => {
              removePendingChange(`relatedResource.${index}`);
              pendingChanges
                .filter(c => c.path.startsWith(`relatedResource.${index}.`))
                .forEach(c => removePendingChange(c.path));
            };

            return (
              <ResourceRow
                key={index}
                resource={resource}
                index={index}
                hasChange={hasDirectChange}
                hasChildChanges={hasChildChanges}
                onRevert={(hasDirectChange || hasChildChanges) ? handleRevert : undefined}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
