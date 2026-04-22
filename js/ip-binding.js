// 全局变量存储网络地址数据
let networkData = [];

// 页面加载时处理URL参数
document.addEventListener('DOMContentLoaded', function() {
    loadNetworkData();
});

// 从URL参数加载网络地址数据
function loadNetworkData() {
    const urlParams = new URLSearchParams(window.location.search);
    const networksParam = urlParams.get('networks');
    
    if (!networksParam) {
        document.getElementById('networkListContainer').innerHTML = 
            '<div class="result-card"><p style="text-align: center; color: #666; padding: 40px;">没有接收到网络地址数据，请从子网计算器跳转</p></div>';
        return;
    }
    
    // 解析网络地址列表
    const networks = networksParam.split(',').map(n => n.trim()).filter(n => n);
    
    if (networks.length === 0) {
        document.getElementById('networkListContainer').innerHTML = 
            '<div class="result-card"><p style="text-align: center; color: #666; padding: 40px;">网络地址数据为空</p></div>';
        return;
    }
    
    // 为每个网络地址计算详细信息
    networkData = networks.map(network => {
        const match = network.match(/(\d+\.\d+\.\d+\.\d+)\/(\d+)/);
        if (!match) {
            return { original: network, error: '格式错误' };
        }
        
        const ipAddress = match[1];
        const cidr = parseInt(match[2]);
        
        return {
            original: network,
            ...calculateSubnetInfo(ipAddress, cidr)
        };
    });
    
    // 渲染网络地址卡片
    renderNetworkCards();
}

// 渲染网络地址卡片
function renderNetworkCards() {
    const container = document.getElementById('networkListContainer');
    container.innerHTML = '';
    
    networkData.forEach((data, index) => {
        const card = createNetworkCard(data, index);
        container.appendChild(card);
    });
}

// 创建单个网络地址卡片
function createNetworkCard(data, index) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    let html = '';
    
    if (data.error) {
        html += `<div style="color: #e74c3c; padding: 15px;">${escapeHtml(data.original)} - ${data.error}</div>`;
    } else {
        // 第一行：网络地址、子网掩码、网关、可用IP数
        html += '<div class="result-row">';
        
        // 网络地址
        html += '<div class="result-item">';
        html += '<div class="item-label">网络地址</div>';
        html += `<div class="item-values"><div>${escapeHtml(data.networkAddress)}</div></div>`;
        html += '</div>';
        
        // 子网掩码
        html += '<div class="result-item">';
        html += '<div class="item-label">子网掩码</div>';
        html += `<div class="item-values"><div>${data.subnetMask}</div></div>`;
        html += '</div>';
        
        // 网关
        html += '<div class="result-item">';
        html += '<div class="item-label">网关</div>';
        html += `<div class="item-values"><div>${data.gatewayIP}</div></div>`;
        html += '</div>';
        
        // 可用IP数
        html += '<div class="result-item highlight">';
        html += '<div class="item-header">';
        html += '<div class="item-label">可用IP数</div>';
        html += `<div class="total-count">${formatNumber(data.usableHosts)}个</div>`;
        html += '</div>';
        html += '<div class="item-values">';
        html += `<div>${data.usableIPRange}</div>`;
        html += '</div></div>';
        
        html += '</div>'; // 结束第一行
        
        // 第二行：IP范围
        html += '<div class="result-row">';
        html += '<div class="result-item" style="grid-column: 1 / -1;">';
        html += '<div class="item-label">IP范围</div>';
        html += `<div class="item-values"><div>${data.ipRange}</div></div>`;
        html += '</div>';
        html += '</div>'; // 结束第二行
    }
    
    card.innerHTML = html;
    return card;
}

// 计算子网信息（复用subnet-calculator.js的逻辑）
function calculateSubnetInfo(ipAddress, cidr) {
    const ipInt = ipToInt(ipAddress);
    const subnetMaskInt = cidrToSubnetMaskInt(cidr);
    const networkInt = ipInt & subnetMaskInt;
    const broadcastInt = networkInt | (~subnetMaskInt >>> 0);
    
    const networkAddress = intToIp(networkInt);
    const broadcastAddress = intToIp(broadcastInt);
    const subnetMask = intToIp(subnetMaskInt);
    
    const totalIPs = Math.pow(2, 32 - cidr);
    
    let firstUsable, lastUsable, ipRange, usableIPRange, usableHosts, gatewayIP;
    
    if (cidr >= 31) {
        // /31和/32没有可用主机
        firstUsable = 'N/A';
        lastUsable = 'N/A';
        ipRange = 'N/A';
        usableIPRange = 'N/A';
        usableHosts = 0;
        gatewayIP = 'N/A';
    } else {
        // 默认使用首IP作为网关
        firstUsable = intToIp(networkInt + 2);  // 第二个可用IP
        lastUsable = intToIp(broadcastInt - 1);  // 最后一个可用IP
        gatewayIP = intToIp(networkInt + 1);  // 网关IP
        
        ipRange = `${firstUsable}-${lastUsable}`;
        
        // 可用IP范围（显示前三段+最后一段范围）
        const firstParts = firstUsable.split('.');
        const lastLastOctet = lastUsable.split('.').pop();
        usableIPRange = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.${firstParts[3]}-${lastLastOctet}`;
        
        // 可用主机数 = 总IP数 - 网络地址 - 广播地址 - 网关IP
        usableHosts = totalIPs - 3;
    }
    
    return {
        networkAddress: `${networkAddress}/${cidr}`,
        subnetMask: subnetMask,
        usableIPRange: usableIPRange,
        ipRange: ipRange,
        usableHosts: usableHosts,
        gatewayIP: gatewayIP || 'N/A'
    };
}

// IP转整数
function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// 整数转IP
function intToIp(int) {
    return [
        (int >>> 24) & 0xFF,
        (int >>> 16) & 0xFF,
        (int >>> 8) & 0xFF,
        int & 0xFF
    ].join('.');
}

// CIDR转子网掩码整数
function cidrToSubnetMaskInt(cidr) {
    return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}

// 格式化数字（添加千位分隔符）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出为CSV
function exportToCSV() {
    if (networkData.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    let csv = '网络地址,子网掩码,网关,可用IP范围,IP范围,可用IP数\n';
    
    networkData.forEach(data => {
        if (!data.error) {
            csv += `"${data.networkAddress}","${data.subnetMask}","${data.gatewayIP}","${data.usableIPRange}","${data.ipRange}",${data.usableHosts}\n`;
        }
    });
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ip-binding-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 复制到剪贴板
function copyToClipboard() {
    if (networkData.length === 0) {
        alert('没有数据可复制');
        return;
    }
    
    let text = '网络地址\t子网掩码\t网关\t可用IP范围\tIP范围\t可用IP数\n';
    
    networkData.forEach(data => {
        if (!data.error) {
            text += `${data.networkAddress}\t${data.subnetMask}\t${data.gatewayIP}\t${data.usableIPRange}\t${data.ipRange}\t${data.usableHosts}\n`;
        }
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板！');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    });
}
