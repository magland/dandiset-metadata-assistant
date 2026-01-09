import { useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { MetadataProvider, useMetadataContext } from './context/MetadataContext';
import logoIcon from '/logo-white.svg';
import { MainLayout } from './components/Layout/MainLayout';
import { ChatPanel } from './components/Chat/ChatPanel';
import { MetadataPanel } from './components/Metadata/MetadataPanel';
import { WelcomePage } from './components/Welcome/WelcomePage';
import { DandisetIndicator } from './components/Controls/DandisetIndicator';
import { ApiKeyManager } from './components/Controls/ApiKeyManager';
import { fetchDandisetVersionInfo } from './utils/api';

// Create a custom theme with better colors for diffs
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      // @ts-expect-error - MUI doesn't have lighter in the type but we can use it
      lighter: '#e8f5e9',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      // @ts-expect-error - MUI doesn't have lighter in the type but we can use it
      lighter: '#ffebee',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          height: '100vh',
          overflow: 'hidden',
        },
        '#root': {
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
  },
});

// Parse URL for dandiset ID
function getUrlParams(): { dandisetId: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    dandisetId: params.get('dandiset'),
  };
}

// Update URL with dandiset ID
function updateUrl(dandisetId: string | null) {
  const url = new URL(window.location.href);
  if (dandisetId) {
    url.searchParams.set('dandiset', dandisetId);
  } else {
    url.searchParams.delete('dandiset');
  }
  // Clean up any old version params
  url.searchParams.delete('version');
  window.history.replaceState({}, '', url.toString());
}

function AppContent() {
  const {
    versionInfo,
    dandisetId,
    setDandisetId,
    setVersion,
    setVersionInfo,
    setIsLoading,
    setError,
    clearPendingChanges,
    apiKey,
  } = useMetadataContext();

  // Load dandiset from URL on initial render
  useEffect(() => {
    const { dandisetId: urlDandisetId } = getUrlParams();
    if (urlDandisetId && !versionInfo) {
      // Auto-load the dandiset from URL parameters (always use draft)
      const loadFromUrl = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const info = await fetchDandisetVersionInfo(urlDandisetId, 'draft', apiKey);
          setVersionInfo(info);
          setDandisetId(urlDandisetId);
          setVersion('draft');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load dandiset from URL');
          // Clear invalid URL params
          updateUrl(null);
        } finally {
          setIsLoading(false);
        }
      };
      loadFromUrl();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  const handleDandisetLoaded = useCallback((newDandisetId: string) => {
    updateUrl(newDandisetId);
  }, []);

  const handleChangeDandiset = useCallback(() => {
    setVersionInfo(null);
    setDandisetId('');
    setVersion('draft');
    clearPendingChanges();
    updateUrl(null);
  }, [setVersionInfo, setDandisetId, setVersion, clearPendingChanges]);

  // Show welcome page if no dandiset is loaded
  const showWelcome = !versionInfo && !dandisetId;

  if (showWelcome) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Minimal App Bar for welcome page */}
        <AppBar position="static" elevation={1}>
          <Toolbar variant="dense">
            <Box component="img" src={logoIcon} alt="Logo" sx={{ height: 24, mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Dandiset Metadata Assistant
            </Typography>
            <ApiKeyManager />
          </Toolbar>
        </AppBar>

        {/* Welcome Page */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <WelcomePage onDandisetLoaded={handleDandisetLoaded} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar with loaded dandiset */}
      <AppBar position="static" elevation={1}>
        <Toolbar variant="dense">
          <Box component="img" src={logoIcon} alt="Logo" sx={{ height: 24, mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ mr: 3 }}>
            Dandiset Metadata Assistant
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <DandisetIndicator onChangeDandiset={handleChangeDandiset} />
          </Box>
          <ApiKeyManager />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MainLayout
          leftPanel={<ChatPanel />}
          rightPanel={<MetadataPanel />}
          initialLeftWidth={50}
          minLeftWidth={25}
          maxLeftWidth={75}
        />
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MetadataProvider>
        <AppContent />
      </MetadataProvider>
    </ThemeProvider>
  );
}

export default App;
