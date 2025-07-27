# Notes Repository

このリポジトリは記事の自動インデックス生成機能を持つノートリポジトリです。

## 自動生成ファイル

プッシュ時に以下のJSONファイルが自動生成されます：

### `index.json`
- 全記事の一覧情報
- 記事のメタデータ（タイトル、タグ、作成日、ID等）
- 記事の抜粋テキスト
- 公開日の新しい順にソート

### `tags.json`  
- 使用されているタグの一覧
- 各タグの使用回数
- 使用回数の多い順にソート

## 記事の書き方

`Article/` ディレクトリに以下の形式でMarkdownファイルを配置してください：

```markdown
---
tags: [Git, TECH, 駆け出しエンジニア応援]
createdAt: 2025-01-02 00:00
publishedAt: 2025-01-02
id: 7hltyl68nznj
---

# 記事タイトル

記事の内容...
```

### フロントマター（必須）
- `tags`: タグの配列
- `createdAt`: 作成日時
- `publishedAt`: 公開日時  
- `id`: 記事の一意ID

## GitHub Actions

`.github/workflows/generate-json.yml` により、main/masterブランチへのプッシュ時に自動実行されます：

1. Node.js環境のセットアップ
2. 依存関係のインストール（js-yaml）
3. `scripts/generate-json.js`の実行
4. 生成されたJSONファイルのコミット・プッシュ