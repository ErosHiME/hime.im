// 获取 IP 信息
async function getIPInfo() {
    const ipDetails = document.getElementById('ip-details');
    ipDetails.innerHTML = '<div class="loading pulse">正在获取 IP 信息...</div>';
    
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('获取失败');
        
        const data = await response.json();
        
        ipDetails.innerHTML = `
            <div class="info-item">
                <div class="label">IP 地址</div>
                <div class="value">${data.ip || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="label">城市</div>
                <div class="value">${data.city || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="label">地区</div>
                <div class="value">${data.region || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="label">国家</div>
                <div class="value">${data.country_name || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="label">ISP</div>
                <div class="value">${data.org || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="label">时区</div>
                <div class="value">${data.timezone || 'N/A'}</div>
            </div>
        `;
    } catch (error) {
        ipDetails.innerHTML = `<div class="error">获取 IP 信息失败: ${error.message}</div>`;
    }
}

function refreshIP() {
    getIPInfo();
}

// DNS 查询
async function queryDNS() {
    const domain = document.getElementById('domain-input').value.trim();
    const recordType = document.getElementById('record-type').value;
    const resultBox = document.getElementById('dns-result');
    
    if (!domain) {
        resultBox.innerHTML = '<div class="error">请输入域名</div>';
        return;
    }
    
    resultBox.innerHTML = '<div class="loading pulse">正在查询...</div>';
    
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`);
        const data = await response.json();
        
        if (data.Status !== 0) {
            resultBox.innerHTML = `<div class="error">DNS 查询失败: ${getDNSError(data.Status)}</div>`;
            return;
        }
        
        if (!data.Answer || data.Answer.length === 0) {
            resultBox.innerHTML = '<div class="error">未找到相关记录</div>';
            return;
        }
        
        let html = '<pre>';
        data.Answer.forEach(record => {
            html += `${record.name}\t${record.TTL}\tIN\t${record.type}\t${record.data}\n`;
        });
        html += '</pre>';
        
        resultBox.innerHTML = html;
    } catch (error) {
        resultBox.innerHTML = `<div class="error">查询失败: ${error.message}</div>`;
    }
}

function getDNSError(status) {
    const errors = {
        1: '格式错误',
        2: '服务器失败',
        3: '名称不存在',
        4: '不支持的查询类型',
        5: '拒绝操作'
    };
    return errors[status] || '未知错误';
}

// Ping 测试（使用在线 API）
async function startPing() {
    const target = document.getElementById('ping-input').value.trim();
    const resultBox = document.getElementById('ping-result');
    
    if (!target) {
        resultBox.innerHTML = '<div class="error">请输入目标地址</div>';
        return;
    }
    
    resultBox.innerHTML = '<div class="loading pulse">正在进行 Ping 测试...</div>';
    
    try {
        const startTime = performance.now();
        const response = await fetch(`https://${target}`, { 
            method: 'HEAD',
            mode: 'no-cors'
        });
        const endTime = performance.now();
        
        const latency = Math.round(endTime - startTime);
        
        resultBox.innerHTML = `
            <div class="success">
                <strong>Ping 测试结果:</strong><br>
                目标: ${target}<br>
                延迟: ${latency} ms<br>
                状态: 可达
            </div>
        `;
    } catch (error) {
        resultBox.innerHTML = `
            <div class="error">
                <strong>Ping 测试结果:</strong><br>
                目标: ${target}<br>
                状态: 不可达或超时
            </div>
        `;
    }
}

// SSL 证书检查
async function checkSSL() {
    const domain = document.getElementById('ssl-input').value.trim();
    const resultBox = document.getElementById('ssl-result');
    
    if (!domain) {
        resultBox.innerHTML = '<div class="error">请输入网站地址</div>';
        return;
    }
    
    resultBox.innerHTML = '<div class="loading pulse">正在检查 SSL 证书...</div>';
    
    try {
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        const response = await fetch(url, { method: 'HEAD' });
        
        if (response.ok) {
            resultBox.innerHTML = `
                <div class="success">
                    <strong>SSL 证书状态:</strong> ✅ 有效<br>
                    网站: ${url}<br>
                    HTTPS: 已启用<br>
                    状态码: ${response.status}
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div class="error">
                    <strong>SSL 证书状态:</strong> ⚠️ 异常<br>
                    网站: ${url}<br>
                    状态码: ${response.status}
                </div>
            `;
        }
    } catch (error) {
        resultBox.innerHTML = `
            <div class="error">
                <strong>SSL 证书状态:</strong> ❌ 无效或不存在<br>
                错误: ${error.message}
            </div>
        `;
    }
}

// 端口扫描
async function scanPorts() {
    const host = document.getElementById('host-input').value.trim();
    const portRange = document.getElementById('port-range').value.trim();
    const resultBox = document.getElementById('port-result');
    
    if (!host) {
        resultBox.innerHTML = '<div class="error">请输入主机地址</div>';
        return;
    }
    
    if (!portRange) {
        resultBox.innerHTML = '<div class="error">请输入端口范围</div>';
        return;
    }
    
    resultBox.innerHTML = '<div class="loading pulse">正在扫描端口...</div>';
    
    // 解析端口
    let ports = [];
    if (portRange.includes('-')) {
        const [start, end] = portRange.split('-').map(Number);
        for (let i = start; i <= end && i <= 1024; i++) {
            ports.push(i);
        }
    } else {
        ports = portRange.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    }
    
    const results = [];
    
    for (const port of ports.slice(0, 20)) { // 限制最多扫描20个端口
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            await fetch(`http://${host}:${port}`, { 
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            results.push({ port, status: '开放', open: true });
        } catch (error) {
            results.push({ port, status: '关闭/过滤', open: false });
        }
    }
    
    let html = '<pre>';
    html += `主机: ${host}\n`;
    html += `扫描端口: ${ports.length} 个\n`;
    html += '='.repeat(40) + '\n';
    
    const openPorts = results.filter(r => r.open);
    results.forEach(r => {
        const icon = r.open ? '✅' : '❌';
        html += `${icon} 端口 ${r.port}: ${r.status}\n`;
    });
    
    html += '='.repeat(40) + '\n';
    html += `开放端口: ${openPorts.length} 个\n`;
    if (openPorts.length > 0) {
        html += `端口列表: ${openPorts.map(r => r.port).join(', ')}`;
    }
    html += '</pre>';
    
    resultBox.innerHTML = html;
}

// HTTP 状态检查
async function checkHTTPStatus() {
    const url = document.getElementById('url-input').value.trim();
    const resultBox = document.getElementById('http-result');
    
    if (!url) {
        resultBox.innerHTML = '<div class="error">请输入 URL 地址</div>';
        return;
    }
    
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    resultBox.innerHTML = '<div class="loading pulse">正在检查 HTTP 状态...</div>';
    
    try {
        const startTime = performance.now();
        const response = await fetch(fullUrl, { 
            method: 'HEAD',
            mode: 'no-cors'
        });
        const endTime = performance.now();
        
        const responseTime = Math.round(endTime - startTime);
        
        resultBox.innerHTML = `
            <div class="success">
                <strong>HTTP 状态检查结果:</strong><br>
                URL: ${fullUrl}<br>
                状态码: ${response.status}<br>
                响应时间: ${responseTime} ms<br>
                OK 类型: ${response.type}
            </div>
        `;
    } catch (error) {
        resultBox.innerHTML = `
            <div class="error">
                <strong>HTTP 状态检查失败:</strong><br>
                URL: ${fullUrl}<br>
                错误: ${error.message}
            </div>
        `;
    }
}

// 页面加载时获取 IP 信息
document.addEventListener('DOMContentLoaded', () => {
    getIPInfo();
});
