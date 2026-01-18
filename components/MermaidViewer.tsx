
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidViewerProps {
  chartCode: string;
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ chartCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, Noto Sans JP',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!chartCode) return;
      setError(null);
      try {
        const id = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chartCode);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid Render Error:', err);
        setError('図のレンダリングに失敗しました。Mermaid構文が不正な可能性があります。');
      }
    };

    renderChart();
  }, [chartCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chartCode);
    alert('Mermaidコードをクリップボードにコピーしました！');
  };

  const handleDownloadPng = async () => {
    if (!svg) return;
    
    setIsDownloading(true);
    
    try {
      // SVGをパースしてサイズを取得
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // SVGのサイズを取得（viewBox、width/height属性、style属性から）
      const scale = 2;
      const padding = 20; // 余白を追加
      
      let width: number;
      let height: number;
      
      // viewBoxからサイズを取得（最も正確）
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+|,/).map(Number);
        if (parts.length === 4) {
          width = parts[2];
          height = parts[3];
        } else {
          width = 800;
          height = 600;
        }
      } else {
        // width/height属性から取得（単位を除去）
        const widthAttr = svgElement.getAttribute('width') || svgElement.style.width || '800';
        const heightAttr = svgElement.getAttribute('height') || svgElement.style.height || '600';
        width = parseFloat(widthAttr.replace(/[^0-9.]/g, '')) || 800;
        height = parseFloat(heightAttr.replace(/[^0-9.]/g, '')) || 600;
      }

      // パディングを追加
      const finalWidth = (width + padding * 2) * scale;
      const finalHeight = (height + padding * 2) * scale;

      // SVGにxmlns属性を追加（必要な場合）
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // SVGのサイズを明示的に設定
      svgElement.setAttribute('width', String(width));
      svgElement.setAttribute('height', String(height));

      // フォントをシステムフォントに置換（外部リソースを使わない）
      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = `
        * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif; }
      `;
      svgElement.insertBefore(styleElement, svgElement.firstChild);

      // SVGをBase64 Data URLに変換（CORSを回避）
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const base64Data = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${base64Data}`;

      // Imageにロード
      const img = new Image();
      img.onload = () => {
        // Canvasに描画（背景透過）
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 背景を透明に（デフォルトで透明）
          ctx.clearRect(0, 0, finalWidth, finalHeight);
          // パディング分だけオフセットして描画
          ctx.scale(scale, scale);
          ctx.drawImage(img, padding, padding);

          // PNGとしてダウンロード
          canvas.toBlob((blob) => {
            if (blob) {
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `flowchart_${new Date().toISOString().slice(0, 10)}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(downloadUrl);
            }
            setIsDownloading(false);
          }, 'image/png');
        }
      };

      img.onerror = () => {
        console.error('Failed to load SVG as image');
        setIsDownloading(false);
        alert('画像の生成に失敗しました。');
      };

      img.src = dataUrl;
    } catch (err) {
      console.error('Download error:', err);
      setIsDownloading(false);
      alert('ダウンロードに失敗しました。');
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
        <i className="fas fa-exclamation-triangle mr-3"></i>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">フローチャート プレビュー</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            <i className="fas fa-copy"></i> コードをコピー
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={isDownloading || !svg}
            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              isDownloading || !svg
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
            }`}
          >
            {isDownloading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> 生成中...
              </>
            ) : (
              <>
                <i className="fas fa-download"></i> PNG保存
              </>
            )}
          </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="flex-1 p-6 overflow-auto flex justify-center items-start min-h-[400px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
};

export default MermaidViewer;
