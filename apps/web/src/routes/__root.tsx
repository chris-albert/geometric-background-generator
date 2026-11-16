import { useState } from 'react';
import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';
import GridViewIcon from '@mui/icons-material/GridView';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LandscapeIcon from '@mui/icons-material/Landscape';

export const Route = createRootRoute({
  component: RootLayout,
});

interface GeneratorItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

const generators: GeneratorItem[] = [
  {
    id: 'geometric',
    name: '2D Geometric',
    description: 'Triangles, squares, hexagons and more',
    path: '/',
    icon: <GridViewIcon />,
  },
  {
    id: 'fractal',
    name: 'Fractal',
    description: 'Mandelbrot, Julia sets and more',
    path: '/fractal',
    icon: <AutoAwesomeIcon />,
  },
  {
    id: 'terrain',
    name: '3D Terrain',
    description: 'Synthwave wireframe landscapes',
    path: '/terrain',
    icon: <LandscapeIcon />,
  },
];

function RootLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const currentGenerator = generators.find((g) => g.path === location.pathname) || generators[0];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ boxShadow: 1 }}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 1 }}
            size="small"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="body1" fontWeight="medium" component="div" sx={{ flexGrow: 1 }}>
            Background Generator
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1, opacity: 0.7 }}
            >
              / {currentGenerator.name}
            </Typography>
          </Typography>
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

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 280 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="medium">
              Generator Styles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a background style
            </Typography>
          </Box>
          <Divider />
          <List>
            {generators.map((generator) => (
              <ListItem key={generator.id} disablePadding>
                <ListItemButton
                  component={Link}
                  to={generator.path}
                  selected={location.pathname === generator.path}
                >
                  <ListItemIcon>{generator.icon}</ListItemIcon>
                  <ListItemText
                    primary={generator.name}
                    secondary={generator.description}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/about">
                <ListItemIcon><InfoIcon /></ListItemIcon>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth={false} sx={{ flex: 1, py: 1.5 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
