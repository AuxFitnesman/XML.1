import { useEffect, useRef } from 'react';
import * as fabricNS from 'fabric';

const fabric = fabricNS.fabric || fabricNS;

export default function CanvasArea({ onCanvasReady, pageSize, showGrid, zoom }) {
  const canvasRef = useRef(null);
  const fabricInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: pageSize.width,
        height: pageSize.height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });

      fabricInstanceRef.current = canvas;

      if (onCanvasReady) {
        onCanvasReady(canvas, fabric);
      }

      canvas.renderAll();

      return () => {
        canvas.dispose();
      };
    } catch (error) {
      console.error('Fabric error:', error);
    }
  }, []);

  useEffect(() => {
    if (fabricInstanceRef.current) {
      fabricInstanceRef.current.setDimensions({
        width: pageSize.width,
        height: pageSize.height
      });
      fabricInstanceRef.current.renderAll();
    }
  }, [pageSize]);

  const gridStyle = showGrid ? {
    backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  } : {};

  return (
    <div className="canvas-wrap">
      {/* Обёртка для CSS-зума */}
      <div 
        className="canvas-zoom-wrapper" 
        style={{ transform: `scale(${zoom})` }}
      >
        <canvas ref={canvasRef} />
        {showGrid && (
          <div style={{
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: pageSize.width, 
            height: pageSize.height,
            pointerEvents: 'none', 
            ...gridStyle,
            zIndex: 1
          }} />
        )}
      </div>
    </div>
  );
}