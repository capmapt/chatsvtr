/**
 * SVTR 项目管理API端点
 * 处理投资项目的创建、查询、更新和管理功能
 */

interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  stage: 'idea' | 'seed' | 'series-a' | 'series-b' | 'series-c' | 'ipo';
  status: 'active' | 'pending' | 'completed' | 'paused' | 'rejected';
  founder: string;
  founderEmail: string;
  fundingGoal: number;
  currentFunding: number;
  investorCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  documents: string[];
  needs: string[]; // 新增：项目需求数组
  files: FileInfo[]; // 新增：文件信息数组
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  uploadedAt?: string;
}

// 生成项目ID
function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 验证项目数据
function validateProjectData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('项目名称至少需要2个字符');
  }
  
  if (!data.description || data.description.trim().length < 5) {
    errors.push('项目描述至少需要5个字符');
  }
  
  if (!data.founder || data.founder.trim().length < 2) {
    errors.push('创始人姓名至少需要2个字符');
  }
  
  if (!data.founderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.founderEmail)) {
    errors.push('请提供有效的创始人邮箱');
  }
  
  if (!data.fundingGoal || data.fundingGoal <= 0) {
    errors.push('融资目标必须大于0');
  }
  
  const validCategories = ['AI', 'Fintech', 'Healthcare', 'E-commerce', 'Enterprise', 'Consumer', 'Other'];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push('请选择有效的项目类别');
  }
  
  const validStages = ['idea', 'seed', 'series-a', 'series-b', 'series-c', 'ipo'];
  if (!data.stage || !validStages.includes(data.stage)) {
    errors.push('请选择有效的融资阶段');
  }
  
  return { valid: errors.length === 0, errors };
}

// 处理POST请求 - 创建项目
export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const projectData = await request.json();
    
    console.log('收到项目创建请求:', projectData);
    
    // 验证项目数据
    const validation = validateProjectData(projectData);
    console.log('数据验证结果:', validation);
    if (!validation.valid) {
      console.error('验证失败详情:', {
        projectData,
        errors: validation.errors
      });
      return new Response(JSON.stringify({
        success: false,
        message: '项目数据验证失败',
        errors: validation.errors,
        debug: {
          receivedData: projectData,
          validationDetails: validation
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 检查KV存储是否可用
    if (!env.SVTR_CACHE) {
      console.warn('KV存储未配置，使用模拟响应');
      return new Response(JSON.stringify({
        success: true,
        message: '项目创建成功！（测试模式）',
        data: { projectId: generateProjectId() },
        note: 'KV存储未配置，数据未实际保存'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 创建项目对象
    const projectId = generateProjectId();
    const project: Project = {
      id: projectId,
      name: projectData.name.trim(),
      description: projectData.description.trim(),
      category: projectData.category,
      stage: projectData.stage,
      status: 'pending', // 新项目默认为待审核状态
      founder: projectData.founder.trim(),
      founderEmail: projectData.founderEmail.trim(),
      fundingGoal: Number(projectData.fundingGoal),
      currentFunding: 0,
      investorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: projectData.tags || [],
      documents: projectData.documents || [],
      needs: projectData.needs || [], // 项目需求
      files: (projectData.files || []).map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }))
    };
    
    // 保存项目到KV存储
    await env.SVTR_CACHE.put(`project_${projectId}`, JSON.stringify(project));
    
    // 更新项目列表
    const projectsList = await env.SVTR_CACHE.get('projects_list');
    let projects = [];
    
    if (projectsList) {
      projects = JSON.parse(projectsList);
    }
    
    projects.push(project);
    await env.SVTR_CACHE.put('projects_list', JSON.stringify(projects));
    
    // 更新统计数据
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `project_stats_${today}`;
    const todayStats = await env.SVTR_CACHE.get(statsKey);
    let stats = { created: 0, updated: 0 };
    
    if (todayStats) {
      stats = JSON.parse(todayStats);
    }
    stats.created += 1;
    
    await env.SVTR_CACHE.put(statsKey, JSON.stringify(stats), {
      expirationTtl: 30 * 24 * 60 * 60 // 30天过期
    });
    
    console.log('项目创建成功:', projectId);
    
    return new Response(JSON.stringify({
      success: true,
      message: '项目创建成功！',
      data: { projectId, project }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('项目创建失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误，请稍后重试',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理GET请求 - 获取项目列表或统计
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const projectId = url.searchParams.get('id');
    
    console.log('GET请求:', action, projectId);
    
    // 如果KV存储未配置，返回模拟数据
    if (!env.SVTR_CACHE) {
      console.warn('KV存储未配置，返回模拟数据');
      
      if (action === 'stats') {
        return new Response(JSON.stringify({
          totalProjects: 156,
          activeProjects: 89,
          pendingProjects: 23,
          completedProjects: 44,
          totalFunding: 42800000,
          categoriesBreakdown: {
            'AI': 45,
            'Fintech': 32,
            'Healthcare': 28,
            'E-commerce': 25,
            'Enterprise': 15,
            'Consumer': 8,
            'Other': 3
          },
          note: 'KV存储未配置，显示模拟数据'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      if (action === 'list') {
        const mockProjects = [
          {
            id: 'proj_1',
            name: 'AI医疗诊断平台',
            description: '基于深度学习的医疗影像诊断平台',
            category: 'Healthcare',
            stage: 'series-a',
            status: 'active',
            founder: '张医生',
            founderEmail: 'zhang@healthai.com',
            fundingGoal: 5000000,
            currentFunding: 2000000,
            investorCount: 8,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-08-15T14:30:00Z',
            tags: ['AI', '医疗', '诊断'],
            documents: [],
            needs: ['找钱', '找人'],
            files: [
              { name: '商业计划书.pdf', size: 2048576, type: 'application/pdf', uploadedAt: '2024-01-15T10:00:00Z' }
            ]
          },
          {
            id: 'proj_2',
            name: '智能物流优化系统',
            description: '基于AI的物流路径优化和配送管理系统',
            category: 'Enterprise',
            stage: 'seed',
            status: 'pending',
            founder: '李总',
            founderEmail: 'li@smartlogistics.com',
            fundingGoal: 2000000,
            currentFunding: 0,
            investorCount: 0,
            createdAt: '2024-08-10T09:15:00Z',
            updatedAt: '2024-08-10T09:15:00Z',
            tags: ['物流', 'AI', '优化'],
            documents: [],
            needs: ['找钱', '找方向'],
            files: []
          }
        ];
        
        return new Response(JSON.stringify(mockProjects), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    if (action === 'stats') {
      // 获取统计数据
      const projectsList = await env.SVTR_CACHE.get('projects_list');
      const projects = projectsList ? JSON.parse(projectsList) : [];
      
      const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter((p: Project) => p.status === 'active').length,
        pendingProjects: projects.filter((p: Project) => p.status === 'pending').length,
        completedProjects: projects.filter((p: Project) => p.status === 'completed').length,
        totalFunding: projects.reduce((sum: number, p: Project) => sum + p.currentFunding, 0),
        categoriesBreakdown: projects.reduce((acc: any, p: Project) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {})
      };
      
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (action === 'list') {
      // 获取项目列表
      const projectsList = await env.SVTR_CACHE.get('projects_list');
      const projects = projectsList ? JSON.parse(projectsList) : [];
      
      // 支持筛选
      const status = url.searchParams.get('status');
      const category = url.searchParams.get('category');
      const stage = url.searchParams.get('stage');
      
      let filteredProjects = projects;
      
      if (status) {
        filteredProjects = filteredProjects.filter((p: Project) => p.status === status);
      }
      
      if (category) {
        filteredProjects = filteredProjects.filter((p: Project) => p.category === category);
      }
      
      if (stage) {
        filteredProjects = filteredProjects.filter((p: Project) => p.stage === stage);
      }
      
      return new Response(JSON.stringify(filteredProjects), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (projectId) {
      // 获取单个项目详情
      const project = await env.SVTR_CACHE.get(`project_${projectId}`);
      if (!project) {
        return new Response(JSON.stringify({
          success: false,
          message: '项目不存在'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      return new Response(project, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '无效的请求参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('获取项目数据失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理PUT请求 - 更新项目
export async function onRequestPut(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('id');
    
    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少项目ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const updateData = await request.json();
    
    // 如果KV存储未配置
    if (!env.SVTR_CACHE) {
      return new Response(JSON.stringify({
        success: true,
        message: '项目更新成功（测试模式）',
        note: 'KV存储未配置，操作未实际执行'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 获取现有项目
    const existingProject = await env.SVTR_CACHE.get(`project_${projectId}`);
    if (!existingProject) {
      return new Response(JSON.stringify({
        success: false,
        message: '项目不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const project = JSON.parse(existingProject);
    
    // 更新项目数据
    const updatedProject = {
      ...project,
      ...updateData,
      id: project.id, // 保持ID不变
      createdAt: project.createdAt, // 保持创建时间不变
      updatedAt: new Date().toISOString()
    };
    
    // 保存更新后的项目
    await env.SVTR_CACHE.put(`project_${projectId}`, JSON.stringify(updatedProject));
    
    // 更新项目列表中的数据
    const projectsList = await env.SVTR_CACHE.get('projects_list');
    if (projectsList) {
      const projects = JSON.parse(projectsList);
      const projectIndex = projects.findIndex((p: Project) => p.id === projectId);
      if (projectIndex >= 0) {
        projects[projectIndex] = updatedProject;
        await env.SVTR_CACHE.put('projects_list', JSON.stringify(projects));
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '项目更新成功',
      data: updatedProject
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('项目更新失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理OPTIONS请求 - CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}