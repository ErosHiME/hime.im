// 子网计算器功能

// 全局变量：网关位置（false=第一个IP，true=最后一个IP）
let gatewayIsLast = false;

// 初始化时生成速查表
document.addEventListener('DOMContentLoaded', function() {
    generateSubnetTable();
    generateCommonSubnetTable();
    
    // 设置输入框自动适应高度
    const textarea = document.getElementById('subnetInput');
    if (textarea) {
        autoResizeTextarea(textarea);
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
});

// 自动调整textarea高度
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 切换网关位置
function setGatewayPosition(isLast) {
    gatewayIsLast = isLast;
    const firstBtn = document.getElementById('gatewayFirstBtn');
    const lastBtn = document.getElementById('gatewayLastBtn');
    
    if (isLast) {
        firstBtn.classList.remove('active');
        lastBtn.classList.add('active');
    } else {
        firstBtn.classList.add('active');
        lastBtn.classList.remove('active');
    }
    
    // 重新生成常用子网详细信息表格
    generateCommonSubnetTable();
    
    // 如果已经有计算结果，重新计算
    const resultSection = document.getElementById('resultSection');
    if (resultSection.style.display !== 'none') {
        calculateSubnets();
    }
}

// 生成子网掩码速查表
function generateSubnetTable() {
    const tableBody = document.getElementById('subnetTableBody');
    // 从 /32 到 /8 倒序排列
    const cidrValues = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
    
    cidrValues.forEach(cidr => {
        const row = document.createElement('tr');
        
        const subnetMask = cidrToSubnetMask(cidr);
        const totalIPs = Math.pow(2, 32 - cidr);
        const usableHosts = cidr >= 31 ? 0 : totalIPs - 2;
        
        row.innerHTML = `
            <td>/${cidr}</td>
            <td>${subnetMask}</td>
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

// 批量计算子网
function calculateSubnets() {
    const input = document.getElementById('subnetInput').value.trim();
    
    if (!input) {
        alert('请输入IP/CIDR地址');
        return;
    }
    
    const lines = input.split('\n').filter(line => line.trim());
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = ''; // 清空之前的结果
    
    let validResults = [];
    let totalUsableHosts = 0;
    
    // 解析并计算每一行
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        // 清理输入：去除序号、标点等无关文本，提取IP/CIDR
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s*\/\s*(\d+)/);
        
        if (!match) {
            return; // 跳过无效格式
        }
        
        const ipAddress = match[1];
        const cidr = parseInt(match[2]);
        
        if (!isValidIP(ipAddress) || cidr < 0 || cidr > 32) {
            return; // 跳过无效IP
        }
        
        // 计算子网信息
        const result = calculateSubnetInfo(ipAddress, cidr);
        validResults.push({
            original: `${ipAddress}/${cidr}`, // 使用格式化后的IP/CIDR
            ...result
        });
        
        totalUsableHosts += result.usableHosts;
    });
    
    if (validResults.length === 0) {
        alert('没有有效的输入，请检查格式');
        return;
    }
    
    // 保存计算结果到全局变量
    window.subnetResults = validResults;
    
    // 生成合并结果
    const mergedCard = createMergedResult(validResults, totalUsableHosts);
    resultsContainer.appendChild(mergedCard);
    
    document.getElementById('resultSection').style.display = 'block';
    
    // 滚动到结果区域
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 打开IP绑定工具
function openIPBindingTool() {
    // 如果没有计算结果，先执行批量计算
    if (!window.subnetResults || window.subnetResults.length === 0) {
        calculateSubnets();
        
        // 如果计算后仍然没有结果，提示用户
        if (!window.subnetResults || window.subnetResults.length === 0) {
            return;
        }
    }
    
    // 提取所有网络地址
    const networkAddresses = window.subnetResults.map(r => r.original).join(',');
    
    // 构建URL参数
    const params = new URLSearchParams({
        networks: networkAddresses
    });
    
    // 打开新标签页
    const url = `ip-binding.html?${params.toString()}`;
    window.open(url, '_blank');
}

// 计算子网信息
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
        if (gatewayIsLast) {
            // 网关为最后一个IP
            firstUsable = intToIp(networkInt + 1);  // 第一个可用IP
            lastUsable = intToIp(broadcastInt - 2);  // 倒数第二个可用IP（网关是最后一个）
            gatewayIP = intToIp(broadcastInt - 1);  // 网关IP
        } else {
            // 网关为第一个IP（默认）
            firstUsable = intToIp(networkInt + 2);  // 第二个可用IP
            lastUsable = intToIp(broadcastInt - 1);  // 最后一个可用IP
            gatewayIP = intToIp(networkInt + 1);  // 网关IP
        }
        
        ipRange = `${firstUsable}-${lastUsable}`;
        
        // 可用IP范围（显示前三段+最后一段范围，例如 192.168.1.2-62）
        const firstParts = firstUsable.split('.');
        const lastLastOctet = lastUsable.split('.').pop();
        usableIPRange = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.${firstParts[3]}-${lastLastOctet}`;
        
        // 可用主机数 = 总IP数 - 网络地址 - 广播地址 - 网关IP
        usableHosts = totalIPs - 3; // 减去网络地址、广播地址和网关
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

// 创建合并结果
function createMergedResult(results, totalUsableHosts) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    let html = '';
    
    // 第一行：网络地址、子网掩码、网关、可用主机数
    html += '<div class="result-row">';
    
    // 网络地址
    html += '<div class="result-item">';
    html += '<div class="item-label">网络地址</div>';
    html += '<div class="item-values">';
    results.forEach(result => {
        html += `<div>${escapeHtml(result.original)}</div>`;
    });
    html += '</div></div>';
    
    // 子网掩码（去重）
    const uniqueMasks = [...new Set(results.map(r => r.subnetMask))];
    html += '<div class="result-item">';
    html += '<div class="item-label">子网掩码</div>';
    html += '<div class="item-values">';
    uniqueMasks.forEach(mask => {
        html += `<div>${mask}</div>`;
    });
    html += '</div></div>';
    
    // 网关（根据设置显示第一个或最后一个IP）
    html += '<div class="result-item">';
    html += '<div class="item-label">网关</div>';
    html += '<div class="item-values">';
    results.forEach(result => {
        if (result.gatewayIP !== 'N/A') {
            html += `<div>${result.gatewayIP}</div>`;
        }
    });
    html += '</div></div>';
    
    // 可用IP数（总和 + 每个子网的数量）
    html += '<div class="result-item highlight">';
    html += '<div class="item-header">';
    html += '<div class="item-label">可用IP数</div>';
    html += `<div class="total-count">（总${formatNumber(totalUsableHosts)}个）</div>`;
    html += '</div>';
    html += '<div class="item-values">';
    results.forEach(result => {
        if (result.usableHosts > 0) {
            html += `<div>${formatNumber(result.usableHosts)}个</div>`;
        }
    });
    html += '</div></div>';
    
    html += '</div>'; // 结束第一行
    
    // 第二行：可用IP、IP范围
    html += '<div class="result-row">';
    
    // 可用IP
    html += '<div class="result-item">';
    html += '<div class="item-label">可用IP</div>';
    html += '<div class="item-values">';
    results.forEach(result => {
        if (result.usableIPRange !== 'N/A') {
            html += `<div>可用IP：${result.usableIPRange}</div>`;
        }
    });
    html += '</div></div>';
    
    // IP范围
    html += '<div class="result-item">';
    html += '<div class="item-label">IP范围</div>';
    html += '<div class="item-values">';
    results.forEach(result => {
        if (result.ipRange !== 'N/A') {
            const parts = result.ipRange.split('-');
            if (parts.length === 2) {
                html += `<div>${parts[0]}-${parts[1]}</div>`;
            }
        }
    });
    html += '</div></div>';
    
    html += '</div>'; // 结束第二行
    
    card.innerHTML = html;
    return card;
}

// 创建单个结果卡片（保留用于错误提示）
function createResultCard(inputLine, result, error) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    if (error) {
        card.innerHTML = `
            <div class="input-line">${escapeHtml(inputLine)}</div>
            <div class="info-item">
                <span class="info-label">错误:</span>
                <span class="info-value" style="color: #e74c3c;">${error}</span>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="input-line">${escapeHtml(inputLine)}</div>
            <div class="info-item">
                <span class="info-label">网络地址:</span>
                <span class="info-value">${result.networkAddress}</span>
            </div>
            <div class="info-item">
                <span class="info-label">子网掩码:</span>
                <span class="info-value">${result.subnetMask}</span>
            </div>
            <div class="info-item">
                <span class="info-label">可用IP:</span>
                <span class="info-value">${result.usableIPRange}</span>
            </div>
            <div class="info-item">
                <span class="info-label">IP范围:</span>
                <span class="info-value">${result.ipRange}</span>
            </div>
            <div class="info-item">
                <span class="info-label">可用主机数:</span>
                <span class="info-value">${result.usableHosts > 0 ? formatNumber(result.usableHosts) + '个' : 'N/A'}</span>
            </div>
        `;
    }
    
    return card;
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// CIDR转子网掩码整数
function cidrToSubnetMaskInt(cidr) {
    return cidr === 0 ? 0 : (~((1 << (32 - cidr)) - 1)) >>> 0;
}

// 生成 /25 到 /30 的常用子网信息静态表格
function generateCommonSubnetTable() {
    const container = document.getElementById('commonSubnetDetails');
    container.innerHTML = ''; // 清空现有内容
    
    // 使用示例 IP 地址 192.168.1.0 作为基准
    const exampleIP = '192.168.1.0';
    const ipInt = ipToInt(exampleIP);
    
    // 生成从 /25 到 /30 的所有子网信息
    for (let cidr = 25; cidr <= 30; cidr++) {
        const subnetCount = Math.pow(2, cidr - 24); // 子网数量
        const hostsPerSubnet = Math.pow(2, 32 - cidr) - 2; // 每个子网的可用主机数
        
        // 创建区块
        const block = document.createElement('div');
        block.className = 'subnet-detail-block';
        
        // 添加标题
        const title = document.createElement('h3');
        title.textContent = `/${cidr} -- ${subnetCount} Subnets -- ${hostsPerSubnet} Hosts/Subnet`;
        block.appendChild(title);
        
        // 创建表格
        const table = document.createElement('table');
        table.className = 'subnet-detail-table';
        
        // 表头
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Network #</th>
                <th>IP Range</th>
                <th>Gateway</th>
                <th>Broadcast</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // 表体
        const tbody = document.createElement('tbody');
        
        // 计算每个子网的大小
        const subnetSize = Math.pow(2, 32 - cidr);
        
        // 生成所有子网
        for (let i = 0; i < subnetCount; i++) {
            const networkInt = ipInt + (i * subnetSize);
            const broadcastInt = networkInt + subnetSize - 1;
            const firstUsable = networkInt + 1;
            const secondUsable = networkInt + 2; // 第二个可用IP
            const lastUsable = broadcastInt - 1;
            
            const networkAddress = intToIp(networkInt);
            const broadcastAddress = intToIp(broadcastInt);
            const firstUsableIP = intToIp(firstUsable);
            const secondUsableIP = intToIp(secondUsable);
            const lastUsableIP = intToIp(lastUsable);
            
            // 只提取IP地址的最后一位
            const networkLastOctet = '.' + networkAddress.split('.').pop();
            const broadcastLastOctet = '.' + broadcastAddress.split('.').pop();
            
            let gatewayLastOctet, rangeDisplay;
            
            if (gatewayIsLast) {
                // 网关为最后一个IP
                gatewayLastOctet = '.' + lastUsableIP.split('.').pop();
                
                if (cidr === 30) {
                    // /30 只有一个可用IP，显示第一个IP
                    rangeDisplay = '.' + firstUsableIP.split('.').pop();
                } else {
                    // 其他CIDR：从第一个IP到倒数第二个IP
                    const rangeStartLastOctet = '.' + firstUsableIP.split('.').pop();
                    const rangeEndLastOctet = '.' + intToIp(lastUsable - 1).split('.').pop();
                    rangeDisplay = `${rangeStartLastOctet}-${rangeEndLastOctet}`;
                }
            } else {
                // 网关为第一个IP（默认）
                gatewayLastOctet = '.' + firstUsableIP.split('.').pop();
                
                if (cidr === 30) {
                    // /30 只有一个可用IP，显示第二个IP
                    rangeDisplay = '.' + secondUsableIP.split('.').pop();
                } else {
                    // 其他CIDR：从第二个IP到最后一个IP
                    const rangeStartLastOctet = '.' + secondUsableIP.split('.').pop();
                    const rangeEndLastOctet = '.' + lastUsableIP.split('.').pop();
                    rangeDisplay = `${rangeStartLastOctet}-${rangeEndLastOctet}`;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${networkLastOctet}</td>
                <td>${rangeDisplay}</td>
                <td>${gatewayLastOctet}</td>
                <td>${broadcastLastOctet}</td>
            `;
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        block.appendChild(table);
        container.appendChild(block);
    }
}
