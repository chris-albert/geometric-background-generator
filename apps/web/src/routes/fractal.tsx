import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import type { FractalConfig } from '@geometric-bg/types';
import { defaultFractalConfig } from '@geometric-bg/types';
import { FractalCanvas, type FractalCanvasHandle } from '../components/FractalCanvas';
import { FractalControlPanel } from '../components/FractalControlPanel';
import { ExportPanel } from '../components/ExportPanel';

export const Route = createFileRoute('/fractal')({
  component: FractalPage,
});

function FractalPage() {
  const [config, setConfig] = useState<FractalConfig>(defaultFractalConfig);
  const [seed, setSeed] = useState<number>(Date.now());
  const canvasRef = useRef<FractalCanvasHandle>(null);

  const handleConfigChange = useCallback((newConfig: Partial<FractalConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const handleRegenerate = useCallback(() => {
    setSeed(Date.now());
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 72px)', display: 'flex', gap: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <FractalCanvas ref={canvasRef} config={config} seed={seed} />
      </Box>
      <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <FractalControlPanel
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
