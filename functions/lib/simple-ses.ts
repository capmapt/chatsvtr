/**
 * 简化的AWS SES实现 - 用于调试
 */

interface SimpleSESConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  fromEmail: string;
}

export class SimpleSES {
  private config: SimpleSESConfig;

  constructor(config: SimpleSESConfig) {
    this.config = config;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      console.log('[SimpleSES] 开始发送邮件到:', to);
      
      // 构建基本的SES请求参数
      const params = new URLSearchParams();
      params.append('Action', 'SendEmail');
      params.append('Version', '2010-12-01');
      params.append('Source', this.config.fromEmail);
      params.append('Destination.ToAddresses.member.1', to);
      params.append('Message.Subject.Data', subject);
      params.append('Message.Subject.Charset', 'UTF-8');
      params.append('Message.Body.Text.Data', body);
      params.append('Message.Body.Text.Charset', 'UTF-8');

      console.log('[SimpleSES] 请求参数构建完成');

      // 生成AWS v4签名
      const host = `email.${this.config.region}.amazonaws.com`;
      const url = `https://${host}/`;
      
      const now = new Date();
      const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
      const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '');
      
      console.log('[SimpleSES] 时间戳生成:', { amzDate, dateStamp });
      
      // 计算payload hash
      const payloadString = params.toString();
      const payloadHash = await this.sha256(payloadString);
      
      console.log('[SimpleSES] Payload hash计算完成');
      
      // 构建canonical request
      const canonicalRequest = [
        'POST',
        '/',
        '',
        `content-type:application/x-www-form-urlencoded`,
        `host:${host}`,
        `x-amz-date:${amzDate}`,
        '',
        'content-type;host;x-amz-date',
        payloadHash
      ].join('\n');
      
      const canonicalRequestHash = await this.sha256(canonicalRequest);
      
      // 构建string to sign
      const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        `${dateStamp}/${this.config.region}/ses/aws4_request`,
        canonicalRequestHash
      ].join('\n');
      
      console.log('[SimpleSES] String to sign构建完成');
      
      // 计算签名
      const signature = await this.calculateSignature(
        this.config.secretAccessKey,
        dateStamp,
        this.config.region,
        'ses',
        stringToSign
      );
      
      console.log('[SimpleSES] 签名计算完成');
      
      // 构建Authorization头
      const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${dateStamp}/${this.config.region}/ses/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`;
      
      // 发送请求
      console.log('[SimpleSES] 准备发送HTTP请求');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': host,
          'X-Amz-Date': amzDate,
          'Authorization': authorizationHeader,
        },
        body: payloadString,
      });
      
      console.log('[SimpleSES] HTTP响应状态:', response.status);
      
      const responseText = await response.text();
      console.log('[SimpleSES] 响应内容:', responseText.substring(0, 500));
      
      if (!response.ok) {
        console.error('[SimpleSES] SES API错误:', response.status, responseText);
        return false;
      }
      
      // 检查是否包含MessageId
      const hasMessageId = responseText.includes('<MessageId>');
      console.log('[SimpleSES] 邮件发送结果:', hasMessageId ? '成功' : '失败');
      
      return hasMessageId;
      
    } catch (error) {
      console.error('[SimpleSES] 发送失败:', error);
      return false;
    }
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

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
}