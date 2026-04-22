// 子网计算器功能

// 初始化时生成速查表
document.addEventListener('DOMContentLoaded', function() {
    generateSubnetTable();
    
    // 添加回车键支持
    document.getElementById('ipAddress').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateSubnet();
        }
    });
});

// 生成子网掩码速查表
function generateSubnetTable() {
    const tableBody = document.getElementById('subnetTableBody');
    const cidrValues = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    
    cidrValues.forEach(cidr => {
        const row = document.createElement('tr');
        
        const subnetMask = cidrToSubnetMask(cidr);
        const wildcardMask = getWildcardMask(subnetMask);
        const totalIPs = Math.pow(2, 32 - cidr);
        const usableHosts = cidr >= 31 ? 0 : totalIPs - 2;
        
        row.innerHTML = `
            <td>/${cidr}</td>
            <td>${subnetMask}</td>
            <td>${wildcardMask}</td>
            <td>${formatNumber(totalIPs)}</td>
            <td>${usableHosts > 0 ? formatNumber(usableHosts) : 'N/A'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// CIDR转子网掩码
function cidrToSubnetMask(cidr) {
    const mask = [];
    for (let i = 0; i < 4; i++) {
        const n = Math.min(cidr, 8);
        mask.push(256 - Math.pow(2, 8 - n));
        cidr -= n;
    }
    return mask.join('.');
}

// 获取通配符掩码
function getWildcardMask(subnetMask) {
    return subnetMask.split('.').map(octet => 255 - parseInt(octet)).join('.');
}

// 格式化数字（添加千位分隔符）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 验证IP地址格式
function isValidIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    for (let part of parts) {
        const num = parseInt(part);
        if (isNaN(num) || num < 0 || num > 255) return false;
        if (part !== num.toString()) return false; // 检查前导零
    }
    
    return true;
}

// IP地址转整数
function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// 整数转IP地址
function intToIp(int) {
    return [
        (int >>> 24) & 0xFF,
        (int >>> 16) & 0xFF,
        (int >>> 8) & 0xFF,
        int & 0xFF
    ].join('.');
}

// 计算子网
function calculateSubnet() {
    const ipAddress = document.getElementById('ipAddress').value.trim();
    const cidr = parseInt(document.getElementById('cidr').value);
    
    // 验证IP地址
    if (!isValidIP(ipAddress)) {
        alert('请输入有效的IP地址（例如：192.168.1.1）');
        return;
    }
    
    // 计算网络信息
    const ipInt = ipToInt(ipAddress);
    const subnetMaskInt = cidrToSubnetMaskInt(cidr);
    const networkInt = ipInt & subnetMaskInt;
    const broadcastInt = networkInt | (~subnetMaskInt >>> 0);
    
    const networkAddress = intToIp(networkInt);
    const broadcastAddress = intToIp(broadcastInt);
    const subnetMask = intToIp(subnetMaskInt);
    
    const totalIPs = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? 0 : totalIPs - 2;
    
    let firstUsable, lastUsable, ipRange;
    
    if (cidr >= 31) {
        firstUsable = 'N/A';
        lastUsable = 'N/A';
        ipRange = `${networkAddress} - ${broadcastAddress}`;
    } else {
        firstUsable = intToIp(networkInt + 1);
        lastUsable = intToIp(broadcastInt - 1);
        ipRange = `${firstUsable} - ${lastUsable}`;
    }
    
    // 显示结果
    document.getElementById('networkAddress').textContent = networkAddress;
    document.getElementById('broadcastAddress').textContent = broadcastAddress;
    document.getElementById('subnetMask').textContent = subnetMask;
    document.getElementById('usableHosts').textContent = usableHosts > 0 ? formatNumber(usableHosts) : 'N/A';
    document.getElementById('firstUsable').textContent = firstUsable;
    document.getElementById('lastUsable').textContent = lastUsable;
    document.getElementById('ipRange').textContent = ipRange;
    
    document.getElementById('resultSection').style.display = 'block';
    
    // 滚动到结果区域
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// CIDR转子网掩码整数
function cidrToSubnetMaskInt(cidr) {
    return cidr === 0 ? 0 : (~((1 << (32 - cidr)) - 1)) >>> 0;
}
