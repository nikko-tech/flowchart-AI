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
   - 「作業現場」「保管場所」「ASANA」などの場所情報は、subgraphでグルーピングしてください。

【最重要：subgraph 構文ルール（これ以外禁止）】
- subgraph は必ず次のどちらかで書くこと（他の書き方は禁止）：
  1) subgraph SG_ASANA[ASANA]
  2) subgraph ASANA
- subgraph 行の中に「方向」「TD」「-->」や ["..."] のような余計な記述を絶対に入れない
- subgraph 行の直後は必ず改行し、次行からノードを書く（同一行にノード定義を続けない）
- subgraph は必ず end で閉じる
- 正しい例：
  subgraph SG_WORK[作業現場]
    n1[1-1 板の種類選定]
    n2[1-2 切断作業]
  end

【分岐前後でグルーピング分離】
- 判断ノード（菱形）は subgraph に含めない（subgraph の外に置く）
- 判断ノードの前後で subgraph を分ける
  - 同じ場所でも「作業現場_前」「作業現場_SS400側」「作業現場_CP側」などに分割してよい
- 1つの subgraph に判断の前後の処理を混在させない

【終了ノード禁止】
- END/終了ノードは作らない
- 最終処理ノードで矢印を止めて自然終了させる

【構文安全ルール】
- ノードIDは英数字とアンダースコアのみ使用（例：n1, n2, D_mat, SG_WORK）
- 判断ノードも必ずID付きで定義（例：D_mat{材質は？}）
- エッジは1行1本、半角スペース区切り
- 1行に複数の --> を書かない

【色分け（classDef + class）】
- 以下のスタイルを定義して適用すること：
  classDef decision fill:#FFE0B2,stroke:#FB8C00
  classDef work fill:#BBDEFB,stroke:#1976D2
  classDef info fill:#C8E6C9,stroke:#388E3C
  classDef item fill:#E1BEE7,stroke:#7B1FA2
- 判断ノードには class D_xxx decision
- 作業ノードには class n1,n2 work
- ASANA等の情報系には class n3 info
- 保管場所には class n4 item
- subgraph 背景色は style SG_xxx fill:#f5f5f5 で設定

【Mermaid出力ルール】
1. graph TD から始まるコードのみを出力してください。
2. ノードIDは英数字とアンダースコア（n1, n2, D_mat, SG_WORK等）、ラベルは日本語にしてください。
3. コードブロック（\`\`\`mermaid）は絶対に出力に含めないでください。
4. 出力の最後に classDef と class の定義を必ず含めてください。
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
