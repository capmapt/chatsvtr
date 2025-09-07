/**
 * SVTR Content Workflow API
 * 处理内容创作的完整工作流程
 */

export interface Env {
  WORKFLOW_KV: KVNamespace;
  CONTENT_KV: KVNamespace;
  AI: any;
}

// 工作流状态
interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  assignedTo?: string;
  assignedAt?: string;
  completedAt?: string;
  result?: any;
  notes?: string;
}

interface ContentWorkflow {
  id: string;
  contentId: string;
  contentTitle: string;
  authorId: string;
  authorName: string;
  workflowType: 'standard' | 'express' | 'premium';
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'published';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  steps: WorkflowStep[];
  notifications: WorkflowNotification[];
  metadata: {
    category: string;
    tags: string[];
    wordCount: number;
    estimatedReviewTime: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

interface WorkflowNotification {
  id: string;
  type: 'email' | 'in_app' | 'webhook';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

// 预定义工作流模板
const WORKFLOW_TEMPLATES = {
  standard: {
    name: '标准审核流程',
    description: '适用于大部分内容的标准审核流程',
    steps: [
      { name: '内容检查', description: '检查内容格式和基本质量' },
      { name: '编辑审核', description: '编辑进行内容审核和修改建议' },
      { name: '主编审批', description: '主编最终审批' },
      { name: '发布准备', description: '准备发布，设置SEO信息' },
      { name: '正式发布', description: '发布到平台' }
    ]
  },
  express: {
    name: '快速发布流程',
    description: '适用于紧急或高质量内容的快速流程',
    steps: [
      { name: '快速审核', description: '编辑快速审核' },
      { name: '立即发布', description: '审核通过后立即发布' }
    ]
  },
  premium: {
    name: '精品内容流程',
    description: '适用于重要内容的严格审核流程',
    steps: [
      { name: '初步审核', description: '初步内容检查' },
      { name: '专家评审', description: '行业专家评审' },
      { name: '多轮修改', description: '基于专家意见进行修改' },
      { name: '最终审批', description: '管理层最终审批' },
      { name: '营销准备', description: '准备营销材料和推广计划' },
      { name: '精品发布', description: '作为精品内容发布推广' }
    ]
  }
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/api/workflow', '');
    const method = request.method;

    try {
      // 工作流路由
      if (path === '/workflows' && method === 'GET') {
        return await handleGetWorkflows(request, env);
      }
      
      if (path === '/workflows' && method === 'POST') {
        return await handleCreateWorkflow(request, env);
      }
      
      if (path.match(/^\/workflows\/[\w-]+$/) && method === 'GET') {
        const workflowId = path.split('/')[2];
        return await handleGetWorkflow(workflowId, env);
      }
      
      if (path.match(/^\/workflows\/[\w-]+\/steps\/[\w-]+$/) && method === 'PUT') {
        const [, , workflowId, , stepId] = path.split('/');
        return await handleUpdateStep(workflowId, stepId, request, env);
      }
      
      if (path.match(/^\/workflows\/[\w-]+\/assign$/) && method === 'POST') {
        const workflowId = path.split('/')[2];
        return await handleAssignWorkflow(workflowId, request, env);
      }
      
      if (path.match(/^\/workflows\/[\w-]+\/complete$/) && method === 'POST') {
        const workflowId = path.split('/')[2];
        return await handleCompleteWorkflow(workflowId, request, env);
      }
      
      if (path === '/templates' && method === 'GET') {
        return await handleGetTemplates();
      }
      
      if (path === '/stats' && method === 'GET') {
        return await handleGetWorkflowStats(env);
      }

      return new Response('Not Found', { 
        status: 404,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error('Workflow API Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};

// 获取工作流列表
async function handleGetWorkflows(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const assignedTo = url.searchParams.get('assignedTo');
  const authorId = url.searchParams.get('authorId');
  const priority = url.searchParams.get('priority');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  try {
    const workflowsData = await env.WORKFLOW_KV.get('workflows:list');
    let workflows: ContentWorkflow[] = workflowsData ? JSON.parse(workflowsData) : [];

    // 应用筛选
    if (status) {
      workflows = workflows.filter(w => w.status === status);
    }
    if (assignedTo) {
      workflows = workflows.filter(w => 
        w.steps.some(step => step.assignedTo === assignedTo && step.status === 'pending')
      );
    }
    if (authorId) {
      workflows = workflows.filter(w => w.authorId === authorId);
    }
    if (priority) {
      workflows = workflows.filter(w => w.priority === priority);
    }

    // 排序（按优先级和更新时间）
    workflows.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // 分页
    const total = workflows.length;
    const offset = (page - 1) * limit;
    const paginatedWorkflows = workflows.slice(offset, offset + limit);

    // 统计信息
    const stats = {
      total,
      draft: workflows.filter(w => w.status === 'draft').length,
      submitted: workflows.filter(w => w.status === 'submitted').length,
      in_review: workflows.filter(w => w.status === 'in_review').length,
      approved: workflows.filter(w => w.status === 'approved').length,
      rejected: workflows.filter(w => w.status === 'rejected').length,
      published: workflows.filter(w => w.status === 'published').length
    };

    return new Response(JSON.stringify({
      workflows: paginatedWorkflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 创建新工作流
async function handleCreateWorkflow(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.json();
    const { contentId, authorId, authorName, workflowType = 'standard', priority = 'medium', deadline } = data;

    // 获取内容信息
    const contentData = await env.CONTENT_KV.get(`svtr:content:${contentId}`);
    if (!contentData) {
      return new Response(JSON.stringify({ error: '内容不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const content = JSON.parse(contentData);
    const template = WORKFLOW_TEMPLATES[workflowType];
    const workflowId = generateWorkflowId();
    const now = new Date().toISOString();

    // 创建工作流步骤
    const steps: WorkflowStep[] = template.steps.map((step, index) => ({
      id: `${workflowId}-step-${index}`,
      name: step.name,
      description: step.description,
      status: index === 0 ? 'pending' : 'pending'
    }));

    // 估算审核时间
    const wordCount = content.wordCount || 0;
    const baseTime = Math.ceil(wordCount / 500) * 10; // 每500字10分钟基础时间
    const complexityMultiplier = {
      simple: 1,
      moderate: 1.5,
      complex: 2
    };
    const complexity = wordCount > 2000 ? 'complex' : wordCount > 1000 ? 'moderate' : 'simple';
    const estimatedReviewTime = Math.round(baseTime * complexityMultiplier[complexity]);

    // 创建工作流
    const workflow: ContentWorkflow = {
      id: workflowId,
      contentId,
      contentTitle: content.title,
      authorId,
      authorName,
      workflowType,
      status: 'submitted',
      priority,
      createdAt: now,
      updatedAt: now,
      deadline,
      steps,
      notifications: [],
      metadata: {
        category: content.category,
        tags: content.tags || [],
        wordCount,
        estimatedReviewTime,
        complexity
      }
    };

    // 保存工作流
    await env.WORKFLOW_KV.put(`workflow:${workflowId}`, JSON.stringify(workflow));
    await addToWorkflowsList(workflow, env);

    // 发送通知
    await sendWorkflowNotification(workflow, 'workflow_created', env);

    // 自动分配第一步（如果有默认审核员）
    await autoAssignFirstStep(workflow, env);

    return new Response(JSON.stringify({
      success: true,
      workflow,
      message: '工作流创建成功'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 获取单个工作流
async function handleGetWorkflow(workflowId: string, env: Env): Promise<Response> {
  try {
    const workflowData = await env.WORKFLOW_KV.get(`workflow:${workflowId}`);
    if (!workflowData) {
      return new Response(JSON.stringify({ error: '工作流不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const workflow: ContentWorkflow = JSON.parse(workflowData);

    return new Response(JSON.stringify(workflow), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 更新工作流步骤
async function handleUpdateStep(workflowId: string, stepId: string, request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.json();
    const { status, result, notes, assignedTo } = data;

    const workflowData = await env.WORKFLOW_KV.get(`workflow:${workflowId}`);
    if (!workflowData) {
      return new Response(JSON.stringify({ error: '工作流不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const workflow: ContentWorkflow = JSON.parse(workflowData);
    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) {
      return new Response(JSON.stringify({ error: '步骤不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    
    // 更新步骤
    workflow.steps[stepIndex] = {
      ...workflow.steps[stepIndex],
      status,
      result,
      notes,
      assignedTo: assignedTo || workflow.steps[stepIndex].assignedTo,
      completedAt: status === 'completed' ? now : workflow.steps[stepIndex].completedAt,
      assignedAt: assignedTo ? now : workflow.steps[stepIndex].assignedAt
    };

    workflow.updatedAt = now;

    // 如果步骤完成，检查是否需要进入下一步
    if (status === 'completed') {
      await handleStepCompletion(workflow, stepIndex, env);
    }

    // 如果步骤失败，可能需要回退或标记整个工作流失败
    if (status === 'failed') {
      workflow.status = 'rejected';
      await sendWorkflowNotification(workflow, 'workflow_rejected', env);
    }

    // 保存更新后的工作流
    await env.WORKFLOW_KV.put(`workflow:${workflowId}`, JSON.stringify(workflow));
    await updateWorkflowInList(workflow, env);

    return new Response(JSON.stringify({
      success: true,
      workflow,
      message: '步骤更新成功'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 分配工作流
async function handleAssignWorkflow(workflowId: string, request: Request, env: Env): Promise<Response> {
  try {
    const { assignedTo, stepId } = await request.json();
    
    const workflowData = await env.WORKFLOW_KV.get(`workflow:${workflowId}`);
    if (!workflowData) {
      return new Response(JSON.stringify({ error: '工作流不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const workflow: ContentWorkflow = JSON.parse(workflowData);
    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) {
      return new Response(JSON.stringify({ error: '步骤不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    
    // 分配步骤
    workflow.steps[stepIndex].assignedTo = assignedTo;
    workflow.steps[stepIndex].assignedAt = now;
    workflow.steps[stepIndex].status = 'in_progress';
    workflow.status = 'in_review';
    workflow.updatedAt = now;

    // 保存工作流
    await env.WORKFLOW_KV.put(`workflow:${workflowId}`, JSON.stringify(workflow));
    await updateWorkflowInList(workflow, env);

    // 发送分配通知
    await sendAssignmentNotification(workflow, stepIndex, assignedTo, env);

    return new Response(JSON.stringify({
      success: true,
      workflow,
      message: '分配成功'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 完成工作流
async function handleCompleteWorkflow(workflowId: string, request: Request, env: Env): Promise<Response> {
  try {
    const workflowData = await env.WORKFLOW_KV.get(`workflow:${workflowId}`);
    if (!workflowData) {
      return new Response(JSON.stringify({ error: '工作流不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const workflow: ContentWorkflow = JSON.parse(workflowData);
    const now = new Date().toISOString();

    // 检查所有步骤是否完成
    const allStepsCompleted = workflow.steps.every(step => step.status === 'completed' || step.status === 'skipped');
    
    if (!allStepsCompleted) {
      return new Response(JSON.stringify({ error: '还有步骤未完成' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 更新工作流状态
    workflow.status = 'published';
    workflow.updatedAt = now;

    // 更新内容状态为已发布
    const contentData = await env.CONTENT_KV.get(`svtr:content:${workflow.contentId}`);
    if (contentData) {
      const content = JSON.parse(contentData);
      content.status = 'published';
      content.publishedAt = now;
      content.updatedAt = now;
      
      await env.CONTENT_KV.put(`svtr:content:${workflow.contentId}`, JSON.stringify(content));
    }

    // 保存工作流
    await env.WORKFLOW_KV.put(`workflow:${workflowId}`, JSON.stringify(workflow));
    await updateWorkflowInList(workflow, env);

    // 发送完成通知
    await sendWorkflowNotification(workflow, 'workflow_completed', env);

    return new Response(JSON.stringify({
      success: true,
      workflow,
      message: '工作流完成，内容已发布'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 获取工作流模板
async function handleGetTemplates(): Promise<Response> {
  return new Response(JSON.stringify(WORKFLOW_TEMPLATES), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// 获取工作流统计
async function handleGetWorkflowStats(env: Env): Promise<Response> {
  try {
    const workflowsData = await env.WORKFLOW_KV.get('workflows:list');
    const workflows: ContentWorkflow[] = workflowsData ? JSON.parse(workflowsData) : [];

    const stats = {
      total: workflows.length,
      byStatus: {
        draft: workflows.filter(w => w.status === 'draft').length,
        submitted: workflows.filter(w => w.status === 'submitted').length,
        in_review: workflows.filter(w => w.status === 'in_review').length,
        approved: workflows.filter(w => w.status === 'approved').length,
        rejected: workflows.filter(w => w.status === 'rejected').length,
        published: workflows.filter(w => w.status === 'published').length
      },
      byPriority: {
        urgent: workflows.filter(w => w.priority === 'urgent').length,
        high: workflows.filter(w => w.priority === 'high').length,
        medium: workflows.filter(w => w.priority === 'medium').length,
        low: workflows.filter(w => w.priority === 'low').length
      },
      byType: {
        standard: workflows.filter(w => w.workflowType === 'standard').length,
        express: workflows.filter(w => w.workflowType === 'express').length,
        premium: workflows.filter(w => w.workflowType === 'premium').length
      },
      averageReviewTime: workflows.length > 0 ? 
        workflows.reduce((sum, w) => sum + w.metadata.estimatedReviewTime, 0) / workflows.length : 0
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 辅助函数

function generateWorkflowId(): string {
  return 'wf_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function handleStepCompletion(workflow: ContentWorkflow, completedStepIndex: number, env: Env) {
  // 检查是否有下一步
  const nextStepIndex = completedStepIndex + 1;
  
  if (nextStepIndex < workflow.steps.length) {
    // 激活下一步
    workflow.steps[nextStepIndex].status = 'pending';
    
    // 自动分配下一步（如果有默认分配规则）
    await autoAssignStep(workflow, nextStepIndex, env);
  } else {
    // 所有步骤完成，更新工作流状态
    workflow.status = 'approved';
  }
}

async function autoAssignFirstStep(workflow: ContentWorkflow, env: Env) {
  // 这里可以实现自动分配逻辑
  // 例如根据内容类别、作者级别等自动分配给相应的审核员
  
  const defaultReviewers = {
    'startups': 'reviewer-startup@svtr.ai',
    'public': 'reviewer-public@svtr.ai',
    'analysis': 'reviewer-analysis@svtr.ai',
    'investors': 'reviewer-investors@svtr.ai',
    'weekly': 'editor-weekly@svtr.ai'
  };
  
  const defaultReviewer = defaultReviewers[workflow.metadata.category];
  if (defaultReviewer && workflow.steps.length > 0) {
    workflow.steps[0].assignedTo = defaultReviewer;
    workflow.steps[0].assignedAt = new Date().toISOString();
    workflow.steps[0].status = 'in_progress';
    workflow.status = 'in_review';
    
    await env.WORKFLOW_KV.put(`workflow:${workflow.id}`, JSON.stringify(workflow));
    await sendAssignmentNotification(workflow, 0, defaultReviewer, env);
  }
}

async function autoAssignStep(workflow: ContentWorkflow, stepIndex: number, env: Env) {
  // 自动分配步骤的逻辑
  const step = workflow.steps[stepIndex];
  
  // 根据步骤名称自动分配
  const stepAssignments = {
    '编辑审核': 'editor@svtr.ai',
    '主编审批': 'chief-editor@svtr.ai',
    '专家评审': 'expert@svtr.ai',
    '最终审批': 'admin@svtr.ai'
  };
  
  const assignee = stepAssignments[step.name];
  if (assignee) {
    step.assignedTo = assignee;
    step.assignedAt = new Date().toISOString();
    step.status = 'in_progress';
    
    await sendAssignmentNotification(workflow, stepIndex, assignee, env);
  }
}

async function sendWorkflowNotification(workflow: ContentWorkflow, eventType: string, env: Env) {
  const notification: WorkflowNotification = {
    id: generateNotificationId(),
    type: 'in_app',
    recipient: workflow.authorId,
    message: generateNotificationMessage(eventType, workflow),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  workflow.notifications.push(notification);
  
  // 这里可以实现实际的通知发送逻辑
  console.log('发送通知:', notification);
}

async function sendAssignmentNotification(workflow: ContentWorkflow, stepIndex: number, assignee: string, env: Env) {
  const step = workflow.steps[stepIndex];
  const notification: WorkflowNotification = {
    id: generateNotificationId(),
    type: 'email',
    recipient: assignee,
    message: `您被分配了新的审核任务：${workflow.contentTitle} - ${step.name}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  workflow.notifications.push(notification);
  
  // 实际发送通知的逻辑
  console.log('发送分配通知:', notification);
}

function generateNotificationId(): string {
  return 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateNotificationMessage(eventType: string, workflow: ContentWorkflow): string {
  const messages = {
    'workflow_created': `您的文章"${workflow.contentTitle}"已提交审核`,
    'workflow_completed': `您的文章"${workflow.contentTitle}"已通过审核并发布`,
    'workflow_rejected': `您的文章"${workflow.contentTitle}"审核未通过，请查看修改意见`
  };
  
  return messages[eventType] || '工作流状态更新';
}

async function addToWorkflowsList(workflow: ContentWorkflow, env: Env) {
  const workflowsData = await env.WORKFLOW_KV.get('workflows:list');
  const workflows: ContentWorkflow[] = workflowsData ? JSON.parse(workflowsData) : [];
  
  workflows.unshift(workflow);
  
  // 保留最近5000个工作流记录
  if (workflows.length > 5000) {
    workflows.splice(5000);
  }
  
  await env.WORKFLOW_KV.put('workflows:list', JSON.stringify(workflows));
}

async function updateWorkflowInList(updatedWorkflow: ContentWorkflow, env: Env) {
  const workflowsData = await env.WORKFLOW_KV.get('workflows:list');
  const workflows: ContentWorkflow[] = workflowsData ? JSON.parse(workflowsData) : [];
  
  const index = workflows.findIndex(w => w.id === updatedWorkflow.id);
  if (index !== -1) {
    workflows[index] = updatedWorkflow;
    await env.WORKFLOW_KV.put('workflows:list', JSON.stringify(workflows));
  }
}