// 全局变量
let gatewayIsLast = false; // 网关位置

// 显示悬浮提示
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// 页面加载时处理
 document.addEventListener('DOMContentLoaded', function() {
    loadURLData();
    setupAutoResize();
    setupOSListener();
    setupNICSelection();
    // 默认显示网卡选择（因为是Windows）
    document.getElementById('nicSelection').style.display = 'block';
    
    // 页面加载时自动生成子网查询表格
    generateSubnetTable();
    generateCommonSubnetTable();
});

// 从URL参数加载网络地址数据到输入框
function loadURLData() {
    const urlParams = new URLSearchParams(window.location.search);
    const networksParam = urlParams.get('networks');
    
    if (networksParam) {
        // 解析网络地址列表并填充到输入框
        const networks = networksParam.split(',').map(n => n.trim()).filter(n => n);
        const textarea = document.getElementById('subnetInput');
        if (textarea && networks.length > 0) {
            textarea.value = networks.join('\n');
            // 触发自定义事件更新高度
            textarea.dispatchEvent(new Event('input'));
        }
    }
}

// 设置输入框自动调整高度
function setupAutoResize() {
    const textarea = document.getElementById('subnetInput');
    if (textarea) {
        autoResizeTextarea(textarea);
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
}

// 自动调整textarea高度
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 设置操作系统选择监听
function setupOSListener() {
    const osRadios = document.querySelectorAll('input[name="os"]');
    osRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const nicSelection = document.getElementById('nicSelection');
            const windowsNicInputs = document.getElementById('windowsNicInputs');
            const linuxNicInputs = document.getElementById('linuxNicInputs');
            
            // Windows、Linux、Debian 12 和 Ubuntu 显示网卡选择
            if (this.value === 'windows' || this.value === 'centos7' || this.value === 'debian12' || this.value === 'ubuntu') {
                nicSelection.style.display = 'block';
                
                // 根据操作系统显示对应的网卡选项
                if (this.value === 'windows') {
                    windowsNicInputs.style.display = 'flex';
                    linuxNicInputs.style.display = 'none';
                } else {
                    // Linux、Debian 12、Ubuntu 都使用 Linux 网卡选择
                    windowsNicInputs.style.display = 'none';
                    linuxNicInputs.style.display = 'flex';
                }
            } else {
                nicSelection.style.display = 'none';
            }
            
            // 如果已经有生成的配置，重新生成
            const resultSection = document.getElementById('resultSection');
            if (resultSection.style.display !== 'none') {
                generateIPBinding();
            }
        });
    });
}

// 设置网卡选择功能
function setupNICSelection() {
    // Windows 网卡
    const localSelect = document.getElementById('localConnectionSelect');
    const ethernetSelect = document.getElementById('ethernetSelect');
    const customInput = document.getElementById('customNicInput');
    
    // Linux 网卡（CentOS 7、Debian 12、Ubuntu 共用）
    const enoSelect = document.getElementById('enoSelect');
    const ethSelect = document.getElementById('ethSelect');
    const customLinuxInput = document.getElementById('customLinuxNicInput');
    
    const allElements = [localSelect, ethernetSelect, customInput, enoSelect, ethSelect, customLinuxInput];
    
    // 为每个元素添加点击事件
    allElements.forEach(element => {
        element.addEventListener('click', function(e) {
            e.stopPropagation();
            setActiveNIC(this);
            
            // 如果已经有生成的配置，重新生成
            const resultSection = document.getElementById('resultSection');
            if (resultSection && resultSection.style.display !== 'none') {
                generateIPBinding();
            }
        });
        
        // 自定义输入框还需要监听输入事件
        if (element === customInput || element === customLinuxInput) {
            element.addEventListener('input', function() {
                setActiveNIC(this);
            });
            
            // 输入框失去焦点时刷新配置
            element.addEventListener('blur', function() {
                const resultSection = document.getElementById('resultSection');
                if (resultSection && resultSection.style.display !== 'none') {
                    generateIPBinding();
                }
            });
        }
    });
    
    // 下拉框改变时也刷新配置
    [localSelect, ethernetSelect, enoSelect, ethSelect].forEach(select => {
        select.addEventListener('change', function() {
            const resultSection = document.getElementById('resultSection');
            if (resultSection && resultSection.style.display !== 'none') {
                generateIPBinding();
            }
        });
    });
    
    // 点击页面其他地方时，保持当前选中状态（不做任何操作）
    document.addEventListener('click', function(e) {
        // 如果点击的不是网卡选择区域，不做处理，保持当前选中
        if (!e.target.closest('.nic-inputs')) {
            // 不取消选中，保持当前状态
        }
    });
}

// 设置选中的网卡
function setActiveNIC(activeElement) {
    // Windows 网卡元素
    const localSelect = document.getElementById('localConnectionSelect');
    const ethernetSelect = document.getElementById('ethernetSelect');
    const customInput = document.getElementById('customNicInput');
    
    // Linux 网卡元素（CentOS 7、Debian 12、Ubuntu 共用）
    const enoSelect = document.getElementById('enoSelect');
    const ethSelect = document.getElementById('ethSelect');
    const customLinuxInput = document.getElementById('customLinuxNicInput');
    
    // 移除所有元素的选中状态
    localSelect.classList.remove('nic-active');
    ethernetSelect.classList.remove('nic-active');
    customInput.classList.remove('nic-active');
    enoSelect.classList.remove('nic-active');
    ethSelect.classList.remove('nic-active');
    customLinuxInput.classList.remove('nic-active');
    
    // 添加当前元素的选中状态
    activeElement.classList.add('nic-active');
    
    // 如果是下拉框，自动聚焦
    if (activeElement.tagName === 'SELECT') {
        activeElement.focus();
    }
}

// 获取选中的网卡名称
function getSelectedNIC() {
    const selectedOS = document.querySelector('input[name="os"]:checked').value;
    
    // Linux 的网卡选择（CentOS 7、Debian 12、Ubuntu 共用）
    if (selectedOS === 'centos7' || selectedOS === 'debian12' || selectedOS === 'ubuntu') {
        const enoSelect = document.getElementById('enoSelect');
        const ethSelect = document.getElementById('ethSelect');
        const customInput = document.getElementById('customLinuxNicInput');
        
        if (customInput.classList.contains('nic-active')) {
            const customValue = customInput.value.trim();
            return customValue || 'eno1';
        } else if (ethSelect.classList.contains('nic-active')) {
            return ethSelect.value;
        } else {
            return enoSelect.value;
        }
    }
    
    // Windows 的网卡选择
    const localSelect = document.getElementById('localConnectionSelect');
    const ethernetSelect = document.getElementById('ethernetSelect');
    const customInput = document.getElementById('customNicInput');
    
    // 根据选中状态返回对应的值
    if (customInput.classList.contains('nic-active')) {
        const customValue = customInput.value.trim();
        return customValue || '以太网'; // 如果自定义为空，使用默认值
    } else if (ethernetSelect.classList.contains('nic-active')) {
        return ethernetSelect.value;
    } else {
        // 默认使用本地连接
        return localSelect.value;
    }
}

// 计算子网信息（复用subnet.js的逻辑）
function calculateSubnetInfo(ipAddress, cidr, gatewayIsLast = false) {
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
            // 使用尾IP作为网关
            firstUsable = intToIp(networkInt + 1);  // 第一个可用IP
            lastUsable = intToIp(broadcastInt - 2);  // 倒数第二个可用IP
            gatewayIP = intToIp(broadcastInt - 1);  // 网关IP（尾IP）
        } else {
            // 默认使用首IP作为网关
            firstUsable = intToIp(networkInt + 2);  // 第二个可用IP
            lastUsable = intToIp(broadcastInt - 1);  // 最后一个可用IP
            gatewayIP = intToIp(networkInt + 1);  // 网关IP
        }
        
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
        gatewayIP: gatewayIP || 'N/A',
        firstUsableIP: firstUsable,
        lastUsableIP: lastUsable
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

// 根据IP范围计算CIDR
function calculateCidrFromRange(startInt, endInt) {
    // 计算需要的IP数量
    const ipCount = endInt - startInt + 1;
    
    // 找到最小的CIDR，使得该子网能容纳所有IP
    // CIDR对应的IP数量是 2^(32-CIDR)
    let cidr = 32;
    while (cidr >= 0) {
        const subnetSize = Math.pow(2, 32 - cidr);
        if (subnetSize >= ipCount) {
            // 检查这个CIDR的网络地址是否能包含起始IP
            const mask = cidrToSubnetMaskInt(cidr);
            const networkAddr = startInt & mask;
            // 关键修复：使用 >>> 0 确保结果为无符号整数
            const broadcastAddr = (networkAddr | (~mask >>> 0)) >>> 0;
            
            // 确保结束IP也在这个子网内
            if (endInt <= broadcastAddr) {
                return cidr;
            }
        }
        cidr--;
    }
    
    // 如果找不到合适的CIDR，返回/0
    return 0;
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
    
    // 如果已经有生成的配置，自动刷新
    const resultSection = document.getElementById('resultSection');
    if (resultSection.style.display !== 'none') {
        generateIPBinding();
    }
    
    // 同步更新子网划分表格
    generateCommonSubnetTable();
}

// 生成IP绑定配置
function generateIPBinding() {
    const input = document.getElementById('subnetInput').value.trim();
    
    if (!input) {
        showToast('请输入IP/CIDR地址');
        return;
    }
    
    // 获取选中的操作系统
    const selectedOS = document.querySelector('input[name="os"]:checked').value;
    
    // Windows、Linux、Debian 12 和 Ubuntu 下自定义网卡名称验证
    if (selectedOS === 'windows' || selectedOS === 'centos7' || selectedOS === 'debian12' || selectedOS === 'ubuntu') {
        let customInput;
        if (selectedOS === 'windows') {
            customInput = document.getElementById('customNicInput');
        } else {
            customInput = document.getElementById('customLinuxNicInput');
        }
        
        if (customInput.classList.contains('nic-active') && !customInput.value.trim()) {
            showToast('请输入网卡名称');
            customInput.focus();
            return;
        }
    }
    
    const lines = input.split('\n').filter(line => line.trim());
    const configContainer = document.getElementById('configContainer');
    configContainer.innerHTML = '';
    
    const results = [];
    
    // 解析并计算每一行
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // 清理多余的前缀文本（如 "1. "、"- " 等），但要保留IP地址
        // 只有当前缀不是IP地址的一部分时才清理
        line = line.replace(/^[\d]+[\.、]\s+/, '');
        
        // 尝试解析不同的输入格式
        let ipAddress, cidr;
        
        // 格式1: IP/CIDR (例如: 192.168.1.0/24)
        const cidrMatch = line.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)\s*\/\s*(\d+)/);
        
        // 格式2: IP起始-IP结束完整 (例如: 192.168.1.2-192.168.1.254)
        const fullRangeMatch = line.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)\s*-\s*(\d+)\.(\d+)\.(\d+)\.(\d+)/);
        
        // 格式3: IP起始-结束简写 (例如: 192.168.1.2-254)
        const shortRangeMatch = line.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)\s*-\s*(\d+)$/);
        
        if (fullRangeMatch) {
            // 处理完整范围格式
            const startIP = `${fullRangeMatch[1]}.${fullRangeMatch[2]}.${fullRangeMatch[3]}.${fullRangeMatch[4]}`;
            const endIP = `${fullRangeMatch[5]}.${fullRangeMatch[6]}.${fullRangeMatch[7]}.${fullRangeMatch[8]}`;
            
            // 验证IP范围
            const startInt = ipToInt(startIP);
            const endInt = ipToInt(endIP);
            
            if (startInt > endInt) {
                showToast('IP范围不正确，起始IP不能大于结束IP');
                return;
            }
            
            // 计算CIDR
            cidr = calculateCidrFromRange(startInt, endInt);
            ipAddress = intToIp(startInt & cidrToSubnetMaskInt(cidr)); // 计算网络地址
            
        } else if (shortRangeMatch) {
            // 处理简写范围格式
            const baseIP = `${shortRangeMatch[1]}.${shortRangeMatch[2]}.${shortRangeMatch[3]}`;
            const startOctet = parseInt(shortRangeMatch[4]);
            const endOctet = parseInt(shortRangeMatch[5]);
            
            // 验证最后一段范围
            if (startOctet < 0 || startOctet > 255 || endOctet < 0 || endOctet > 255) {
                showToast('IP段输入不正确，每段应为0-255');
                return;
            }
            
            if (startOctet > endOctet) {
                showToast('IP范围不正确，起始值不能大于结束值');
                return;
            }
            
            const startIP = `${baseIP}.${startOctet}`;
            const endIP = `${baseIP}.${endOctet}`;
            const startInt = ipToInt(startIP);
            const endInt = ipToInt(endIP);
            
            // 计算CIDR
            cidr = calculateCidrFromRange(startInt, endInt);
            ipAddress = intToIp(startInt & cidrToSubnetMaskInt(cidr)); // 计算网络地址
            
        } else if (cidrMatch) {
            // 处理标准CIDR格式
            const octet1 = parseInt(cidrMatch[1]);
            const octet2 = parseInt(cidrMatch[2]);
            const octet3 = parseInt(cidrMatch[3]);
            const octet4 = parseInt(cidrMatch[4]);
            cidr = parseInt(cidrMatch[5]);
            
            // 验证IP地址每段是否在0-255范围内
            if (octet1 < 0 || octet1 > 255 || 
                octet2 < 0 || octet2 > 255 || 
                octet3 < 0 || octet3 > 255 || 
                octet4 < 0 || octet4 > 255) {
                showToast('IP地址输入不正确，每段应为0-255');
                return;
            }
            
            // 验证CIDR范围
            if (cidr < 0 || cidr > 32) {
                showToast('CIDR输入不正确，应为0-32');
                return;
            }
            
            ipAddress = `${octet1}.${octet2}.${octet3}.${octet4}`;
            
        } else {
            showToast('请输入正确的IP/CIDR格式或IP范围格式');
            return;
        }
        
        const info = calculateSubnetInfo(ipAddress, cidr, gatewayIsLast);
        results.push({
            original: ipAddress + '/' + cidr,  // 保存计算后的网络地址和CIDR
            ...info
        });
    }
    
    if (results.length === 0) {
        showToast('没有有效的IP/CIDR地址');
        return;
    }
    
    // 显示结果区域
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    
    // 所有系统：先显示子网信息，再显示配置命令
    // 先显示子网计算结果
    const subnetResultBlock = createSubnetResultBlock(results);
    configContainer.appendChild(subnetResultBlock);
    
    // 再显示配置命令
    if (selectedOS === 'windows') {
        const mergedBlock = createMergedWindowsConfigBlocks(results);
        configContainer.appendChild(mergedBlock);
    } else if (selectedOS === 'centos7') {
        const centosBlock = createMergedCentOS7ConfigBlocks(results);
        configContainer.appendChild(centosBlock);
    } else if (selectedOS === 'debian12' || selectedOS === 'ubuntu') {
        const debianBlock = createMergedDebian12ConfigBlocks(results);
        configContainer.appendChild(debianBlock);
    } else {
        // 其他系统：为每个网络地址生成配置
        results.forEach(result => {
            const configBlock = createConfigBlock(result, selectedOS);
            configContainer.appendChild(configBlock);
        });
    }
}

// 创建配置块
function createConfigBlock(data, os) {
    const block = document.createElement('div');
    block.className = 'config-block';
    
    // Windows特殊处理：生成CMD和PowerShell两个卡片
    if (os === 'windows') {
        return createWindowsConfigBlocks(data);
    }
    
    const configCode = generateConfigCode(data, os);
    
    let html = `<h4>${escapeHtml(data.networkAddress)}</h4>`;
    html += `<div class="config-code" id="config-${data.networkAddress.replace(/[\.\/]/g, '-')}">${escapeHtml(configCode)}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('config-${data.networkAddress.replace(/[\.\/]/g, '-')}')">复制配置</button>`;
    html += '</div>';
    
    block.innerHTML = html;
    return block;
}

// 创建Windows配置块（CMD + PowerShell）
function createWindowsConfigBlocks(data) {
    const container = document.createElement('div');
    container.className = 'config-block';
    
    const networkAddr = data.networkAddress.split('/')[0];
    const cidr = data.networkAddress.split('/')[1];
    const nicName = getSelectedNIC();
    const gateway = data.gatewayIP;
    const firstIP = data.firstUsableIP;
    const lastIP = data.lastUsableIP;
    const subnetMask = data.subnetMask;
    const prefixLength = cidr;
    
    // 提取IP前三位和最后一段
    const firstParts = firstIP.split('.');
    const lastParts = lastIP.split('.');
    const ipPrefix = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.`;
    const firstOctet = firstParts[3];
    const lastOctet = lastParts[3];
    
    let html = `<h4>${escapeHtml(data.networkAddress)}</h4>`;
    
    // CMD卡片
    const cmdId = `cmd-${data.networkAddress.replace(/[\.\/]/g, '-')}`;
    const cmdCode = `for /l %i in (${firstOctet},1,${lastOctet}) do netsh interface ip add address "${nicName}" ${ipPrefix}%i ${subnetMask}`;
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">CMD</h5>`;
    html += `<div class="config-code" id="${cmdId}">${escapeHtml(cmdCode)}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${cmdId}')">复制CMD命令</button>`;
    html += '</div>';
    
    // PowerShell卡片
    const psId = `ps-${data.networkAddress.replace(/[\.\/]/g, '-')}`;
    const psCode = `${firstOctet}..${lastOctet} | % { ni ${ipPrefix}$_/${prefixLength} -if "${nicName}" -ea 0 }`;
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">PowerShell</h5>`;
    html += `<div class="config-code" id="${psId}">${escapeHtml(psCode)}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${psId}')">复制PowerShell命令</button>`;
    html += '</div>';
    
    container.innerHTML = html;
    return container;
}

// 创建合并的Windows配置块（所有IP段合并）
function createMergedWindowsConfigBlocks(results) {
    const container = document.createElement('div');
    container.className = 'config-block';
    
    const nicName = getSelectedNIC();
    
    let html = '<h4>IP绑定</h4>';
    
    // 收集所有CMD命令
    let cmdCommands = [];
    let psCommands = [];
    
    results.forEach((data, index) => {
        const firstIP = data.firstUsableIP;
        const lastIP = data.lastUsableIP;
        const subnetMask = data.subnetMask;
        const cidr = data.networkAddress.split('/')[1];
        
        // 提取IP前三位和最后一段
        const firstParts = firstIP.split('.');
        const lastParts = lastIP.split('.');
        const ipPrefix = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.`;
        const firstOctet = firstParts[3];
        const lastOctet = lastParts[3];
        
        // CMD命令
        cmdCommands.push(`for /l %i in (${firstOctet},1,${lastOctet}) do netsh interface ip add address "${nicName}" ${ipPrefix}%i ${subnetMask}`);
        
        // PowerShell命令
        psCommands.push(`${firstOctet}..${lastOctet} | % { ni ${ipPrefix}$_/${cidr} -if "${nicName}" -ea 0 }`);
    });
    
    // CMD卡片
    const cmdId = 'cmd-merged';
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">CMD</h5>`;
    html += `<div class="config-code" id="${cmdId}">${escapeHtml(cmdCommands.join('\n'))}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${cmdId}')">复制CMD命令</button>`;
    html += '</div>';
    
    // PowerShell卡片
    const psId = 'ps-merged';
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">PowerShell（win2012及以上）</h5>`;
    html += `<div class="config-code" id="${psId}">${escapeHtml(psCommands.join('\n'))}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${psId}')">复制PowerShell命令</button>`;
    html += '</div>';
    
    container.innerHTML = html;
    return container;
}

// 创建合并的CentOS 7配置块（所有IP段合并）
function createMergedCentOS7ConfigBlocks(results) {
    console.log('createMergedCentOS7ConfigBlocks called with:', results);
    
    const container = document.createElement('div');
    container.className = 'config-block';
    
    const nicName = getSelectedNIC();
    
    let html = '<h4>IP绑定</h4>';
    
    // 收集所有bash命令
    let bashCommands = [];
    let rangeConfigs = [];
    
    results.forEach((data, index) => {
        const firstIP = data.firstUsableIP;
        const lastIP = data.lastUsableIP;
        const subnetMask = data.subnetMask;
        
        // 提取IP前三位和最后一段
        const firstParts = firstIP.split('.');
        const lastParts = lastIP.split('.');
        const ipPrefix = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.`;
        const firstOctet = firstParts[3];
        const lastOctet = lastParts[3];
        
        // 计算当前IP段的第一个可用IP在所有可用IP中的序号（从1开始）
        let cloneNumStart = 1;
        for (let i = 0; i < index; i++) {
            const prevFirstParts = results[i].firstUsableIP.split('.');
            const prevLastParts = results[i].lastUsableIP.split('.');
            const prevFirstOctet = parseInt(prevFirstParts[3]);
            const prevLastOctet = parseInt(prevLastParts[3]);
            cloneNumStart += (prevLastOctet - prevFirstOctet + 1);
        }
        
        // bash命令
        bashCommands.push('for I in $(seq ' + firstOctet + ' ' + lastOctet + '); do nmcli con mod ' + nicName + ' +ipv4.addresses ' + ipPrefix + '${I}; done');
        
        // range配置
        rangeConfigs.push(`vi /etc/sysconfig/network-scripts/ifcfg-${nicName}-range${index}`);
        rangeConfigs.push(`DEVICE=${nicName}`);
        rangeConfigs.push(`BOOTPROTO=static`);
        rangeConfigs.push(`ONBOOT=yes`);
        rangeConfigs.push(`IPADDR_START=${firstIP}`);
        rangeConfigs.push(`IPADDR_END=${lastIP}`);
        rangeConfigs.push(`CLONENUM_START=${cloneNumStart}`);
        rangeConfigs.push(`NETMASK=${subnetMask}`);
        
        if (index < results.length - 1) {
            rangeConfigs.push('');
        }
    });
    
    // 添加重启网络服务命令
    bashCommands.push('service network restart');
    
    // bash卡片
    const bashId = 'centos7-bash';
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">bash（循环绑定）</h5>`;
    html += `<div class="config-code" id="${bashId}">${escapeHtml(bashCommands.join('\n'))}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${bashId}')">复制bash命令</button>`;
    html += '</div>';
    
    // range卡片
    const rangeId = 'centos7-range';
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">range（配置文件）</h5>`;
    html += `<div class="collapsible-config">`;
    html += `<div class="config-code" id="${rangeId}" style="max-height: 240px; overflow-y: hidden; transition: max-height 0.3s ease;">${escapeHtml(rangeConfigs.join('\n'))}</div>`;
    html += `<div class="expand-toggle" style="text-align: center; padding: 5px 0; cursor: pointer; color: #667eea;" onclick="toggleNetplanExpand(this)">`;
    html += `<span class="expand-icon">▼</span> 展开`;
    html += `</div>`;
    html += `</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${rangeId}')">复制range配置</button>`;
    html += '</div>';
    
    container.innerHTML = html;
    return container;
}

// 创建合并的Debian 12配置块（所有IP段合并）
function createMergedDebian12ConfigBlocks(results) {
    const container = document.createElement('div');
    container.className = 'config-block';
    
    const nicName = getSelectedNIC();
    
    let html = '<h4>IP绑定</h4>';
    
    // 收集所有IP地址和网关
    let allAddresses = [];
    const gatewayIP = results[0].gatewayIP; // 取第一段IP的网关
    
    results.forEach((data, index) => {
        const firstIP = data.firstUsableIP;
        const lastIP = data.lastUsableIP;
        const cidr = data.networkAddress.split('/')[1];
        
        // 提取IP前三位和最后一段
        const firstParts = firstIP.split('.');
        const lastParts = lastIP.split('.');
        const ipPrefix = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.`;
        const firstOctet = firstParts[3];
        const lastOctet = lastParts[3];
        
        // 收集所有可用IP
        for (let i = parseInt(firstOctet); i <= parseInt(lastOctet); i++) {
            allAddresses.push(`${ipPrefix}${i}/${cidr}`);
        }
    });
    
    // netplan配置（YAML格式）
    const netplanLines = [];
    netplanLines.push(`#vim /etc/netplan/50-cloud-init.yaml`);
    netplanLines.push(`network:`);
    netplanLines.push(`  version: 2`);
    netplanLines.push(`  renderer: networkd`);
    netplanLines.push(`  ethernets:`);
    netplanLines.push(`    "${nicName}":`);
    netplanLines.push(`      dhcp4: no`);
    netplanLines.push(`      addresses:`);
    allAddresses.forEach(addr => {
        netplanLines.push(`        - ${addr}`);
    });
    netplanLines.push(`      routes:`);
    netplanLines.push(`        - to: default`);
    netplanLines.push(`          via: "${gatewayIP}"`);
    netplanLines.push(`      nameservers:`);
    netplanLines.push(`        addresses:`);
    netplanLines.push(`          - 8.8.8.8`);
    netplanLines.push(`          - 114.114.114.114`);
    
    // interfaces配置
    let interfacesConfigs = [];
    interfacesConfigs.push(`#定义接口`);
    interfacesConfigs.push(`grep -q "iface ${nicName} inet static" /etc/network/interfaces || echo -e "auto ${nicName}\\niface ${nicName} inet static" | sudo tee -a /etc/network/interfaces`);
    
    results.forEach((data, index) => {
        const firstIP = data.firstUsableIP;
        const lastIP = data.lastUsableIP;
        const cidr = data.networkAddress.split('/')[1];
        
        // 提取IP前三位和最后一段
        const firstParts = firstIP.split('.');
        const lastParts = lastIP.split('.');
        const ipPrefix = `${firstParts[0]}.${firstParts[1]}.${firstParts[2]}.`;
        const firstOctet = firstParts[3];
        const lastOctet = lastParts[3];
        interfacesConfigs.push(`for i in {${firstOctet}..${lastOctet}}; do echo "    address ${ipPrefix}$i/${cidr}" | sudo tee -a /etc/network/interfaces > /dev/null; done`);
    });
    
    // 添加重启网络服务命令
    interfacesConfigs.push(`sudo systemctl restart networking`);
    
    // interfaces卡片
    const interfacesId = 'debian12-interfaces';
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">interfaces（命令绑定）</h5>`;
    html += `<div class="config-code" id="${interfacesId}">${escapeHtml(interfacesConfigs.join('\n'))}</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${interfacesId}')">复制interfaces命令</button>`;
    html += '</div>';
    
    // netplan卡片
    const netplanId = 'debian12-netplan';
    html += `<h5 style="color: #667eea; margin: 15px 0 8px 0;">netplan（配置文件）</h5>`;
    html += `<div class="collapsible-config">`;
    html += `<div class="config-code" id="${netplanId}" style="max-height: 240px; overflow-y: hidden; transition: max-height 0.3s ease;">${escapeHtml(netplanLines.join('\n'))}</div>`;
    html += `<div class="expand-toggle" style="text-align: center; padding: 5px 0; cursor: pointer; color: #667eea;" onclick="toggleNetplanExpand(this)">`;
    html += `<span class="expand-icon">▼</span> 展开`;
    html += `</div>`;
    html += `</div>`;
    html += '<div class="config-actions">';
    html += `<button class="btn-copy-config" onclick="copyConfig('${netplanId}')">复制netplan配置</button>`;
    html += '</div>';
    
    container.innerHTML = html;
    return container;
}

// 切换netplan展开/折叠
function toggleNetplanExpand(toggleElement) {
    const configCode = toggleElement.previousElementSibling;
    const icon = toggleElement.querySelector('.expand-icon');
    const textNode = toggleElement.childNodes[1]; // 文本节点
    
    if (configCode.style.maxHeight === '240px' || configCode.style.maxHeight === '') {
        // 展开
        configCode.style.maxHeight = configCode.scrollHeight + 'px';
        configCode.style.overflowY = 'auto';
        icon.textContent = '▲';
        textNode.textContent = ' 折叠';
    } else {
        // 折叠
        configCode.style.maxHeight = '240px';
        configCode.style.overflowY = 'hidden';
        icon.textContent = '▼';
        textNode.textContent = ' 展开';
    }
}

// 创建子网计算结果块
function createSubnetResultBlock(results) {
    const container = document.createElement('div');
    container.className = 'config-block';
    
    // 计算总可用主机数
    const totalUsableHosts = results.reduce((sum, r) => sum + (r.usableHosts || 0), 0);
    
    let html = '<h4>子网信息</h4>';
    
    // 第一行：网络地址、子网掩码、网关、可用主机数
    html += '<div class="result-row">';
    
    // 网络地址
    const networkAddrs = results.map(r => escapeHtml(r.original)).join('\n');
    html += '<div class="result-item"><div class="item-label">网络地址</div><div class="item-values">' + networkAddrs + '</div></div>';
    
    // 子网掩码（去重）
    const uniqueMasks = [...new Set(results.map(r => r.subnetMask))];
    const masks = results.map(r => r.subnetMask).join('\n');
    html += '<div class="result-item"><div class="item-label">子网掩码</div><div class="item-values">' + masks + '</div></div>';
    
    // 网关
    const gateways = results.filter(r => r.gatewayIP !== 'N/A').map(r => r.gatewayIP).join('\n');
    html += '<div class="result-item"><div class="item-label">网关</div><div class="item-values">' + gateways + '</div></div>';
    
    // 可用IP数
    const hostCounts = results.filter(r => r.usableHosts > 0).map(r => `${formatNumber(r.usableHosts)}个`).join('\n');
    html += '<div class="result-item highlight"><div class="item-header"><div class="item-label">可用IP数</div><div class="total-count">（总' + formatNumber(totalUsableHosts) + '个）</div></div><div class="item-values">' + hostCounts + '</div></div>';
    
    html += '</div>'; // 结束第一行
    
    // 第二行：可用IP、IP范围
    html += '<div class="result-row">';
    
    // 可用IP
    const usableIPs = results.filter(r => r.usableIPRange !== 'N/A').map(r => `可用IP：${r.usableIPRange}`).join('\n');
    html += '<div class="result-item"><div class="item-label">可用IP</div><div class="item-values">' + usableIPs + '</div></div>';
    
    // IP范围
    const ipRanges = results.filter(r => r.ipRange !== 'N/A').map(r => {
        const parts = r.ipRange.split('-');
        return parts.length === 2 ? `${parts[0]}-${parts[1]}` : '';
    }).filter(Boolean).join('\n');
    html += '<div class="result-item"><div class="item-label">IP范围</div><div class="item-values">' + ipRanges + '</div></div>';
    
    html += '</div>'; // 结束第二行
    
    container.innerHTML = html;
    
    // 为每个 result-item 添加点击复制功能
    const resultItems = container.querySelectorAll('.result-item');
    resultItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.title = '点击复制';
        item.addEventListener('click', function() {
            const values = this.querySelector('.item-values');
            if (values) {
                navigator.clipboard.writeText(values.textContent.trim()).then(() => {
                    showToast('已复制！');
                });
            }
        });
    });
    
    return container;
}

// 生成配置代码
function generateConfigCode(data, os) {
    const networkAddr = data.networkAddress.split('/')[0];
    const cidr = data.networkAddress.split('/')[1];
    const subnetMask = data.subnetMask;
    const gateway = data.gatewayIP;
    
    switch(os) {
        case 'windows':
            const nicName = getSelectedNIC();
            return generateWindowsConfig(networkAddr, cidr, subnetMask, gateway, nicName);
        case 'centos7':
            return generateCentOS7Config(networkAddr, cidr, subnetMask, gateway);
        case 'debian12':
            return generateDebian12Config(networkAddr, cidr, subnetMask, gateway);
        default:
            return '';
    }
}

// 生成Windows配置
function generateWindowsConfig(ip, cidr, mask, gateway, nicName) {
    return `# Windows 网络配置
# 网络地址: ${ip}/${cidr}
# 子网掩码: ${mask}
# 网关: ${gateway}
# 网卡: ${nicName}

# 设置IP地址和子网掩码
netsh interface ip set address name="${nicName}" static ${ip} ${mask} ${gateway}

# 或者使用PowerShell
# New-NetIPAddress -InterfaceAlias "${nicName}" -IPAddress "${ip}" -PrefixLength ${cidr} -DefaultGateway "${gateway}"`;
}

// 生成CentOS 7配置
function generateCentOS7Config(ip, cidr, mask, gateway) {
    return `# CentOS 7 网络配置
# 网络地址: ${ip}/${cidr}
# 子网掩码: ${mask}
# 网关: ${gateway}

# 编辑网卡配置文件（假设网卡名为eth0）
# vi /etc/sysconfig/network-scripts/ifcfg-eth0

TYPE=Ethernet
BOOTPROTO=static
DEFROUTE=yes
NAME=eth0
DEVICE=eth0
ONBOOT=yes
IPADDR=${ip}
PREFIX=${cidr}
GATEWAY=${gateway}
DNS1=8.8.8.8
DNS2=8.8.4.4

# 重启网络服务
systemctl restart network`;
}

// 生成Debian 12配置
function generateDebian12Config(ip, cidr, mask, gateway) {
    return `# Debian 12 网络配置
# 网络地址: ${ip}/${cidr}
# 子网掩码: ${mask}
# 网关: ${gateway}

# 编辑网络接口配置文件
# nano /etc/network/interfaces

auto eth0
iface eth0 inet static
    address ${ip}/${cidr}
    gateway ${gateway}
    dns-nameservers 8.8.8.8 8.8.4.4

# 或者使用NetworkManager
# nmcli con mod "有线连接" ipv4.addresses "${ip}/${cidr}" ipv4.gateway "${gateway}" ipv4.dns "8.8.8.8"

# 重启网络服务
systemctl restart networking`;
}

// 复制配置代码
function copyConfig(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let text = element.textContent;
    
    // 如果是合并的Windows配置，在每行命令后添加换行符
    if (elementId === 'cmd-merged' || elementId === 'ps-merged') {
        const lines = text.split('\n');
        // 确保每行后面都有换行符（包括最后一行）
        text = lines.map(line => line + '\n').join('');
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('配置已复制到剪贴板！');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制');
    });
}

// 复制子网信息（无空白行）
function copySubnetInfo(button) {
    // 找到包含子网信息的容器
    const configBlock = button.closest('.config-block');
    if (!configBlock) return;
    
    // 提取所有标签和值
    const items = configBlock.querySelectorAll('.result-item');
    let text = '';
    
    items.forEach(item => {
        const label = item.querySelector('.item-label');
        const values = item.querySelector('.item-values');
        
        if (label && values) {
            // 添加标签
            text += label.textContent.trim() + '\n';
            
            // 添加值（已经用\n连接）
            const valueText = values.textContent.trim();
            if (valueText) {
                text += valueText + '\n';
            }
        }
    });
    
    // 移除最后多余的换行符
    text = text.trimEnd();
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('子网信息已复制！');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制');
    });
}

// 切换子网查询显示/隐藏
function toggleSubnetQuery() {
    const subnetContainer = document.getElementById('subnetQueryContainer');
    const resultSection = document.getElementById('resultSection');
    
    if (subnetContainer.style.display === 'none') {
        // 显示子网查询内容
        subnetContainer.style.display = 'block';
        
        // 如果结果区域正在显示，先隐藏它
        if (resultSection.style.display !== 'none') {
            resultSection.style.display = 'none';
        }
    } else {
        // 隐藏子网查询内容
        subnetContainer.style.display = 'none';
    }
}

// ========== 子网查询功能 ==========

// 生成子网掩码速查表
function generateSubnetTable() {
    const tableBody = document.getElementById('subnetTableBody');
    if (!tableBody) return;
    
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

// 生成 /25 到 /30 的常用子网信息静态表格
function generateCommonSubnetTable() {
    const container = document.getElementById('commonSubnetDetails');
    if (!container) return;
    
    container.innerHTML = ''; // 清空现有内容
    
    // 使用示例 IP 地址 192.168.1.0 作为基准
    const exampleIP = '192.168.1.0';
    const ipInt = ipToInt(exampleIP);
    
    // 创建主容器（双列布局）
    const mainContainer = document.createElement('div');
    mainContainer.className = 'subnet-detail-columns';
    
    // 左列：/25 到 /29
    const leftColumn = document.createElement('div');
    leftColumn.className = 'subnet-detail-left-column';
    
    // 右列：/30
    const rightColumn = document.createElement('div');
    rightColumn.className = 'subnet-detail-right-column';
    
    // 生成从 /25 到 /30 的所有子网信息
    for (let cidr = 25; cidr <= 30; cidr++) {
        const subnetCount = Math.pow(2, cidr - 24); // 子网数量
        const hostsPerSubnet = Math.pow(2, 32 - cidr) - 2; // 每个子网的可用主机数
        
        // 创建区块容器
        const block = document.createElement('div');
        block.className = 'subnet-detail-block';
        
        // 添加标题
        const title = document.createElement('h3');
        title.textContent = `/${cidr} -- ${subnetCount} Subnets -- ${hostsPerSubnet} Hosts/Subnet`;
        block.appendChild(title);
        
        // 计算每个子网的大小
        const subnetSize = Math.pow(2, 32 - cidr);
        
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
        
        // 生成所有子网
        for (let i = 0; i < subnetCount; i++) {
            const networkInt = ipInt + (i * subnetSize);
            const broadcastInt = networkInt + subnetSize - 1;
            const firstUsable = networkInt + 1;
            const lastUsable = broadcastInt - 1;
            
            const networkAddress = intToIp(networkInt);
            const broadcastAddress = intToIp(broadcastInt);
            const firstUsableIP = intToIp(firstUsable);
            const lastUsableIP = intToIp(lastUsable);
            
            // 只提取IP地址的最后一位
            const networkLastOctet = '.' + networkAddress.split('.').pop();
            const broadcastLastOctet = '.' + broadcastAddress.split('.').pop();
            
            // 根据网关位置生成不同的内容
            let gatewayLastOctet, rangeDisplay;
            
            if (gatewayIsLast) {
                // 网关为尾IP
                gatewayLastOctet = '.' + lastUsableIP.split('.').pop();
                
                if (cidr === 30) {
                    // /30 只有一个可用IP
                    rangeDisplay = '.' + firstUsableIP.split('.').pop();
                } else {
                    // 其他CIDR：从第一个IP到倒数第二个IP
                    const rangeStartLastOctet = '.' + firstUsableIP.split('.').pop();
                    const rangeEndLastOctet = intToIp(broadcastInt - 2).split('.').pop();
                    rangeDisplay = `${rangeStartLastOctet}-${rangeEndLastOctet}`;
                }
            } else {
                // 网关为首IP（默认）
                gatewayLastOctet = '.' + firstUsableIP.split('.').pop();
                
                if (cidr === 30) {
                    // /30 只有一个可用IP，显示第二个IP
                    const secondUsableIP = intToIp(networkInt + 2);
                    rangeDisplay = '.' + secondUsableIP.split('.').pop();
                } else {
                    // 其他CIDR：从第二个IP到最后一个IP
                    const secondUsableIP = intToIp(networkInt + 2);
                    const rangeStartLastOctet = '.' + secondUsableIP.split('.').pop();
                    const rangeEndLastOctet = lastUsableIP.split('.').pop();
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
        
        // 根据CIDR分配到不同的列
        if (cidr === 25 || cidr === 27 || cidr === 29) {
            leftColumn.appendChild(block);
        } else {
            rightColumn.appendChild(block);
        }
    }
    
    mainContainer.appendChild(leftColumn);
    mainContainer.appendChild(rightColumn);
    container.appendChild(mainContainer);
}
