import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ boxShadow: 1 }}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <Typography variant="body1" fontWeight="medium" component="div" sx={{ flexGrow: 1 }}>
            Geometric Background Generator
          </Typography>
          <Button
            color="inherit"
            size="small"
            component={Link}
            to="/"
            startIcon={<HomeIcon fontSize="small" />}
          >
            Generator
          </Button>
          <Button
            color="inherit"
            size="small"
            component={Link}
            to="/about"
            startIcon={<InfoIcon fontSize="small" />}
          >
            About
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ flex: 1, py: 1.5 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
