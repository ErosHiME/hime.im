// 颜色选择器功能

let currentColor = '#667eea';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    updateColor();
});

// 更新颜色显示
function updateColor() {
    const colorInput = document.getElementById('colorInput');
    currentColor = colorInput.value;
    
    // 更新预览
    const previewBox = document.querySelector('.preview-box');
    previewBox.style.backgroundColor = currentColor;
    
    // 转换并显示各种格式
    const rgb = hexToRgb(currentColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // 更新显示值
    document.getElementById('hexValue').value = currentColor.toUpperCase();
    document.getElementById('rgbValue').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    document.getElementById('hslValue').value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    
    // 更新滑块
    document.getElementById('rSlider').value = rgb.r;
    document.getElementById('gSlider').value = rgb.g;
    document.getElementById('bSlider').value = rgb.b;
    document.getElementById('rValue').textContent = rgb.r;
    document.getElementById('gValue').textContent = rgb.g;
    document.getElementById('bValue').textContent = rgb.b;
}

// 从滑块更新颜色
function updateFromSliders() {
    const r = parseInt(document.getElementById('rSlider').value);
    const g = parseInt(document.getElementById('gSlider').value);
    const b = parseInt(document.getElementById('bSlider').value);
    
    // 更新文本显示
    document.getElementById('rValue').textContent = r;
    document.getElementById('gValue').textContent = g;
    document.getElementById('bValue').textContent = b;
    
    // 转换为HEX
    const hex = rgbToHex(r, g, b);
    currentColor = hex;
    
    // 更新颜色输入
    document.getElementById('colorInput').value = hex;
    
    // 更新预览和显示值
    const previewBox = document.querySelector('.preview-box');
    previewBox.style.backgroundColor = hex;
    
    const hsl = rgbToHsl(r, g, b);
    document.getElementById('hexValue').value = hex.toUpperCase();
    document.getElementById('rgbValue').value = `rgb(${r}, ${g}, ${b})`;
    document.getElementById('hslValue').value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

// HEX转RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// RGB转HEX
function rgbToHex(r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

// RGB转HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        
        h /= 6;
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// 复制到剪贴板
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    element.setSelectionRange(0, 99999); // 移动端兼容
    
    navigator.clipboard.writeText(element.value).then(() => {
        // 显示复制成功提示
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, 300);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}
