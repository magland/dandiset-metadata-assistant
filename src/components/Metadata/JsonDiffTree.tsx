import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useMetadataContext } from '../../context/MetadataContext';
import {
  type DiffNode,
  type DiffType,
  generateDiffTree,
  formatPrimitiveValue,
  isExpandable,
  countChanges,
} from './jsonDiffUtils';

interface JsonDiffNodeProps {
  node: DiffNode;
  depth?: number;
  showUnchanged: boolean;
  defaultExpanded?: boolean;
}

function JsonDiffNode({ node, depth = 0, showUnchanged, defaultExpanded = true }: JsonDiffNodeProps) {
  const { removePendingChange, getPendingChangeForPath } = useMetadataContext();
  
  // Determine if this node should be expanded by default
  const shouldExpandByDefault = 
    node.type === 'nested' || node.type === 'modified' || node.type === 'added' || node.type === 'removed';
  
  const [isExpanded, setIsExpanded] = useState(shouldExpandByDefault ? defaultExpanded : false);

  const hasChildren = node.children && node.children.length > 0;
  const expandable = hasChildren || 
    (node.type === 'added' && isExpandable(node.newValue)) ||
    (node.type === 'removed' && isExpandable(node.oldValue));

  // For added/removed nodes with expandable values, create synthetic children
  const displayChildren = useMemo(() => {
    if (node.children) return node.children;
    
    if (node.type === 'added' && isExpandable(node.newValue)) {
      const val = node.newValue;
      if (Array.isArray(val)) {
        return val.map((item, i) => ({
          key: `[${i}]`,
          path: `${node.path}.${i}`,
          type: 'added' as DiffType,
          oldValue: undefined,
          newValue: item,
        }));
      }
      if (typeof val === 'object' && val !== null) {
        return Object.entries(val).map(([k, v]) => ({
          key: k,
          path: `${node.path}.${k}`,
          type: 'added' as DiffType,
          oldValue: undefined,
          newValue: v,
        }));
      }
    }
    
    if (node.type === 'removed' && isExpandable(node.oldValue)) {
      const val = node.oldValue;
      if (Array.isArray(val)) {
        return val.map((item, i) => ({
          key: `[${i}]`,
          path: `${node.path}.${i}`,
          type: 'removed' as DiffType,
          oldValue: item,
          newValue: undefined,
        }));
      }
      if (typeof val === 'object' && val !== null) {
        return Object.entries(val).map(([k, v]) => ({
          key: k,
          path: `${node.path}.${k}`,
          type: 'removed' as DiffType,
          oldValue: v,
          newValue: undefined,
        }));
      }
    }
    
    return [];
  }, [node]);

  // Filter children based on showUnchanged
  const visibleChildren = useMemo(() => {
    if (!displayChildren) return [];
    if (showUnchanged) return displayChildren;
    return displayChildren.filter(child => child.type !== 'unchanged');
  }, [displayChildren, showUnchanged]);

  // Check if this path has a pending change
  const pendingChange = getPendingChangeForPath(node.path);
  const canRevert = !!pendingChange;

  // Skip unchanged nodes if not showing them
  if (!showUnchanged && node.type === 'unchanged') {
    return null;
  }

  const handleRevert = () => {
    removePendingChange(node.path);
  };

  // Color based on diff type
  const getTypeColor = () => {
    switch (node.type) {
      case 'added': return 'success.main';
      case 'removed': return 'error.main';
      case 'modified': return 'warning.main';
      case 'nested': return 'primary.main';
      default: return 'text.secondary';
    }
  };

  const getTypeIcon = () => {
    switch (node.type) {
      case 'added': return <AddIcon fontSize="inherit" sx={{ color: 'success.main', fontSize: '0.9rem' }} />;
      case 'removed': return <RemoveIcon fontSize="inherit" sx={{ color: 'error.main', fontSize: '0.9rem' }} />;
      default: return null;
    }
  };

  const renderValue = () => {
    if (node.type === 'unchanged') {
      const val = node.newValue ?? node.oldValue;
      if (hasChildren) return null; // Will show children instead
      return (
        <Typography
          component="span"
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: 'text.secondary',
          }}
        >
          {formatPrimitiveValue(val)}
        </Typography>
      );
    }

    if (node.type === 'added') {
      if (isExpandable(node.newValue)) return null; // Show children
      return (
        <Typography
          component="span"
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            backgroundColor: 'success.lighter',
            color: 'success.dark',
            px: 0.5,
            borderRadius: 0.5,
          }}
        >
          {formatPrimitiveValue(node.newValue)}
        </Typography>
      );
    }

    if (node.type === 'removed') {
      if (isExpandable(node.oldValue)) return null; // Show children
      return (
        <Typography
          component="span"
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            backgroundColor: 'error.lighter',
            color: 'error.main',
            textDecoration: 'line-through',
            px: 0.5,
            borderRadius: 0.5,
          }}
        >
          {formatPrimitiveValue(node.oldValue)}
        </Typography>
      );
    }

    if (node.type === 'modified') {
      return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              backgroundColor: 'error.lighter',
              color: 'error.main',
              textDecoration: 'line-through',
              px: 0.5,
              borderRadius: 0.5,
            }}
          >
            {formatPrimitiveValue(node.oldValue)}
          </Typography>
          <Typography component="span" sx={{ color: 'text.secondary', mx: 0.5 }}>
            →
          </Typography>
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              backgroundColor: 'success.lighter',
              color: 'success.dark',
              px: 0.5,
              borderRadius: 0.5,
            }}
          >
            {formatPrimitiveValue(node.newValue)}
          </Typography>
        </Box>
      );
    }

    // nested type - don't show value, will show children
    return null;
  };

  return (
    <Box sx={{ userSelect: 'none' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.5,
          py: 0.25,
          pl: depth * 2,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {/* Expand/collapse button */}
        {expandable && visibleChildren.length > 0 ? (
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ p: 0, mt: 0.125 }}
          >
            {isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}

        {/* Type indicator icon */}
        {getTypeIcon()}

        {/* Key name */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: getTypeColor(),
            minWidth: 80,
            flexShrink: 0,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
          }}
        >
          {node.key}:
        </Typography>

        {/* Value */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {renderValue()}
        </Box>

        {/* Revert button */}
        {canRevert && (
          <Tooltip title="Revert this change">
            <IconButton
              size="small"
              onClick={handleRevert}
              sx={{ p: 0.25, color: 'warning.main' }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Children */}
      {expandable && visibleChildren.length > 0 && (
        <Collapse in={isExpanded}>
          <Box
            sx={{
              borderLeft: '1px solid',
              borderColor: node.type === 'added' ? 'success.light' : 
                           node.type === 'removed' ? 'error.light' : 
                           node.type === 'nested' ? 'primary.light' : 'divider',
              ml: depth * 2 + 1.5,
              pl: 0.5,
            }}
          >
            {visibleChildren.map((child, index) => (
              <JsonDiffNode
                key={child.path || index}
                node={child}
                depth={depth + 1}
                showUnchanged={showUnchanged}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

interface JsonDiffTreeProps {
  showUnchanged?: boolean;
}

export function JsonDiffTree({ showUnchanged = false }: JsonDiffTreeProps) {
  const { versionInfo, getModifiedMetadata } = useMetadataContext();

  const diffTree = useMemo(() => {
    if (!versionInfo) return null;
    const original = versionInfo.metadata;
    const modified = getModifiedMetadata();
    if (!modified) return null;
    return generateDiffTree(original, modified, 'root', '');
  }, [versionInfo, getModifiedMetadata]);

  if (!diffTree) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No metadata loaded
      </Typography>
    );
  }

  const changeCount = countChanges(diffTree);

  if (changeCount === 0 && !showUnchanged) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No pending changes
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: 'monospace' }}>
      {diffTree.children?.map((child, index) => (
        <JsonDiffNode
          key={child.path || index}
          node={child}
          depth={0}
          showUnchanged={showUnchanged}
          defaultExpanded={true}
        />
      ))}
    </Box>
  );
}
