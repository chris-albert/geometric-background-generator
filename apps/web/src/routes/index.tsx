import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import type { BackgroundConfig } from '@geometric-bg/types';
import { defaultConfig } from '@geometric-bg/types';
import { GeometricCanvas, type GeometricCanvasHandle } from '../components/GeometricCanvas';
import { ControlPanel } from '../components/ControlPanel';
import { ExportPanel } from '../components/ExportPanel';

export const Route = createFileRoute('/')({
  component: GeneratorPage,
});

function GeneratorPage() {
  const [config, setConfig] = useState<BackgroundConfig>(defaultConfig);
  const [seed, setSeed] = useState<number>(Date.now());
  const canvasRef = useRef<GeometricCanvasHandle>(null);

  const handleConfigChange = useCallback((newConfig: Partial<BackgroundConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const handleRegenerate = useCallback(() => {
    setSeed(Date.now());
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <GeometricCanvas ref={canvasRef} config={config} seed={seed} />
      </Box>
      <Box sx={{ width: 320, flexShrink: 0, overflow: 'auto' }}>
        <ControlPanel
          config={config}
          onChange={handleConfigChange}
          onRegenerate={handleRegenerate}
        />
        <ExportPanel
          canvasRef={canvasRef}
          width={config.width}
          height={config.height}
        />
      </Box>
    </Box>
  );
}
