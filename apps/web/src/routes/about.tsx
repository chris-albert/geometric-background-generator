import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import TriangleIcon from '@mui/icons-material/ChangeHistory';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          About Geometric Background Generator
        </Typography>
        <Typography paragraph>
          Create beautiful geometric triangle backgrounds with customizable parameters.
          Perfect for desktop wallpapers, website backgrounds, or design projects.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Features
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <TriangleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Triangle-based patterns"
              secondary="Generate seamless triangle meshes with adjustable size and uniformity"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ColorLensIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Color customization"
              secondary="Set base colors, accent colors, and color variation for unique looks"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TuneIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Fine-tuned controls"
              secondary="Adjust vignette strength, uniformity, accent frequency and more"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DownloadIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Export options"
              secondary="Export your backgrounds as PNG, JPEG, or SVG files"
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          How to Use
        </Typography>
        <Typography component="div">
          <ol>
            <li>Adjust the canvas dimensions to match your desired output size</li>
            <li>Set your base color and optionally enable an accent color</li>
            <li>Tweak the triangle size and uniformity for different patterns</li>
            <li>Adjust color variation and vignette for subtle effects</li>
            <li>Click "Regenerate" to create new random variations</li>
            <li>Export your final background in your preferred format</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
}
