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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Geometric Background Generator
          </Typography>
          <Button
            color="inherit"
            component={Link}
            to="/"
            startIcon={<HomeIcon />}
          >
            Generator
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/about"
            startIcon={<InfoIcon />}
          >
            About
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
