import { FunctionComponent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const AboutDialog: FunctionComponent<AboutDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>About Dandiset Metadata Assistant</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {/* Description */}
          <Typography variant="body1">
            A web application for viewing and editing DANDI Archive dandiset
            metadata with AI assistance. Load a dandiset from the DANDI
            Archive, view its metadata, and use the integrated AI chat and
            manual tools to modify and improve your metadata.
          </Typography>

          <Typography variant="body1">
            The application tracks changes with visual diffs, making it easy
            to review modifications before committing them back to the archive.
          </Typography>

          {/* Authors */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Authors
            </Typography>
            <Typography variant="body2">
              Jeremy Magland, Center for Computational Mathematics, Flatiron
              Institute
            </Typography>
            <Typography variant="body2">
              Ben Dichter, CatalystNeuro
            </Typography>
          </Box>

          {/* GitHub Link */}
          <Box>
            <Link
              href="https://github.com/magland/dandiset-metadata-assistant"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                textDecoration: "none",
              }}
            >
              <GitHubIcon fontSize="small" />
              <Typography variant="body2">View on GitHub</Typography>
            </Link>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutDialog;
