/**
 * 融资日报健康检查API
 * 用于监控数据源状态和API可用性
 */

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: any;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    feishuAuth: { status: string; latency?: number; error?: string };
    dataFetch: { status: string; recordCount?: number; latency?: number; error?: string };
    cacheStatus: { status: string; hasCache?: boolean; error?: string };
  };
  recommendations?: string[];
}

/**
 * 健康检查端点
 */
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  console.log('🏥 开始健康检查...');

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      feishuAuth: { status: 'pending' },
      dataFetch: { status: 'pending' },
      cacheStatus: { status: 'pending' }
    },
    recommendations: []
  };

  // 1. 检查飞书认证
  try {
    const authStart = Date.now();
    const authResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: env.FEISHU_APP_ID,
        app_secret: env.FEISHU_APP_SECRET
      })
    });

    const authData = await authResponse.json();
    const authLatency = Date.now() - authStart;

    if (authData.code === 0) {
      result.checks.feishuAuth = {
        status: 'ok',
        latency: authLatency
      };
      console.log(`✅ 飞书认证成功 (${authLatency}ms)`);
    } else {
      result.checks.feishuAuth = {
        status: 'error',
        error: authData.msg
      };
      result.status = 'down';
      result.recommendations?.push('检查飞书App ID和Secret配置');
      console.error('❌ 飞书认证失败:', authData.msg);
    }
  } catch (error) {
    result.checks.feishuAuth = {
      status: 'error',
      error: error.message
    };
    result.status = 'down';
    result.recommendations?.push('飞书API网络连接失败');
    console.error('❌ 飞书认证异常:', error);
  }

  // 2. 检查数据获取
  if (result.checks.feishuAuth.status === 'ok') {
    try {
      const dataStart = Date.now();
      const dataResponse = await fetch(`${request.url.replace('/wiki-funding-health', '/wiki-funding-sync')}?force=true`);
      const dataLatency = Date.now() - dataStart;

      const data = await dataResponse.json();

      if (data.success && data.count > 0) {
        result.checks.dataFetch = {
          status: 'ok',
          recordCount: data.count,
          latency: dataLatency
        };
        console.log(`✅ 数据获取成功: ${data.count}条记录 (${dataLatency}ms)`);

        // 数据质量检查
        if (data.count < 5) {
          result.status = 'degraded';
          result.recommendations?.push('数据记录数量偏少，检查飞书数据源');
        }
      } else {
        result.checks.dataFetch = {
          status: 'error',
          recordCount: 0,
          error: data.message || '未知错误'
        };
        result.status = 'degraded';
        result.recommendations?.push('数据获取失败或返回空数据');
        console.warn('⚠️ 数据获取异常:', data);
      }
    } catch (error) {
      result.checks.dataFetch = {
        status: 'error',
        error: error.message
      };
      result.status = 'degraded';
      result.recommendations?.push('数据API调用失败');
      console.error('❌ 数据获取异常:', error);
    }
  } else {
    result.checks.dataFetch = {
      status: 'skipped',
      error: '飞书认证失败，跳过数据检查'
    };
  }

  // 3. 检查缓存状态
  if (env.SVTR_CACHE) {
    try {
      const cacheKey = 'wiki-funding-real-data-v3';
      const cachedData = await env.SVTR_CACHE.get(cacheKey);

      result.checks.cacheStatus = {
        status: 'ok',
        hasCache: !!cachedData
      };

      if (!cachedData) {
        result.recommendations?.push('缓存为空，首次请求可能较慢');
      }

      console.log(`✅ 缓存检查完成: ${cachedData ? '有缓存' : '无缓存'}`);
    } catch (error) {
      result.checks.cacheStatus = {
        status: 'error',
        error: error.message
      };
      result.recommendations?.push('缓存系统异常');
      console.error('❌ 缓存检查失败:', error);
    }
  } else {
    result.checks.cacheStatus = {
      status: 'unavailable',
      error: 'KV存储未配置'
    };
    result.recommendations?.push('配置KV存储以提升性能');
  }

  // 生成最终状态
  const hasError = Object.values(result.checks).some(check => check.status === 'error');
  const hasWarning = result.status === 'degraded';

  if (hasError) {
    result.status = 'down';
  } else if (hasWarning) {
    result.status = 'degraded';
  }

  console.log(`🏥 健康检查完成: ${result.status}`);

  return new Response(JSON.stringify(result, null, 2), {
    status: result.status === 'down' ? 503 : 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}