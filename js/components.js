// 组件加载器 - 用于动态加载header和footer

/**
 * 获取当前页面相对于项目根目录的路径深度
 */
function getRootPath() {
    const path = window.location.pathname;
    // 如果路径包含 /tools/ 目录，则返回 ../
    if (path.includes('/tools/')) {
        return '../';
    }
    // 根目录页面使用 ./
    return './';
}

/**
 * 加载HTML组件并替换占位符
 */
async function loadComponent(placeholderId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${componentPath}`);
        }
        let html = await response.text();
        
        // 替换模板变量 {{rootPath}}
        const rootPath = getRootPath();
        html = html.replace(/\{\{rootPath\}\}/g, rootPath);
        
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.outerHTML = html;
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
    
    // 获取当前页面文件名
    const currentPage = path.split('/').pop() || 'index.html';

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href) {
            // 获取链接中的页面名
            const linkPage = href.split('/').pop();
            if (currentPage === linkPage) {
                link.classList.add('active');
            }
        }
    });
}

/**
 * 初始化组件加载
 */
async function initComponents() {
    const rootPath = getRootPath();

    // 创建header占位符并插入到body开头
    if (!document.querySelector('header.header')) {
        const headerPlaceholder = document.createElement('div');
        headerPlaceholder.id = 'header-placeholder';
        document.body.insertBefore(headerPlaceholder, document.body.firstChild);
    }

    // 创建footer占位符并添加到body末尾
    if (!document.querySelector('footer.footer')) {
        const footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        document.body.appendChild(footerPlaceholder);
    }

    // 并行加载header和footer
    await Promise.all([
        loadComponent('header-placeholder', `${rootPath}components/header.html`),
        loadComponent('footer-placeholder', `${rootPath}components/footer.html`)
    ]);

    // 组件加载完成后更新导航激活状态
    updateNavActiveState();
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', initComponents);
