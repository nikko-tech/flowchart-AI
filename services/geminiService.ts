
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
あなたは業務効率化を支援するプロのビジネスアナリストおよびMermaid.jsのエキスパートです。
ユーザーが提供する「日本語の業務フロー説明」を解析し、論理的に正しいMermaid形式のフローチャート（graph TD）を生成してください。

以下のルールを厳守してください：
1. 出力は純粋なMermaid記法（graph TDから始まるコード）のみとしてください。
2. 日本語の自然な表現（「～する」「～を確認する」など）から正確にステップを抽出してください。
3. 条件分岐（「もし～なら」「～の場合」など）がある場合は、菱形ノード（{}）を使用して適切に分岐させてください。
4. 並行処理（「同時に」「一方で」など）がある場合は、可能な限り並行パスとして表現してください。
5. ノード名にはID（A, B, C...）を振り、ラベルは日本語で記述してください。
6. 見やすく整理されたレイアウトを心がけてください。
7. 変換不可能な入力の場合でも、エラーメッセージではなく、推測に基づいてシンプルなフローを作成してください。
8. コードブロック（\`\`\`mermaid）で囲まず、プレーンテキストとして出力してください。
`;

export const generateFlowchart = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // 低温で一貫性を保つ
      },
    });

    const result = response.text || '';
    
    // 不要なマークダウンバックティックスを取り除く
    return result.replace(/```mermaid\n?|```/g, '').trim();
  } catch (error) {
    console.error('Error generating flowchart:', error);
    throw new Error('フローチャートの生成に失敗しました。');
  }
};
