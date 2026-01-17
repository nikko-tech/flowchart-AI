
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
  // Vercelで設定されている環境変数名を柔軟に取得
  const apiKey = process.env.API_KEY || (process.env as any).GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('API_KEYが検出できませんでした。Vercelの環境変数設定を確認し、変更後は必ず「Redeploy」を行ってください。');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    const result = response.text || '';
    return result.replace(/```mermaid\n?|```/g, '').trim();
  } catch (error: any) {
    console.error('Error generating flowchart:', error);
    // APIキーの不備に関する具体的なエラーメッセージ
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403')) {
      throw new Error('APIキーが無効です。Google AI Studioで正しいキーが作成されているか確認してください。');
    }
    throw new Error('フローチャートの生成中にエラーが発生しました。時間を置いて再度お試しください。');
  }
};
