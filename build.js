#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, 'books');
const DOCS_DIR = path.join(__dirname, 'docs');

// Clean and recreate docs dir
if (fs.existsSync(DOCS_DIR)) {
  fs.rmSync(DOCS_DIR, { recursive: true });
}
fs.mkdirSync(DOCS_DIR, { recursive: true });

// Read all books
function readBooks() {
  const books = [];
  const bookDirs = fs.readdirSync(BOOKS_DIR).filter(d =>
    fs.statSync(path.join(BOOKS_DIR, d)).isDirectory()
  );

  for (const dir of bookDirs) {
    const bookPath = path.join(BOOKS_DIR, dir);
    const book = { id: dir, chapters: [] };

    // Read author.md
    const authorFile = path.join(bookPath, 'author.md');
    if (fs.existsSync(authorFile)) {
      book.author = fs.readFileSync(authorFile, 'utf-8');
    }

    // Read abstract.md
    const abstractFile = path.join(bookPath, 'abstract.md');
    if (fs.existsSync(abstractFile)) {
      book.abstract = fs.readFileSync(abstractFile, 'utf-8');
    }

    // Read chapters.txt
    const chaptersFile = path.join(bookPath, 'chapters.txt');
    if (fs.existsSync(chaptersFile)) {
      book.chapterTitles = fs.readFileSync(chaptersFile, 'utf-8')
        .split('\n').filter(l => l.trim());
    }

    // Read chapter files
    const chapterFiles = fs.readdirSync(bookPath)
      .filter(f => /^ch\d+\.txt$/.test(f))
      .sort();

    for (const cf of chapterFiles) {
      const content = fs.readFileSync(path.join(bookPath, cf), 'utf-8');
      const lines = content.split('\n');
      const title = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();
      book.chapters.push({ file: cf, title, body });
    }

    // Extract book title from abstract (first # heading)
    const titleMatch = book.abstract?.match(/^#\s+(.+)$/m);
    book.title = titleMatch ? titleMatch[1] : dir;

    // Extract author name
    const authorMatch = book.author?.match(/\*\*筆名\*\*[：:]\s*(.+)/);
    book.authorName = authorMatch ? authorMatch[1] : '佚名';

    books.push(book);
  }

  return books;
}

// Simple markdown to HTML (covers our use cases)
function md2html(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>')
    .replace(/<p><(h[1-3]|ul|li)/g, '<$1')
    .replace(/<\/(h[1-3]|ul|li)><\/p>/g, '</$1>');
}

// Escape text for HTML content
function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Convert plain text paragraphs to HTML
function text2html(text) {
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

const CSS = `
:root {
  --bg: #faf8f5;
  --text: #2c2c2c;
  --accent: #8b6914;
  --card-bg: #fff;
  --border: #e8e0d4;
  --shadow: rgba(0,0,0,0.06);
  --code-bg: #f5f0e8;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e0dcd6;
    --accent: #d4a530;
    --card-bg: #252525;
    --border: #3a3a3a;
    --shadow: rgba(0,0,0,0.3);
    --code-bg: #2a2520;
  }
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: "Noto Serif TC", "Source Han Serif TC", "PMingLiU", serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.9;
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

header {
  text-align: center;
  padding: 3rem 0 2rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--accent);
}

header p {
  margin-top: 0.5rem;
  font-size: 0.95rem;
  opacity: 0.7;
}

.book-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.8rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow);
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-2px);
}

.book-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.3rem;
}

.book-card h2 a {
  color: var(--text);
  text-decoration: none;
}

.book-card h2 a:hover {
  color: var(--accent);
}

.book-card .meta {
  font-size: 0.85rem;
  opacity: 0.6;
  margin-bottom: 1rem;
}

.book-card .abstract-preview {
  font-size: 0.95rem;
  line-height: 1.8;
}

/* Book page */
.book-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.book-header h1 {
  font-size: 2rem;
  color: var(--accent);
}

.book-header .author-name {
  font-size: 1rem;
  opacity: 0.7;
  margin-top: 0.3rem;
}

.section {
  margin-bottom: 2.5rem;
}

.section h2 {
  font-size: 1.3rem;
  color: var(--accent);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.toc-list {
  list-style: none;
  counter-reset: chapter;
}

.toc-list li {
  counter-increment: chapter;
  margin-bottom: 0.5rem;
}

.toc-list li a {
  color: var(--text);
  text-decoration: none;
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  transition: background 0.15s;
}

.toc-list li a:hover {
  background: var(--code-bg);
  color: var(--accent);
}

.toc-list li a::before {
  content: "第" counter(chapter, cjk-ideographic) "章";
  font-size: 0.85rem;
  opacity: 0.5;
  flex-shrink: 0;
}

/* Chapter page */
.chapter-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
}

.chapter-header .book-title {
  font-size: 0.9rem;
  opacity: 0.5;
}

.chapter-header h1 {
  font-size: 1.8rem;
  margin-top: 0.5rem;
}

.chapter-header .chapter-num {
  font-size: 0.85rem;
  color: var(--accent);
  margin-top: 0.3rem;
}

.chapter-body {
  font-size: 1.05rem;
  text-align: justify;
}

.chapter-body p {
  margin-bottom: 1.2rem;
  text-indent: 2em;
}

.chapter-body p:first-child {
  text-indent: 0;
}

.chapter-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.chapter-nav a {
  color: var(--accent);
  text-decoration: none;
  font-size: 0.95rem;
}

.chapter-nav a:hover {
  text-decoration: underline;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: var(--accent);
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

.author-section {
  background: var(--code-bg);
  border-radius: 8px;
  padding: 1.5rem;
}

.author-section h1, .author-section h2, .author-section h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
}

.author-section ul {
  list-style: none;
  padding-left: 0;
}

.author-section li {
  margin-bottom: 0.4rem;
  padding-left: 0;
}

footer {
  text-align: center;
  padding: 2rem 0;
  font-size: 0.8rem;
  opacity: 0.4;
  border-top: 1px solid var(--border);
  margin-top: 3rem;
}
`;

function htmlPage(title, body, extraHead = '') {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>${CSS}</style>
${extraHead}
</head>
<body>
<div class="container">
${body}
</div>
<footer><p>小說閱讀站</p></footer>
</body>
</html>`;
}

function buildIndex(books) {
  let cards = '';
  for (const book of books) {
    // Extract first paragraph of abstract for preview
    const abstractLines = (book.abstract || '').split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-'));
    const preview = abstractLines[0] || '';
    cards += `
    <div class="book-card">
      <h2><a href="${book.id}/">${esc(book.title)}</a></h2>
      <div class="meta">作者：${esc(book.authorName)} ｜ ${book.chapters.length} 章</div>
      <div class="abstract-preview">${esc(preview)}</div>
    </div>`;
  }

  const body = `
  <header>
    <h1>小說閱讀站</h1>
    <p>收錄原創小說，以正體中文書寫</p>
  </header>
  ${cards}`;

  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), htmlPage('小說閱讀站', body));
}

function buildBookPage(book) {
  const bookDir = path.join(DOCS_DIR, book.id);
  fs.mkdirSync(bookDir, { recursive: true });

  // TOC
  let tocItems = '';
  book.chapters.forEach((ch, i) => {
    tocItems += `<li><a href="ch${String(i + 1).padStart(3, '0')}.html">${esc(ch.title)}</a></li>\n`;
  });

  // Abstract section
  const abstractHtml = md2html(
    (book.abstract || '').replace(/^#\s+.+\n*/m, '') // remove title line
  );

  // Author section
  const authorHtml = md2html(book.author || '');

  const body = `
  <a href="../" class="back-link">&larr; 返回書單</a>
  <div class="book-header">
    <h1>${esc(book.title)}</h1>
    <div class="author-name">作者：${esc(book.authorName)}</div>
  </div>

  <div class="section">
    <h2>大綱</h2>
    ${abstractHtml}
  </div>

  <div class="section">
    <h2>章節目錄</h2>
    <ol class="toc-list">
      ${tocItems}
    </ol>
  </div>

  <div class="section">
    <h2>關於作者</h2>
    <div class="author-section">
      ${authorHtml}
    </div>
  </div>`;

  fs.writeFileSync(path.join(bookDir, 'index.html'), htmlPage(book.title, body));

  // Chapter pages
  book.chapters.forEach((ch, i) => {
    const chNum = String(i + 1).padStart(3, '0');
    const prevLink = i > 0
      ? `<a href="ch${String(i).padStart(3, '0')}.html">&larr; 上一章</a>`
      : `<a href="./">&larr; 目錄</a>`;
    const nextLink = i < book.chapters.length - 1
      ? `<a href="ch${String(i + 2).padStart(3, '0')}.html">下一章 &rarr;</a>`
      : `<a href="./">回到目錄 &rarr;</a>`;

    const chBody = `
    <a href="./" class="back-link">&larr; 返回目錄</a>
    <div class="chapter-header">
      <div class="book-title">${esc(book.title)}</div>
      <h1>${esc(ch.title)}</h1>
      <div class="chapter-num">第${i + 1}章</div>
    </div>
    <div class="chapter-body">
      ${text2html(ch.body)}
    </div>
    <div class="chapter-nav">
      ${prevLink}
      ${nextLink}
    </div>`;

    fs.writeFileSync(
      path.join(bookDir, `ch${chNum}.html`),
      htmlPage(`${ch.title} - ${book.title}`, chBody)
    );
  });
}

// Main
console.log('正在建構網站...');
const books = readBooks();
console.log(`找到 ${books.length} 本小說`);

buildIndex(books);
for (const book of books) {
  buildBookPage(book);
  console.log(`  ✓ ${book.title}（${book.chapters.length} 章）`);
}

console.log(`\n建構完成！輸出至 ${DOCS_DIR}`);
