
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
あなたは業務フロー分析の高度な専門家です。
ユーザーから提供される業務手順メモ（番号、記号、現場用語が含まれる断片的な記述）を解析し、論理的なMermaid形式のフローチャート（graph TD）を生成してください。

【解析のルール】
1. 「1-1」「3-1」などの番号はステップの順序やIDとして扱ってください。
2. 「〜の場合」「〜なら」といった記述や、複数の選択肢（例：CP神戸、CP中山、CP東鉄）が示されている場合は、必ず菱形ノード { } を使って条件分岐を表現してください。
3. 「終了」「現品」「完了」などの言葉は、フローの終端ノードとして適切に配置してください。
4. 現場のメモ書きから、暗黙的な前後のつながりを論理的に推論して矢印でつなげてください。

【Mermaid出力ルール】
1. 出力は純粋なMermaid記法（graph TDから始まるコード）のみとしてください。
2. ノードのテキストには日本語を使用し、IDは英数字（A, B, C...）にしてください。
3. コードブロック（\`\`\`mermaid）は含めず、プレーンテキストで出力してください。
`;

export const generateFlowchart = async (text: string): Promise<string> => {
  // 環境変数からAPIキーを取得
  // Vercelなどの環境でブラウザに注入される process.env.API_KEY を優先
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error('API_KEYが見つかりません。Vercelの環境変数で「Name」を「API_KEY」として設定し、保存後に必ず「Redeploy」を行ってください。');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // 構造化データのため低めの温度設定
      },
    });

    const result = response.text || '';
    // 不要なコードブロック記法を除去
    return result.replace(/```mermaid\n?|```/g, '').trim();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error('設定されたAPIキーが無効です。Google AI Studioで新しいキーを作成し、Vercelに設定し直してください。');
    }
    throw new Error('AIによる解析に失敗しました。VercelのEnvironment VariablesでAPI_KEYが正しく設定されているか確認し、再デプロイしてください。');
  }
};
