# 🔄 缓存清除指南 - 查看最新功能

**问题**: 更新部署后，浏览器仍显示旧版本（如轮次仍显示"未知"）

**原因**: Cloudflare设置了强缓存策略（`max-age=31536000`，即1年）

---

## 🚀 立即解决方案

### **方法1: 访问最新部署URL（推荐）**

直接访问最新部署，绕过主域名缓存：

```
https://1713b556.chatsvtr.pages.dev
```

这个URL是最新部署，**保证显示更新后的代码**。

---

### **方法2: 强制刷新浏览器缓存**

#### **Windows/Linux**
- **Chrome/Edge**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`

#### **Mac**
- **Chrome/Edge/Safari**: `Cmd + Shift + R`
- **Firefox**: `Cmd + Shift + R`

---

### **方法3: 清除浏览器缓存**

#### **Chrome/Edge**
1. 按 `F12` 打开开发者工具
2. **右键点击刷新按钮**（地址栏旁边）
3. 选择"**清空缓存并硬性重新加载**"

或者：
1. 按 `Ctrl + Shift + Delete`（Mac: `Cmd + Shift + Delete`）
2. 选择"缓存的图像和文件"
3. 时间范围选"全部时间"
4. 点击"清除数据"

#### **Firefox**
1. 按 `Ctrl + Shift + Delete`（Mac: `Cmd + Shift + Delete`）
2. 勾选"缓存"
3. 点击"立即清除"

---

### **方法4: 无痕/隐私模式**

**最快速的方法**：
- **Chrome/Edge**: `Ctrl + Shift + N`（Mac: `Cmd + Shift + N`）
- **Firefox**: `Ctrl + Shift + P`（Mac: `Cmd + Shift + P`）
- **Safari**: `Cmd + Shift + N`

然后访问 https://svtr.ai

---

## 🔍 验证更新是否生效

### **1. 检查控制台日志**

打开浏览器控制台（`F12` → Console），刷新页面，应该看到：

```javascript
✅ [完成模式] 成功识别轮次: D轮
💡 [金额推断] 融资金额$900.0M → 推断轮次: D轮以上
⚠️ 所有模式匹配失败，尝试根据金额推断轮次...
```

**如果看到这些日志，说明新代码已加载！**

---

### **2. 检查JS文件版本**

在浏览器控制台运行：

```javascript
fetch('/assets/js/funding-daily.js')
  .then(r => r.text())
  .then(t => {
    if (t.includes('智能推断')) {
      console.log('✅ 已加载最新版本！');
    } else {
      console.log('❌ 仍是旧版本，请清除缓存');
    }
  });
```

---

### **3. 查看具体案例**

在创投日报区域查看：
- **ŌURA公司**: 如果显示"D轮以上"或其他轮次（而不是"未知"），说明金额推断生效了✅
- **其他公司**: 轮次显示应该更准确

---

## 🛠️ 开发者调试

### **禁用缓存（开发者工具）**

1. 按 `F12` 打开开发者工具
2. 切换到 **Network** 标签
3. 勾选 **Disable cache**
4. **保持开发者工具打开**的状态下刷新页面

---

### **查看实际加载的JS文件**

1. 按 `F12` → **Network** 标签
2. 刷新页面
3. 搜索 `funding-daily.js`
4. 点击文件名，查看 **Preview** 或 **Response** 标签
5. 搜索"智能推断"，如果找到说明已加载新版本

---

## 📊 为什么会有缓存问题？

### **Cloudflare缓存策略**

当前配置：
```
Cache-Control: public, max-age=31536000, immutable
```

- `max-age=31536000`: 缓存1年
- `immutable`: 告诉浏览器内容永不改变

**优点**: 性能极佳，减少服务器请求
**缺点**: 更新后需要手动清除缓存

---

## 🔧 长期解决方案

### **方案1: 文件名版本化（推荐）**

修改构建流程，为JS文件添加哈希值：
```
funding-daily.js → funding-daily.abc123.js
```

每次更新后文件名改变，自动绕过缓存。

---

### **方案2: 添加版本参数**

在HTML中引用JS时添加版本参数：
```html
<script src="/assets/js/funding-daily.js?v=20251016"></script>
```

每次更新后改变版本号。

---

### **方案3: 调整缓存策略**

修改Cloudflare缓存规则，将JS文件的`max-age`改为较短时间（如1小时）：
```
Cache-Control: public, max-age=3600
```

---

## ✅ 快速验证清单

- [ ] 尝试访问最新部署URL: https://1713b556.chatsvtr.pages.dev
- [ ] 使用无痕模式访问: https://svtr.ai
- [ ] 强制刷新浏览器: `Ctrl + Shift + R`
- [ ] 清除浏览器缓存
- [ ] 查看控制台是否有新日志（包含"智能推断"等关键词）
- [ ] 验证轮次显示是否更准确

---

## 📞 仍然有问题？

如果以上方法都尝试过，仍然看到旧版本：

1. **等待5-10分钟**: Cloudflare CDN全球同步需要时间
2. **检查网络**: 确认不是网络代理或企业防火墙缓存
3. **检查部署**: 访问 Cloudflare Dashboard 确认部署状态

---

**最快的验证方法**:
直接访问 👉 https://1713b556.chatsvtr.pages.dev 👈
