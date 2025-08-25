/**
 * AWS SES邮件发送服务
 * 支持验证码邮件和Magic Link邮件发送
 */

interface EmailConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  fromEmail: string;
}

interface VerificationEmailData {
  email: string;
  code: string;
  userName?: string;
  language: 'zh-CN' | 'en';
}

interface MagicLinkEmailData {
  email: string;
  magicLink: string;
  userName?: string;
  language: 'zh-CN' | 'en';
}

class AWSEmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(data: VerificationEmailData): Promise<boolean> {
    try {
      const { email, code, userName, language } = data;
      
      const subject = language === 'zh-CN' 
        ? `[SVTR] 您的登录验证码: ${code}`
        : `[SVTR] Your Login Verification Code: ${code}`;

      const htmlBody = this.generateVerificationEmailHTML(data);
      const textBody = this.generateVerificationEmailText(data);

      const success = await this.sendEmail({
        to: email,
        subject,
        htmlBody,
        textBody
      });

      if (success) {
        console.log(`验证码邮件发送成功: ${email}`);
      } else {
        console.error(`验证码邮件发送失败: ${email}`);
      }

      return success;
    } catch (error) {
      console.error('发送验证码邮件失败:', error);
      return false;
    }
  }

  /**
   * 发送Magic Link邮件
   */
  async sendMagicLink(data: MagicLinkEmailData): Promise<boolean> {
    try {
      const { email, magicLink, userName, language } = data;
      
      const subject = language === 'zh-CN' 
        ? '[SVTR] 您的一键登录链接'
        : '[SVTR] Your Magic Login Link';

      const htmlBody = this.generateMagicLinkEmailHTML(data);
      const textBody = this.generateMagicLinkEmailText(data);

      const success = await this.sendEmail({
        to: email,
        subject,
        htmlBody,
        textBody
      });

      if (success) {
        console.log(`Magic Link邮件发送成功: ${email}`);
      } else {
        console.error(`Magic Link邮件发送失败: ${email}`);
      }

      return success;
    } catch (error) {
      console.error('发送Magic Link邮件失败:', error);
      return false;
    }
  }

  /**
   * 使用AWS SES发送邮件
   */
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
  }): Promise<boolean> {
    try {
      const { to, subject, htmlBody, textBody } = emailData;
      
      // 构建SES API请求
      const sesRequest = {
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: htmlBody
            },
            Text: {
              Charset: 'UTF-8',
              Data: textBody
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: this.config.fromEmail
      };

      // AWS SES API调用
      const response = await this.callSESAPI('SendEmail', sesRequest);
      
      return response.MessageId ? true : false;
    } catch (error) {
      console.error('[AWS SES] API调用失败:', {
        error: error.message || String(error),
        stack: error.stack,
        to: emailData.to
      });
      return false;
    }
  }

  /**
   * 调用AWS SES API
   */
  private async callSESAPI(action: string, payload: any): Promise<any> {
    const host = `email.${this.config.region}.amazonaws.com`;
    const service = 'ses';
    const method = 'POST';
    
    // 生成AWS签名
    const { headers, body } = await this.generateAWSSignature(
      host, 
      service, 
      method, 
      action, 
      payload
    );

    const response = await fetch(`https://${host}/`, {
      method,
      headers,
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AWS SES] HTTP错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: `https://${host}/`
      });
      throw new Error(`SES API错误: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    return this.parseXMLResponse(responseText);
  }

  /**
   * 生成AWS API签名
   */
  private async generateAWSSignature(
    host: string,
    service: string,
    method: string,
    action: string,
    payload: any
  ) {
    const now = new Date();
    const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    
    // Form-encoded payload for SES
    const formData = new URLSearchParams();
    formData.append('Action', action);
    formData.append('Version', '2010-12-01');
    this.addObjectToFormData(formData, payload, '');
    
    const payloadString = formData.toString();
    const payloadHash = await this.sha256(payloadString);

    // 构建canonical request
    const canonicalHeaders = [
      `content-type:application/x-www-form-urlencoded`,
      `host:${host}`,
      `x-amz-date:${amzDate}`
    ].join('\n');

    const signedHeaders = 'content-type;host;x-amz-date';
    
    const canonicalRequest = [
      method,
      '/',
      '',
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash
    ].join('\n');

    // 构建string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.config.region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await this.sha256(canonicalRequest)
    ].join('\n');

    // 计算签名
    const signature = await this.calculateSignature(
      this.config.secretAccessKey,
      dateStamp,
      this.config.region,
      service,
      stringToSign
    );

    // 构建authorization header
    const authorization = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': host,
        'X-Amz-Date': amzDate,
        'Authorization': authorization
      },
      body: payloadString
    };
  }

  /**
   * 递归添加对象到FormData
   */
  private addObjectToFormData(formData: URLSearchParams, obj: any, prefix: string) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const formKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'object') {
                this.addObjectToFormData(formData, item, `${formKey}.${index + 1}`);
              } else {
                formData.append(`${formKey}.${index + 1}`, String(item));
              }
            });
          } else {
            this.addObjectToFormData(formData, value, formKey);
          }
        } else {
          formData.append(formKey, String(value));
        }
      }
    }
  }

  /**
   * 计算AWS签名
   */
  private async calculateSignature(
    secretKey: string,
    dateStamp: string,
    region: string,
    service: string,
    stringToSign: string
  ): Promise<string> {
    const kDate = await this.hmacSha256(`AWS4${secretKey}`, dateStamp);
    const kRegion = await this.hmacSha256(kDate, region);
    const kService = await this.hmacSha256(kRegion, service);
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    const signature = await this.hmacSha256(kSigning, stringToSign);
    
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * SHA256哈希
   */
  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * HMAC-SHA256
   */
  private async hmacSha256(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    const messageBuffer = new TextEncoder().encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    return await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  }

  /**
   * 解析XML响应
   */
  private parseXMLResponse(xmlString: string): any {
    // 简单的XML解析，提取MessageId
    const messageIdMatch = xmlString.match(/<MessageId>([^<]+)<\/MessageId>/);
    const errorMatch = xmlString.match(/<Error>.*?<Code>([^<]+)<\/Code>.*?<Message>([^<]+)<\/Message>/s);
    
    if (errorMatch) {
      throw new Error(`AWS SES错误: ${errorMatch[1]} - ${errorMatch[2]}`);
    }
    
    return {
      MessageId: messageIdMatch ? messageIdMatch[1] : null
    };
  }

  /**
   * 生成验证码邮件HTML模板
   */
  private generateVerificationEmailHTML(data: VerificationEmailData): string {
    const { code, userName, language } = data;
    const name = userName || (language === 'zh-CN' ? '用户' : 'User');
    
    if (language === 'zh-CN') {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVTR登录验证码</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SVTR</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">硅谷科技评论</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">您好，${name}！</h2>
    <p style="font-size: 16px; color: #666;">您正在登录SVTR平台，请使用以下验证码完成登录：</p>
    
    <div style="background: #fff; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #667eea;">
      <p style="font-size: 14px; color: #666; margin: 0 0 10px;">您的验证码</p>
      <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 3px;">${code}</p>
    </div>
    
    <p style="font-size: 14px; color: #999;">
      • 验证码5分钟内有效<br>
      • 请勿将验证码泄露给他人<br>
      • 如非本人操作，请忽略此邮件
    </p>
  </div>
  
  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>此邮件由 SVTR 系统自动发送，请勿回复</p>
    <p>© 2025 SVTR - Silicon Valley Tech Review</p>
  </div>
</body>
</html>`;
    } else {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVTR Login Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SVTR</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Silicon Valley Tech Review</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hello, ${name}!</h2>
    <p style="font-size: 16px; color: #666;">You're logging into SVTR platform. Please use the verification code below to complete your login:</p>
    
    <div style="background: #fff; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #667eea;">
      <p style="font-size: 14px; color: #666; margin: 0 0 10px;">Your Verification Code</p>
      <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 3px;">${code}</p>
    </div>
    
    <p style="font-size: 14px; color: #999;">
      • Code expires in 5 minutes<br>
      • Do not share this code with anyone<br>
      • If this wasn't you, please ignore this email
    </p>
  </div>
  
  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>This email was sent automatically by SVTR system, please do not reply</p>
    <p>© 2025 SVTR - Silicon Valley Tech Review</p>
  </div>
</body>
</html>`;
    }
  }

  /**
   * 生成验证码邮件纯文本版本
   */
  private generateVerificationEmailText(data: VerificationEmailData): string {
    const { code, userName, language } = data;
    const name = userName || (language === 'zh-CN' ? '用户' : 'User');
    
    if (language === 'zh-CN') {
      return `
SVTR 登录验证码

您好，${name}！

您正在登录SVTR平台，请使用以下验证码完成登录：

验证码：${code}

注意事项：
• 验证码5分钟内有效
• 请勿将验证码泄露给他人
• 如非本人操作，请忽略此邮件

此邮件由 SVTR 系统自动发送，请勿回复
© 2025 SVTR - Silicon Valley Tech Review
`;
    } else {
      return `
SVTR Login Verification Code

Hello, ${name}!

You're logging into SVTR platform. Please use the verification code below to complete your login:

Verification Code: ${code}

Important Notes:
• Code expires in 5 minutes
• Do not share this code with anyone
• If this wasn't you, please ignore this email

This email was sent automatically by SVTR system, please do not reply
© 2025 SVTR - Silicon Valley Tech Review
`;
    }
  }

  /**
   * 生成Magic Link邮件HTML模板
   */
  private generateMagicLinkEmailHTML(data: MagicLinkEmailData): string {
    const { magicLink, userName, language } = data;
    const name = userName || (language === 'zh-CN' ? '用户' : 'User');
    
    if (language === 'zh-CN') {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVTR一键登录</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SVTR</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">硅谷科技评论</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">您好，${name}！</h2>
    <p style="font-size: 16px; color: #666;">点击下方按钮即可快速登录SVTR平台：</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        🚀 立即登录 SVTR
      </a>
    </div>
    
    <p style="font-size: 14px; color: #999;">
      • 登录链接10分钟内有效<br>
      • 此链接只能使用一次<br>
      • 如非本人操作，请忽略此邮件
    </p>
    
    <div style="background: #fff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-top: 20px;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
        <span style="word-break: break-all; color: #667eea;">${magicLink}</span>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>此邮件由 SVTR 系统自动发送，请勿回复</p>
    <p>© 2025 SVTR - Silicon Valley Tech Review</p>
  </div>
</body>
</html>`;
    } else {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVTR Magic Login</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SVTR</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Silicon Valley Tech Review</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hello, ${name}!</h2>
    <p style="font-size: 16px; color: #666;">Click the button below to quickly login to SVTR platform:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        🚀 Login to SVTR Now
      </a>
    </div>
    
    <p style="font-size: 14px; color: #999;">
      • Link expires in 10 minutes<br>
      • This link can only be used once<br>
      • If this wasn't you, please ignore this email
    </p>
    
    <div style="background: #fff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-top: 20px;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        If the button doesn't work, please copy and paste this link into your browser:<br>
        <span style="word-break: break-all; color: #667eea;">${magicLink}</span>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>This email was sent automatically by SVTR system, please do not reply</p>
    <p>© 2025 SVTR - Silicon Valley Tech Review</p>
  </div>
</body>
</html>`;
    }
  }

  /**
   * 生成Magic Link邮件纯文本版本
   */
  private generateMagicLinkEmailText(data: MagicLinkEmailData): string {
    const { magicLink, userName, language } = data;
    const name = userName || (language === 'zh-CN' ? '用户' : 'User');
    
    if (language === 'zh-CN') {
      return `
SVTR 一键登录

您好，${name}！

点击以下链接即可快速登录SVTR平台：

${magicLink}

注意事项：
• 登录链接10分钟内有效
• 此链接只能使用一次
• 如非本人操作，请忽略此邮件

此邮件由 SVTR 系统自动发送，请勿回复
© 2025 SVTR - Silicon Valley Tech Review
`;
    } else {
      return `
SVTR Magic Login

Hello, ${name}!

Click the following link to quickly login to SVTR platform:

${magicLink}

Important Notes:
• Link expires in 10 minutes
• This link can only be used once
• If this wasn't you, please ignore this email

This email was sent automatically by SVTR system, please do not reply
© 2025 SVTR - Silicon Valley Tech Review
`;
    }
  }
}

export { AWSEmailService, type EmailConfig, type VerificationEmailData, type MagicLinkEmailData };