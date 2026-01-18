
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

      // SVGのサイズを取得（スケールアップで高解像度に）
      const scale = 2;
      const width = parseFloat(svgElement.getAttribute('width') || '800') * scale;
      const height = parseFloat(svgElement.getAttribute('height') || '600') * scale;

      // SVGにxmlns属性を追加（必要な場合）
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      // スタイルを埋め込む（フォント対応）
      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { font-family: 'Inter', 'Noto Sans JP', sans-serif; }
      `;
      svgElement.insertBefore(styleElement, svgElement.firstChild);

      // SVGをBlobに変換
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Imageにロード
      const img = new Image();
      img.onload = () => {
        // Canvasに描画（背景透過）
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 背景を透明に（デフォルトで透明）
          ctx.clearRect(0, 0, width, height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

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
        
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        console.error('Failed to load SVG as image');
        setIsDownloading(false);
        alert('画像の生成に失敗しました。');
      };

      img.src = url;
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
