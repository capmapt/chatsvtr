/**
 * 统一的地理位置格式化服务
 * 为订阅用户和注册用户提供一致的地理位置显示逻辑
 */

// 地理位置接口
export interface GeoLocation {
  city: string;
  region: string;
  country: string;
  timezone?: string;
}

// 用户信息接口（简化版）
export interface UserLocationInfo {
  email: string;
  geoLocation?: GeoLocation;
  ipAddress?: string;
  cfCountry?: string;
}

/**
 * 格式化地理位置信息为用户友好的显示文本
 * @param user 用户信息（包含地理位置数据）
 * @returns 格式化的地理位置字符串
 */
export function formatUserLocation(user: UserLocationInfo): string {
  let locationInfo = '未知地区';
  
  // 优先使用详细地理位置信息
  if (user.geoLocation) {
    const geo = user.geoLocation;
    if (geo.city && geo.city !== '未知' && geo.city !== 'Unknown') {
      // 优先显示城市信息，避免重复显示相同的区域名
      locationInfo = `${geo.city}${geo.region && geo.region !== geo.city && geo.region !== '未知' ? ', ' + geo.region : ''}, ${geo.country}`;
    } else if (geo.region && geo.region !== '未知' && geo.region !== 'Unknown') {
      // 没有城市，显示区域
      locationInfo = `${geo.region}, ${geo.country}`;
    } else if (geo.country && geo.country !== '未知' && geo.country !== 'Unknown') {
      // 只有国家信息
      locationInfo = geo.country;
    }
  }
  
  // 后备逻辑1：基于IP推断位置
  if (locationInfo === '未知地区' && user.ipAddress) {
    locationInfo = getLocationFromIPAddress(user.ipAddress, user.cfCountry);
  }
  
  // 后备逻辑2：基于邮箱域名推断
  if (locationInfo === '未知地区' || locationInfo === '其他地区') {
    const emailDomain = user.email.split('@')[1];
    const domainLocation = getLocationFromEmailDomain(emailDomain);
    if (domainLocation !== '其他地区') {
      locationInfo = domainLocation;
    }
  }
  
  return locationInfo;
}

/**
 * 基于IP地址获取位置信息
 */
function getLocationFromIPAddress(ip: string, cfCountry?: string): string {
  // 本地/测试环境IP
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return '本地环境';
  }
  
  // 优先使用Cloudflare的国家代码 - 扩展更多国家和城市映射
  if (cfCountry && cfCountry !== 'XX') {
    const locationMap: { [key: string]: string } = {
      'CN': '中国大陆',
      'US': '美国',
      'JP': '日本',
      'KR': '韩国',
      'SG': '新加坡',
      'HK': '香港特别行政区',
      'TW': '台湾地区',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'IN': '印度',
      'BR': '巴西',
      'MX': '墨西哥',
      'RU': '俄罗斯',
      'IT': '意大利',
      'ES': '西班牙',
      'NL': '荷兰',
      'CH': '瑞士',
      'SE': '瑞典',
      'NO': '挪威',
      'DK': '丹麦',
      'FI': '芬兰',
      'BE': '比利时',
      'AT': '奥地利',
      'PL': '波兰',
      'CZ': '捷克',
      'HU': '匈牙利',
      'MY': '马来西亚',
      'TH': '泰国',
      'VN': '越南',
      'ID': '印度尼西亚',
      'PH': '菲律宾',
      'NZ': '新西兰',
      'ZA': '南非',
      'EG': '埃及',
      'IL': '以色列',
      'AE': '阿联酋',
      'SA': '沙特阿拉伯'
    };
    return locationMap[cfCountry] || `${cfCountry}`;
  }
  
  // 基于IP段的详细推断
  if (ip.includes('.')) {
    const segments = ip.split('.').map(Number);
    const firstSegment = segments[0];
    
    // 中国大陆详细IP段分析
    if ((firstSegment >= 1 && firstSegment <= 126 && firstSegment !== 127)) {
      if (firstSegment >= 58 && firstSegment <= 61) return '北京, 中国';
      if (firstSegment >= 114 && firstSegment <= 117) return '上海, 中国';
      if (firstSegment >= 113 && firstSegment <= 114) return '广东, 中国';
      return '中国大陆';
    }
    
    if ((firstSegment >= 202 && firstSegment <= 203) ||
        (firstSegment >= 210 && firstSegment <= 222)) {
      return '中国大陆';
    }
    
    // 美国详细IP段
    if ((firstSegment >= 3 && firstSegment <= 99) ||
        (firstSegment >= 128 && firstSegment <= 191)) {
      if (firstSegment >= 192 && firstSegment <= 199) return '加利福尼亚, 美国';
      if (firstSegment >= 204 && firstSegment <= 207) return '纽约, 美国';
      return '美国';
    }
  }
  
  return '未知地区';
}

/**
 * 基于邮箱域名获取地理位置信息
 */
function getLocationFromEmailDomain(emailDomain: string): string {
  const domainLocationMap: { [key: string]: string } = {
    // 中国主要邮箱服务商
    'qq.com': '腾讯邮箱 (中国)',
    '163.com': '网易邮箱 (中国)',
    '126.com': '网易邮箱 (中国)',
    'sina.com': '新浪邮箱 (中国)',
    'sina.cn': '新浪邮箱 (中国)',
    'sohu.com': '搜狐邮箱 (中国)',
    'foxmail.com': '腾讯Foxmail (中国)',
    'yeah.net': '网易邮箱 (中国)',
    'tom.com': 'TOM邮箱 (中国)',
    'aliyun.com': '阿里云邮箱 (中国)',
    
    // 国际邮箱服务商
    'gmail.com': 'Google邮箱 (全球)',
    'yahoo.com': 'Yahoo邮箱 (美国)',
    'yahoo.co.jp': 'Yahoo日本 (日本)',
    'hotmail.com': 'Microsoft邮箱 (美国)',
    'outlook.com': 'Microsoft邮箱 (美国)',
    'live.com': 'Microsoft邮箱 (美国)',
    'msn.com': 'Microsoft邮箱 (美国)',
    'icloud.com': 'Apple邮箱 (美国)',
    'me.com': 'Apple邮箱 (美国)',
    
    // 企业和机构
    'svtr.ai': '平台内部',
    'example.com': '测试环境',
    
    // 教育机构常见后缀
    'edu.cn': '中国教育机构',
    'ac.cn': '中国科研机构',
    'gov.cn': '中国政府机构',
    'edu': '教育机构',
    'ac.uk': '英国学术机构',
    'edu.au': '澳大利亚教育机构'
  };
  
  const lowerDomain = emailDomain.toLowerCase();
  
  // 精确匹配
  if (domainLocationMap[lowerDomain]) {
    return domainLocationMap[lowerDomain];
  }
  
  // 模糊匹配教育机构
  if (lowerDomain.includes('.edu')) return '教育机构';
  if (lowerDomain.includes('.gov')) return '政府机构';
  if (lowerDomain.includes('.org')) return '非营利组织';
  
  return '其他地区';
}

/**
 * 为订阅者数据格式化地理位置（保持向后兼容）
 */
export function formatSubscriberLocation(subscriber: any): string {
  return formatUserLocation({
    email: subscriber.email,
    geoLocation: subscriber.geoLocation,
    ipAddress: subscriber.ipAddress,
    cfCountry: subscriber.cfCountry
  });
}

/**
 * 为注册用户数据格式化地理位置
 */
export function formatRegisteredUserLocation(user: any, subscribers: any[] = []): string {
  // 优先使用用户自身的地理位置信息
  if (user.geoLocation) {
    return formatUserLocation({
      email: user.email,
      geoLocation: user.geoLocation,
      ipAddress: user.ipAddress
    });
  }
  
  // 其次从订阅数据中查找该用户的地理位置信息
  const subscriberInfo = subscribers.find((sub: any) => sub.email === user.email);
  if (subscriberInfo) {
    return formatUserLocation({
      email: user.email,
      geoLocation: subscriberInfo.geoLocation,
      ipAddress: subscriberInfo.ipAddress,
      cfCountry: subscriberInfo.cfCountry
    });
  }
  
  // 最后使用基础信息推断
  return formatUserLocation({
    email: user.email,
    ipAddress: user.ipAddress
  });
}