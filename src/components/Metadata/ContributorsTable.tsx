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
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { useMetadataContext } from '../../context/MetadataContext';
import type { Contributor } from '../../types/dandiset';

interface ContributorRowProps {
  contributor: Contributor;
  index: number;
  hasChange: boolean;
  hasChildChanges: boolean;
  onRevert?: () => void;
}

function formatRoles(roles?: string[]): string[] {
  if (!roles || roles.length === 0) return [];
  return roles.map(role => role.replace('dcite:', ''));
}

function ContributorRow({ contributor, index, hasChange, hasChildChanges, onRevert }: ContributorRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { removePendingChange, getPendingChangeForPath } = useMetadataContext();

  const isPerson = contributor.schemaKey === 'Person';
  const showExpand = contributor.email || contributor.url || contributor.awardNumber || 
                     (contributor.affiliation && contributor.affiliation.length > 0);

  // Get pending changes for specific fields
  const nameChange = getPendingChangeForPath(`contributor.${index}.name`);
  const identifierChange = getPendingChangeForPath(`contributor.${index}.identifier`);
  const rolesChange = getPendingChangeForPath(`contributor.${index}.roleName`);
  const includeInCitationChange = getPendingChangeForPath(`contributor.${index}.includeInCitation`);
  const emailChange = getPendingChangeForPath(`contributor.${index}.email`);
  const urlChange = getPendingChangeForPath(`contributor.${index}.url`);
  const awardNumberChange = getPendingChangeForPath(`contributor.${index}.awardNumber`);

  // Get display values (pending change or original)
  const displayName = nameChange ? (nameChange.newValue as string) : contributor.name;
  const displayIdentifier = identifierChange ? (identifierChange.newValue as string) : contributor.identifier;
  const displayRoles = rolesChange ? formatRoles(rolesChange.newValue as string[]) : formatRoles(contributor.roleName);
  const displayIncludeInCitation = includeInCitationChange !== undefined 
    ? (includeInCitationChange.newValue as boolean)
    : contributor.includeInCitation;
  const displayEmail = emailChange ? (emailChange.newValue as string) : contributor.email;
  const displayUrl = urlChange ? (urlChange.newValue as string) : contributor.url;
  const displayAwardNumber = awardNumberChange ? (awardNumberChange.newValue as string) : contributor.awardNumber;

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
            <Tooltip title={isPerson ? 'Person' : 'Organization'}>
              {isPerson ? (
                <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              ) : (
                <BusinessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              )}
            </Tooltip>
            <Box>
              {nameChange && (
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.75rem' }}>
                  {contributor.name}
                </Typography>
              )}
              <Typography variant="body2" sx={{ fontWeight: 500, color: nameChange ? 'success.dark' : 'text.primary' }}>
                {displayName}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Box>
            {identifierChange && contributor.identifier && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', textDecoration: 'line-through', color: 'error.main' }}>
                {contributor.identifier}
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: identifierChange ? 'success.dark' : 'text.primary' }}>
              {displayIdentifier || '—'}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {displayRoles.length > 0 ? (
              displayRoles.slice(0, 3).map((role: string, i: number) => (
                <Chip key={i} label={role} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', borderColor: rolesChange ? 'success.main' : undefined }} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">—</Typography>
            )}
            {displayRoles.length > 3 && (
              <Chip label={`+${displayRoles.length - 3}`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Box>
        </TableCell>
        <TableCell sx={{ py: 0.75, textAlign: 'center' }}>
          {displayIncludeInCitation !== undefined ? (
            <Box>
              {includeInCitationChange && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'error.main', mr: 0.5 }}>
                  {contributor.includeInCitation ? 'Yes' : 'No'}
                </Typography>
              )}
              <Chip 
                label={displayIncludeInCitation ? 'Yes' : 'No'} 
                size="small" 
                color={displayIncludeInCitation ? 'success' : 'default'}
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem',
                  border: includeInCitationChange ? '2px solid' : undefined,
                  borderColor: includeInCitationChange ? 'success.main' : undefined,
                }}
              />
            </Box>
          ) : '—'}
        </TableCell>
        <TableCell sx={{ py: 0.75, width: 50 }}>
          {(hasChange || hasChildChanges) && onRevert && (
            <Tooltip title="Revert all changes to this contributor">
              <IconButton size="small" onClick={onRevert} color="warning" sx={{ p: 0.25 }}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {showExpand && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
            <Collapse in={expanded}>
              <Box sx={{ py: 1, pl: 6, pr: 2 }}>
                <Table size="small" sx={{ backgroundColor: 'grey.50' }}>
                  <TableBody>
                    {(contributor.email || emailChange) && (
                      <TableRow sx={{ backgroundColor: emailChange ? 'success.lighter' : 'transparent' }}>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: emailChange ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>Email</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {emailChange && contributor.email && (
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.8rem' }}>
                              {contributor.email}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ color: emailChange ? 'success.dark' : 'text.primary' }}>
                            {displayEmail || '—'}
                          </Typography>
                        </TableCell>
                        {emailChange && (
                          <TableCell sx={{ border: 0, py: 0.5, width: 40 }}>
                            <IconButton size="small" onClick={() => removePendingChange(`contributor.${index}.email`)} color="warning">
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                    {(contributor.url || urlChange) && (
                      <TableRow sx={{ backgroundColor: urlChange ? 'success.lighter' : 'transparent' }}>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: urlChange ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>URL</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {urlChange && contributor.url && (
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.8rem' }}>
                              {contributor.url}
                            </Typography>
                          )}
                          {displayUrl ? (
                            <Typography variant="body2" component="a" href={displayUrl} target="_blank" sx={{ color: urlChange ? 'success.dark' : 'primary.main' }}>
                              {displayUrl}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        {urlChange && (
                          <TableCell sx={{ border: 0, py: 0.5, width: 40 }}>
                            <IconButton size="small" onClick={() => removePendingChange(`contributor.${index}.url`)} color="warning">
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                    {(contributor.awardNumber || awardNumberChange) && (
                      <TableRow sx={{ backgroundColor: awardNumberChange ? 'success.lighter' : 'transparent' }}>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: awardNumberChange ? 'primary.main' : 'text.secondary', border: 0, py: 0.5 }}>Award</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {awardNumberChange && contributor.awardNumber && (
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.main', fontSize: '0.8rem' }}>
                              {contributor.awardNumber}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ color: awardNumberChange ? 'success.dark' : 'text.primary' }}>
                            {displayAwardNumber || '—'}
                          </Typography>
                        </TableCell>
                        {awardNumberChange && (
                          <TableCell sx={{ border: 0, py: 0.5, width: 40 }}>
                            <IconButton size="small" onClick={() => removePendingChange(`contributor.${index}.awardNumber`)} color="warning">
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                    {contributor.affiliation && contributor.affiliation.length > 0 && (
                      <TableRow>
                        <TableCell sx={{ width: 100, fontWeight: 500, color: 'text.secondary', border: 0, py: 0.5, verticalAlign: 'top' }}>Affiliation</TableCell>
                        <TableCell sx={{ border: 0, py: 0.5 }}>
                          {contributor.affiliation.map((aff, i) => (
                            <Typography key={i} variant="body2">
                              {typeof aff === 'object' && aff !== null && 'name' in aff 
                                ? (aff as { name: string }).name 
                                : String(aff)}
                            </Typography>
                          ))}
                        </TableCell>
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

export function ContributorsTable() {
  const { versionInfo, pendingChanges, removePendingChange, getPendingChangeForPath } = useMetadataContext();

  if (!versionInfo) return null;

  const contributors = versionInfo.metadata.contributor || [];

  if (contributors.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        No contributors
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
            <TableCell sx={{ py: 0.75, fontWeight: 600 }}>Identifier</TableCell>
            <TableCell sx={{ py: 0.75, fontWeight: 600 }}>Roles</TableCell>
            <TableCell sx={{ py: 0.75, fontWeight: 600, textAlign: 'center' }}>In Citation</TableCell>
            <TableCell sx={{ py: 0.75, width: 50 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {contributors.map((contributor, index) => {
            const hasDirectChange = !!getPendingChangeForPath(`contributor.${index}`);
            const hasChildChanges = pendingChanges.some(c => 
              c.path.startsWith(`contributor.${index}.`)
            );

            const handleRevert = () => {
              // Remove direct change
              removePendingChange(`contributor.${index}`);
              // Remove all child changes
              pendingChanges
                .filter(c => c.path.startsWith(`contributor.${index}.`))
                .forEach(c => removePendingChange(c.path));
            };

            return (
              <ContributorRow
                key={index}
                contributor={contributor}
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
