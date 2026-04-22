// 组件加载器 - 用于动态加载header和footer

/**
 * 获取当前页面相对于项目根目录的路径深度
 * 例如: index.html -> ''
 *      tools/ip-binding.html -> '../'
 */
function getRootPath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    return depth > 0 ? '../'.repeat(depth) : './';
}

/**
 * 加载HTML组件
 * @param {string} selector - CSS选择器，指定插入位置
 * @param {string} componentPath - 组件文件路径
 */
async function loadComponent(selector, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${componentPath}`);
        }
        let html = await response.text();
        
        // 替换模板变量
        const rootPath = getRootPath();
        html = html.replace(/\{\{rootPath\}\}/g, rootPath);
        
        const element = document.querySelector(selector);
        if (element) {
            element.outerHTML = html;
            // 加载后更新导航激活状态
            if (selector.includes('header') || selector === 'body') {
                updateNavActiveState();
            }
        }
    } catch (error) {
        console.error('Component load error:', error);
    }
}

/**
 * 更新导航栏激活状态
 */
function updateNavActiveState() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && path.endsWith(href.replace('./', '').replace('../', ''))) {
            link.classList.add('active');
        }
    });
}

/**
 * 初始化组件加载
 */
function initComponents() {
    const rootPath = getRootPath();

    // 加载header（如果页面上还没有）
    if (!document.querySelector('header.header')) {
        loadComponent('body', `${rootPath}components/header.html`);
    }

    // 加载footer（如果页面上还没有）
    if (!document.querySelector('footer.footer')) {
        const footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        document.body.appendChild(footerPlaceholder);
        loadComponent('#footer-placeholder', `${rootPath}components/footer.html`);
    } else {
        // 如果已有footer，只更新激活状态
        updateNavActiveState();
    }
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', initComponents);
