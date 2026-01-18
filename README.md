<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Flowchart AI Generator

自然言語で業務プロセスを入力すると、Mermaid形式のフローチャートを自動生成するWebアプリケーションです。

## セットアップ

**前提条件:** Node.js (v18以上推奨)

### 1. 依存関係のインストール
```bash
npm install
```

### 2. APIキーの設定

Gemini APIキーを取得して設定する必要があります。

1. [Google AI Studio](https://aistudio.google.com/) でAPIキーを取得
2. プロジェクトルートに `.env.local` ファイルを作成:

```bash
# env.exampleをコピーして編集
cp env.example .env.local
```

3. `.env.local` を開いて、APIキーを設定:
```
GEMINI_API_KEY=あなたのAPIキー
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

アプリは http://localhost:3000 で起動します。

## 使い方

1. テキストエリアに業務フローを自然な日本語で入力
2. 「図解を生成」ボタンをクリック
3. AIがMermaid形式のフローチャートを生成・表示

## 技術スタック

- React 19
- TypeScript
- Vite
- Mermaid.js
- Google Gemini API
- Tailwind CSS
