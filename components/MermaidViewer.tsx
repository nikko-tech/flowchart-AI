
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidViewerProps {
  chartCode: string;
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ chartCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
        <button
          onClick={handleCopyCode}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          <i className="fas fa-copy"></i> コードをコピー
        </button>
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
