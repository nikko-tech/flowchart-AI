import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
あなたは製造・物流現場の業務プロセスを可視化する専門家です。
ユーザーが入力する「番号、場所、条件、結果」が混ざった複雑な業務メモを解析し、Mermaid形式のフローチャート（graph TD）を作成してください。

【解析のルール】
1. 番号（1-1, 3-1, 10-1など）の扱い：
   - これらは各作業ステップのIDです。ラベルには番号と作業内容（例：「1-1 作業現場：板の種類選定」）を含めてください。
2. 条件分岐の抽出：
   - 「〜の場合」「〜なら」「（判断）」という言葉を敏感に察知してください。
   - 例：「CP神戸の場合10-1」→ 菱形ノード { } を作り、条件「|CP神戸|」で10-1のノードへ繋げてください。
   - 例：「残材切断をする場合1-1、しない場合1-2」→ 2つの分岐ルートを作成してください。
3. 接続の推論：
   - 文中に現れる番号の順序や「終了」「現品」といったキーワードから、論理的な矢印（-->）を引いてください。
4. 場所の記載：
   - 「作業現場」「保管場所」「ASANA」などの場所情報は、ステップの内容に含めてください。

【Mermaid出力ルール】
1. graph TD から始まるコードのみを出力してください。
2. ノードIDは英数字（n1, n2, n3...）、ラベルは日本語にしてください。
3. コードブロック（\`\`\`mermaid）は絶対に出力に含めないでください。
`;

export const generateFlowchart = async (text: string): Promise<string> => {
  // ガイドラインに従い、process.env.API_KEY を直接使用します
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error('API_KEYが検出できません。Vercelのプロジェクト設定で環境変数名が「API_KEY」になっていることを確認し、必ず「Redeploy（再デプロイ）」を実行してください。');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // 論理構造を維持するため低めに設定
      },
    });

    const result = response.text || '';
    // 不要な装飾を除去してMermaidコードのみを抽出
    return result.replace(/```mermaid\n?|```/g, '').trim();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.status === 403 || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('APIキーが無効です。Google AI Studioで作成した有効なキーがVercelに設定されているか確認してください。');
    }
    throw new Error('AIによる図解の生成に失敗しました。入力を少し整理するか、時間を置いて再度お試しください。');
  }
};
