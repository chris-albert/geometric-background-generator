import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import type { TerrainConfig } from '@geometric-bg/types';
import { defaultTerrainConfig } from '@geometric-bg/types';
import { TerrainCanvas, type TerrainCanvasHandle } from '../components/TerrainCanvas';
import { TerrainControlPanel } from '../components/TerrainControlPanel';
import { ExportPanel } from '../components/ExportPanel';

export const Route = createFileRoute('/terrain')({
  component: TerrainPage,
});

function TerrainPage() {
  const [config, setConfig] = useState<TerrainConfig>(defaultTerrainConfig);
  const [seed, setSeed] = useState<number>(Date.now());
  const canvasRef = useRef<TerrainCanvasHandle>(null);

  const handleConfigChange = useCallback((newConfig: Partial<TerrainConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const handleRegenerate = useCallback(() => {
    setSeed(Date.now());
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 72px)', display: 'flex', gap: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TerrainCanvas ref={canvasRef} config={config} seed={seed} />
      </Box>
      <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <TerrainControlPanel
            config={config}
            onChange={handleConfigChange}
            onRegenerate={handleRegenerate}
          />
        </Box>
        <Box sx={{ flexShrink: 0, mt: 1.5 }}>
          <ExportPanel
            canvasRef={canvasRef}
            width={config.width}
            height={config.height}
          />
        </Box>
      </Box>
    </Box>
  );
}
