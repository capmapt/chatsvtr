/**
 * SVTR Authentication Service
 * Cloudflare Workers + Hono + AWS SES
 * 支持邮箱OTP验证码和Magic Link登录
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { AwsV4Signer } from 'aws4fetch'

type Bindings = {
  OTP_KV: KVNamespace
  APP_URL: string
  ALLOWED_RETURN_TO: string
  AWS_REGION: string
  FROM_LOGIN: string
  APP_SECRET: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS配置
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://svtr.ai',
      'https://svtrglobal.com', 
      'https://svtrai.com',
      'https://svtr.cn',
      'http://localhost:3000'
    ]
    return allowed.includes(origin) ? origin : allowed[0]
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}))

// 工具函数
function generateOTP(): string {
  return Math.random().toString().slice(2, 8) // 6位数字
}

function generateMagicToken(): string {
  return crypto.randomUUID() + '_' + Date.now()
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isAllowedReturnUrl(url: string, allowedUrls: string[]): boolean {
  try {
    const targetUrl = new URL(url)
    return allowedUrls.some(allowed => {
      const allowedUrl = new URL(allowed)
      return targetUrl.hostname === allowedUrl.hostname
    })
  } catch {
    return false
  }
}

// AWS SES发送邮件
async function sendEmailViaSES(
  c: any,
  recipient: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<boolean> {
  try {
    const signer = new AwsV4Signer({
      accessKeyId: c.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY,
      region: c.env.AWS_REGION,
    })

    const sesEndpoint = `https://email.${c.env.AWS_REGION}.amazonaws.com`
    const emailData = {
      Source: c.env.FROM_LOGIN,
      Destination: {
        ToAddresses: [recipient]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8'
          }
        }
      }
    }

    const request = new Request(sesEndpoint + '/v2/email/outbound-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    const signedRequest = await signer.sign(request)
    const response = await fetch(signedRequest)
    
    if (!response.ok) {
      console.error('SES API error:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('SES发送失败:', error)
    return false
  }
}

// 生成OTP邮件模板
function generateOTPEmailTemplate(otp: string, language: string = 'zh-CN') {
  const templates = {
    'zh-CN': {
      subject: '【SVTR】邮箱验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #FA8C32; text-align: center; margin-bottom: 30px;">SVTR 硅谷科技评论</h1>
            <h2 style="color: #333; text-align: center;">邮箱验证码</h2>
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: #FA8C32; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">验证码有效期为 <strong>5分钟</strong>，请及时使用。</p>
            <p style="color: #666; line-height: 1.6;">如果这不是您的操作，请忽略此邮件。</p>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>SVTR - 洞察全球资本，成就AI创业者</p>
              <p>https://svtr.ai</p>
            </div>
          </div>
        </div>
      `,
      text: `SVTR 邮箱验证码: ${otp}\n\n验证码有效期为5分钟，请及时使用。\n\n如果这不是您的操作，请忽略此邮件。\n\nSVTR - 洞察全球资本，成就AI创业者\nhttps://svtr.ai`
    },
    'en': {
      subject: '[SVTR] Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #FA8C32; text-align: center; margin-bottom: 30px;">SVTR Silicon Valley Technology Review</h1>
            <h2 style="color: #333; text-align: center;">Email Verification Code</h2>
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: #FA8C32; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">This verification code expires in <strong>5 minutes</strong>.</p>
            <p style="color: #666; line-height: 1.6;">If this wasn't you, please ignore this email.</p>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>SVTR - Insights on Global Capital, Empowering AI Founders</p>
              <p>https://svtr.ai</p>
            </div>
          </div>
        </div>
      `,
      text: `SVTR Email Verification Code: ${otp}\n\nThis verification code expires in 5 minutes.\n\nIf this wasn't you, please ignore this email.\n\nSVTR - Insights on Global Capital, Empowering AI Founders\nhttps://svtr.ai`
    }
  }

  return templates[language as keyof typeof templates] || templates['zh-CN']
}

// 生成Magic Link邮件模板
function generateMagicLinkEmailTemplate(magicLink: string, language: string = 'zh-CN') {
  const templates = {
    'zh-CN': {
      subject: '【SVTR】一键登录链接',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #FA8C32; text-align: center; margin-bottom: 30px;">SVTR 硅谷科技评论</h1>
            <h2 style="color: #333; text-align: center;">一键登录</h2>
            <p style="color: #666; line-height: 1.6;">点击下方按钮即可快速登录您的SVTR账户：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #FA8C32; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">🚀 立即登录</a>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">或复制以下链接到浏览器：</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">${magicLink}</p>
            <p style="color: #666; line-height: 1.6;">链接有效期为 <strong>10分钟</strong>，请及时使用。</p>
            <p style="color: #666; line-height: 1.6;">如果这不是您的操作，请忽略此邮件。</p>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>SVTR - 洞察全球资本，成就AI创业者</p>
              <p>https://svtr.ai</p>
            </div>
          </div>
        </div>
      `,
      text: `SVTR 一键登录链接\n\n点击以下链接登录您的SVTR账户：\n${magicLink}\n\n链接有效期为10分钟，请及时使用。\n\n如果这不是您的操作，请忽略此邮件。\n\nSVTR - 洞察全球资本，成就AI创业者\nhttps://svtr.ai`
    },
    'en': {
      subject: '[SVTR] Magic Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #FA8C32; text-align: center; margin-bottom: 30px;">SVTR Silicon Valley Technology Review</h1>
            <h2 style="color: #333; text-align: center;">Magic Login</h2>
            <p style="color: #666; line-height: 1.6;">Click the button below to quickly sign in to your SVTR account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #FA8C32; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">🚀 Sign In Now</a>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">${magicLink}</p>
            <p style="color: #666; line-height: 1.6;">This link expires in <strong>10 minutes</strong>.</p>
            <p style="color: #666; line-height: 1.6;">If this wasn't you, please ignore this email.</p>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>SVTR - Insights on Global Capital, Empowering AI Founders</p>
              <p>https://svtr.ai</p>
            </div>
          </div>
        </div>
      `,
      text: `SVTR Magic Login Link\n\nClick the following link to sign in to your SVTR account:\n${magicLink}\n\nThis link expires in 10 minutes.\n\nIf this wasn't you, please ignore this email.\n\nSVTR - Insights on Global Capital, Empowering AI Founders\nhttps://svtr.ai`
    }
  }

  return templates[language as keyof typeof templates] || templates['zh-CN']
}

// API路由

// 健康检查
app.get('/', (c) => {
  return c.json({
    service: 'SVTR Authentication Service',
    version: '1.0.0',
    status: 'healthy',
    endpoints: [
      'POST /auth/email/send - 发送OTP验证码',
      'POST /auth/email/verify - 验证OTP',
      'GET /auth/magic - Magic Link验证'
    ]
  })
})

// 发送OTP验证码
app.post('/auth/email/send', async (c) => {
  try {
    const { email, language = 'zh-CN', returnTo } = await c.req.json()

    if (!email || !isValidEmail(email)) {
      return c.json({ success: false, message: '请提供有效的邮箱地址' }, 400)
    }

    // 验证returnTo URL
    if (returnTo) {
      const allowedUrls = c.env.ALLOWED_RETURN_TO.split(',')
      if (!isAllowedReturnUrl(returnTo, allowedUrls)) {
        return c.json({ success: false, message: '无效的回调地址' }, 400)
      }
    }

    // 检查发送频率限制
    const rateLimitKey = `rate_limit_${email}`
    const lastSent = await c.env.OTP_KV.get(rateLimitKey)
    
    if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
      return c.json({ success: false, message: '发送过于频繁，请稍后重试' }, 429)
    }

    // 生成OTP
    const otp = generateOTP()
    
    // 存储OTP (5分钟有效)
    await c.env.OTP_KV.put(`otp_${email}`, otp, { expirationTtl: 300 })
    
    // 记录发送时间 (1分钟防重复)
    await c.env.OTP_KV.put(rateLimitKey, Date.now().toString(), { expirationTtl: 60 })

    // 发送邮件
    const emailTemplate = generateOTPEmailTemplate(otp, language)
    const emailSent = await sendEmailViaSES(
      c,
      email,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    )

    if (emailSent) {
      return c.json({
        success: true,
        message: language === 'zh-CN' ? '验证码已发送，5分钟内有效' : 'Verification code sent, valid for 5 minutes'
      })
    } else {
      // 如果是测试邮箱，返回测试信息
      if (email === 'success@simulator.amazonses.com') {
        return c.json({
          success: true,
          message: `[测试模式] 验证码: ${otp}`,
          testMode: true,
          otp // 仅测试环境返回
        })
      }
      
      return c.json({ success: false, message: '邮件发送失败，请重试' }, 500)
    }

  } catch (error) {
    console.error('发送OTP失败:', error)
    return c.json({ success: false, message: '服务器错误' }, 500)
  }
})

// 验证OTP
app.post('/auth/email/verify', async (c) => {
  try {
    const { email, otp, returnTo } = await c.req.json()

    if (!email || !otp) {
      return c.json({ success: false, message: '请提供邮箱和验证码' }, 400)
    }

    // 验证OTP
    const storedOtp = await c.env.OTP_KV.get(`otp_${email}`)
    if (!storedOtp || storedOtp !== otp) {
      return c.json({ success: false, message: '验证码错误或已过期' }, 400)
    }

    // 删除已使用的OTP
    await c.env.OTP_KV.delete(`otp_${email}`)

    // 生成会话token
    const sessionToken = crypto.randomUUID()
    const sessionData = {
      email,
      loginTime: Date.now(),
      method: 'otp'
    }

    // 存储会话 (30天)
    await c.env.OTP_KV.put(`session_${sessionToken}`, JSON.stringify(sessionData), {
      expirationTtl: 30 * 24 * 60 * 60
    })

    // 处理回调
    if (returnTo) {
      const allowedUrls = c.env.ALLOWED_RETURN_TO.split(',')
      if (isAllowedReturnUrl(returnTo, allowedUrls)) {
        const callbackUrl = new URL(returnTo)
        callbackUrl.searchParams.set('auth_success', 'true')
        callbackUrl.searchParams.set('token', sessionToken)
        callbackUrl.searchParams.set('email', email)
        
        return c.redirect(callbackUrl.toString())
      }
    }

    return c.json({
      success: true,
      message: '验证成功',
      token: sessionToken,
      email: email
    })

  } catch (error) {
    console.error('验证OTP失败:', error)
    return c.json({ success: false, message: '服务器错误' }, 500)
  }
})

// Magic Link处理
app.get('/auth/magic', async (c) => {
  try {
    const token = c.req.query('token')
    const returnTo = c.req.query('return_to')

    if (!token) {
      return c.json({ success: false, message: '缺少登录令牌' }, 400)
    }

    // 验证Magic Token
    const magicData = await c.env.OTP_KV.get(`magic_${token}`)
    if (!magicData) {
      return c.json({ success: false, message: '登录链接无效或已过期' }, 400)
    }

    const { email } = JSON.parse(magicData)
    
    // 删除已使用的Magic Token
    await c.env.OTP_KV.delete(`magic_${token}`)

    // 生成会话token
    const sessionToken = crypto.randomUUID()
    const sessionData = {
      email,
      loginTime: Date.now(),
      method: 'magic_link'
    }

    // 存储会话 (30天)
    await c.env.OTP_KV.put(`session_${sessionToken}`, JSON.stringify(sessionData), {
      expirationTtl: 30 * 24 * 60 * 60
    })

    // 处理回调
    if (returnTo) {
      const allowedUrls = c.env.ALLOWED_RETURN_TO.split(',')
      if (isAllowedReturnUrl(returnTo, allowedUrls)) {
        const callbackUrl = new URL(returnTo)
        callbackUrl.searchParams.set('auth_success', 'true')
        callbackUrl.searchParams.set('token', sessionToken)
        callbackUrl.searchParams.set('email', email)
        
        return c.redirect(callbackUrl.toString())
      }
    }

    return c.json({
      success: true,
      message: 'Magic Link登录成功',
      token: sessionToken,
      email: email
    })

  } catch (error) {
    console.error('Magic Link处理失败:', error)
    return c.json({ success: false, message: '服务器错误' }, 500)
  }
})

// 发送Magic Link (扩展功能)
app.post('/auth/magic/send', async (c) => {
  try {
    const { email, language = 'zh-CN', returnTo } = await c.req.json()

    if (!email || !isValidEmail(email)) {
      return c.json({ success: false, message: '请提供有效的邮箱地址' }, 400)
    }

    // 验证returnTo URL
    if (returnTo) {
      const allowedUrls = c.env.ALLOWED_RETURN_TO.split(',')
      if (!isAllowedReturnUrl(returnTo, allowedUrls)) {
        return c.json({ success: false, message: '无效的回调地址' }, 400)
      }
    }

    // 检查发送频率限制
    const rateLimitKey = `magic_limit_${email}`
    const lastSent = await c.env.OTP_KV.get(rateLimitKey)
    
    if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
      return c.json({ success: false, message: '发送过于频繁，请稍后重试' }, 429)
    }

    // 生成Magic Token
    const magicToken = generateMagicToken()
    const magicData = { email, returnTo, createdAt: Date.now() }
    
    // 存储Magic Token (10分钟有效)
    await c.env.OTP_KV.put(`magic_${magicToken}`, JSON.stringify(magicData), {
      expirationTtl: 600
    })
    
    // 记录发送时间
    await c.env.OTP_KV.put(rateLimitKey, Date.now().toString(), { expirationTtl: 60 })

    // 构建Magic Link
    const magicLink = `${c.env.APP_URL}/auth/magic?token=${magicToken}${returnTo ? `&return_to=${encodeURIComponent(returnTo)}` : ''}`

    // 发送邮件
    const emailTemplate = generateMagicLinkEmailTemplate(magicLink, language)
    const emailSent = await sendEmailViaSES(
      c,
      email,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    )

    if (emailSent) {
      return c.json({
        success: true,
        message: language === 'zh-CN' ? '登录链接已发送，10分钟内有效' : 'Login link sent, valid for 10 minutes'
      })
    } else {
      // 如果是测试邮箱，返回测试信息
      if (email === 'success@simulator.amazonses.com') {
        return c.json({
          success: true,
          message: `[测试模式] Magic Link: ${magicLink}`,
          testMode: true,
          magicLink // 仅测试环境返回
        })
      }
      
      return c.json({ success: false, message: '邮件发送失败，请重试' }, 500)
    }

  } catch (error) {
    console.error('发送Magic Link失败:', error)
    return c.json({ success: false, message: '服务器错误' }, 500)
  }
})

// 会话验证
app.get('/auth/session', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '') || c.req.query('token')
    
    if (!token) {
      return c.json({ success: false, message: '缺少会话令牌' }, 401)
    }

    const sessionData = await c.env.OTP_KV.get(`session_${token}`)
    if (!sessionData) {
      return c.json({ success: false, message: '会话无效或已过期' }, 401)
    }

    const session = JSON.parse(sessionData)
    return c.json({
      success: true,
      session: {
        email: session.email,
        loginTime: session.loginTime,
        method: session.method
      }
    })

  } catch (error) {
    console.error('会话验证失败:', error)
    return c.json({ success: false, message: '服务器错误' }, 500)
  }
})

export default app