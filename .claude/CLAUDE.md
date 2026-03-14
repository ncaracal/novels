# 小說網站專案

## 專案結構

```
novels/
├── CLAUDE.md
├── build.js                  # 靜態網站產生器
├── docs/                     # GitHub Pages 輸出目錄
└── books/                    # 小說資料
    └── <novel-name>/
        ├── author.md         # 作者屬性
        ├── abstract.md       # 小說大綱
        ├── chapters.txt      # 章節目錄（每行一個章節標題）
        ├── ch001.txt          # 第一章（第一行為標題）
        ├── ch002.txt          # 第二章
        └── ...
```

## 規則

1. **語言**：所有內容使用正體中文
2. **禁止愛國元素**：任何作者、小說內容中不得包含愛國主義、民族主義、國家崇拜等元素
3. **章節檔案格式**：`ch001.txt` ~ `ch999.txt`，第一行為章節標題，其餘為正文
4. **chapters.txt 格式**：每行一個章節標題，行號對應章節編號
5. **更新流程**：修改 `books/` 下的內容後，執行 `node build.js` 重新產生 `docs/` 目錄
6. **部署**：推送到 GitHub 後，GitHub Pages 從 `docs/` 目錄提供靜態網站

## Agent 使用

- `.claude/agents/reader_a.md` 和 `.claude/agents/reader_b.md` 定義了兩位資深讀者的偏好
- 使用這些 Agent 來審稿、評論、推薦小說時，應依據各自的偏好給出不同觀點

## 常用指令

```bash
node build.js        # 重新建構網站到 docs/
```
