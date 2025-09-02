/**
 * SVTR 地理位置服务
 * 统一的地理位置获取功能，支持用户注册和订阅
 */

export interface GeoLocation {
  city: string;
  region: string;
  country: string;
  timezone: string;
}

/**
 * 从IP地址获取详细地理位置信息
 * @param ipAddress IP地址
 * @param cfCountry Cloudflare国家代码（fallback）
 * @returns 地理位置信息
 */
export async function getGeoLocationFromIP(
  ipAddress: string,
  cfCountry?: string
): Promise<GeoLocation> {
  // 默认返回值
  let geoLocation: GeoLocation = {
    city: '未知',
    region: '未知', 
    country: '未知',
    timezone: '未知'
  };

  try {
    // 跳过本地和测试IP
    if (isLocalIP(ipAddress)) {
      return {
        city: '本地环境',
        region: '测试',
        country: '本地',
        timezone: 'Asia/Shanghai'
      };
    }

    console.log(`[GeoLocation] 获取IP地理位置: ${ipAddress}`);

    // 使用ipapi.co获取详细地理位置（免费1000次/天）
    const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: { 
        'User-Agent': 'SVTR-GeoLocation/1.0' 
      },
      signal: AbortSignal.timeout(5000) // 5秒超时
    });

    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      
      if (geoData && !geoData.error) {
        geoLocation = {
          city: geoData.city || '未知',
          region: geoData.region || '未知',
          country: geoData.country_name || '未知',
          timezone: geoData.timezone || '未知'
        };
        
        console.log(`[GeoLocation] 获取成功:`, geoLocation);
        return geoLocation;
      } else {
        console.warn(`[GeoLocation] API返回错误:`, geoData);
      }
    } else {
      console.warn(`[GeoLocation] API请求失败: ${geoResponse.status}`);
    }
  } catch (error) {
    console.warn(`[GeoLocation] 获取失败: ${error.message}`);
  }

  // Fallback 1: 使用Cloudflare的CF-IPCountry
  if (cfCountry && cfCountry !== 'XX') {
    const countryName = getCountryNameFromCode(cfCountry);
    if (countryName) {
      geoLocation.country = countryName;
      console.log(`[GeoLocation] 使用Cloudflare fallback: ${countryName}`);
    }
  }

  // Fallback 2: 基于IP段的简单推断
  if (geoLocation.country === '未知') {
    const inferredCountry = inferCountryFromIP(ipAddress);
    if (inferredCountry) {
      geoLocation.country = inferredCountry;
      console.log(`[GeoLocation] 使用IP推断: ${inferredCountry}`);
    }
  }

  return geoLocation;
}

/**
 * 检查是否为本地IP
 */
function isLocalIP(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return true;
  if (ip.includes('localhost')) return true;
  return false;
}

/**
 * 根据国家代码获取国家名称
 */
function getCountryNameFromCode(code: string): string | null {
  const countryMap: { [key: string]: string } = {
    'CN': '中国',
    'US': '美国', 
    'JP': '日本',
    'KR': '韩国',
    'SG': '新加坡',
    'HK': '香港',
    'TW': '台湾',
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
    'RO': '罗马尼亚',
    'BG': '保加利亚',
    'HR': '克罗地亚',
    'SK': '斯洛伐克',
    'SI': '斯洛文尼亚',
    'EE': '爱沙尼亚',
    'LV': '拉脱维亚',
    'LT': '立陶宛'
  };
  
  return countryMap[code] || null;
}

/**
 * 基于IP段进行简单的国家推断
 */
function inferCountryFromIP(ip: string): string | null {
  if (!ip.includes('.')) return null;
  
  try {
    const segments = ip.split('.').map(Number);
    const firstSegment = segments[0];
    
    // 中国大陆常见IP段
    if ((firstSegment >= 1 && firstSegment <= 126 && firstSegment !== 127) ||
        (firstSegment >= 202 && firstSegment <= 203) ||
        (firstSegment >= 210 && firstSegment <= 222)) {
      return '中国';
    }
    
    // 美国常见IP段
    if ((firstSegment >= 3 && firstSegment <= 99) ||
        (firstSegment >= 128 && firstSegment <= 191)) {
      return '美国';
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 基于邮箱域名推断地理区域（作为最后的fallback）
 */
export function getLocationFromEmailDomain(emailDomain: string): string {
  const domainLocationMap: { [key: string]: string } = {
    'qq.com': '中国',
    '163.com': '中国',
    '126.com': '中国',
    'sina.com': '中国',
    'sina.cn': '中国',
    'sohu.com': '中国',
    'foxmail.com': '中国',
    'gmail.com': '全球',
    'yahoo.com': '美国',
    'hotmail.com': '美国',
    'outlook.com': '美国',
    'live.com': '美国',
    'msn.com': '美国',
    'svtr.ai': '平台内部',
    'example.com': '测试环境'
  };
  
  return domainLocationMap[emailDomain.toLowerCase()] || '其他地区';
}