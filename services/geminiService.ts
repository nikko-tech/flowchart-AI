
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
あなたは業務フロー分析の専門家です。
ユーザーから提供される業務手順（文章、箇条書き、または現場のメモ書き）を解析し、論理的なMermaid形式のフローチャート（graph TD）を生成してください。

【解析のルール】
1. 入力が「1-1 作業場所 内容」のような短縮形式であっても、それぞれのステップをノードとして抽出してください。
2. 「〜の場合」や条件分岐を示唆する記述（例：CP神戸の場合 10-1）があれば、必ず菱形ノード {} を使って分岐を表現してください。
3. 処理の順序（1-1 → 2-1 など）を番号から推測し、矢印でつなげてください。
4. 「終了」や「完了」という言葉があれば、フローの終端として扱ってください。

【Mermaid出力ルール】
1. 出力は純粋なMermaid記法（graph TDから始まるコード）のみとしてください。
2. 日本語ラベルを使用し、ノードIDは英数字（A, B, C...）にしてください。
3. コードブロック（\`\`\`mermaid）は含めず、プレーンテキストで出力してください。
4. 複雑な条件分岐も可能な限り網羅してください。
`;

export const generateFlowchart = async (text: string): Promise<string> => {
  // システムによって注入される process.env.API_KEY を直接使用
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error('API_KEYが検出できませんでした。Vercelの環境変数設定が完了しているか、再デプロイされているか確認してください。');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // 構造化データ抽出のためより厳格に
      },
    });

    const result = response.text || '';
    // もしAIがコードブロックを付けてしまった場合のガード
    return result.replace(/```mermaid\n?|```/g, '').trim();
  } catch (error) {
    console.error('Error generating flowchart:', error);
    throw new Error('フローチャートの生成中にエラーが発生しました。入力内容が長すぎるか、APIキーの権限を確認してください。');
  }
};
