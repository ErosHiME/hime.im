# 组件使用说明

## 文件结构

```
hime.im/
├── components/
│   ├── header.html          # Header组件模板（供参考）
│   ├── footer.html          # Footer组件模板（供参考）
│   ├── page-template.html   # 新页面模板（推荐使用）
│   └── README.md            # 本文件
├── css/
│   ├── base.css             # 基础样式（包含header和footer样式）
│   └── layout.css           # 布局样式
├── js/
│   └── components.js        # 组件加载器（可选使用）
└── tools/
    └── ip-binding.html      # 示例工具页面
```

## 创建新工具页面的步骤

### 方法一：复制模板（推荐）

1. 复制 `components/page-template.html` 到目标位置
2. 修改 `<title>` 和 `<meta name="description">`
3. 更新导航栏中的 `active` 类，标记当前页面
4. 在 `<main>` 中添加页面内容
5. 根据需要添加页面特定的 CSS 和 JS 文件

### 方法二：手动创建

在新页面的 `<body>` 中直接包含以下结构：

#### Header（复制到子目录页面时调整路径）

```html
<header class="header">
    <nav class="navbar">
        <div class="container navbar-container">
            <a href="../index.html" class="nav-brand">
                <span class="brand-icon">&#9889;</span>
                <span class="brand-name">HIME Tools</span>
            </a>
            <ul class="nav-menu">
                <li class="nav-item">
                    <a href="../index.html" class="nav-link">首页</a>
                </li>
                <li class="nav-item">
                    <a href="./your-page.html" class="nav-link active">你的页面</a>
                </li>
            </ul>
        </div>
    </nav>
</header>
```

#### Footer

```html
<footer class="footer">
    <div class="container footer-container">
        <div class="footer-brand">
            <span class="brand-icon">&#9889;</span>
            <span class="brand-name">HIME Tools</span>
        </div>
        <p class="footer-text">&copy; 2026 HIME Tools. All rights reserved.</p>
    </div>
</footer>
```

## 路径规则

- **根目录页面**（如 `index.html`）：使用 `./` 前缀
- **子目录页面**（如 `tools/xxx.html`）：使用 `../` 前缀返回上级

## 导航激活状态

在当前页面对应的导航链接上添加 `active` 类：

```html
<a href="./your-page.html" class="nav-link active">你的页面</a>
```

## 样式说明

Header 和 Footer 的样式已包含在 `css/base.css` 中，无需额外引入。
