import { FunctionComponent } from "react";
import { Box, Chip } from "@mui/material";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";

interface SuggestedPromptsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

/**
 * Displays clickable suggested prompts inline above the chat input.
 * Designed to be unobtrusive with light styling.
 */
const SuggestedPrompts: FunctionComponent<SuggestedPromptsProps> = ({
  suggestions,
  onSuggestionClick,
  disabled = false,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        px: 2,
        py: 1,
        borderTop: 1,
        borderColor: "divider",
        backgroundColor: "grey.50",
        alignItems: "center",
      }}
    >
      <LightbulbOutlinedIcon 
        sx={{ 
          fontSize: 16, 
          color: "text.secondary",
          mr: 0.5,
        }} 
      />
      {suggestions.map((suggestion, index) => (
        <Chip
          key={index}
          label={suggestion}
          size="small"
          variant="outlined"
          onClick={() => !disabled && onSuggestionClick(suggestion)}
          disabled={disabled}
          sx={{
            cursor: disabled ? "default" : "pointer",
            fontSize: "0.75rem",
            height: "auto",
            py: 0.5,
            "& .MuiChip-label": {
              whiteSpace: "normal",
              lineHeight: 1.3,
            },
            "&:hover": disabled ? {} : {
              backgroundColor: "primary.lighter",
              borderColor: "primary.main",
            },
            transition: "all 0.2s",
          }}
        />
      ))}
    </Box>
  );
};

export default SuggestedPrompts;
