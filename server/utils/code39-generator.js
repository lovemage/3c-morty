/**
 * Code39條碼生成器
 * 用於生成符合超商標準的Code39條碼SVG
 */

// Code39字符映射表
const CODE39_PATTERNS = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '$': '100100100101',
  '/': '100100101001', '+': '100101001001', '%': '101001001001', '*': '100101101101'
};

// Code39起始/結束字符
const START_STOP_PATTERN = '*';

/**
 * 驗證Code39字符
 * @param {string} text - 要編碼的文字
 * @returns {boolean} 是否為有效的Code39字符
 */
function isValidCode39(text) {
  const validChars = Object.keys(CODE39_PATTERNS);
  return text.split('').every(char => validChars.includes(char.toUpperCase()));
}

/**
 * 生成Code39條碼的二進制模式
 * @param {string} text - 要編碼的文字
 * @returns {string} 二進制模式字符串
 */
function generateCode39Pattern(text) {
  if (!isValidCode39(text)) {
    throw new Error('包含無效的Code39字符');
  }

  let pattern = '';
  const upperText = text.toUpperCase();
  
  // 添加起始字符
  pattern += CODE39_PATTERNS[START_STOP_PATTERN];
  pattern += '0'; // 字符間隔
  
  // 添加內容字符
  for (let i = 0; i < upperText.length; i++) {
    pattern += CODE39_PATTERNS[upperText[i]];
    if (i < upperText.length - 1) {
      pattern += '0'; // 字符間隔
    }
  }
  
  // 添加結束字符
  pattern += '0'; // 字符間隔
  pattern += CODE39_PATTERNS[START_STOP_PATTERN];
  
  return pattern;
}

/**
 * 生成Code39條碼SVG
 * @param {string} text - 要編碼的文字
 * @param {Object} options - 選項
 * @returns {string} SVG字符串
 */
function generateCode39SVG(text, options = {}) {
  const {
    width = 300,           // 總寬度
    height = 80,           // 總高度
    barHeight = 60,        // 條碼高度
    showText = true,       // 是否顯示文字
    fontSize = 12,         // 字體大小
    fontFamily = 'monospace', // 字體
    textMargin = 5,        // 文字邊距
    backgroundColor = 'white', // 背景色
    barColor = 'black',    // 條碼顏色
    textColor = 'black',   // 文字顏色
    quietZone = 10         // 靜區寬度
  } = options;

  try {
    const pattern = generateCode39Pattern(text);
    const barCount = pattern.length;
    const availableWidth = width - (quietZone * 2);
    const barWidth = availableWidth / barCount;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // 背景
    svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
    
    // 繪製條碼
    let x = quietZone;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        svg += `<rect x="${x}" y="${(height - barHeight) / 2}" width="${barWidth}" height="${barHeight}" fill="${barColor}"/>`;
      }
      x += barWidth;
    }
    
    // 顯示文字
    if (showText) {
      const textY = height - textMargin;
      const textX = width / 2;
      const displayText = `*${text.toUpperCase()}*`; // Code39格式
      
      svg += `<text x="${textX}" y="${textY}" font-family="${fontFamily}" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="text-bottom">${displayText}</text>`;
    }
    
    svg += '</svg>';
    
    return svg;
  } catch (error) {
    throw new Error(`Code39生成失敗: ${error.message}`);
  }
}

/**
 * 生成多段條碼的組合SVG
 * @param {Array} segments - 條碼段陣列 ['段1', '段2', '段3']
 * @param {Object} options - 選項
 * @returns {string} 組合SVG字符串
 */
function generateMultiSegmentCode39SVG(segments, options = {}) {
  const {
    segmentSpacing = 20,   // 段間距
    labelSpacing = 30,     // 標籤間距
    showSegmentLabels = true, // 顯示段標籤
    ...barcodeOptions
  } = options;

  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('條碼段不能為空');
  }

  // 計算總尺寸
  const singleHeight = barcodeOptions.height || 80;
  const totalHeight = (singleHeight * segments.length) + (segmentSpacing * (segments.length - 1)) + 
                     (showSegmentLabels ? labelSpacing : 0);
  const totalWidth = barcodeOptions.width || 300;

  let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="${barcodeOptions.backgroundColor || 'white'}"/>`;

  let currentY = showSegmentLabels ? labelSpacing : 0;

  segments.forEach((segment, index) => {
    // 段標籤
    if (showSegmentLabels) {
      svg += `<text x="10" y="${currentY - 5}" font-family="Arial, sans-serif" font-size="14" fill="black" font-weight="bold">第${index + 1}段:</text>`;
    }

    // 生成單段條碼
    const segmentSVG = generateCode39SVG(segment, {
      ...barcodeOptions,
      height: singleHeight
    });

    // 提取條碼內容（去除SVG標籤）
    const svgContent = segmentSVG.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    
    // 添加到組合SVG中，調整位置
    svg += `<g transform="translate(0, ${currentY})">${svgContent}</g>`;
    
    currentY += singleHeight + segmentSpacing;
  });

  svg += '</svg>';
  return svg;
}

/**
 * 檢查文字是否適合Code39編碼
 * @param {string} text - 要檢查的文字
 * @returns {Object} 檢查結果
 */
function validateCode39Text(text) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    cleanedText: text
  };

  if (!text || text.length === 0) {
    result.isValid = false;
    result.errors.push('文字不能為空');
    return result;
  }

  // 檢查長度
  if (text.length > 20) {
    result.warnings.push('文字過長，可能影響條碼可讀性');
  }

  // 檢查字符
  const invalidChars = [];
  const validChars = Object.keys(CODE39_PATTERNS);
  
  for (const char of text) {
    if (!validChars.includes(char.toUpperCase())) {
      invalidChars.push(char);
    }
  }

  if (invalidChars.length > 0) {
    result.isValid = false;
    result.errors.push(`包含無效字符: ${invalidChars.join(', ')}`);
  }

  // 清理文字（轉大寫）
  result.cleanedText = text.toUpperCase();

  return result;
}

export {
  generateCode39SVG,
  generateMultiSegmentCode39SVG,
  validateCode39Text,
  isValidCode39,
  CODE39_PATTERNS
};