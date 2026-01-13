import { useState } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface EditableKeywordsListProps {
  value: string[] | null | undefined;
  onSave: (value: string[]) => void;
}

/**
 * Editable keywords list with dialog editor
 * Supports add, remove, and reorder operations
 */
export function EditableKeywordsList({ value, onSave }: EditableKeywordsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const handleStartEdit = () => {
    setEditKeywords([...(value || [])]);
    setNewKeyword('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    onSave(editKeywords);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setEditKeywords([]);
    setNewKeyword('');
    setDialogOpen(false);
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !editKeywords.includes(trimmed)) {
      setEditKeywords([...editKeywords, trimmed]);
      setNewKeyword('');
    }
  };

  const handleAddKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (index: number) => {
    const newKeywords = [...editKeywords];
    newKeywords.splice(index, 1);
    setEditKeywords(newKeywords);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newKeywords = [...editKeywords];
    [newKeywords[index - 1], newKeywords[index]] = [newKeywords[index], newKeywords[index - 1]];
    setEditKeywords(newKeywords);
  };

  const handleMoveDown = (index: number) => {
    if (index >= editKeywords.length - 1) return;
    const newKeywords = [...editKeywords];
    [newKeywords[index], newKeywords[index + 1]] = [newKeywords[index + 1], newKeywords[index]];
    setEditKeywords(newKeywords);
  };

  return (
    <>
      <Tooltip title="Edit keywords">
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
          Edit Keywords
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Add new keyword */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Add keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleAddKeywordKeyDown}
              placeholder="Type and press Enter"
            />
            <Button
              variant="outlined"
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim()}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <AddIcon />
            </Button>
          </Box>

          {/* Keywords list */}
          {editKeywords.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No keywords. Add some above.
            </Typography>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {editKeywords.length} keyword{editKeywords.length !== 1 ? 's' : ''} - use arrows to reorder
              </Typography>
              <List dense sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {editKeywords.map((keyword, index) => (
                  <ListItem
                    key={`${keyword}-${index}`}
                    sx={{
                      borderBottom: index < editKeywords.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                      py: 0.5,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Chip
                          label={keyword}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Move up">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === editKeywords.length - 1}
                          >
                            <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveKeyword(index)}
                          color="error"
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
