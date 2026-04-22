// 计算器功能

let display = document.getElementById('display');

// 添加字符到显示
function appendToDisplay(value) {
    if (display.value === '0' && value !== '.') {
        display.value = value;
    } else {
        display.value += value;
    }
}

// 清空显示
function clearDisplay() {
    display.value = '';
    display.placeholder = '0';
}

// 删除最后一个字符
function deleteLast() {
    display.value = display.value.slice(0, -1);
    if (display.value === '') {
        display.placeholder = '0';
    }
}

// 计算结果
function calculate() {
    try {
        // 替换×为*
        let expression = display.value.replace(/×/g, '*');
        
        // 检查表达式是否有效
        if (expression === '' || expression === undefined) {
            return;
        }
        
        // 计算结果
        let result = eval(expression);
        
        // 处理小数精度
        if (typeof result === 'number' && !Number.isInteger(result)) {
            result = parseFloat(result.toFixed(8));
        }
        
        display.value = result;
    } catch (error) {
        display.value = '错误';
        setTimeout(() => {
            clearDisplay();
        }, 1500);
    }
}

// 键盘支持
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    // 数字和运算符
    if (/[0-9.]/.test(key)) {
        appendToDisplay(key);
    } else if (['+', '-', '*', '/'].includes(key)) {
        appendToDisplay(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    }
});
