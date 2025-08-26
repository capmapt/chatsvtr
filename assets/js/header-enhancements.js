/**
 * Header功能增强脚本
 * 处理语言切换下拉菜单和项目提交功能
 */

(function() {
  'use strict';

  // DOM加载完成后初始化
  document.addEventListener('DOMContentLoaded', function() {
    initializeLanguageDropdown();
    initializeProjectSubmit();
  });

  /**
   * 初始化语言切换下拉菜单
   */
  function initializeLanguageDropdown() {
    const dropdownTrigger = document.getElementById('langDropdownTrigger');
    const dropdownMenu = document.getElementById('langDropdownMenu');
    const dropdown = document.querySelector('.lang-dropdown');
    const currentLangSpan = document.getElementById('currentLang');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!dropdownTrigger || !dropdownMenu || !dropdown) {
      console.warn('语言下拉菜单元素未找到');
      return;
    }

    // 点击触发器切换下拉菜单
    dropdownTrigger.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    // 点击外部关闭下拉菜单
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // 处理语言选项点击
    langOptions.forEach(function(option) {
      option.addEventListener('click', function() {
        const selectedLang = this.id;
        const langText = this.textContent;
        
        // 更新显示的语言
        if (currentLangSpan) {
          currentLangSpan.textContent = langText;
        }

        // 更新激活状态
        langOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');

        // 关闭下拉菜单
        dropdown.classList.remove('active');

        // 触发原有的语言切换逻辑
        if (selectedLang === 'btnZh') {
          switchToLanguage('zh');
        } else if (selectedLang === 'btnEn') {
          switchToLanguage('en');
        }
      });
    });

    // ESC键关闭下拉菜单
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
      }
    });
  }

  /**
   * 初始化项目提交功能
   */
  function initializeProjectSubmit() {
    const submitBtn = document.querySelector('.btn-submit-project');
    
    if (!submitBtn) {
      console.warn('项目提交按钮未找到');
      return;
    }

    submitBtn.addEventListener('click', function() {
      // 显示项目提交模态框或跳转到提交页面
      showProjectSubmitModal();
    });
  }

  /**
   * 显示项目提交模态框
   */
  function showProjectSubmitModal() {
    // 创建模态框HTML
    const modalHTML = `
      <div class="project-submit-modal" id="projectSubmitModal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 data-i18n="submit_project_title">提交项目</h3>
            <button class="modal-close" aria-label="关闭">×</button>
          </div>
          <div class="modal-body">
            <form id="projectSubmitForm" class="project-submit-form">
              <div class="form-group">
                <label for="projectName" data-i18n="project_name">项目名称</label>
                <input type="text" id="projectName" required placeholder="请输入项目名称">
              </div>
              <div class="form-group">
                <label for="projectUrl" data-i18n="project_url">项目链接</label>
                <input type="url" id="projectUrl" placeholder="https://example.com">
              </div>
              <div class="form-group">
                <label for="projectCategory" data-i18n="project_category">项目类别</label>
                <select id="projectCategory" required>
                  <option value="">请选择类别</option>
                  <option value="ai">人工智能 (AI)</option>
                  <option value="fintech">金融科技 (Fintech)</option>
                  <option value="healthcare">医疗健康 (Healthcare)</option>
                  <option value="ecommerce">电子商务 (E-commerce)</option>
                  <option value="enterprise">企业服务 (Enterprise)</option>
                  <option value="consumer">消费科技 (Consumer)</option>
                  <option value="other">其他 (Other)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="projectDescription" data-i18n="project_description">项目描述</label>
                <textarea id="projectDescription" rows="4" required placeholder="请简要描述您的项目"></textarea>
              </div>
              <div class="form-group">
                <label for="contactEmail" data-i18n="contact_email">联系邮箱</label>
                <input type="email" id="contactEmail" required placeholder="you@company.com">
              </div>
              <div class="form-actions">
                <button type="button" class="btn-cancel" data-i18n="cancel">取消</button>
                <button type="submit" class="btn-submit" data-i18n="submit">提交</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // 添加模态框到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 添加模态框样式
    if (!document.getElementById('projectSubmitModalStyles')) {
      const styles = document.createElement('style');
      styles.id = 'projectSubmitModalStyles';
      styles.textContent = `
        .project-submit-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }
        
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          width: 90vw;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          transform: translateY(-20px);
          animation: slideUp 0.3s ease forwards;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .modal-close:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .project-submit-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-group label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(250, 140, 50, 0.1);
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        
        .btn-cancel,
        .btn-submit {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel {
          background: #f8f9fa;
          color: #666;
          border: 1px solid rgba(0, 0, 0, 0.15);
        }
        
        .btn-cancel:hover {
          background: #e9ecef;
          color: #333;
        }
        
        .btn-submit {
          background: var(--primary-color);
          color: white;
        }
        
        .btn-submit:hover {
          background: #e17a28;
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          to { transform: translateY(0); }
        }
        
        @media (max-width: 480px) {
          .modal-content {
            width: 95vw;
            max-height: 95vh;
          }
          
          .modal-header,
          .modal-body {
            padding: 16px;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .btn-cancel,
          .btn-submit {
            width: 100%;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // 绑定事件处理器
    const modal = document.getElementById('projectSubmitModal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const overlay = modal.querySelector('.modal-overlay');
    const form = document.getElementById('projectSubmitForm');

    // 关闭模态框的函数
    function closeModal() {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }

    // 绑定关闭事件
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    // 处理表单提交
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;
      
      // 显示提交中状态
      submitBtn.textContent = '提交中...';
      submitBtn.disabled = true;
      
      const formData = {
        name: document.getElementById('projectName').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        category: mapCategoryToAPI(document.getElementById('projectCategory').value),
        founder: extractNameFromEmail(document.getElementById('contactEmail').value),
        founderEmail: document.getElementById('contactEmail').value.trim(),
        fundingGoal: 1000000, // 默认融资目标1M
        stage: 'seed', // 默认种子轮
        tags: [document.getElementById('projectCategory').value],
        website: document.getElementById('projectUrl').value.trim() || '',
        submittedAt: new Date().toISOString()
      };

      // 提交到项目API
      submitProject(formData)
        .then(response => {
          if (response.success) {
            // 显示成功消息
            alert('项目提交成功！我们将尽快联系您。项目ID: ' + response.data.projectId);
            closeModal();
          } else {
            throw new Error(response.message || '提交失败');
          }
        })
        .catch(error => {
          console.error('项目提交失败:', error);
          alert('提交失败: ' + error.message + '\n请检查网络连接或稍后重试。');
        })
        .finally(() => {
          // 恢复按钮状态
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });

    // 辅助函数：映射类别到API格式
    function mapCategoryToAPI(category) {
      const categoryMap = {
        'ai': 'AI',
        'fintech': 'Fintech',
        'healthcare': 'Healthcare',
        'ecommerce': 'E-commerce',
        'enterprise': 'Enterprise',
        'consumer': 'Consumer',
        'other': 'Other'
      };
      return categoryMap[category] || 'Other';
    }

    // 辅助函数：从邮箱提取用户名作为创始人姓名
    function extractNameFromEmail(email) {
      const username = email.split('@')[0];
      return username.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // 项目提交API调用
    async function submitProject(projectData) {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(projectData)
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || `HTTP ${response.status}`);
        }

        return result;
      } catch (error) {
        console.error('API调用失败:', error);
        throw error;
      }
    }
  }

  /**
   * 切换语言（集成现有的国际化系统）
   */
  function switchToLanguage(lang) {
    // 触发现有的语言切换逻辑
    if (typeof window.switchLanguage === 'function') {
      window.switchLanguage(lang);
    } else if (typeof changeLanguage === 'function') {
      changeLanguage(lang);
    } else {
      // 如果没有现有的切换函数，手动触发按钮点击
      const oldBtn = document.getElementById(lang === 'zh' ? 'btnZh' : 'btnEn');
      if (oldBtn && typeof oldBtn.click === 'function') {
        // 临时显示旧按钮来触发事件
        const tempBtn = oldBtn.cloneNode(true);
        tempBtn.style.display = 'none';
        document.body.appendChild(tempBtn);
        tempBtn.click();
        document.body.removeChild(tempBtn);
      }
    }
  }

})();