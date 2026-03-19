// 敏感词库（简化版，实际应扩展）
const SENSITIVE_WORDS = [
  '杀人', '抢劫', '诈骗', '逃税', '报复', '威胁', '伪造', '贿赂'
];

// 民法典范围关键词
const LEGAL_KEYWORDS = [
  '离婚', '财产', '继承', '合同', '债务', '租房', '劳动', '工伤',
  '侵权', '赔偿', '抚养', '赡养', '婚姻', '房产', '借款'
];

module.exports = {
  // 敏感词检测
  checkSensitive(text) {
    const matched = [];
    for (const word of SENSITIVE_WORDS) {
      if (text.includes(word)) matched.push(word);
    }
    return {
      isSensitive: matched.length > 0,
      words: matched
    };
  },

  // 问题边界检测
  checkBoundary(question) {
    // 长度过滤
    if (question.length > 200) {
      return { inScope: false, message: '问题过长，请精简描述' };
    }
    
    // 关键词匹配（简化逻辑）
    const lower = question.toLowerCase();
    const inScope = LEGAL_KEYWORDS.some(kw => lower.includes(kw));
    
    let message = '';
    if (!inScope) {
      if (lower.includes('杀人') || lower.includes('犯罪')) {
        message = '⚠️ 您的问题涉及刑事范畴\n\n• 刑事问题请立即联系公安机关（110）\n• 本工具仅提供《民法典》相关咨询';
      } else if (lower.includes('工资') || lower.includes('社保')) {
        message = '⚠️ 您的问题涉及劳动法范畴\n\n• 劳动纠纷请咨询《劳动合同法》\n• 拨打人社热线：12333';
      } else {
        message = '⚠️ 问题可能超出《民法典》范围\n\n• 建议明确咨询场景（如：离婚财产、租房押金等）\n• 专业问题请咨询执业律师（12348可查询）';
      }
    }
    
    return { inScope, message };
  }
};