import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Paper,
  Alert,
  Chip,
  Tooltip,
  Button,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
import { useMetadataContext } from "../../context/MetadataContext";
import useChat from "../../chat/useChat";
import { CHEAP_MODELS } from "../../chat/availableModels";
import { getStoredOpenRouterApiKey } from "../../chat/apiKeyStorage";
import ChatInput from "./ChatInput";
import MessageItem from "./MessageItem";
import ChatSettingsDialog from "./ChatSettingsDialog";

export function ChatPanel() {
  const {
    versionInfo,
    dandisetId,
    version,
    addPendingChange,
    pendingChanges,
  } = useMetadataContext();

  const getMetadata = useCallback(() => {
    return versionInfo?.metadata || null;
  }, [versionInfo]);

  const {
    chat,
    submitUserMessage,
    responding,
    partialResponse,
    setChatModel,
    error,
    clearChat,
    abortResponse,
  } = useChat({
    getMetadata,
    addPendingChange,
    dandisetId,
    version,
  });

  const [newPrompt, setNewPrompt] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Check if API key is required but not present
  const requiresApiKey = !CHEAP_MODELS.includes(chat.model);
  const hasApiKey = !!getStoredOpenRouterApiKey();
  const needsApiKey = requiresApiKey && !hasApiKey;

  // All messages including partial response
  const allMessages = useMemo(() => {
    const messages = chat.messages.map((m) => ({ message: m, inProgress: false }));
    if (responding && partialResponse) {
      return [
        ...messages,
        ...partialResponse.map((m) => ({ message: m, inProgress: true })),
      ];
    }
    return messages;
  }, [chat.messages, responding, partialResponse]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [allMessages]);

  const handleSubmit = useCallback(() => {
    if (newPrompt.trim() === "" || responding || needsApiKey) return;
    submitUserMessage(newPrompt.trim());
    setNewPrompt("");
  }, [newPrompt, submitUserMessage, responding, needsApiKey]);

  const handleNewChat = useCallback(() => {
    clearChat();
    setNewPrompt("");
  }, [clearChat]);

  const hasMetadata = !!versionInfo?.metadata;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <SmartToyIcon color="primary" />
          Assistant
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {responding && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={abortResponse}
              sx={{ mr: 1 }}
            >
              Stop
            </Button>
          )}
          <Chip
            label={chat.model.split("/")[1]}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem" }}
          />
          <Tooltip title="New Chat">
            <span>
              <IconButton
                size="small"
                onClick={handleNewChat}
                disabled={chat.messages.length === 0}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Chat Messages Area */}
      <Box
        ref={conversationRef}
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!hasMetadata ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              backgroundColor: "grey.50",
              borderRadius: 2,
              m: "auto",
              maxWidth: 400,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Load a Dandiset First
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Load a dandiset using the welcome page to start chatting with the
              AI assistant about metadata.
            </Typography>
          </Paper>
        ) : allMessages.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              backgroundColor: "grey.50",
              borderRadius: 2,
              m: "auto",
              maxWidth: 400,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Ready to Help!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ask me questions about your dandiset metadata or request changes.
              I can help you:
            </Typography>
            <Box
              component="ul"
              sx={{
                textAlign: "left",
                pl: 2,
                color: "text.secondary",
                fontSize: "0.875rem",
              }}
            >
              <li>Review and improve metadata fields</li>
              <li>Add missing information</li>
              <li>Fix formatting or compliance issues</li>
              <li>Suggest better descriptions</li>
            </Box>
            {pendingChanges.length > 0 && (
              <Alert severity="info" sx={{ mt: 2, textAlign: "left" }}>
                You have {pendingChanges.length} pending change
                {pendingChanges.length > 1 ? "s" : ""} to review.
              </Alert>
            )}
          </Paper>
        ) : (
          <>
            {allMessages.map(({ message, inProgress }, index) => (
              <MessageItem
                key={index}
                message={message}
                inProgress={inProgress}
              />
            ))}
            {responding && !partialResponse && (
              <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: "grey.100",
                    borderRadius: 2,
                    borderTopLeftRadius: 0,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: "italic", color: "text.secondary" }}
                    >
                      Thinking...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {error}
        </Alert>
      )}

      {/* API Key Warning */}
      {needsApiKey && hasMetadata && (
        <Alert
          severity="warning"
          sx={{ mx: 2, mb: 1 }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          }
        >
          This model requires an OpenRouter API key. Click settings to add one
          or switch to a free model.
        </Alert>
      )}

      {/* Input Area */}
      <ChatInput
        value={newPrompt}
        onChange={setNewPrompt}
        onSubmit={handleSubmit}
        disabled={responding || !hasMetadata || needsApiKey}
        placeholder={
          !hasMetadata
            ? "Load a dandiset first..."
            : needsApiKey
              ? "API key required..."
              : "Ask about metadata or request changes..."
        }
      />

      {/* Usage Display */}
      {chat.totalUsage.estimatedCost > 0 && (
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderTop: 1,
            borderColor: "divider",
            backgroundColor: "grey.50",
            fontSize: "0.75rem",
            color: "text.secondary",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Tokens: {chat.totalUsage.promptTokens.toLocaleString()} prompt /{" "}
            {chat.totalUsage.completionTokens.toLocaleString()} completion
          </span>
          <span>Est. cost: ${chat.totalUsage.estimatedCost.toFixed(4)}</span>
        </Box>
      )}

      {/* Settings Dialog */}
      <ChatSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentModel={chat.model}
        onModelChange={setChatModel}
      />
    </Box>
  );
}
