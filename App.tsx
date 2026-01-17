
import React, { useState } from 'react';
import { generateFlowchart } from './services/geminiService';
import { AppStatus } from './types';
import MermaidViewer from './components/MermaidViewer';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setStatus(AppStatus.LOADING);
    setErrorMsg('');
    
    try {
      const code = await generateFlowchart(inputText);
      setMermaidCode(code);
      setStatus(AppStatus.SUCCESS);
    } catch (error: any) {
      setErrorMsg(error.message || '予期せぬエラーが発生しました。');
      setStatus(AppStatus.ERROR);
    }
  };

  const examplePrompt = "顧客から見積依頼が来る。在庫を確認し、在庫があれば見積書を作成して送信する。在庫がなければメーカーに納期を照会し、顧客に納期を連絡する。顧客が承諾すれば注文を確定し、承諾しなければ案件をクローズする。";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <i className="fas fa-project-diagram text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Flowchart AI</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Business Efficiency Tool</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a 
              href="https://mermaid.js.org/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-blue-600 font-medium"
            >
              Mermaid.jsについて
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <i className="fas fa-pen-nib text-blue-500"></i>
                業務フローを記述
              </label>
              <p className="text-xs text-slate-500">自然な日本語で手順を説明してください。AIが自動的に論理構造を解析します。</p>
            </div>
            <button
              onClick={() => setInputText(examplePrompt)}
              className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors self-start"
            >
              例を入力
            </button>
          </div>

          <div className="relative group">
            <textarea
              className="w-full h-48 p-4 text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none shadow-sm"
              placeholder="例：顧客から問い合わせが来たら、まず内容を確認する。技術的な質問であれば専門部署へ回し、そうでなければ直接回答する。"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">
                {inputText.length} chars
              </span>
              <button
                onClick={handleGenerate}
                disabled={status === AppStatus.LOADING || !inputText.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md ${
                  status === AppStatus.LOADING || !inputText.trim()
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'
                }`}
              >
                {status === AppStatus.LOADING ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    解析中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic"></i>
                    図解を生成
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Display Error if any */}
        {status === AppStatus.ERROR && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <i className="fas fa-circle-exclamation mt-1"></i>
            <div>
              <p className="font-bold text-sm">エラーが発生しました</p>
              <p className="text-xs">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Output Section */}
        {status === AppStatus.SUCCESS && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2">
                <i className="fas fa-chart-line text-green-500"></i>
                <h2 className="text-sm font-semibold text-slate-700">生成されたフローチャート</h2>
             </div>
             <MermaidViewer chartCode={mermaidCode} />
             
             <div className="bg-blue-50 p-4 rounded-xl">
               <div className="flex items-center gap-2 mb-2">
                 <i className="fas fa-lightbulb text-blue-500 text-xs"></i>
                 <h3 className="text-xs font-bold text-blue-800">ヒント</h3>
               </div>
               <p className="text-xs text-blue-700 leading-relaxed">
                 図が複雑すぎる場合は、入力をもう少し細かく箇条書きのように記述してみてください。
                 条件分岐には「もし〜の場合」「〜なら」などのキーワードを使うとより正確に解析されます。
               </p>
             </div>
          </section>
        )}

        {/* Empty State */}
        {status === AppStatus.IDLE && (
          <section className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <i className="fas fa-diagram-project text-3xl"></i>
            </div>
            <div>
              <h3 className="text-slate-600 font-bold">まだフローが生成されていません</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">上の入力エリアに業務内容を記入して「図解を生成」ボタンを押してください。</p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <i className="fas fa-project-diagram text-white text-sm"></i>
            </div>
            <span className="text-white font-bold text-sm tracking-tight">Flowchart AI Generator</span>
          </div>
          <div className="text-slate-400 text-xs font-medium">
            © 2024 Business Efficiency Solutions. Powered by Gemini.
          </div>
          <div className="flex gap-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <i className="fab fa-github text-lg"></i>
            </button>
            <button className="text-slate-400 hover:text-white transition-colors">
              <i className="fab fa-twitter text-lg"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
