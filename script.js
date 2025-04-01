// 全局变量
let savedPalettes = localStorage.getItem('savedPalettes') ? JSON.parse(localStorage.getItem('savedPalettes')) : [];
let currentBaseColor = '#4361ee';
let pickrInstances = {}; // 存储所有色轮选择器实例

// 在脚本开始处添加防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航
    initNavigation();
    
    // 初始化色轮选择器
    initColorPicker();
    
    // 初始化图片上传
    initImageUpload();
    
    // 初始化WCAG对比度检测
    initWCAGChecker();
    
    // 初始化主题配色助手
    initThemeColorAssistant();
    
    // 初始化保存的配色方案
    displaySavedPalettes();
    
    // 初始化底部快速工具
    initQuickTools();
    
    // 初始化颜色百科功能
    initColorEncyclopedia();
    
    // 初始化图像处理工具
    initImageTools();
});

// 全局可访问函数，用于从AI助手保存配色方案
window.savePaletteFromAI = function(colors) {
    // 创建一个新的配色方案对象
    const newPalette = {
        colors: colors,
        timestamp: new Date().toISOString()
    };
    
    // 获取现有配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    // 添加新配色方案到开头
    palettes.unshift(newPalette);
    
    // 限制保存的配色方案数量为20个
    if (palettes.length > 20) {
        palettes.pop();
    }
    
    // 保存更新后的配色方案
    localStorage.setItem('savedPalettes', JSON.stringify(palettes));
    
    // 更新显示
    displaySavedPalettes();
    
    // 显示保存成功的通知
    showNotification('配色方案已保存');
};

// 全局可访问函数，用于生成新配色方案
window.generateNewPalette = function() {
    if (document.getElementById('ai-assistant-dialog').classList.contains('active')) {
        generateColorResponse("帮我生成一套新配色");
    }
};

// 初始化导航
function initNavigation() {
    console.log('Initializing navigation...');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section-content');
    
    // 首先确保所有section都隐藏，只激活默认的section
    sections.forEach(section => section.classList.remove('active'));
    const defaultSection = document.getElementById('color-tools');
    if (defaultSection) {
        defaultSection.classList.add('active');
    }
    
    // 然后确保导航链接有正确的active状态
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === 'color-tools') {
            link.classList.add('active');
        }
    });
    
    // 为每个导航链接添加点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetSectionId = this.getAttribute('data-section');
            switchToSection(targetSectionId, navLinks);
        });
    });
    
    // 初始化移动端底部导航
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    if (mobileNavItems.length > 0) {
        console.log('Found mobile navigation items:', mobileNavItems.length);
        mobileNavItems.forEach(item => {
            // 设置默认active状态
            if (item.getAttribute('data-section') === 'color-tools') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            // 添加点击事件
            item.addEventListener('click', function() {
                const targetSectionId = this.getAttribute('data-section');
                console.log('Mobile nav clicked:', targetSectionId);
                
                // 更新mobile nav的active状态
                mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
                this.classList.add('active');
                
                // 切换到目标section
                switchToSection(targetSectionId, navLinks);
            });
        });
    } else {
        console.warn('Mobile navigation items not found');
    }
}

// 切换到指定section
function switchToSection(sectionId, navLinks) {
    console.log('Switching to section:', sectionId);
    
    // 获取所有section
    const sections = document.querySelectorAll('.section-content');
    
    // 移除所有active类
    navLinks.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    
    // 找到对应的nav link并添加active类
    const activeNavLink = Array.from(navLinks).find(link => link.getAttribute('data-section') === sectionId);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // 查找并激活目标section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Activated section:', sectionId);
        
        // 如果切换到调色板生成器，初始化配色
        if (sectionId === 'color-palette-section') {
            setTimeout(() => {
                if (document.getElementById('harmony-colors')) {
                    generateColorHarmony('harmony-colors');
                }
            }, 100);
        }
    } else {
        console.error(`Section with ID ${sectionId} not found`);
    }
}

// 显示通知
function showNotification(message, icon = 'ri-check-line') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="${icon}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 初始化色轮选择器
function initColorPicker() {
    console.log('Initializing color pickers...');
    
    // 检查是否有配色工具的色轮选择器容器
    const mainColorPickerContainer = document.querySelector('#color-tools #color-picker-container');
    if (mainColorPickerContainer) {
        console.log('Found main color picker container');
        // 使用Pickr库创建颜色选择器 - 主色轮选择器
        pickrInstances.mainColorPicker = Pickr.create({
            el: mainColorPickerContainer,
            theme: 'nano',
            default: currentBaseColor,
            swatches: [
                '#f44336', '#E91E63', '#9C27B0', '#673AB7',
                '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
                '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
                '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    input: true,
                    save: true
                }
            }
        });
        
        // 颜色选择事件
        pickrInstances.mainColorPicker.on('change', (color) => {
            currentBaseColor = color.toHEXA().toString();
            
            // 更新基准颜色输入框
            const baseColorInput = document.getElementById('base-color');
            if (baseColorInput) {
                baseColorInput.value = currentBaseColor;
            }
            
            // 生成配色方案
            generateColorHarmony('color-palette');
        });
        
        // 初始生成配色方案
        setTimeout(() => generateColorHarmony('color-palette'), 100);
        
        // 配色方案类型变化事件 - 主色轮
        const mainHarmonyType = document.querySelector('#color-tools #harmony-type');
        if (mainHarmonyType) {
            mainHarmonyType.addEventListener('change', () => generateColorHarmony('color-palette'));
        }
    } else {
        console.warn('Main color picker container not found');
    }
    
    // 检查是否有调色板生成器的色轮选择器
    const paletteSection = document.getElementById('color-palette-section');
    if (paletteSection) {
        console.log('Found palette generator section');
        // 确保base-color输入框存在
        const baseColorInput = paletteSection.querySelector('#base-color');
        if (baseColorInput) {
            console.log('Found base color input for palette generator');
            // 初始化输入框值
            baseColorInput.value = currentBaseColor;
            
            // 创建palette section的色轮选择器
            pickrInstances.paletteColorPicker = Pickr.create({
                el: paletteSection.querySelector('#color-picker-container'),
                theme: 'nano',
                default: currentBaseColor,
                swatches: [
                    '#f44336', '#E91E63', '#9C27B0', '#673AB7',
                    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
                    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
                    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
                ],
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                        input: true,
                        save: true
                    }
                }
            });
            
            // 色轮选择器变化事件
            pickrInstances.paletteColorPicker.on('change', (color) => {
                const hexColor = color.toHEXA().toString();
                baseColorInput.value = hexColor;
                currentBaseColor = hexColor;
                generateColorHarmony('harmony-colors');
            });
            
            // 监听输入框变化
            baseColorInput.addEventListener('change', function() {
                currentBaseColor = this.value;
                generateColorHarmony('harmony-colors');
                if (pickrInstances.paletteColorPicker) {
                    pickrInstances.paletteColorPicker.setColor(currentBaseColor);
                }
            });
        } else {
            console.warn('Base color input for palette generator not found');
        }
        
        // 配色方案类型变化事件 - 调色板生成器
        const paletteHarmonyType = paletteSection.querySelector('#harmony-type');
        if (paletteHarmonyType) {
            console.log('Found harmony type selector for palette generator');
            paletteHarmonyType.addEventListener('change', () => generateColorHarmony('harmony-colors'));
        } else {
            console.warn('Harmony type selector for palette generator not found');
        }
        
        // 检查并绑定生成按钮
        const generateButton = paletteSection.querySelector('#generate-harmony');
        if (generateButton) {
            console.log('Found generate button for palette generator');
            generateButton.addEventListener('click', () => generateColorHarmony('harmony-colors'));
        } else {
            console.warn('Generate button for palette generator not found');
        }
    } else {
        console.warn('Palette generator section not found');
    }
    
    // 保存配色方案按钮事件
    const saveButton = document.getElementById('save-palette');
    if (saveButton) {
        saveButton.addEventListener('click', savePalette);
    } else {
        console.warn('Save palette button not found');
    }
}

// 保存当前配色方案
function savePalette() {
    // 获取当前设置的所有颜色
    const colorBlocks = document.querySelectorAll('#color-palette .color-block');
    if (colorBlocks.length === 0) {
        showNotification('请先生成配色方案', 'ri-error-warning-line');
        return;
    }
    
    // 收集颜色值
    const colors = [];
    colorBlocks.forEach(block => {
        // 获取背景颜色
        const style = window.getComputedStyle(block);
        const color = style.backgroundColor;
        
        // 将rgb格式转换为hex格式
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length === 3) {
                const hex = rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
                colors.push(hex);
            }
        } else {
            colors.push(color);
        }
    });
    
    // 创建新的配色方案对象
    const newPalette = {
        colors: colors,
        timestamp: new Date().toISOString()
    };
    
    // 获取现有配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    // 添加新配色方案到开头
    palettes.unshift(newPalette);
    
    // 限制保存的配色方案数量为20个
    if (palettes.length > 20) {
        palettes.pop();
    }
    
    // 保存更新后的配色方案
    localStorage.setItem('savedPalettes', JSON.stringify(palettes));
    
    // 更新显示
    displaySavedPalettes();
    
    // 显示保存成功的通知
    showNotification('配色方案已保存');
}

// 初始化快速工具
function initQuickTools() {
    const quickTools = document.querySelector('.quick-tools');
    if (!quickTools) return;
    
    // 获取各个按钮
    const randomBtn = quickTools.querySelector('.btn:nth-child(1)');
    const clearBtn = quickTools.querySelector('.btn:nth-child(2)');
    const exportBtn = quickTools.querySelector('.btn:nth-child(3)');
    
    // 添加随机配色功能
    if (randomBtn) {
        randomBtn.addEventListener('click', randomizePalette);
    }
    
    // 添加清除历史功能
    if (clearBtn) {
        clearBtn.addEventListener('click', clearHistory);
    }
    
    // 添加导出所有功能
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAllPalettes);
    }
}

// 生成随机颜色
function randomizePalette() {
    // 从多种常见调色板类型中随机选择一种
    const paletteTypes = [
        'complementary',
        'analogous',
        'triadic',
        'tetradic',
        'monochromatic',
        'split-complementary'
    ];
    
    const randomType = paletteTypes[Math.floor(Math.random() * paletteTypes.length)];
    
    // 生成随机基准色
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const randomBaseColor = rgbToHex(r, g, b);
    
    // 计算和谐配色
    const harmonyColors = calculateHarmonyColors(randomBaseColor, randomType);
    
    // 创建新的配色方案对象
    const newPalette = {
        colors: [randomBaseColor, ...harmonyColors],
        timestamp: new Date().toISOString()
    };
    
    // 获取保存的配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    // 添加新配色方案到开头
    palettes.unshift(newPalette);
    
    // 限制保存的配色方案数量为20个
    if (palettes.length > 20) {
        palettes.pop();
    }
    
    // 保存配色方案
    localStorage.setItem('savedPalettes', JSON.stringify(palettes));
    
    // 更新显示
    displaySavedPalettes();
    
    // 显示通知
    showNotification(`已生成随机${getPaletteTypeName(randomType)}配色方案`);
}

// 获取配色类型的中文名称
function getPaletteTypeName(type) {
    const typeNames = {
        'complementary': '互补色',
        'analogous': '邻近色',
        'triadic': '三等分色',
        'tetradic': '四等分色',
        'monochromatic': '单色系',
        'split-complementary': '分裂互补色'
    };
    
    return typeNames[type] || type;
}

// 清除历史
function clearHistory() {
    if (confirm('确定要清除所有保存的配色方案吗？')) {
        savedPalettes = [];
        localStorage.removeItem('savedPalettes');
        displaySavedPalettes();
        showNotification('历史记录已清除', 'ri-delete-bin-line');
    }
}

// 导出所有保存的配色方案
function exportAllPalettes() {
    // 获取保存的配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    if (palettes.length === 0) {
        showNotification('暂无保存的配色方案', 'ri-error-warning-line');
        return;
    }
    
    // 创建可下载的JSON数据
    const dataStr = JSON.stringify(palettes, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'colorpal_palettes_' + new Date().toISOString().slice(0, 10) + '.json');
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('配色方案已导出', 'ri-download-2-line');
}

// 生成颜色和谐配色方案
function generateColorHarmony(targetContainerId = 'color-palette') {
    // 查找当前使用的颜色配置界面
    const isMainColorTools = targetContainerId === 'color-palette';
    
    // 获取合适的harmonyType
    let harmonyTypeSelect;
    if (isMainColorTools) {
        harmonyTypeSelect = document.querySelector('#color-tools #harmony-type');
    } else {
        harmonyTypeSelect = document.querySelector('#color-palette-section #harmony-type');
    }
    
    if (!harmonyTypeSelect) {
        console.error('无法找到配色类型选择器');
        return;
    }
    
    const harmonyType = harmonyTypeSelect.value;
    let baseColor = currentBaseColor;
    
    // 如果是从调色板生成部分调用，则使用输入框的值
    if (targetContainerId === 'harmony-colors') {
        const baseColorInput = document.getElementById('base-color');
        if (baseColorInput && baseColorInput.value) {
            baseColor = baseColorInput.value;
            currentBaseColor = baseColor;
        }
    }
    
    if (!baseColor) {
        showNotification('请选择基准颜色', 'ri-error-warning-line');
        return;
    }
    
    const harmonyColors = calculateHarmonyColors(baseColor, harmonyType);
    
    // 找到要更新的容器
    const container = document.getElementById(targetContainerId);
    if (!container) {
        console.error(`找不到容器: ${targetContainerId}`);
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 添加基准色
    createColorBlock(baseColor, container);
    
    // 添加和谐色
    harmonyColors.forEach(color => {
        createColorBlock(color, container);
    });
    
    // 检查是否是调色板部分，添加保存按钮
    if (targetContainerId === 'harmony-colors') {
        // 清除之前可能存在的按钮
        const existingButtons = document.querySelectorAll('#save-harmony-palette');
        existingButtons.forEach(btn => btn.remove());
        
        // 创建新的保存按钮
        const saveButton = document.createElement('button');
        saveButton.id = 'save-harmony-palette';
        saveButton.className = 'btn btn-primary mt-3';
        saveButton.innerHTML = '<i class="ri-save-line me-1"></i> 保存配色方案';
        saveButton.onclick = saveHarmonyPalette;
        
        // 添加到容器后面
        container.parentNode.appendChild(saveButton);
    }
}

// 保存和谐配色方案
function saveHarmonyPalette() {
    const paletteContainer = document.getElementById('harmony-colors');
    if (!paletteContainer) return;
    
    const colorElements = paletteContainer.querySelectorAll('.color-block');
    if (colorElements.length === 0) return;
    
    const colors = [];
    colorElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.backgroundColor;
        // 将rgb转换为hex
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length === 3) {
                const hex = rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
                colors.push(hex);
            }
        } else {
            colors.push(color);
        }
    });
    
    // 使用标准的palette保存格式
    const newPalette = {
        colors: colors,
        timestamp: new Date().toISOString()
    };
    
    // 获取现有配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    // 添加新配色方案到开头
    palettes.unshift(newPalette);
    
    // 限制保存的配色方案数量为20个
    if (palettes.length > 20) {
        palettes.pop();
    }
    
    // 保存更新后的配色方案
    localStorage.setItem('savedPalettes', JSON.stringify(palettes));
    
    // 更新显示
    displaySavedPalettes();
    
    // 显示保存成功的通知
    showNotification('配色方案已保存');
    
    // 如果色轮选择器是打开的，关闭它
    if (pickrInstances.harmonyColorPicker && pickrInstances.harmonyColorPicker.isOpen()) {
        pickrInstances.harmonyColorPicker.hide();
    }
}

// 计算和谐色彩
function calculateHarmonyColors(baseColor, harmonyType) {
    // 将颜色转换为HSL格式，便于计算
    const hsl = hexToHSL(baseColor);
    const h = hsl.h;
    const s = hsl.s;
    const l = hsl.l;
    
    const colors = [];
    
    switch (harmonyType) {
        case 'monochromatic':
            // 单色方案：相同色相，不同亮度和饱和度
            colors.push(
                hslToHex(h, s, Math.max(0, l - 0.3)),
                hslToHex(h, Math.max(0, s - 0.3), l),
                hslToHex(h, Math.min(1, s + 0.1), Math.min(0.9, l + 0.2)),
                hslToHex(h, Math.min(1, s + 0.1), Math.max(0.1, l - 0.2))
            );
            break;
            
        case 'analogous':
            // 类比色：相邻的色相
            colors.push(
                hslToHex((h + 30) % 360, s, l),
                hslToHex((h + 60) % 360, s, l),
                hslToHex((h - 30 + 360) % 360, s, l),
                hslToHex((h - 60 + 360) % 360, s, l)
            );
            break;
            
        case 'complementary':
            // 互补色：相对的色相
            const compH = (h + 180) % 360;
            colors.push(
                hslToHex(compH, s, l),
                hslToHex(h, Math.min(1, s + 0.1), Math.min(0.9, l + 0.1)),
                hslToHex(compH, Math.min(1, s + 0.1), Math.min(0.9, l + 0.1)),
                hslToHex(h, Math.max(0, s - 0.2), Math.max(0.1, l - 0.2))
            );
            break;
            
        case 'triadic':
            // 三分色：三个等距的色相
            colors.push(
                hslToHex((h + 120) % 360, s, l),
                hslToHex((h + 240) % 360, s, l),
                hslToHex(h, Math.min(1, s + 0.1), Math.min(0.9, l + 0.1)),
                hslToHex((h + 120) % 360, Math.min(1, s + 0.1), Math.min(0.9, l + 0.1))
            );
            break;
            
        case 'tetradic':
            // 四分色：四个等距的色相
            colors.push(
                hslToHex((h + 90) % 360, s, l),
                hslToHex((h + 180) % 360, s, l),
                hslToHex((h + 270) % 360, s, l),
                hslToHex(h, Math.min(1, s + 0.1), Math.min(0.9, l + 0.1))
            );
            break;
    }
    
    return colors;
}

// 创建颜色块
function createColorBlock(color, container) {
    const colorBlock = document.createElement('div');
    colorBlock.className = 'color-block';
    colorBlock.style.backgroundColor = color;
    colorBlock.setAttribute('data-color', color);
    
    // 添加复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'color-copy-btn';
    copyBtn.innerHTML = '<i class="ri-file-copy-line"></i>';
    copyBtn.title = '复制色值';
    copyBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        navigator.clipboard.writeText(color)
            .then(() => showNotification(`已复制色值：${color}`))
            .catch(err => console.error('复制失败：', err));
    });
    
    // 添加颜色值显示
    const colorValues = document.createElement('div');
    colorValues.className = 'color-values';
    
    // 计算并显示不同格式的颜色值
    const hexValue = color;
    const rgbValue = hexToRGB(hexValue);
    
    colorValues.innerHTML = `
        <div>${hexValue}</div>
        <div>RGB(${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b})</div>
    `;
    
    // 将元素添加到颜色块
    colorBlock.appendChild(copyBtn);
    colorBlock.appendChild(colorValues);
    
    // 将颜色块添加到容器
    container.appendChild(colorBlock);
}

// 初始化图片上传
function initImageUpload() {
    const dropArea = document.getElementById('image-drop-area');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const colorCountSlider = document.getElementById('color-count');
    const colorCountValue = document.getElementById('color-count-value');
    const downloadButton = document.getElementById('download-palette');
    
    // 检查所有元素是否存在
    if (!dropArea || !fileInput || !preview || !previewImg || !colorCountSlider || !colorCountValue) {
        console.error('图片上传区域初始化失败：缺少必要DOM元素');
        return;
    }
    
    // 颜色数量滑块事件
    colorCountSlider.addEventListener('input', function() {
        const value = this.value;
        colorCountValue.textContent = value;
        
        // 如果预览图已经加载，重新提取颜色
        if (previewImg.complete && previewImg.naturalWidth && !preview.classList.contains('d-none')) {
            extractColorsFromImage();
        }
    });
    
    // 防止默认行为
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 高亮放置区域
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    // 取消高亮放置区域
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    // 添加拖放事件监听
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // 处理拖放的文件
    dropArea.addEventListener('drop', handleDrop, false);
    
    // 文件输入事件
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // 处理放置的文件
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // 下载调色板按钮
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const extractedColors = document.querySelectorAll('#extracted-colors .extracted-color-block');
            if (extractedColors.length === 0) {
                showNotification('没有可下载的颜色', 'ri-error-warning-line');
                return;
            }
            
            // 收集颜色值
            const colors = Array.from(extractedColors).map(block => block.getAttribute('data-color'));
            
            // 创建一个画布来生成调色板图像
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const blockSize = 100;
            const padding = 10;
            const width = colors.length * (blockSize + padding) + padding;
            const height = blockSize + padding * 2;
            
            canvas.width = width;
            canvas.height = height;
            
            // 设置白色背景
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            
            // 绘制颜色块
            colors.forEach((color, index) => {
                const x = padding + index * (blockSize + padding);
                const y = padding;
                
                // 绘制颜色块
                ctx.fillStyle = color;
                ctx.fillRect(x, y, blockSize, blockSize);
                
                // 添加边框
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, blockSize, blockSize);
                
                // 添加颜色文本
                ctx.fillStyle = getContrastColor(color);
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(color, x + blockSize / 2, y + blockSize / 2);
            });
            
            // 转换为图像数据URL
            const dataURL = canvas.toDataURL('image/png');
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'color-palette.png';
            link.click();
            
            showNotification('调色板已下载', 'ri-download-line');
        });
    }
}

// 显示保存的配色方案
function displaySavedPalettes() {
    const savedPalettesContainer = document.getElementById('saved-palettes');
    if (!savedPalettesContainer) return;
    
    // 清空容器
    savedPalettesContainer.innerHTML = '';
    
    // 获取保存的配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    if (palettes.length === 0) {
        savedPalettesContainer.innerHTML = '<p class="text-muted">暂无保存的配色方案</p>';
        return;
    }
    
    // 显示最近的5个配色方案
    palettes.slice(0, 5).forEach((palette, index) => {
        const paletteDiv = document.createElement('div');
        paletteDiv.className = 'saved-palette-item me-2 mb-2';
        paletteDiv.setAttribute('data-index', index);
        
        // 创建颜色块
        palette.colors.forEach(color => {
            const colorBlock = document.createElement('div');
            colorBlock.className = 'saved-color-block';
            colorBlock.style.backgroundColor = color;
            colorBlock.setAttribute('data-color', color);
            
            // 添加点击事件以复制颜色
            colorBlock.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡到父元素
                copyColorToClipboard(color);
                showNotification(`已复制颜色: ${color}`);
            });
            
            paletteDiv.appendChild(colorBlock);
        });
        
        // 添加点击整个方案事件以加载该配色方案
        paletteDiv.addEventListener('click', () => {
            loadPalette(palette);
            showNotification('已应用配色方案');
        });
        
        savedPalettesContainer.appendChild(paletteDiv);
    });
}

// 复制颜色值到剪贴板
function copyColorToClipboard(color) {
    const tempInput = document.createElement('input');
    tempInput.value = color;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    showNotification(`已复制颜色值: ${color}`, 'ri-file-copy-line');
}

// 加载保存的配色方案
function loadPalette(palette) {
    if (palette && palette.colors && palette.colors.length > 0) {
        // 设置基础颜色
        currentBaseColor = palette.colors[0];
        
        // 切换到配色工具选项卡
        document.querySelector('.nav-link[data-section="color-tools"]').click();
        
        // 更新色轮选择器
        const pickrInstance = Pickr.create({el: '#color-picker-container'});
        if (pickrInstance) {
            pickrInstance.setColor(currentBaseColor);
        }
        
        // 手动展示所有颜色
        const colorPalette = document.getElementById('color-palette');
        colorPalette.innerHTML = '';
        
        palette.colors.forEach(color => {
            createColorBlock(color, colorPalette);
        });
        
        showNotification('已加载配色方案');
    }
}

// 颜色转换工具函数
function hexToRGB(hex) {
    // 移除#号如果存在
    hex = hex.replace('#', '');
    
    // 解析颜色值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToHSL(hex) {
    // 首先转换为RGB
    const rgb = hexToRGB(hex);
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // 灰色
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h = Math.round(h * 60);
    }
    
    s = Math.round(s * 100) / 100;
    l = Math.round(l * 100) / 100;
    
    return { h, s, l };
}

function hslToHex(h, s, l) {
    h /= 360;
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // 灰色
    } else {
        const hue2rgb = function(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 获取对比色（用于在颜色背景上显示文本）
function getContrastColor(hexColor) {
    // 转换hex为rgb
    const rgb = hexToRGB(hexColor);
    
    // 计算亮度
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    // 根据亮度返回黑色或白色
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

// 主题配色助手功能
function initThemeColorAssistant() {
    const themeColors = {
        // 行业主题配色
        // 金融行业
        finance: {
            traditional: {
                name: '传统金融',
                colors: ['#1C2B4B', '#243B6C', '#2E4C8A', '#4169E1', '#F5F5F5'],
                description: '稳重可靠、专业权威的传统金融配色，适合银行、证券等机构'
            },
            fintech: {
                name: '金融科技',
                colors: ['#0052CC', '#00C7E6', '#36B37E', '#172B4D', '#FFFFFF'],
                description: '现代感强、科技感突出的互联网金融配色，适合互联网金融产品'
            },
            wealth: {
                name: '财富管理',
                colors: ['#B8860B', '#DAA520', '#FFD700', '#1C1C1C', '#FFFFFF'],
                description: '高端奢华、尊贵专属的财富管理配色，适合私人银行、资产管理'
            }
        },
        
        // 电商行业
        ecommerce: {
            general: {
                name: '综合电商',
                colors: ['#FF4400', '#FF7300', '#FFB000', '#333333', '#FFFFFF'],
                description: '活力四射、促销感强的电商配色，适合综合购物平台'
            },
            luxury: {
                name: '奢侈品电商',
                colors: ['#000000', '#1A1A1A', '#D4AF37', '#FFFFFF', '#F5F5F5'],
                description: '简约高级、优雅精致的奢侈品配色，适合高端购物平台'
            },
            fresh: {
                name: '生鲜电商',
                colors: ['#7CB342', '#8BC34A', '#4CAF50', '#2E7D32', '#FFFFFF'],
                description: '清新自然、健康活力的生鲜配色，适合生鲜食品平台'
            }
        },
        
        // 教育行业
        education: {
            k12: {
                name: 'K12教育',
                colors: ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#FFFFFF'],
                description: '活泼明快、充满童趣的教育配色，适合少儿教育平台'
            },
            university: {
                name: '高等教育',
                colors: ['#1565C0', '#0D47A1', '#2E7D32', '#263238', '#FFFFFF'],
                description: '庄重严谨、学术气息的教育配色，适合高等教育机构'
            },
            professional: {
                name: '职业教育',
                colors: ['#455A64', '#607D8B', '#90A4AE', '#37474F', '#FFFFFF'],
                description: '专业稳重、职场感强的教育配色，适合职业培训平台'
            }
        },
        
        // 母婴行业
        maternal: {
            baby: {
                name: '婴幼儿用品',
                colors: ['#FF69B4', '#FFB6C1', '#87CEEB', '#98FB98', '#FFFFFF'],
                description: '温馨可爱、柔和舒适的母婴配色，适合婴幼儿产品平台'
            },
            maternity: {
                name: '孕妇用品',
                colors: ['#DDA0DD', '#E6E6FA', '#F0F8FF', '#FFF0F5', '#FFFFFF'],
                description: '温柔细腻、安心舒适的孕妇用品配色，适合孕妇产品平台'
            },
            education: {
                name: '早教产品',
                colors: ['#FF7F50', '#FFD700', '#98FB98', '#87CEEB', '#FFFFFF'],
                description: '活泼有趣、益智启蒙的早教配色，适合儿童教育产品'
            }
        },
        
        // 科技行业
        technology: {
            software: {
                name: '软件科技',
                colors: ['#2196F3', '#03A9F4', '#00BCD4', '#263238', '#FFFFFF'],
                description: '现代简约、科技感强的软件配色，适合各类软件产品'
            },
            ai: {
                name: '人工智能',
                colors: ['#6200EA', '#651FFF', '#7C4DFF', '#1A237E', '#FFFFFF'],
                description: '未来感强、高科技感的AI配色，适合人工智能产品'
            },
            hardware: {
                name: '硬件科技',
                colors: ['#424242', '#616161', '#757575', '#212121', '#FFFFFF'],
                description: '工业感强、质感突出的硬件配色，适合硬件产品展示'
            }
        },
        
        // 医疗健康
        healthcare: {
            hospital: {
                name: '医院诊所',
                colors: ['#4CAF50', '#81C784', '#C8E6C9', '#2E7D32', '#FFFFFF'],
                description: '专业可靠、清新卫生的医疗配色，适合医疗机构'
            },
            wellness: {
                name: '健康养生',
                colors: ['#66BB6A', '#A5D6A7', '#E8F5E9', '#388E3C', '#FFFFFF'],
                description: '自然养生、健康生活的配色，适合养生保健产品'
            },
            pharmacy: {
                name: '药店医药',
                colors: ['#43A047', '#66BB6A', '#C8E6C9', '#1B5E20', '#FFFFFF'],
                description: '专业可靠、清新明快的医药配色，适合药店医药平台'
            }
        },
        
        // 文化娱乐
        entertainment: {
            game: {
                name: '游戏娱乐',
                colors: ['#7B1FA2', '#9C27B0', '#BA68C8', '#4A148C', '#FFFFFF'],
                description: '炫酷动感、充满活力的游戏配色，适合游戏娱乐平台'
            },
            video: {
                name: '视频媒体',
                colors: ['#D32F2F', '#F44336', '#EF9A9A', '#B71C1C', '#FFFFFF'],
                description: '热情活力、吸引眼球的视频配色，适合视频媒体平台'
            },
            music: {
                name: '音乐平台',
                colors: ['#512DA8', '#673AB7', '#9575CD', '#311B92', '#FFFFFF'],
                description: '律动感强、艺术气息的音乐配色，适合音乐平台'
            }
        },
        
        // 美食餐饮
        food: {
            restaurant: {
                name: '餐厅美食',
                colors: ['#FF5722', '#FF7043', '#FFCCBC', '#BF360C', '#FFFFFF'],
                description: '食欲感强、温暖诱人的餐饮配色，适合餐饮平台'
            },
            cafe: {
                name: '咖啡甜点',
                colors: ['#795548', '#8D6E63', '#D7CCC8', '#3E2723', '#FFFFFF'],
                description: '温馨优雅、休闲舒适的咖啡配色，适合咖啡甜点店'
            },
            delivery: {
                name: '外卖平台',
                colors: ['#FFA000', '#FFB300', '#FFECB3', '#FF6F00', '#FFFFFF'],
                description: '活力四射、促销感强的外卖配色，适合外卖平台'
            }
        },
        
        // 时尚美妆
        fashion: {
            luxury: {
                name: '奢侈品牌',
                colors: ['#212121', '#424242', '#D4AF37', '#000000', '#FFFFFF'],
                description: '高端奢华、优雅时尚的奢侈品配色，适合奢侈品牌'
            },
            cosmetics: {
                name: '美妆护肤',
                colors: ['#EC407A', '#F48FB1', '#FCE4EC', '#880E4F', '#FFFFFF'],
                description: '优雅精致、浪漫柔美的美妆配色，适合美妆护肤品牌'
            },
            clothing: {
                name: '服装时尚',
                colors: ['#455A64', '#607D8B', '#CFD8DC', '#263238', '#FFFFFF'],
                description: '时尚简约、品质感强的服装配色，适合服装品牌'
            }
        },
        
        // 添加节日和促销活动主题配色
        seasonal: {
            // 春节系列
            springFestival: {
                name: '春节',
                colors: ['#E25822', '#FFB61E', '#E8BC4D', '#8B0304', '#FFFFFF'],
                description: '喜庆热闹、富贵吉祥的新春配色，以红金为主，搭配白色增加层次感'
            },
            lanternFestival: {
                name: '元宵节',
                colors: ['#FF4D4D', '#FFD700', '#FF69B4', '#4A0404', '#FFFFFF'],
                description: '欢快温馨的元宵节配色，以红粉为主，体现出节日的温暖喜庆'
            },
            springPromotion: {
                name: '春季促销',
                colors: ['#95C23D', '#FFC0CB', '#87CEEB', '#FFFFFF', '#333333'],
                description: '清新明快的春季配色，以嫩绿粉蓝为主，展现春天的活力与生机'
            },
            easter: {
                name: '复活节',
                colors: ['#FFB7C5', '#98FB98', '#87CEEB', '#E6E6FA', '#FFFFFF'],
                description: '温柔甜美的复活节配色，以粉嫩色调为主，营造温馨欢乐的节日氛围'
            },

            // 夏季主题
            mothersDay: {
                name: '母亲节',
                colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFFFFF', '#4A4A4A'],
                description: '温馨浪漫的母亲节配色，以粉色系为主，体现母爱的温暖与柔情'
            },
            fathersDay: {
                name: '父亲节',
                colors: ['#000080', '#4169E1', '#1E90FF', '#F5F5F5', '#2F4F4F'],
                description: '稳重大气的父亲节配色，以深蓝为主，展现父爱的深沉与可靠'
            },
            dragonBoatFestival: {
                name: '端午节',
                colors: ['#006400', '#228B22', '#98FB98', '#FFD700', '#FFFFFF'],
                description: '清新自然的端午节配色，以翠绿为主，点缀金黄，突出节日特色'
            },

            // 秋季主题
            midAutumnFestival: {
                name: '中秋节',
                colors: ['#4A148C', '#6A1B9A', '#FFD700', '#E6E6FA', '#FFFFFF'],
                description: '典雅温润的中秋配色，以紫色月光为主题，搭配金色，营造团圆氛围'
            },
            backToSchool: {
                name: '返校季',
                colors: ['#1565C0', '#42A5F5', '#BBDEFB', '#FFFFFF', '#333333'],
                description: '青春活力的返校季配色，以蓝色为主，展现朝气与求知欲望'
            },
            nationalDay: {
                name: '国庆节',
                colors: ['#FF0000', '#FFD700', '#FFFFFF', '#8B0000', '#000000'],
                description: '庄重喜庆的国庆节配色，以红金为主，体现节日的隆重与喜悦'
            },

            // 冬季主题
            halloween: {
                name: '万圣节',
                colors: ['#FF4500', '#000000', '#4B0082', '#FFD700', '#FFFFFF'],
                description: '神秘炫酷的万圣节配色，以橙黑为主，营造节日的神秘氛围'
            },
            thanksgiving: {
                name: '感恩节',
                colors: ['#8B4513', '#DEB887', '#FFE4B5', '#F4A460', '#FFFFFF'],
                description: '温暖自然的感恩节配色，以棕色系为主，营造温馨感恩的氛围'
            },
            blackFriday: {
                name: '黑色星期五',
                colors: ['#000000', '#FF0000', '#FFD700', '#FFFFFF', '#333333'],
                description: '强烈冲击的黑五配色，以黑红为主，突出促销的紧迫感与优惠力度'
            },
            cyberMonday: {
                name: '网络星期一',
                colors: ['#0288D1', '#29B6F6', '#81D4FA', '#FFFFFF', '#333333'],
                description: '科技感强的网一配色，以蓝色为主，突出线上购物的科技属性'
            },
            christmas: {
                name: '圣诞节',
                colors: ['#006400', '#FF0000', '#FFD700', '#FFFFFF', '#228B22'],
                description: '欢乐祥和的圣诞配色，以红绿为主，营造浓厚的节日气氛'
            }
        }
    };

    const themeContainer = document.getElementById('theme-color-container');
    
    // 创建主题分类
    const categories = {
        'finance': '金融行业',
        'ecommerce': '电商行业',
        'education': '教育行业',
        'maternal': '母婴行业',
        'technology': '科技行业',
        'healthcare': '医疗健康',
        'entertainment': '文化娱乐',
        'food': '美食餐饮',
        'fashion': '时尚美妆',
        'seasonal': '节日活动'
    };

    // 创建分类选择器
    const categorySelect = document.createElement('select');
    categorySelect.className = 'form-select mb-3';
    categorySelect.innerHTML = '<option value="">选择行业类型...</option>';
    Object.entries(categories).forEach(([key, value]) => {
        categorySelect.innerHTML += `<option value="${key}">${value}</option>`;
    });
    themeContainer.appendChild(categorySelect);

    // 创建子类选择器
    const subCategorySelect = document.createElement('select');
    subCategorySelect.className = 'form-select mb-3';
    subCategorySelect.innerHTML = '<option value="">选择具体场景...</option>';
    subCategorySelect.disabled = true;
    themeContainer.appendChild(subCategorySelect);

    // 创建颜色展示区域
    const colorDisplay = document.createElement('div');
    colorDisplay.className = 'theme-color-display mb-3';
    themeContainer.appendChild(colorDisplay);

    // 创建描述文本区域
    const descriptionDisplay = document.createElement('div');
    descriptionDisplay.className = 'theme-description mb-3';
    themeContainer.appendChild(descriptionDisplay);

    // 创建操作按钮组
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'btn-group d-none';
    buttonGroup.innerHTML = `
        <button class="btn btn-primary" id="apply-theme">应用此配色方案</button>
        <button class="btn btn-outline-primary" id="save-theme">保存此配色方案</button>
    `;
    themeContainer.appendChild(buttonGroup);

    // 分类选择事件
    categorySelect.addEventListener('change', function() {
        subCategorySelect.innerHTML = '<option value="">选择具体场景...</option>';
        colorDisplay.innerHTML = '';
        descriptionDisplay.innerHTML = '';
        buttonGroup.classList.add('d-none');

        if (!this.value) {
            subCategorySelect.disabled = true;
            return;
        }

        subCategorySelect.disabled = false;
        const category = this.value;
        
        // 根据分类加载子类选项
        Object.entries(themeColors[category]).forEach(([key, theme]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = theme.name;
            subCategorySelect.appendChild(option);
        });
    });

    // 子类选择事件
    subCategorySelect.addEventListener('change', function() {
        const category = categorySelect.value;
        const subCategory = this.value;
        
        if (!category || !subCategory) {
            colorDisplay.innerHTML = '';
            descriptionDisplay.innerHTML = '';
            buttonGroup.classList.add('d-none');
            return;
        }

        const selectedTheme = themeColors[category][subCategory];

        // 显示颜色块
        colorDisplay.innerHTML = '';
        selectedTheme.colors.forEach(color => {
            const colorBlock = document.createElement('div');
            colorBlock.className = 'theme-color-block';
            colorBlock.style.backgroundColor = color;
            colorBlock.title = color;
            
            // 添加点击复制功能
            colorBlock.addEventListener('click', () => {
                navigator.clipboard.writeText(color);
                showNotification(`已复制颜色代码: ${color}`, 'ri-clipboard-line');
            });
            
            colorDisplay.appendChild(colorBlock);
        });

        // 显示描述
        descriptionDisplay.innerHTML = `
            <div class="alert alert-info">
                <h6 class="mb-2">${selectedTheme.name}</h6>
                <p class="mb-0">${selectedTheme.description}</p>
            </div>
        `;

        // 显示按钮组
        buttonGroup.classList.remove('d-none');
    });

    // 应用配色方案
    document.getElementById('apply-theme').addEventListener('click', function() {
        const category = categorySelect.value;
        const subCategory = subCategorySelect.value;
        if (!category || !subCategory) return;

        const selectedTheme = themeColors[category][subCategory];
        
        // 更新调色板
        const colorPalette = document.getElementById('color-palette');
        if (colorPalette) {
            colorPalette.innerHTML = '';
            selectedTheme.colors.forEach(color => {
                createColorBlock(color, colorPalette);
            });
        }

        showNotification(`已应用${selectedTheme.name}配色方案`, 'ri-palette-line');
    });

    // 保存配色方案
    document.getElementById('save-theme').addEventListener('click', function() {
        const category = categorySelect.value;
        const subCategory = subCategorySelect.value;
        if (!category || !subCategory) return;

        const selectedTheme = themeColors[category][subCategory];

        // 保存到本地存储
        const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        const newPalette = {
            name: selectedTheme.name,
            colors: selectedTheme.colors,
            timestamp: new Date().toISOString()
        };
        savedPalettes.unshift(newPalette);
        
        // 限制保存数量
        if (savedPalettes.length > 20) {
            savedPalettes.pop();
        }
        
        localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));

        showNotification(`已保存${selectedTheme.name}配色方案`, 'ri-save-line');
        
        // 刷新已保存的配色方案显示
        if (typeof displaySavedPalettes === 'function') {
            displaySavedPalettes();
        }
    });

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .theme-color-display {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        .theme-color-block {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
        }
        .theme-color-block:hover {
            transform: scale(1.1);
        }
        .theme-color-block:active {
            transform: scale(0.95);
        }
        .btn-group {
            display: flex;
            gap: 10px;
        }
        .theme-description {
            margin: 20px 0;
        }
        .form-select {
            font-size: 1rem;
            padding: 0.5rem;
            border-radius: 6px;
            border: 1px solid #ced4da;
        }
        .form-select:disabled {
            background-color: #e9ecef;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

// 图像处理工具变量
let cropper;
let currentImageFile = null;
let currentImageURL = null;
let removedBgImageURL = null;
let currentRemoveBgType = 'auto';
let currentBgColor = '#FFFFFF';

// 初始化图像处理工具
function initImageTools() {
    const dropArea = document.getElementById('image-tools-drop-area');
    const fileInput = document.getElementById('imageToolsFileInput');
    const imageUploadCard = document.getElementById('image-upload-card');
    const imagePreviewCard = document.getElementById('image-preview-card');
    const previewImage = document.getElementById('preview-image');
    const changeImageBtn = document.getElementById('change-image');
    
    let currentFile = null;
    let currentImageURL = null;
    let cropper = null;
    let watermarkColor = '#FFFFFF';
    let watermarkOpacity = 0.5;
    
    // 防止默认拖放行为
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 高亮拖放区域
    function highlight() {
        dropArea.classList.add('highlight');
    }

    // 取消高亮
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    // 处理图片文件
    function handleImageFiles(files) {
        if (files && files[0]) {
            if (currentImageURL) {
                URL.revokeObjectURL(currentImageURL);
            }
            currentFile = files[0];
            currentImageURL = URL.createObjectURL(files[0]);
            
            // 显示预览
            previewImage.src = currentImageURL;
            // 隐藏上传区域
            imageUploadCard.classList.add('d-none');
            // 显示预览和编辑区域
            imagePreviewCard.classList.remove('d-none');
            
            // 初始化裁剪工具
            initCropper();
        }
    }

    // 初始化裁剪工具
    function initCropper() {
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(previewImage, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.9,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
    }

    // 绑定拖放事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleImageFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleImageFiles(this.files);
    });

    // 更换图片按钮事件
    changeImageBtn.addEventListener('click', function() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        if (currentImageURL) {
            URL.revokeObjectURL(currentImageURL);
            currentImageURL = null;
        }
        currentFile = null;
        previewImage.src = '';
        
        // 重置所有调整
        imageAdjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0
        };
        currentFilter = 'none';
        document.querySelectorAll('.filter-buttons button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'none');
        });
        document.getElementById('brightness').value = 0;
        document.getElementById('contrast').value = 0;
        document.getElementById('saturation').value = 0;
        
        // 显示上传区域
        imageUploadCard.classList.remove('d-none');
        imagePreviewCard.classList.add('d-none');
        
        // 重置文件输入
        fileInput.value = '';
    });

    // 裁剪比例按钮事件
    document.querySelectorAll('.ratio-button-group button').forEach(button => {
        button.addEventListener('click', function() {
            if (!cropper) return;
            
            const ratio = this.dataset.ratio;
            let aspectRatio = NaN;
            
            if (ratio !== 'free') {
                const [width, height] = ratio.split(':').map(Number);
                aspectRatio = width / height;
            }
            
            document.querySelectorAll('.ratio-button-group button').forEach(btn => {
                btn.classList.toggle('active', btn === this);
            });
            
            cropper.setAspectRatio(aspectRatio);
        });
    });

    // 旋转和翻转按钮事件
    document.getElementById('rotate-left').addEventListener('click', () => cropper && cropper.rotate(-90));
    document.getElementById('rotate-right').addEventListener('click', () => cropper && cropper.rotate(90));
    document.getElementById('flip-horizontal').addEventListener('click', () => cropper && cropper.scaleX(-cropper.getData().scaleX || -1));
    document.getElementById('flip-vertical').addEventListener('click', () => cropper && cropper.scaleY(-cropper.getData().scaleY || -1));

    // 图像调整事件
    document.getElementById('brightness').addEventListener('input', function() {
        imageAdjustments.brightness = parseInt(this.value);
    });
    
    document.getElementById('contrast').addEventListener('input', function() {
        imageAdjustments.contrast = parseInt(this.value);
    });
    
    document.getElementById('saturation').addEventListener('input', function() {
        imageAdjustments.saturation = parseInt(this.value);
    });

    // 滤镜按钮事件
    document.querySelectorAll('.filter-buttons button').forEach(button => {
        button.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            document.querySelectorAll('.filter-buttons button').forEach(btn => {
                btn.classList.toggle('active', btn === this);
            });
        });
    });

    // 水印相关事件
    document.getElementById('add-text-watermark').addEventListener('click', function() {
        if (!cropper) return;
        
        const text = document.getElementById('watermark-text').value.trim();
        if (!text) return;
        
        const canvas = cropper.getCroppedCanvas();
        const ctx = canvas.getContext('2d');
        
        // 获取水印设置
        const position = document.getElementById('watermark-position').value;
        const style = document.getElementById('watermark-style').value;
        const fontSize = parseInt(document.getElementById('watermark-size').value);
        document.getElementById('watermark-size-value').textContent = fontSize;
        
        // 设置水印样式
        ctx.font = `${fontSize}px Arial`;
        const rgba = hexToRGB(watermarkColor);
        ctx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${watermarkOpacity})`;
        
        // 计算文字尺寸
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;
        
        // 根据位置和样式绘制水印
        const drawWatermark = (x, y, angle = 0) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle * Math.PI / 180); // 转换角度为弧度
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);
            ctx.restore();
        };
        
        // 计算水印位置和角度
        const padding = 20; // 边距
        let x, y, angle;
        
        switch (position) {
            case 'center':
                x = canvas.width / 2;
                y = canvas.height / 2;
                break;
            case 'top-left':
                x = textWidth / 2 + padding;
                y = textHeight / 2 + padding;
                break;
            case 'top-right':
                x = canvas.width - textWidth / 2 - padding;
                y = textHeight / 2 + padding;
                break;
            case 'bottom-left':
                x = textWidth / 2 + padding;
                y = canvas.height - textHeight / 2 - padding;
                break;
            case 'bottom-right':
                x = canvas.width - textWidth / 2 - padding;
                y = canvas.height - textHeight / 2 - padding;
                break;
            case 'tile':
                // 计算平铺间距
                const spacingX = textWidth * 1.5;
                const spacingY = textHeight * 1.5;
                const cols = Math.ceil(canvas.width / spacingX);
                const rows = Math.ceil(canvas.height / spacingY);
                
                // 绘制平铺水印
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        x = j * spacingX + spacingX / 2;
                        y = i * spacingY + spacingY / 2;
                        
                        // 根据样式设置角度
                        switch (style) {
                            case 'rotate-45':
                                angle = 45;
                                break;
                            case 'rotate-neg-45':
                                angle = -45;
                                break;
                            default:
                                angle = 0;
                        }
                        
                        drawWatermark(x, y, angle);
                    }
                }
                break;
        }
        
        // 如果不是平铺模式，绘制单个水印
        if (position !== 'tile') {
            // 根据样式设置角度
            switch (style) {
                case 'rotate-45':
                    angle = 45;
                    break;
                case 'rotate-neg-45':
                    angle = -45;
                    break;
                default:
                    angle = 0;
            }
            
            drawWatermark(x, y, angle);
        }
        
        // 更新预览
        const dataUrl = canvas.toDataURL();
        previewImage.src = dataUrl;
        initCropper();
        
        showNotification('已添加文字水印', 'ri-text-line');
    });

    // 字体大小滑块值显示更新
    document.getElementById('watermark-size').addEventListener('input', function() {
        document.getElementById('watermark-size-value').textContent = this.value;
    });

    // 水印颜色选择器
    const watermarkColorPicker = Pickr.create({
        el: '#watermark-color-picker',
        theme: 'nano',
        default: watermarkColor,
        swatches: [
            '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080'
        ],
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                input: true,
                save: true
            }
        }
    });
    
    // 颜色选择事件
    watermarkColorPicker.on('change', (color) => {
        watermarkColor = color.toHEXA().toString();
        document.getElementById('watermark-color').value = watermarkColor;
    });
    
    // 手动输入颜色事件
    document.getElementById('watermark-color').addEventListener('change', function() {
        const color = this.value;
        watermarkColorPicker.setColor(color);
        watermarkColor = color;
    });
    
    // 透明度调整事件
    document.getElementById('watermark-opacity').addEventListener('input', function() {
        watermarkOpacity = parseInt(this.value) / 100;
    });

    // 应用编辑按钮事件
    document.getElementById('apply-edit').addEventListener('click', function() {
        if (!cropper) return;
        
        const canvas = applyImageAdjustments();
        const dataUrl = canvas.toDataURL();
        previewImage.src = dataUrl;
        initCropper();
        
        showNotification('已应用编辑效果', 'ri-check-line');
    });

    // 重置编辑按钮事件
    document.getElementById('reset-edit').addEventListener('click', function() {
        if (!currentImageURL || !cropper) return;
        
        // 重置所有调整
        imageAdjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0
        };
        currentFilter = 'none';
        
        // 重置UI状态
        document.querySelectorAll('.filter-buttons button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'none');
        });
        document.getElementById('brightness').value = 0;
        document.getElementById('contrast').value = 0;
        document.getElementById('saturation').value = 0;
        
        // 重置图片
        previewImage.src = currentImageURL;
        initCropper();
        
        showNotification('已重置所有编辑', 'ri-refresh-line');
    });

    // 下载按钮事件
    document.getElementById('download-image').addEventListener('click', function() {
        if (!cropper) return;
        
        const canvas = applyImageAdjustments();
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showNotification('图片已下载', 'ri-download-line');
    });
}

// 辅助函数：将十六进制颜色转换为RGB对象
function hexToRGB(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 创建提取的颜色块
function createExtractedColorBlock(color, label, container) {
    const block = document.createElement('div');
    block.className = 'extracted-color-block me-2 mb-2';
    block.style.backgroundColor = color;
    block.setAttribute('data-color', color);
    
    // 添加颜色标签
    const labelElement = document.createElement('div');
    labelElement.className = 'color-label';
    labelElement.textContent = color;
    block.appendChild(labelElement);
    
    // 添加复制功能
    block.addEventListener('click', () => {
        navigator.clipboard.writeText(color);
        showNotification(`已复制颜色代码: ${color}`, 'ri-clipboard-line');
    });
    
    container.appendChild(block);
    return block;
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .extracted-color-block {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .extracted-color-block:hover {
        transform: scale(1.05);
    }
    
    .extracted-color-block .color-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px;
        font-size: 12px;
        text-align: center;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }
`;
document.head.appendChild(style);

// 初始化WCAG对比度检测
function initWCAGChecker() {
    const foregroundColor = document.getElementById('foreground-color');
    const backgroundColor = document.getElementById('background-color');
    const contrastRatio = document.getElementById('contrast-ratio');
    const contrastLevel = document.getElementById('contrast-level');
    const contrastStatus = document.getElementById('contrast-status');
    
    // 创建颜色选择器
    const foregroundPicker = Pickr.create({
        el: '#foreground-color-picker',
        theme: 'nano',
        default: '#000000',
        swatches: [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080'
        ],
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                input: true,
                save: true
            }
        }
    });
    
    const backgroundPicker = Pickr.create({
        el: '#background-color-picker',
        theme: 'nano',
        default: '#FFFFFF',
        swatches: [
            '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080'
        ],
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                input: true,
                save: true
            }
        }
    });
    
    // 颜色选择事件
    foregroundPicker.on('change', (color) => {
        foregroundColor.value = color.toHEXA().toString();
        updateContrast();
    });
    
    backgroundPicker.on('change', (color) => {
        backgroundColor.value = color.toHEXA().toString();
        updateContrast();
    });
    
    // 手动输入颜色事件
    foregroundColor.addEventListener('change', function() {
        const color = this.value;
        foregroundPicker.setColor(color);
        updateContrast();
    });
    
    backgroundColor.addEventListener('change', function() {
        const color = this.value;
        backgroundPicker.setColor(color);
        updateContrast();
    });
    
    // 更新对比度
    function updateContrast() {
        const fgColor = foregroundColor.value;
        const bgColor = backgroundColor.value;
        
        if (!fgColor || !bgColor) return;
        
        const ratio = calculateContrastRatio(fgColor, bgColor);
        
        // 更新对比度比率显示
        const contrastRatioElement = document.getElementById('contrast-ratio');
        contrastRatioElement.textContent = ratio.toFixed(2);
        
        // 检查不同级别的标准
        const wcagAA = document.getElementById('wcag-aa');
        const wcagAAA = document.getElementById('wcag-aaa');
        const wcagAALarge = document.getElementById('wcag-aa-large');
        const wcagAAALarge = document.getElementById('wcag-aaa-large');
        
        // 正常文本的 AA 级别 (4.5:1)
        if (ratio >= 4.5) {
            wcagAA.textContent = '通过';
            wcagAA.className = 'badge bg-success';
        } else {
            wcagAA.textContent = '未通过';
            wcagAA.className = 'badge bg-danger';
        }
        
        // 正常文本的 AAA 级别 (7:1)
        if (ratio >= 7) {
            wcagAAA.textContent = '通过';
            wcagAAA.className = 'badge bg-success';
        } else {
            wcagAAA.textContent = '未通过';
            wcagAAA.className = 'badge bg-danger';
        }
        
        // 大文本的 AA 级别 (3:1)
        if (ratio >= 3) {
            wcagAALarge.textContent = '通过';
            wcagAALarge.className = 'badge bg-success';
        } else {
            wcagAALarge.textContent = '未通过';
            wcagAALarge.className = 'badge bg-danger';
        }
        
        // 大文本的 AAA 级别 (4.5:1)
        if (ratio >= 4.5) {
            wcagAAALarge.textContent = '通过';
            wcagAAALarge.className = 'badge bg-success';
        } else {
            wcagAAALarge.textContent = '未通过';
            wcagAAALarge.className = 'badge bg-danger';
        }
        
        // 更新建议
        const suggestionElement = document.getElementById('contrast-suggestion');
        let suggestion = '';
        
        if (ratio < 3) {
            suggestion = `
                <div class="alert alert-danger">
                    <strong>严重问题：</strong>当前对比度不满足任何 WCAG 标准。
                    <hr>
                    <strong>建议：</strong>
                    <ul>
                        <li>尝试增加颜色对比度至少到 3:1 以满足大文本的基本要求</li>
                        <li>考虑使用更深的前景色或更浅的背景色</li>
                        <li>如果是文本，可以增加字体粗细来提高可读性</li>
                    </ul>
                </div>
            `;
        } else if (ratio < 4.5) {
            suggestion = `
                <div class="alert alert-warning">
                    <strong>注意：</strong>当前对比度仅满足大文本的 AA 标准。
                    <hr>
                    <strong>建议：</strong>
                    <ul>
                        <li>建议增加对比度至少到 4.5:1 以满足正常文本的要求</li>
                        <li>如果无法增加对比度，请确保此配色仅用于大标题等大文本</li>
                    </ul>
                </div>
            `;
        } else if (ratio < 7) {
            suggestion = `
                <div class="alert alert-info">
                    <strong>良好：</strong>当前对比度满足 AA 标准。
                    <hr>
                    <strong>建议：</strong>
                    <ul>
                        <li>如果追求最高的可访问性，可以考虑增加对比度到 7:1</li>
                        <li>当前配色适合大多数场景使用</li>
                    </ul>
                </div>
            `;
        } else {
            suggestion = `
                <div class="alert alert-success">
                    <strong>优秀：</strong>当前对比度满足所有 WCAG 标准！
                    <hr>
                    <p>这个配色组合具有极佳的可读性，适合所有类型的文本内容。</p>
                </div>
            `;
        }
        
        suggestionElement.innerHTML = suggestion;
        suggestionElement.classList.remove('d-none');
        
        // 更新预览
        const preview = document.getElementById('contrast-preview');
        if (preview) {
            preview.style.color = fgColor;
            preview.style.backgroundColor = bgColor;
        }
    }
    
    // 计算对比度
    function calculateContrastRatio(color1, color2) {
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return ratio;
    }
    
    // 获取亮度
    function getLuminance(color) {
        const rgb = hexToRGB(color);
        if (!rgb) return 0;
        
        const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(val => {
            if (val <= 0.03928) {
                return val / 12.92;
            } else {
                return Math.pow((val + 0.055) / 1.055, 2.4);
            }
        });
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    // 获取对比度等级
    function getContrastLevel(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'A';
        return '不满足';
    }
    
    // 初始更新
    updateContrast();
}

// 处理图片文件上传
function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const extractedColors = document.getElementById('extracted-colors');
    
    // 检查元素是否存在
    if (!preview || !previewImg || !extractedColors) {
        console.error('未找到必要的DOM元素');
        showNotification('图片处理错误：未找到必要的DOM元素', 'ri-error-warning-line');
        return;
    }
    
    const file = files[0];
    
    // 检查文件类型
    if (!file.type.match('image.*')) {
        showNotification('请选择有效的图片文件', 'ri-error-warning-line');
        return;
    }
    
    // 显示通知
    showNotification('正在处理图片...', 'ri-loader-4-line');
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewImg.onload = function() {
            // 显示预览区域
            preview.classList.remove('d-none');
            
            // 预览图加载成功后提取颜色
            extractColorsFromImage();
            
            // 显示通知
            showNotification('图片上传成功', 'ri-check-line');
        };
        
        // 添加错误处理
        previewImg.onerror = function() {
            showNotification('图片加载失败', 'ri-error-warning-line');
            console.error('图片加载失败');
        };
    };
    
    reader.onerror = function() {
        showNotification('文件读取错误', 'ri-error-warning-line');
        console.error('文件读取错误');
    };
    
    reader.readAsDataURL(file);
}

// 提取图片颜色
function extractColorsFromImage() {
    const img = document.getElementById('preview-img');
    const colorCount = parseInt(document.getElementById('color-count').value);
    const extractedColorsContainer = document.getElementById('extracted-colors');
    
    // 检查元素是否存在
    if (!img) {
        console.error('未找到预览图像元素');
        showNotification('图片处理错误：未找到预览图像元素', 'ri-error-warning-line');
        return;
    }
    
    if (!extractedColorsContainer) {
        console.error('未找到颜色容器元素');
        showNotification('图片处理错误：未找到颜色容器元素', 'ri-error-warning-line');
        return;
    }
    
    // 清空容器
    extractedColorsContainer.innerHTML = '';
    
    // 确保移除所有现有的保存按钮容器
    const existingSaveButtonContainers = document.querySelectorAll('.save-buttons-container');
    existingSaveButtonContainers.forEach(container => container.remove());
    
    function extractColors() {
        try {
            // 检查图片是否已经成功加载
            if (!img.complete || !img.naturalWidth) {
                throw new Error('图片未成功加载');
            }
            
            // 显示加载状态
            extractedColorsContainer.innerHTML = '<div class="text-center py-3"><i class="ri-loader-4-line fa-spin fa-2x"></i><p class="mt-2">正在提取颜色...</p></div>';
            
            // 创建临时canvas来处理图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            
            // 使用ColorThief提取颜色
            const colorThief = new ColorThief();
            let palette;
            
            try {
                palette = colorThief.getPalette(img, colorCount);
            } catch (e) {
                console.error('ColorThief提取颜色失败，尝试使用canvas获取像素数据');
                
                // 如果ColorThief失败，尝试手动提取主要颜色
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                const colorMap = {};
                
                // 简化像素数据，只取每10个像素的颜色
                for (let i = 0; i < pixels.length; i += 40) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    
                    // 忽略透明像素
                    if (pixels[i + 3] < 128) continue;
                    
                    // 简化颜色，减少颜色数量
                    const simplifiedR = Math.round(r / 10) * 10;
                    const simplifiedG = Math.round(g / 10) * 10;
                    const simplifiedB = Math.round(b / 10) * 10;
                    
                    const colorKey = `${simplifiedR},${simplifiedG},${simplifiedB}`;
                    colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
                }
                
                // 将颜色按出现频率排序
                const sortedColors = Object.entries(colorMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, colorCount)
                    .map(entry => entry[0].split(',').map(Number));
                
                palette = sortedColors;
            }
            
            if (!palette || palette.length === 0) {
                throw new Error('无法从图片中提取颜色');
            }
            
            // 清空加载状态
            extractedColorsContainer.innerHTML = '';
            
            // 显示提取的颜色
            palette.forEach((color, index) => {
                const [r, g, b] = color;
                const hexColor = rgbToHex(r, g, b);
                createExtractedColorBlock(hexColor, `颜色 ${index + 1}`, extractedColorsContainer);
            });
            
            // 创建保存按钮容器
            const saveButtonContainer = document.createElement('div');
            saveButtonContainer.className = 'w-100 d-flex justify-content-center mt-3 save-buttons-container';
            
            // 添加保存按钮
            const saveButton = document.createElement('button');
            saveButton.className = 'btn btn-success me-2';
            saveButton.innerHTML = '<i class="ri-save-line me-1"></i> 保存到我的配色方案';
            saveButton.addEventListener('click', saveExtractedPalette);
            
            saveButtonContainer.appendChild(saveButton);
            extractedColorsContainer.parentNode.appendChild(saveButtonContainer);
            
            // 显示下载按钮
            const downloadButton = document.getElementById('download-palette');
            if (downloadButton) {
                downloadButton.classList.remove('d-none');
            }
            
            showNotification('颜色提取成功', 'ri-palette-line');
        } catch (error) {
            console.error('提取颜色失败：', error);
            extractedColorsContainer.innerHTML = `
                <div class="alert alert-danger">
                    提取颜色失败：${error.message}
                    <br>
                    请尝试使用其他图片或刷新页面重试。
                </div>
            `;
            showNotification('提取颜色失败', 'ri-error-warning-line');
        }
    }
    
    // 确保图片已完全加载
    if (img.complete && img.naturalWidth) {
        // 使用setTimeout避免UI阻塞
        setTimeout(extractColors, 0);
    } else {
        img.onload = extractColors;
        // 添加错误处理
        img.onerror = function() {
            extractedColorsContainer.innerHTML = `
                <div class="alert alert-danger">
                    图片加载失败
                    <br>
                    请尝试使用其他图片或刷新页面重试。
                </div>
            `;
            showNotification('图片加载失败', 'ri-error-warning-line');
        };
    }
}

// 保存提取的颜色方案
function saveExtractedPalette() {
    const extractedColors = document.querySelectorAll('#extracted-colors .extracted-color-block');
    if (extractedColors.length === 0) {
        showNotification('请先从图片提取颜色', 'ri-error-warning-line');
        return;
    }
    
    // 收集颜色值
    const colors = [];
    extractedColors.forEach(colorBlock => {
        const colorValue = colorBlock.getAttribute('data-color');
        if (colorValue) {
            colors.push(colorValue);
        }
    });
    
    if (colors.length === 0) {
        showNotification('未能获取有效的颜色值', 'ri-error-warning-line');
        return;
    }
    
    // 创建新的配色方案对象
    const newPalette = {
        colors: colors,
        timestamp: new Date().toISOString()
    };
    
    // 获取现有配色方案
    const palettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    
    // 添加新配色方案到开头
    palettes.unshift(newPalette);
    
    // 限制保存的配色方案数量为20个
    if (palettes.length > 20) {
        palettes.pop();
    }
    
    // 保存更新后的配色方案
    localStorage.setItem('savedPalettes', JSON.stringify(palettes));
    
    // 更新显示
    displaySavedPalettes();
    
    // 显示保存成功的通知
    showNotification('配色方案已保存');
}