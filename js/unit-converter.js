// 单位转换器功能

// 单位定义
const units = {
    length: {
        'm': { name: '米', factor: 1 },
        'km': { name: '千米', factor: 1000 },
        'cm': { name: '厘米', factor: 0.01 },
        'mm': { name: '毫米', factor: 0.001 },
        'ft': { name: '英尺', factor: 0.3048 },
        'in': { name: '英寸', factor: 0.0254 },
        'mi': { name: '英里', factor: 1609.34 }
    },
    weight: {
        'kg': { name: '千克', factor: 1 },
        'g': { name: '克', factor: 0.001 },
        'mg': { name: '毫克', factor: 0.000001 },
        'lb': { name: '磅', factor: 0.453592 },
        'oz': { name: '盎司', factor: 0.0283495 },
        't': { name: '吨', factor: 1000 }
    },
    temperature: {
        'C': { name: '摄氏度' },
        'F': { name: '华氏度' },
        'K': { name: '开尔文' }
    },
    area: {
        'm2': { name: '平方米', factor: 1 },
        'km2': { name: '平方千米', factor: 1000000 },
        'cm2': { name: '平方厘米', factor: 0.0001 },
        'ha': { name: '公顷', factor: 10000 },
        'acre': { name: '英亩', factor: 4046.86 },
        'ft2': { name: '平方英尺', factor: 0.092903 }
    }
};

let currentCategory = 'length';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    updateUnits();
});

// 更新单位选项
function updateUnits() {
    currentCategory = document.getElementById('category').value;
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    
    // 清空现有选项
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';
    
    // 添加新选项
    const categoryUnits = units[currentCategory];
    for (let unit in categoryUnits) {
        const option1 = new Option(categoryUnits[unit].name, unit);
        const option2 = new Option(categoryUnits[unit].name, unit);
        fromUnit.add(option1);
        toUnit.add(option2);
    }
    
    // 设置默认选择（选择不同的单位）
    if (toUnit.options.length > 1) {
        toUnit.selectedIndex = 1;
    }
    
    // 清除输入
    document.getElementById('fromValue').value = '';
    document.getElementById('toValue').value = '';
}

// 执行转换
function convert() {
    const fromValue = parseFloat(document.getElementById('fromValue').value);
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    
    if (isNaN(fromValue)) {
        document.getElementById('toValue').value = '';
        return;
    }
    
    let result;
    
    // 温度特殊处理
    if (currentCategory === 'temperature') {
        result = convertTemperature(fromValue, fromUnit, toUnit);
    } else {
        // 其他单位使用因子转换
        const fromFactor = units[currentCategory][fromUnit].factor;
        const toFactor = units[currentCategory][toUnit].factor;
        result = fromValue * fromFactor / toFactor;
    }
    
    // 格式化结果
    if (Number.isInteger(result)) {
        document.getElementById('toValue').value = result;
    } else {
        document.getElementById('toValue').value = parseFloat(result.toFixed(6));
    }
}

// 温度转换
function convertTemperature(value, from, to) {
    if (from === to) return value;
    
    let celsius;
    
    // 先转换为摄氏度
    switch (from) {
        case 'C':
            celsius = value;
            break;
        case 'F':
            celsius = (value - 32) * 5 / 9;
            break;
        case 'K':
            celsius = value - 273.15;
            break;
    }
    
    // 从摄氏度转换为目标单位
    switch (to) {
        case 'C':
            return celsius;
        case 'F':
            return celsius * 9 / 5 + 32;
        case 'K':
            return celsius + 273.15;
    }
}

// 交换单位
function swapUnits() {
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const fromValue = document.getElementById('fromValue');
    const toValue = document.getElementById('toValue');
    
    // 交换单位选择
    const temp = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = temp;
    
    // 交换数值
    fromValue.value = toValue.value;
    
    // 重新计算
    convert();
}
