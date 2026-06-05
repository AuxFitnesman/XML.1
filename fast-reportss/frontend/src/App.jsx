import { useState, useEffect, useRef } from 'react';
import CanvasArea from './components/CanvasArea';
import Toolbar from './components/Toolbar';
import ToolPanel from './components/ToolPanel';
import PropertiesPanel from './components/PropertiesPanel';
import TemplateSelector from './components/TemplateSelector';
import LayersPanel from './components/LayersPanel';
import AIGenerateModal from './components/AIGenerateModal';
import AuthModal from './components/AuthModal';
import MyProjectsModal from './components/MyProjectsModal';
import { useAuth } from './context/AuthContext';
import * as api from './api/client';
import { jsonToXML, xmlToJSON } from './utils/xmlMapper';
import { applyAiDesign } from './utils/applyAiDesign';
import {
  canvasToFlyer,
  flyerToFabricJson,
  getPageSizeFromFlyer,
  getOrientationFromFlyer,
} from './utils/fabricFlyerBridge';

const FONTS = [
  { name: 'Arial', family: 'Arial' },
  { name: 'Times New Roman', family: 'Times New Roman' },
  { name: 'Courier New', family: 'Courier New' },
  { name: 'Roboto', family: 'Roboto' },
  { name: 'Montserrat', family: 'Montserrat' },
];

export default function App() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [canvas, setCanvas] = useState(null);
  const [fabric, setFabric] = useState(null);
  const [pageSize, setPageSize] = useState({ width: 794, height: 1123 });
  const [orientation, setOrientation] = useState('portrait');
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Листовка');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const isUndoRedoInProgress = useRef(false);
  const [copiedObject, setCopiedObject] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleCanvasReady = (newCanvas, newFabric) => {
    window.fabricCanvas = newCanvas;
    setCanvas(newCanvas);
    setFabric(newFabric);
  };

  const handleOrientation = (newOr) => {
    setOrientation(newOr);
    setPageSize(prev => ({
      width: prev.height,
      height: prev.width
    }));
  };

  const handleBgChange = (color) => {
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.renderAll();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas || !fabric) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.scaleToWidth(300);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    if (!canvas || !fabric) return;
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          fabric.Image.fromURL(event.target.result, (img) => {
            img.set({ left: 150, top: 150 });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
          });
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleZoom = (direction) => {
    setZoom(prev => {
      const newZoom = direction > 0 ? prev + 0.1 : prev - 0.1;
      return Math.min(Math.max(newZoom, 0.2), 3);
    });
  };

  const handleSaveXML = () => {
    if (!canvas) return;
    const json = canvas.toJSON(['text', 'src', 'fontSize', 'fontWeight', 'fontStyle', 'fontFamily']);
    const xml = jsonToXML(json);
    const blob = new Blob([xml], { type: 'text/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flyer.xml';
    a.click();
  };

  const handleLoadXML = (xmlStr) => {
    try {
      const json = xmlToJSON(xmlStr);
      if (canvas) {
        canvas.clear();
        canvas.setBackgroundColor(json.background || '#ffffff', () => {}); 
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
        });
      }
    } catch (e) {
      alert('Ошибка XML: ' + e.message);
    }
  };

  const handleExport = (format) => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format, quality: 1 });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `flyer.${format === 'jpeg' ? 'jpg' : format}`;
    a.click();
  };

  const handleExportPDF = () => {
    if (!canvas) return;
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Листовка</title></head>
      <body><img src="${imgData}" /></body>
      <script>window.onload = () => { setTimeout(() => window.print(), 250); }</script>
      </html>
    `);
    printWindow.document.close();
  };

  const handleLoadTemplate = (templateData) => {
    if (!canvas) return;
    
    canvas.clear();
    canvas.setBackgroundColor(templateData.background || '#ffffff', () => {});
    canvas.loadFromJSON(templateData, () => {
      canvas.renderAll();
    });
    
    setShowTemplates(false);
  };

  const handleApplyAI = (design) => {
    if (!canvas || !fabric) {
      alert('Дождитесь загрузки холста');
      return;
    }
    applyAiDesign(canvas, fabric, design);
    setTimeout(() => saveToHistory(), 200);
  };

  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return false;
    }
    return true;
  };

  const loadFlyerOnCanvas = (flyer) => {
    if (!canvas) return;
    const json = flyerToFabricJson(flyer);
    setPageSize(getPageSizeFromFlyer(flyer));
    setOrientation(getOrientationFromFlyer(flyer));
    if (flyer.name) setProjectName(flyer.name);
    canvas.clear();
    canvas.setBackgroundColor(json.background || '#ffffff', () => {});
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      setTimeout(() => saveToHistory(), 300);
    });
  };

  const handleSaveToCloud = async () => {
    if (!requireAuth() || !canvas) return;
    const flyer = canvasToFlyer(canvas, {
      pageSize,
      orientation,
      name: projectName,
    });
    try {
      if (currentProjectId) {
        await api.updateProject(token, currentProjectId, flyer);
        alert('Проект сохранён на сервере');
      } else {
        const created = await api.createProject(token, { name: projectName, flyer });
        setCurrentProjectId(created.id);
        alert('Проект создан и сохранён');
      }
    } catch (e) {
      alert(e.message || 'Ошибка сохранения');
    }
  };

  const handleOpenProject = async (id) => {
    if (!token) return;
    try {
      const { flyer, project } = await api.getProject(token, id);
      setCurrentProjectId(project.id);
      setProjectName(project.name || flyer.name);
      loadFlyerOnCanvas(flyer);
      setShowProjects(false);
    } catch (e) {
      alert(e.message || 'Не удалось открыть проект');
    }
  };

  const handleNewCloudProject = async () => {
    if (!requireAuth()) return;
    const name = prompt('Название проекта:', 'Новая листовка');
    if (!name) return;
    try {
      const created = await api.createProject(token, {
        name,
        pageSize: pageSize.width === 794 ? 'A4' : 'custom',
        orientation,
      });
      setCurrentProjectId(created.id);
      setProjectName(name);
      const { flyer } = await api.getProject(token, created.id);
      loadFlyerOnCanvas(flyer);
      setShowProjects(false);
    } catch (e) {
      alert(e.message || 'Ошибка создания');
    }
  };

  const handleOpenProjects = () => {
    if (!requireAuth()) return;
    setShowProjects(true);
  };

  const saveToHistory = () => {
    if (!canvas || isUndoRedoInProgress.current) return;
    
    try {
      const json = canvas.toJSON(['text', 'src', 'fontSize', 'fontWeight', 'fontStyle', 'fontFamily', 'left', 'top', 'width', 'height', 'fill', 'opacity', 'name', 'locked']);
      
      setHistory(prev => {
        const newHistory = [...prev, json];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      
      setHistoryStep(prev => prev + 1);
    } catch (error) {
    }
  };

  const saveState = () => {
    if (!isUndoRedoInProgress.current) {
      setTimeout(() => saveToHistory(), 100);
    }
  };

  const handleUndo = () => {
    if (!canvas || historyStep <= 0 || history.length === 0) return;
    
    isUndoRedoInProgress.current = true;
    canvas.off('object:modified', saveState);
    canvas.off('object:added', saveState);
    canvas.off('object:removed', saveState);
    
    const newStep = historyStep - 1;
    const stateToLoad = history[newStep];
    
    if (!stateToLoad) {
      isUndoRedoInProgress.current = false;
      setTimeout(() => {
        canvas.on('object:modified', saveState);
        canvas.on('object:added', saveState);
        canvas.on('object:removed', saveState);
      }, 100);
      return;
    }
    
    canvas.loadFromJSON(stateToLoad, () => {
      canvas.renderAll();
      setHistoryStep(newStep);
      
      setTimeout(() => {
        canvas.on('object:modified', saveState);
        canvas.on('object:added', saveState);
        canvas.on('object:removed', saveState);
        isUndoRedoInProgress.current = false;
      }, 300);
    });
  };

  const handleRedo = () => {
    if (!canvas || historyStep >= history.length - 1) return;
    
    isUndoRedoInProgress.current = true;
    canvas.off('object:modified', saveState);
    canvas.off('object:added', saveState);
    canvas.off('object:removed', saveState);
    
    const newStep = historyStep + 1;
    const stateToLoad = history[newStep];
    
    if (!stateToLoad) {
      isUndoRedoInProgress.current = false;
      return;
    }
    
    canvas.loadFromJSON(stateToLoad, () => {
      canvas.renderAll();
      setHistoryStep(newStep);
      
      setTimeout(() => {
        canvas.on('object:modified', saveState);
        canvas.on('object:added', saveState);
        canvas.on('object:removed', saveState);
        isUndoRedoInProgress.current = false;
      }, 300);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyStep, canvas]);

  useEffect(() => {
    if (!canvas) return;

    canvas.on('object:modified', saveState);
    canvas.on('object:added', saveState);
    canvas.on('object:removed', saveState);

    setTimeout(() => saveToHistory(), 500);

    return () => {
      canvas.off('object:modified', saveState);
      canvas.off('object:added', saveState);
      canvas.off('object:removed', saveState);
    };
  }, [canvas]);

  const handleCopy = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.clone((cloned) => setCopiedObject(cloned));
    }
  };

  const handlePasteObject = () => {
    if (!canvas || !copiedObject) return;
    
    copiedObject.clone((clonedObj) => {
      clonedObj.set({
        left: clonedObj.left + 20,
        top: clonedObj.top + 20,
        evented: true,
      });
      
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        clonedObj.forEachObject((obj) => canvas.add(obj));
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      
      canvas.setActiveObject(clonedObj);
      canvas.renderAll();
    });
  };

  useEffect(() => {
    const handleCopyPaste = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleCopy();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handlePasteObject();
        }
      }
    };

    window.addEventListener('keydown', handleCopyPaste);
    return () => window.removeEventListener('keydown', handleCopyPaste);
  }, [canvas, copiedObject]);

  return (
    <div className="editor" onPaste={handlePaste} tabIndex="0">
      <Toolbar
        onSaveXML={handleSaveXML}
        onLoadXML={handleLoadXML}
        onExportPNG={() => handleExport('png')}
        onExportJPEG={() => handleExport('jpeg')}
        onExportSVG={() => handleExport('svg')}
        onExportPDF={handleExportPDF}
        onOpenTemplates={() => setShowTemplates(true)}
        onOpenAI={() => setShowAI(true)}
        user={user}
        onLogin={() => setShowAuth(true)}
        onLogout={logout}
        onOpenProjects={handleOpenProjects}
        onSaveToCloud={handleSaveToCloud}
        isAuthenticated={isAuthenticated}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onToggleTheme={toggleTheme}
        theme={theme}
        pageSize={pageSize}
        setPageSize={setPageSize}
        orientation={orientation}
        setOrientation={handleOrientation}
        onZoom={handleZoom}
        zoom={zoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
      />
      
      <div className="workspace">
        <ToolPanel 
          canvas={canvas}
          fabric={fabric}
          onBgChange={handleBgChange}
          showGrid={showGrid}
          onGridToggle={() => setShowGrid(!showGrid)}
          onImageUpload={handleImageUpload}
          onCopy={handleCopy}
          onPasteObject={handlePasteObject}
          hasCopiedObject={!!copiedObject}
        />
        
        <CanvasArea 
          onCanvasReady={handleCanvasReady}
          pageSize={pageSize}
          showGrid={showGrid}
          zoom={zoom}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <PropertiesPanel 
            canvas={canvas}
            fonts={FONTS}
          />
          <LayersPanel canvas={canvas} />
        </div>
      </div>

      {showTemplates && (
        <TemplateSelector 
          onSelect={handleLoadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showAI && (
        <AIGenerateModal
          pageSize={pageSize}
          onClose={() => setShowAI(false)}
          onApply={handleApplyAI}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showProjects && (
        <MyProjectsModal
          currentProjectId={currentProjectId}
          onClose={() => setShowProjects(false)}
          onOpenProject={handleOpenProject}
          onNewProject={handleNewCloudProject}
        />
      )}
    </div>
  );
}