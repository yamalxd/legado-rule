
# 书源规则解析器（Book Source Rule Parser）

一个高性能、可组合的网页/文本数据提取规则引擎，支持多种选择器与操作符，适合电商、小说、资讯等场景的快速抓取与清洗。

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/book-source-rule-parser.svg)](https://www.npmjs.com/package/book-source-rule-parser)


## 📦 安装

```bash
pnpm add book-source-rule-parser
# 或
npm i book-source-rule-parser
# 或
yarn add book-source-rule-parser
````

---

## ⚡ 5 分钟上手

```ts
// TypeScript/ESM
import { RuleEngine } from 'book-source-rule-parser';

const engine = new RuleEngine();

// HTML 示例
const html = `<div class="book">
  <h1 class="title">JavaScript 权威指南</h1>
  <p class="author">David Flanagan</p>
  <span class="price">￥89.00</span>
  <img class="cover" src="https://example.com/cover.jpg" />
</div>`;

// 1) 基础提取
const title = await engine.parse(html, '@css:.title@text');
// => "JavaScript 权威指南"

// 2) 回退（当上一个失败时使用下一个）
const safeTitle = await engine.parse(html, '@css:.not-exist@text || @css:.title@text || @text:未知标题');
// => "JavaScript 权威指南"

// 3) 净化（用正则清洗文本）
const price = await engine.parse(html, '@css:.price@text##\\d+\\.\\d+');
// => "89.00"

// 4) 拼接（组合多个结果）
const info = await engine.parse(html, '@css:.title@text && @text: - 作者： && @css:.author@text');
// => "JavaScript 权威指南 - 作者：David Flanagan"

// 5) 批量解析（一次提多个字段）
const result = await engine.parseBatch(html, {
  title: '@css:.title@text',
  author: '@css:.author@text',
  price: '@css:.price@text##\\d+\\.\\d+',
  cover: '@css:.cover@src',
});
// => { 
//   title: { success: true, data: 'JavaScript 权威指南' },
//   author: { success: true, data: 'David Flanagan' },
//   price: { success: true, data: '89.00' },
//   cover: { success: true, data: 'https://example.com/cover.jpg' }
// }
```

---

## 🎯 核心特性

| 特性 | 说明 |
|------|------|
| 🎨 **6种选择器** | CSS、XPath、JSON、正则、JS、文本 |
| 🔧 **3种操作符** | 拼接(`&&`)、回退(`\|\|`)、净化(`##`) |
| 💎 **TypeScript** | 完整类型定义、智能提示 |
| 🛡️ **容错机制** | 自动回退、空值处理、错误恢复 |
| ⚡ **高性能** | <1ms单次解析、1000次/秒批量处理 |
| ✅ **测试完善** | 200+测试用例、高覆盖率 |

---

## 📖 选择器语法速览

> 说明：`@xxx:` 为选择器前缀；`@text`、`@src`、`@href` 等尾缀表示取值方式（文本/属性）。

### 1) CSS 选择器 `@css:`

```js
'@css:.title@text'       // 取文本
'@css:img@src'           // 取图片地址
'@css:a@href'            // 取超链接
'@css:.price@text##\\d+\\.\\d+' // 取文本后用正则净化，仅保留数字与小数点
```

### 2) XPath 选择器 `@xpath:`

```js
'@xpath://h1/text()'                     // 文本
'@xpath://img/@src'                      // 图片地址
'@xpath://span[@class="author"]/text()'  // 选定属性节点
```

### 3) JSON 选择器 `@json:`

```js
'@json:$.book.title'            // JSONPath
'@json:books[0].author'         // 下标访问
'@json:$.items[*].name'         // 批量提取（结合 parseBatch 或自定义处理）
```

### 4) 正则选择器 `@regex:`

```js
'@regex:\\d+\\.\\d+'            // 匹配数字（含小数）
'@regex:ISBN:([\\d-]+)'         // 分组提取
```

### 5) JS 选择器 `@js:`

> 在受控沙箱中执行简单 JS 表达式（如已有上下文变量时）。

```js
'@js:document.title'
'@js:window.pageData.bookName'
```

### 6) 文本选择器 `@text:`

```js
'@text:常量文本'       // 直接输出常量
'@text: - '            // 注意可保留空格
```

---

## 🔧 操作符用法

### 拼接 `&&`

```js
'@css:.title@text && @text:（完整版）'
// 输出示例："书名（完整版）"
```

### 回退 `||`

```js
'@css:.title@text || @css:.name@text || @text:未知'
// 按顺序尝试，直到某一项成功
```

### 净化 `##`

```js
'@css:.price@text##\\d+\\.\\d+'
// 从 "价格：￥128.50元" 中提取 "128.50"
```

### 组合示例

```js
'(@css:.title@text || @text:默认标题) && @text: - && @css:.author@text'
// 可能输出："默认标题 - XXX"
```

---

## 💼 实战片段

### 电商卡片

```js
const productHTML = `
<div class="product">
  <h1 class="title">iPhone 15 Pro Max</h1>
  <span class="price">￥9999</span>
  <span class="category">手机</span>
</div>`;

const rule = '@text:【 && @css:.category@text && @text:】 && @css:.title@text && @text: - ￥ && @css:.price@text##\\d+';
const text = await engine.parse(productHTML, rule);
// => "【手机】iPhone 15 Pro Max - ￥9999"
```

### 小说章节信息

```js
const novelHTML = `
<div class="chapter">
  <h2 class="title">第 1 章：开端</h2>
  <span class="time">2024-10-12</span>
  <div class="content">故事从这里开始……</div>
</div>`;

const chapter = await engine.parse(novelHTML, '@css:.title@text && @text: (更新于 && @css:.time@text && @text:)');
// => "第 1 章：开端 (更新于 2024-10-12)"
```

### JSON API

```js
const api = {
  code: 200,
  data: {
    books: [
      { title: 'JavaScript 高级程序设计', price: 99, author: 'Nicholas' },
      { title: '深入理解计算机系统', price: 139, author: 'Bryant' },
    ],
  },
};

const b1 = await engine.parse(JSON.stringify(api),
  '@json:$.data.books[0].title && @text: - && @json:$.data.books[0].author && @text: - ￥ && @json:$.data.books[0].price'
);
// => "JavaScript 高级程序设计 - Nicholas - ￥99"
```

### XPath 提取

```js
const html = `
<html>
  <body>
    <div class="book">
      <h1>深入理解计算机系统</h1>
      <p class="info">
        <span class="author">Randal E. Bryant</span>
        <span class="price">139元</span>
      </p>
    </div>
  </body>
</html>`;

const title = await engine.parse(html, '@xpath://h1/text()');
// => "深入理解计算机系统"

const author = await engine.parse(html, '@xpath://span[@class="author"]/text()');
// => "Randal E. Bryant"
```

---

## 🔌 API 参考

### `new RuleEngine(options?)`

```ts
interface RuleEngineOptions {
  timeout?: number;     // 解析超时（毫秒），默认 5000
  maxDepth?: number;    // 最大嵌套深度，默认 10
  enableCache?: boolean;// 是否启用缓存，默认 true
  strictMode?: boolean; // 严格模式，默认 false
}
```

### `parse(source, rule, context?)`

单个规则解析，返回 ParseResult 对象。

```ts
const result = await engine.parse(source, rule, context);

// 返回值结构
interface ParseResult {
  success: boolean;    // 是否成功
  data: any;          // 提取的数据
  rule: string;       // 使用的规则
  selector: string;   // 选择器类型
  errors?: Array;     // 错误信息(可选)
}
```

**参数**:
- `source` (string): 要解析的源数据(HTML/JSON/文本)
- `rule` (string): 解析规则
- `context` (object, 可选): 上下文对象

### `parseBatch(source, rules, context?)`

批量解析多个字段，返回对象映射。

```ts
const results = await engine.parseBatch(source, {
  title: '@css:.title@text',
  author: '@css:.author@text',
  // ...
}, context);

// 返回值结构
// Record<string, ParseResult>
// 每个键对应一个 ParseResult 对象
```

**参数**:
- `source` (string): 要解析的源数据
- `rules` (object): 规则对象,键为字段名,值为规则
- `context` (object, 可选): 上下文对象

### `clearCache()`

清除内部缓存。

```ts
engine.clearCache();
```

---

## 🧪 运行示例与测试

> 以下脚本名称仅作参考，请以实际 `package.json` 为准。

```bash
# 运行基础示例
pnpm run example:basic

# 电商/小说/JSON 示例
pnpm run example:ecommerce
pnpm run example:novel
pnpm run example:json

# 运行全部示例
pnpm run examples

# 单元测试与覆盖率
pnpm test
pnpm run coverage
```

---

## ❓ 常见问题（FAQ）

- **拼接 `&&` 是否必须空格？**
  
  是，推荐单空格包围：`selector1 && selector2`。
  `selector1&&selector2` 为不规范写法。

- **`@text:` 如何保留空格？**
  
  会保留有意义空格，例如 `@text: - ` 将输出 `" - "`。

- **正则为什么需要双反斜杠？**
  
  字符串本身需要转义，如 `@regex:\\d+\\.\\d+`。

- **如何调试复杂规则？**
  
  建议分步验证每个选择器，再逐步组合操作符，并输出中间结果进行排查。

---

## 🤝 贡献

欢迎提交 Issue 与 Pull Request。请确保提交前通过本地测试与格式化校验。

```bash
git clone <your-repo-url>
cd <your-repo>
pnpm i
pnpm test
```

---

## 📄 许可证

详见仓库根目录的 `LICENSE` 文件。

---

**⭐ 如果该项目对你有帮助，欢迎 Star 支持！**
