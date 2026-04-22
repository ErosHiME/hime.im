# HIME Tools - 开发者在线工具箱

一个部署在 Cloudflare Pages 的静态网站，提供实用的网络配置与开发工具。

## 📁 项目结构

```
hime.im/
├── index.html                  # 主页导航页面
├── components/                 # 组件目录
│   ├── header.html            # Header组件参考模板
│   ├── footer.html            # Footer组件参考模板
│   ├── page-template.html     # 新页面完整模板（推荐使用）
│   └── README.md              # 组件使用说明
├── css/
│   ├── base.css               # 基础样式（包含Header、Footer等全局样式）
│   ├── layout.css             # 布局样式
│   └── ip-binding.css         # IP绑定工具专用样式
├── js/
│   ├── components.js          # 组件加载器（可选使用）
│   └── ip-binding.js          # IP绑定工具功能
└── tools/
    └── ip-binding.html        # IP批量绑定生成器
```

## 🛠️ 已包含的工具

### IP批量绑定生成器 (IP Binding Generator)

Windows CMD/PowerShell 及 Linux 系统网络配置命令生成器。

**主要功能：**
- 支持 CIDR 格式输入（如 `192.168.1.0/24`）
- 支持 IP 范围格式（如 `192.168.1.2-254`）
- 支持多行批量处理
- 自动生成 Windows CMD、PowerShell、CentOS 7、Debian 12 配置命令
- 网关位置可配置（首IP/尾IP）
- 子网掩码速查表
- 详细子网信息计算

**访问路径:** `/tools/ip-binding.html`

## 🚀 部署到 Cloudflare Pages

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接到你的 GitHub 仓库
4. 构建配置：
   - 构建命令：留空（静态网站无需构建）
   - 构建输出目录：`/` （根目录）
5. 点击部署

## 📝 添加新工具

### 快速开始（推荐）

1. 复制 `components/page-template.html` 到 `tools/` 目录
2. 修改页面标题、描述和导航激活状态
3. 在 `<main>` 中添加页面内容
4. 在 `index.html` 中添加导航卡片

### 详细步骤

**1. 创建工具页面**

复制模板文件并自定义：
```bash
cp components/page-template.html tools/your-tool.html
```

**2. 更新导航栏**

在 `your-tool.html` 中设置当前页面为激活状态：
```html
<a href="./your-tool.html" class="nav-link active">工具名称</a>
```

**3. 添加主页导航卡片**

在 `index.html` 的 `.tools-grid` 中添加：
```html
<a href="tools/your-tool.html" class="tool-card">
    <div class="tool-icon" role="img" aria-label="图标">🔧</div>
    <h3 class="tool-title">工具名称</h3>
    <p class="tool-desc">工具简短描述</p>
</a>
```

**4. 添加专用样式（可选）**

如需额外样式，在 `css/` 目录创建新文件，并在页面中引入：
```html
<link rel="stylesheet" href="../css/your-tool.css">
```

**5. 添加脚本逻辑（可选）**

在 `js/` 目录创建脚本文件，并在页面底部引入：
```html
<script src="../js/your-tool.js" defer></script>
```

## 🎨 设计特点

- **简约现代**：清爽的白色主题，统一的视觉风格
- **响应式设计**：完美适配桌面和移动设备
- **固定导航**：Header 始终可见，方便页面切换
- **模块化架构**：每个工具独立维护，便于扩展
- **性能优化**：纯静态网站，首屏加载快
- **SEO友好**：语义化HTML结构，利于搜索引擎收录

## 🔧 技术栈

- **纯前端**：HTML5 + CSS3 + Vanilla JavaScript
- **无依赖**：不使用任何第三方框架或库
- **CSS变量**：统一的颜色和设计系统
- **Flexbox/Grid**：现代布局方案

## 📄 许可证

© 2026 HIME Tools. All rights reserved.
