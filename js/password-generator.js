// 密码生成器功能

// 字符集定义
const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// 相似字符
const SIMILAR_CHARS = '0O1lI';

// 歧义字符
const AMBIGUOUS_CHARS = '{}[]()/\\\'` ,;:.~';

// 更新长度显示
function updateLengthDisplay() {
    const lengthInput = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');
    lengthValue.textContent = lengthInput.value;
}

// 显示提示消息
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// 生成单个密码
function generateSinglePassword(length, options) {
    let charset = '';
    let password = '';
    let requiredChars = [];
    
    // 构建字符集
    if (options.includeUppercase) {
        let chars = CHAR_SETS.uppercase;
        if (options.excludeSimilar) {
            chars = chars.replace(/[O]/g, '');
        }
        if (options.excludeAmbiguous) {
            chars = chars.replace(/[{}[\]()\\\/'`,;:.~]/g, '');
        }
        charset += chars;
        if (options.requireAllTypes) {
            requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
        }
    }
    
    if (options.includeLowercase) {
        let chars = CHAR_SETS.lowercase;
        if (options.excludeSimilar) {
            chars = chars.replace(/[lI]/g, '');
        }
        if (options.excludeAmbiguous) {
            chars = chars.replace(/[{}[\]()\\\/'`,;:.~]/g, '');
        }
        charset += chars;
        if (options.requireAllTypes) {
            requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
        }
    }
    
    if (options.includeNumbers) {
        let chars = CHAR_SETS.numbers;
        if (options.excludeSimilar) {
            chars = chars.replace(/[01]/g, '');
        }
        if (options.excludeAmbiguous) {
            chars = chars.replace(/[{}[\]()\\\/'`,;:.~]/g, '');
        }
        charset += chars;
        if (options.requireAllTypes) {
            requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
        }
    }
    
    if (options.includeSymbols) {
        let chars = CHAR_SETS.symbols;
        if (options.excludeAmbiguous) {
            chars = chars.replace(/[{}[\]()\\\/'`,;:.~]/g, '');
        }
        charset += chars;
        if (options.requireAllTypes) {
            requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
        }
    }
    
    // 排除自定义字符
    if (options.customExclude) {
        for (let char of options.customExclude) {
            charset = charset.replace(new RegExp('\\' + char, 'g'), '');
        }
    }
    
    // 检查字符集是否为空
    if (charset.length === 0) {
        return null;
    }
    
    // 如果要求包含所有类型，先添加必需字符
    if (options.requireAllTypes && requiredChars.length > 0) {
        password = requiredChars.join('');
    }
    
    // 生成剩余字符
    const remainingLength = length - password.length;
    for (let i = 0; i < remainingLength; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    // 打乱密码字符顺序
    password = shuffleString(password);
    
    return password;
}

// 打乱字符串
function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

// 计算密码熵值
function calculateEntropy(password, options) {
    let charsetSize = 0;
    
    if (options.includeUppercase) {
        let size = 26;
        if (options.excludeSimilar) size -= 1; // O
        if (options.excludeAmbiguous) size -= 0;
        charsetSize += size;
    }
    
    if (options.includeLowercase) {
        let size = 26;
        if (options.excludeSimilar) size -= 2; // l, I
        if (options.excludeAmbiguous) size -= 0;
        charsetSize += size;
    }
    
    if (options.includeNumbers) {
        let size = 10;
        if (options.excludeSimilar) size -= 2; // 0, 1
        if (options.excludeAmbiguous) size -= 0;
        charsetSize += size;
    }
    
    if (options.includeSymbols) {
        let size = CHAR_SETS.symbols.length;
        if (options.excludeAmbiguous) size -= 15;
        charsetSize += size;
    }
    
    if (options.customExclude) {
        charsetSize -= options.customExclude.length;
    }
    
    // 熵值 = 长度 * log2(字符集大小)
    const entropy = password.length * Math.log2(charsetSize);
    return Math.round(entropy);
}

// 获取强度等级
function getStrengthLevel(entropy) {
    if (entropy < 40) return { level: '弱', color: '#ff6b6b', tip: '密码强度较弱，建议增加长度或启用更多字符类型' };
    if (entropy < 60) return { level: '中等', color: '#ffd93d', tip: '密码强度中等，可用于一般账户' };
    if (entropy < 80) return { level: '强', color: '#6bcf7f', tip: '密码强度较强，适合大多数场景' };
    return { level: '非常强', color: '#4ecdc4', tip: '密码强度非常高，适合重要账户' };
}

// 生成密码
function generatePasswords() {
    const length = parseInt(document.getElementById('passwordLength').value);
    const count = parseInt(document.getElementById('passwordCount').value);
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;
    const excludeSimilar = document.getElementById('excludeSimilar').checked;
    const excludeAmbiguous = document.getElementById('excludeAmbiguous').checked;
    const requireAllTypes = document.getElementById('requireAllTypes').checked;
    
    // 验证选项
    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        showToast('请至少选择一种字符类型！');
        return;
    }
    
    if (count < 1 || count > 50) {
        showToast('生成数量必须在 1-50 之间！');
        return;
    }
    
    if (length < 4 || length > 128) {
        showToast('密码长度必须在 4-128 之间！');
        return;
    }
    
    const options = {
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        excludeAmbiguous,
        requireAllTypes,
        customExclude: ''
    };
    
    // 生成密码
    const passwords = [];
    for (let i = 0; i < count; i++) {
        const password = generateSinglePassword(length, options);
        if (password) {
            passwords.push(password);
        }
    }
    
    if (passwords.length === 0) {
        showToast('生成失败，请调整选项后重试！');
        return;
    }
    
    // 显示密码
    const passwordOutput = document.getElementById('passwordOutput');
    passwordOutput.value = passwords.join('\n');
    
    showToast(`成功生成 ${passwords.length} 个密码！`);
}

// 复制密码
function copyPasswords() {
    const passwordOutput = document.getElementById('passwordOutput');
    const passwords = passwordOutput.value.trim();
    
    if (!passwords) {
        showToast('没有可复制的密码！');
        return;
    }
    
    navigator.clipboard.writeText(passwords).then(() => {
        showToast('密码已复制到剪贴板！');
    }).catch(err => {
        // 降级方案
        passwordOutput.select();
        document.execCommand('copy');
        showToast('密码已复制到剪贴板！');
    });
}

// 清空密码
function clearPasswords() {
    const passwordOutput = document.getElementById('passwordOutput');
    passwordOutput.value = '';
    
    showToast('已清空！');
}

// ==================== UUID 生成器功能 ====================

// 生成 UUID v4 (随机)
function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 生成 UUID v1 (时间戳)
function generateUUIDv1() {
    const now = new Date().getTime();
    return 'xxxxxxxx-xxxx-1xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (now + Math.random() * 16) % 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 格式化 UUID
function formatUUID(uuid, options) {
    let formatted = uuid;
    
    // 转换为大写
    if (options.uppercase) {
        formatted = formatted.toUpperCase();
    }
    
    // 移除连字符
    if (options.noDashes) {
        formatted = formatted.replace(/-/g, '');
    }
    
    // 添加花括号
    if (options.withBraces) {
        if (options.noDashes) {
            formatted = '{' + formatted + '}';
        } else {
            formatted = '{' + formatted + '}';
        }
    }
    
    return formatted;
}

// 生成 UUIDs
function generateUUIDs() {
    const version = document.getElementById('uuidVersion').value;
    const count = parseInt(document.getElementById('uuidCount').value);
    const uppercase = document.getElementById('uuidUppercase').checked;
    const withBraces = document.getElementById('uuidWithBraces').checked;
    const noDashes = document.getElementById('uuidNoDashes').checked;
    
    // 验证选项
    if (count < 1 || count > 100) {
        showToast('生成数量必须在 1-100 之间！');
        return;
    }
    
    const options = {
        uppercase,
        withBraces,
        noDashes
    };
    
    // 生成 UUID
    const uuids = [];
    for (let i = 0; i < count; i++) {
        let uuid;
        if (version === '1') {
            uuid = generateUUIDv1();
        } else {
            uuid = generateUUIDv4();
        }
        uuids.push(formatUUID(uuid, options));
    }
    
    // 显示 UUID
    const uuidOutput = document.getElementById('uuidOutput');
    uuidOutput.value = uuids.join('\n');
    
    showToast(`成功生成 ${uuids.length} 个 UUID！`);
}

// 复制 UUIDs
function copyUUIDs() {
    const uuidOutput = document.getElementById('uuidOutput');
    const uuids = uuidOutput.value.trim();
    
    if (!uuids) {
        showToast('没有可复制的 UUID！');
        return;
    }
    
    navigator.clipboard.writeText(uuids).then(() => {
        showToast('UUID 已复制到剪贴板！');
    }).catch(err => {
        // 降级方案
        uuidOutput.select();
        document.execCommand('copy');
        showToast('UUID 已复制到剪贴板！');
    });
}

// 清空 UUIDs
function clearUUIDs() {
    const uuidOutput = document.getElementById('uuidOutput');
    uuidOutput.value = '';
    
    showToast('已清空！');
}
