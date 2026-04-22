# HIME Tools - 在线工具集合

一个部署在 Cloudflare Pages 的静态网站，提供各种实用的在线小工具。

## 📁 项目结构

```
hime.im/
├── index.html              # 主页导航页面
├── css/
│   ├── main.css           # 全局样式
│   ├── calculator.css     # 计算器样式
│   ├── unit-converter.css # 单位转换器样式
│   └── color-picker.css   # 颜色选择器样式
├── js/
│   ├── main.js            # 全局脚本
│   ├── calculator.js      # 计算器功能
│   ├── unit-converter.js  # 单位转换器功能
│   └── color-picker.js    # 颜色选择器功能
└── tools/
    ├── calculator.html     # 计算器页面
    ├── unit-converter.html # 单位转换器页面
    └── color-picker.html   # 颜色选择器页面
```

## 🛠️ 已包含的工具

### 1. 计算器 (Calculator)
- 支持基本四则运算
- 键盘输入支持
- 简洁直观的界面

访问路径: `/tools/calculator.html`

### 2. 单位转换器 (Unit Converter)
- 长度转换（米、千米、英尺、英寸等）
- 重量转换（千克、克、磅、盎司等）
- 温度转换（摄氏度、华氏度、开尔文）
- 面积转换（平方米、公顷、英亩等）
- 实时转换和单位交换功能

访问路径: `/tools/unit-converter.html`

### 3. 颜色选择器 (Color Picker)
- 可视化颜色选择
- 支持 HEX、RGB、HSL 格式
- RGB 滑块调节
- 一键复制颜色值

访问路径: `/tools/color-picker.html`

## 🚀 部署到 Cloudflare Pages

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接到你的 GitHub 仓库
4. 构建配置：
   - 构建命令：留空（静态网站无需构建）
   - 构建输出目录：`/` （根目录）
5. 点击部署

## 📝 添加新工具

要添加新的工具，需要：

1. 在 `tools/` 目录创建新的 HTML 页面（如 `new-tool.html`）
2. 在 `css/` 目录创建对应的样式文件（如 `new-tool.css`）
3. 在 `js/` 目录创建对应的脚本文件（如 `new-tool.js`）
4. 在 `index.html` 中添加新工具的导航卡片

示例导航卡片：
```html
<a href="tools/new-tool.html" class="tool-card">
    <div class="tool-icon">🔧</div>
    <h3 class="tool-title">新工具名称</h3>
    <p class="tool-desc">工具描述</p>
</a>
```

## 🎨 设计特点

- **响应式设计**：完美适配桌面和移动设备
- **统一风格**：所有工具保持一致的视觉设计
- **模块化架构**：每个工具独立维护，便于扩展
- **性能优化**：纯静态网站，加载速度快

## 📄 许可证

© 2026 HIME Tools. All rights reserved.
