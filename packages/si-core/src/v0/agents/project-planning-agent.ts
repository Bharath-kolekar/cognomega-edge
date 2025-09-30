/**
 * Project Planning Agent
 * Analyzes requirements and creates comprehensive project plans
 */

import { BaseAgent } from './base-agent';
import {
  AgentTask,
  AgentResult,
  ProjectRequirements,
  ProjectPlan,
  ProjectTask,
  ProjectPhase,
  Milestone,
  RiskAssessment,
} from './types';

export class ProjectPlanningAgent extends BaseAgent {
  constructor() {
    super(
      'planning',
      'ProjectPlanningAgent',
      [
        'requirements-analysis',
        'project-planning',
        'task-breakdown',
        'risk-assessment',
        'timeline-estimation',
      ],
      10 // High priority
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing planning task: ${task.id}`);

    const requirements = task.payload.requirements as ProjectRequirements;
    if (!requirements) {
      return {
        success: false,
        error: 'Missing project requirements',
      };
    }

    try {
      const plan = await this.createProjectPlan(requirements);
      
      return {
        success: true,
        data: plan,
        metadata: {
          duration: 0, // Will be set by base class
          confidence: this.assessPlanConfidence(plan),
          suggestions: this.generateSuggestions(plan),
        },
        nextSteps: [
          'Review architecture components',
          'Validate timeline estimates',
          'Assign tasks to specialized agents',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project plan',
      };
    }
  }

  private async createProjectPlan(requirements: ProjectRequirements): Promise<ProjectPlan> {
    const planId = `plan-${Date.now()}`;
    const now = Date.now();

    // Analyze requirements and determine architecture
    const architecture = this.designArchitecture(requirements);
    
    // Create timeline with phases and milestones
    const timeline = this.createTimeline(requirements);
    
    // Break down into specific tasks
    const tasks = this.generateTasks(requirements, timeline);
    
    // Assess risks
    const risks = this.assessRisks(requirements, tasks);

    return {
      id: planId,
      requirements,
      architecture,
      timeline,
      tasks,
      risks,
      created: now,
      lastModified: now,
    };
  }

  private designArchitecture(requirements: ProjectRequirements) {
    const { framework, targetPlatform, techStack } = requirements;

    return {
      frontend: framework ? {
        type: framework,
        components: this.inferFrontendComponents(requirements),
        dependencies: techStack?.frontend || this.getDefaultFrontendDeps(framework),
        patterns: ['component-based', 'state-management', 'routing'],
        description: `${framework}-based frontend architecture`,
      } : undefined,
      
      backend: targetPlatform !== 'web' || requirements.features?.some(f => 
        f.includes('api') || f.includes('backend') || f.includes('server')
      ) ? {
        type: 'REST API',
        components: ['api-routes', 'middleware', 'controllers', 'services'],
        dependencies: techStack?.backend || ['express', 'cors', 'helmet'],
        patterns: ['MVC', 'service-layer', 'repository'],
        description: 'RESTful API backend architecture',
      } : undefined,
      
      database: this.requiresDatabase(requirements) ? {
        type: techStack?.database?.[0] || 'postgresql',
        schema: {},
        relationships: [],
        indexes: [],
      } : undefined,
      
      infrastructure: {
        platform: 'cloud',
        services: this.inferRequiredServices(requirements),
        deployment: {
          type: 'container' as const,
          environment: 'development' as const,
          config: {},
        },
      },
    };
  }

  private createTimeline(requirements: ProjectRequirements) {
    const now = Date.now();
    const estimatedDuration = this.estimateProjectDuration(requirements);
    const phases = this.generatePhases(requirements);
    const milestones = this.generateMilestones(phases);

    return {
      start: now,
      estimatedEnd: now + estimatedDuration,
      milestones,
      phases,
    };
  }

  private generateTasks(requirements: ProjectRequirements, timeline: any): ProjectTask[] {
    const tasks: ProjectTask[] = [];
    const now = Date.now();

    // Planning tasks
    tasks.push({
      id: `task-${Date.now()}-1`,
      title: 'Requirements Analysis',
      description: 'Analyze and document detailed requirements',
      assignedAgent: 'planning',
      priority: 'high',
      status: 'completed',
      dependencies: [],
      estimatedEffort: 2,
      created: now,
    });

    // UI/UX tasks
    if (requirements.framework || requirements.targetPlatform === 'web') {
      tasks.push({
        id: `task-${Date.now()}-2`,
        title: 'UI/UX Design',
        description: 'Create user interface designs and prototypes',
        assignedAgent: 'ui-design',
        priority: 'high',
        status: 'pending',
        dependencies: [tasks[0].id],
        estimatedEffort: 8,
        created: now,
      });
    }

    // Frontend tasks
    if (requirements.framework) {
      tasks.push({
        id: `task-${Date.now()}-3`,
        title: 'Frontend Implementation',
        description: `Implement ${requirements.framework} frontend`,
        assignedAgent: 'frontend',
        priority: 'high',
        status: 'pending',
        dependencies: tasks.length > 1 ? [tasks[1].id] : [tasks[0].id],
        estimatedEffort: 20,
        created: now,
      });
    }

    // Backend tasks
    if (this.requiresBackend(requirements)) {
      tasks.push({
        id: `task-${Date.now()}-4`,
        title: 'Backend API Development',
        description: 'Implement backend API and business logic',
        assignedAgent: 'backend',
        priority: 'high',
        status: 'pending',
        dependencies: [tasks[0].id],
        estimatedEffort: 16,
        created: now,
      });
    }

    // Database tasks
    if (this.requiresDatabase(requirements)) {
      tasks.push({
        id: `task-${Date.now()}-5`,
        title: 'Database Design & Implementation',
        description: 'Design schema and implement database',
        assignedAgent: 'database',
        priority: 'high',
        status: 'pending',
        dependencies: [tasks[0].id],
        estimatedEffort: 8,
        created: now,
      });
    }

    // Testing tasks
    tasks.push({
      id: `task-${Date.now()}-6`,
      title: 'Testing & Quality Assurance',
      description: 'Write and execute tests',
      assignedAgent: 'testing',
      priority: 'medium',
      status: 'pending',
      dependencies: tasks.slice(2).map(t => t.id),
      estimatedEffort: 12,
      created: now,
    });

    // DevOps tasks
    tasks.push({
      id: `task-${Date.now()}-7`,
      title: 'Deployment & Infrastructure',
      description: 'Setup CI/CD and deploy application',
      assignedAgent: 'devops',
      priority: 'medium',
      status: 'pending',
      dependencies: tasks.slice(-1).map(t => t.id),
      estimatedEffort: 6,
      created: now,
    });

    return tasks;
  }

  private generatePhases(requirements: ProjectRequirements): ProjectPhase[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return [
      {
        id: 'phase-planning',
        name: 'Planning & Design',
        description: 'Requirements analysis and architecture design',
        tasks: [],
        startDate: now,
        endDate: now + 5 * dayMs,
        status: 'in-progress',
      },
      {
        id: 'phase-development',
        name: 'Development',
        description: 'Implementation of features',
        tasks: [],
        startDate: now + 5 * dayMs,
        endDate: now + 25 * dayMs,
        status: 'pending',
      },
      {
        id: 'phase-testing',
        name: 'Testing & QA',
        description: 'Quality assurance and testing',
        tasks: [],
        startDate: now + 25 * dayMs,
        endDate: now + 35 * dayMs,
        status: 'pending',
      },
      {
        id: 'phase-deployment',
        name: 'Deployment',
        description: 'Production deployment and monitoring',
        tasks: [],
        startDate: now + 35 * dayMs,
        endDate: now + 40 * dayMs,
        status: 'pending',
      },
    ];
  }

  private generateMilestones(phases: ProjectPhase[]): Milestone[] {
    return phases.map((phase, index) => ({
      id: `milestone-${index}`,
      name: `${phase.name} Complete`,
      description: `Completion of ${phase.name.toLowerCase()}`,
      deadline: phase.endDate,
      dependencies: index > 0 ? [`milestone-${index - 1}`] : [],
      completed: false,
    }));
  }

  private assessRisks(requirements: ProjectRequirements, tasks: ProjectTask[]): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    // Technical complexity risk
    if (requirements.features && requirements.features.length > 10) {
      risks.push({
        id: 'risk-complexity',
        description: 'High feature complexity may lead to extended timeline',
        severity: 'medium',
        probability: 0.6,
        impact: 'Timeline may extend by 20-30%',
        mitigation: 'Break down into smaller iterations, prioritize core features',
      });
    }

    // Technology stack risk
    if (requirements.techStack?.backend?.some(tech => tech.includes('new') || tech.includes('experimental'))) {
      risks.push({
        id: 'risk-technology',
        description: 'Experimental technology may have limited documentation',
        severity: 'high',
        probability: 0.7,
        impact: 'Increased development time and potential bugs',
        mitigation: 'Allocate time for research, consider proven alternatives',
      });
    }

    // Resource risk
    if (tasks.length > 15) {
      risks.push({
        id: 'risk-resources',
        description: 'Large number of tasks may strain resources',
        severity: 'medium',
        probability: 0.5,
        impact: 'Potential delays in task completion',
        mitigation: 'Parallel task execution, agent optimization',
      });
    }

    return risks;
  }

  private assessPlanConfidence(plan: ProjectPlan): number {
    let confidence = 0.8;

    // Adjust based on risks
    if (plan.risks.some(r => r.severity === 'high')) confidence -= 0.1;
    if (plan.risks.some(r => r.severity === 'critical')) confidence -= 0.2;

    // Adjust based on task count
    if (plan.tasks.length > 20) confidence -= 0.1;

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private generateSuggestions(plan: ProjectPlan): string[] {
    const suggestions: string[] = [];

    if (plan.tasks.length > 15) {
      suggestions.push('Consider breaking down large tasks into smaller subtasks');
    }

    if (plan.risks.some(r => r.severity === 'high' || r.severity === 'critical')) {
      suggestions.push('High-risk items identified - review mitigation strategies');
    }

    if (!plan.architecture.database && plan.requirements.features?.some(f => f.includes('data') || f.includes('user'))) {
      suggestions.push('Consider adding database layer for data persistence');
    }

    return suggestions;
  }

  // Helper methods
  private inferFrontendComponents(requirements: ProjectRequirements): string[] {
    const components = ['App', 'Layout', 'Router'];
    
    if (requirements.features?.some(f => f.includes('auth') || f.includes('login'))) {
      components.push('Authentication');
    }
    if (requirements.features?.some(f => f.includes('dashboard'))) {
      components.push('Dashboard');
    }
    if (requirements.features?.some(f => f.includes('form'))) {
      components.push('Forms');
    }
    
    return components;
  }

  private getDefaultFrontendDeps(framework: string): string[] {
    const common = ['react', 'react-dom'];
    switch (framework.toLowerCase()) {
      case 'react':
        return [...common, 'react-router-dom'];
      case 'next.js':
      case 'nextjs':
        return ['next', 'react', 'react-dom'];
      case 'vue':
        return ['vue', 'vue-router'];
      default:
        return common;
    }
  }

  private requiresBackend(requirements: ProjectRequirements): boolean {
    return requirements.targetPlatform === 'fullstack' ||
      requirements.features?.some(f => 
        f.toLowerCase().includes('api') || 
        f.toLowerCase().includes('backend') ||
        f.toLowerCase().includes('server')
      ) || false;
  }

  private requiresDatabase(requirements: ProjectRequirements): boolean {
    return requirements.features?.some(f => 
      f.toLowerCase().includes('database') ||
      f.toLowerCase().includes('data') ||
      f.toLowerCase().includes('storage') ||
      f.toLowerCase().includes('user')
    ) || false;
  }

  private inferRequiredServices(requirements: ProjectRequirements): string[] {
    const services: string[] = ['compute'];
    
    if (this.requiresDatabase(requirements)) services.push('database');
    if (requirements.features?.some(f => f.includes('storage'))) services.push('object-storage');
    if (requirements.features?.some(f => f.includes('cdn'))) services.push('cdn');
    
    return services;
  }

  private estimateProjectDuration(requirements: ProjectRequirements): number {
    const dayMs = 24 * 60 * 60 * 1000;
    let baseDuration = 30 * dayMs; // 30 days base

    // Adjust based on features
    if (requirements.features) {
      baseDuration += requirements.features.length * 2 * dayMs;
    }

    // Adjust based on platform
    if (requirements.targetPlatform === 'fullstack') {
      baseDuration *= 1.5;
    }

    return baseDuration;
  }
}
