import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export type CommitAction = 'cancel' | 'commit-only' | 'commit-and-publish';

interface CommitConfirmDialogProps {
  open: boolean;
  onClose: (action: CommitAction) => void;
  isProcessing?: boolean;
}

export function CommitConfirmDialog({ open, onClose, isProcessing = false }: CommitConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !isProcessing && onClose('cancel')}
      aria-labelledby="commit-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="commit-dialog-title">
        Commit Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Choose how to proceed with your metadata changes:
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          <strong>Commit and Publish (Recommended):</strong> Save your changes and immediately publish a new version of your dandiset.
        </DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>
          <strong>Commit Only:</strong> Save your changes to the draft without publishing.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={() => onClose('cancel')} 
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onClose('commit-only')}
          disabled={isProcessing}
          variant="outlined"
          color="primary"
        >
          Commit Only
        </Button>
        <Button 
          onClick={() => onClose('commit-and-publish')}
          disabled={isProcessing}
          variant="contained"
          color="success"
          autoFocus
        >
          Commit and Publish
        </Button>
      </DialogActions>
    </Dialog>
  );
}
