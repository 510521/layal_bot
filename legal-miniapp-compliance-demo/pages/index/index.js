const safety = require('../../utils/safety.js');
const mockData = require('../../utils/mockData.js');

Page({
  data: {
    question: '',
    answer: '',
    sources: [],
    errorMessage: '',
    isProcessing: false,
    showSource: false,
    inputLength: 0,
    maxInputLength: 200
  },

  onInput(e) {
    const value = e.detail.value;
    this.setData({ 
      question: value,
      inputLength: value.length,
      errorMessage: ''
    });
    
    // 实时敏感词检测（用户体验优化）
    if (value.length > 3) {
      const { isSensitive, words } = safety.checkSensitive(value);
      if (isSensitive) {
        this.setData({
          errorMessage: `⚠️ 检测到敏感词：${words.join('、')}。请描述合法咨询场景`
        });
      }
    }
  },

  handleSubmit() {
    const q = this.data.question.trim();
    
    // 前置校验
    if (!q) {
      this.showError('请输入您的法律问题');
      return;
    }
    if (q.length < 4) {
      this.showError('问题描述过短，请详细说明（≥4字）');
      return;
    }
    if (q.length > this.data.maxInputLength) {
      this.showError(`问题过长（≤${this.data.maxInputLength}字），请精简描述`);
      return;
    }

    // 三重安全防护
    this.setData({ isProcessing: true, errorMessage: '' });
    
    // 防护1：敏感词拦截
    const sensCheck = safety.checkSensitive(q);
    if (sensCheck.isSensitive) {
      this.showError(
        `⚠️ 检测到敏感内容：${sensCheck.words.join('、')}\n\n` +
        `【重要提示】\n• 任何违法行为都将承担法律责任\n• 建议立即停止相关行为\n• 如需帮助，请拨打12348法律援助热线`
      );
      this.setData({ isProcessing: false });
      return;
    }

    // 防护2：问题边界检测
    const boundaryCheck = safety.checkBoundary(q);
    if (!boundaryCheck.inScope) {
      this.showError(
        `🔍 问题边界提示\n\n${boundaryCheck.message}\n\n` +
        `💡 建议：劳动纠纷→12333 | 刑事问题→110 | 行政问题→12345`
      );
      this.setData({ isProcessing: false });
      return;
    }

    // 防护3：模拟RAG检索 + 生成回答
    setTimeout(() => {
      const mockResult = mockData.getMockResponse(q);
      
      // 强制注入免责声明（双重保障）
      let finalAnswer = mockResult.answer;
      if (!finalAnswer.includes('法律免责声明')) {
        finalAnswer += mockData.DISCLAIMER_FOOTER;
      }
      
      this.setData({
        answer: finalAnswer,
        sources: mockResult.sources,
        isProcessing: false
      });
      
      // 滚动到回答区域
      wx.pageScrollTo({ scrollTop: 400, duration: 300 });
      
      // 记录成功咨询（本地存储，仅用于演示统计）
      const history = wx.getStorageSync('consultHistory') || [];
      history.unshift({
        time: new Date().toLocaleString('zh-CN'),
        question: q,
        type: 'success'
      });
      wx.setStorageSync('consultHistory', history.slice(0, 10)); // 保留最近10条
    }, 800);
  },

  toggleSource() {
    this.setData({ showSource: !this.data.showSource });
  },

  showError(msg) {
    this.setData({ 
      errorMessage: msg,
      answer: '',
      isProcessing: false 
    });
    wx.vibrateShort({ type: 'medium' });
    
    // 记录拦截事件（合规审计）
    const blocks = wx.getStorageSync('blockedQueries') || [];
    blocks.unshift({
      time: new Date().toLocaleString('zh-CN'),
      query: this.data.question,
      reason: msg.includes('敏感') ? 'sensitive' : 'out_of_scope'
    });
    wx.setStorageSync('blockedQueries', blocks.slice(0, 20));
  },

  onLoad() {
    console.log('✅ 合规框架加载完成 | 三重安全防护已就绪');
  },

  // 清空输入（用户友好）
  clearInput() {
    this.setData({ question: '', inputLength: 0, errorMessage: '' });
  }
});