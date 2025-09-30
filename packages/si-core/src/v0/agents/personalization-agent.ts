/**
 * Personalization Agent
 * Continuously adapts recommendations/solutions to users
 * Learns user goals, expertise, preferences
 * Anticipates needs and next actions
 * Supports multimodal learning from feedback/behavior
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult } from './types';

export interface UserProfile {
  id: string;
  goals: string[];
  expertise: ExpertiseLevel;
  preferences: UserPreferences;
  behaviorPatterns: BehaviorPattern[];
  interactionHistory: InteractionRecord[];
  lastUpdated: number;
  created: number;
}

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface UserPreferences {
  // Communication preferences
  communicationStyle: 'concise' | 'detailed' | 'technical' | 'casual';
  preferredLanguage?: string;
  
  // Content preferences
  codeStyle?: 'functional' | 'oop' | 'declarative' | 'mixed';
  frameworkPreferences?: string[];
  toolPreferences?: string[];
  
  // UX preferences
  interactionMode?: 'guided' | 'autonomous' | 'collaborative';
  feedbackFrequency?: 'frequent' | 'moderate' | 'minimal';
  
  // Learning preferences
  learningStyle?: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
  
  // Custom preferences
  custom?: Record<string, unknown>;
}

export interface BehaviorPattern {
  id: string;
  type: 'task-completion' | 'tool-usage' | 'error-recovery' | 'feature-adoption' | 'interaction-timing';
  pattern: string;
  frequency: number;
  confidence: number;
  lastObserved: number;
  metadata?: Record<string, unknown>;
}

export interface InteractionRecord {
  id: string;
  timestamp: number;
  taskType: string;
  input: string;
  output?: string;
  feedback?: UserFeedback;
  success: boolean;
  duration: number;
  context?: Record<string, unknown>;
}

export interface UserFeedback {
  type: 'positive' | 'negative' | 'neutral';
  rating?: number; // 1-5
  comment?: string;
  aspects?: string[]; // What aspects they liked/disliked
  timestamp: number;
}

export interface PersonalizationRecommendation {
  id: string;
  type: 'action' | 'tool' | 'feature' | 'workflow' | 'content';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  suggestedTiming?: string;
  contextual: boolean;
  priority: number;
}

export interface AdaptiveResponse {
  content: string;
  style: 'concise' | 'detailed' | 'technical' | 'casual';
  technicality: number; // 0-1 scale
  examples: string[];
  additionalResources?: string[];
  nextSteps?: string[];
}

export interface LearningInsight {
  category: 'goal' | 'preference' | 'expertise' | 'pattern';
  insight: string;
  confidence: number;
  basedOn: string[];
  timestamp: number;
}

export class PersonalizationAgent extends BaseAgent {
  private userProfiles: Map<string, UserProfile> = new Map();
  private learningInsights: Map<string, LearningInsight[]> = new Map();
  
  constructor() {
    super(
      'personalization',
      'PersonalizationAgent',
      [
        'personalization',
        'user-modeling',
        'adaptive-recommendations',
        'behavior-learning',
        'need-anticipation',
        'multimodal-learning',
        'preference-tracking',
      ],
      9 // High priority for personalization
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing personalization task: ${task.id}`);

    const taskType = task.payload.taskType as string;
    const userId = task.context?.userId || 'anonymous';

    try {
      switch (taskType) {
        case 'get-recommendations':
          return await this.generateRecommendations(userId, task);
        
        case 'update-profile':
          return await this.updateUserProfile(userId, task);
        
        case 'record-interaction':
          return await this.recordInteraction(userId, task);
        
        case 'analyze-behavior':
          return await this.analyzeBehavior(userId, task);
        
        case 'anticipate-needs':
          return await this.anticipateNeeds(userId, task);
        
        case 'adapt-response':
          return await this.adaptResponse(userId, task);
        
        case 'get-profile':
          return await this.getUserProfile(userId);
        
        case 'learn-from-feedback':
          return await this.learnFromFeedback(userId, task);
        
        default:
          return {
            success: false,
            error: `Unknown personalization task type: ${taskType}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process personalization task',
      };
    }
  }

  /**
   * Generate personalized recommendations for a user
   */
  private async generateRecommendations(
    userId: string,
    task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const context = task.payload.context as Record<string, unknown> | undefined;
    
    const recommendations: PersonalizationRecommendation[] = [];

    // Generate recommendations based on user profile
    const expertiseRecommendations = this.getExpertiseBasedRecommendations(profile);
    recommendations.push(...expertiseRecommendations);

    // Generate recommendations based on goals
    const goalRecommendations = this.getGoalBasedRecommendations(profile);
    recommendations.push(...goalRecommendations);

    // Generate recommendations based on behavior patterns
    const behaviorRecommendations = this.getBehaviorBasedRecommendations(profile);
    recommendations.push(...behaviorRecommendations);

    // Generate contextual recommendations if context provided
    if (context) {
      const contextualRecommendations = this.getContextualRecommendations(profile, context);
      recommendations.push(...contextualRecommendations);
    }

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.confidence - a.confidence;
    });

    return {
      success: true,
      data: {
        recommendations: recommendations.slice(0, 10), // Top 10 recommendations
        userProfile: {
          id: profile.id,
          expertise: profile.expertise,
          goals: profile.goals,
        },
      },
      metadata: {
        duration: 0,
        confidence: recommendations.length > 0 
          ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length 
          : 0,
      },
    };
  }

  /**
   * Update user profile with new information
   */
  private async updateUserProfile(
    userId: string,
    task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const updates = task.payload.updates as Partial<UserProfile>;

    if (updates.goals) {
      profile.goals = [...new Set([...profile.goals, ...updates.goals])];
    }

    if (updates.expertise) {
      profile.expertise = updates.expertise;
    }

    if (updates.preferences) {
      profile.preferences = {
        ...profile.preferences,
        ...updates.preferences,
      };
    }

    profile.lastUpdated = Date.now();
    this.userProfiles.set(userId, profile);

    // Generate learning insights from the update
    const insight: LearningInsight = {
      category: 'preference',
      insight: `User profile updated with new ${Object.keys(updates).join(', ')}`,
      confidence: 0.9,
      basedOn: ['explicit-update'],
      timestamp: Date.now(),
    };
    this.addLearningInsight(userId, insight);

    return {
      success: true,
      data: { profile },
      metadata: { duration: 0 },
    };
  }

  /**
   * Record user interaction for learning
   */
  private async recordInteraction(
    userId: string,
    task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const interactionData = task.payload.interaction as Partial<InteractionRecord>;

    const interaction: InteractionRecord = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      taskType: interactionData.taskType || 'unknown',
      input: interactionData.input || '',
      output: interactionData.output,
      feedback: interactionData.feedback,
      success: interactionData.success !== undefined ? interactionData.success : true,
      duration: interactionData.duration || 0,
      context: interactionData.context,
    };

    profile.interactionHistory.push(interaction);
    
    // Limit history size to prevent memory issues
    if (profile.interactionHistory.length > 1000) {
      profile.interactionHistory = profile.interactionHistory.slice(-1000);
    }

    profile.lastUpdated = Date.now();
    this.userProfiles.set(userId, profile);

    // Analyze the interaction to extract patterns
    await this.extractPatternsFromInteraction(userId, interaction);

    return {
      success: true,
      data: { interactionId: interaction.id },
      metadata: { duration: 0 },
    };
  }

  /**
   * Analyze user behavior to identify patterns
   */
  private async analyzeBehavior(
    userId: string,
    _task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const patterns: BehaviorPattern[] = [];

    // Analyze task completion patterns
    const taskPatterns = this.analyzeTaskPatterns(profile);
    patterns.push(...taskPatterns);

    // Analyze tool usage patterns
    const toolPatterns = this.analyzeToolUsage(profile);
    patterns.push(...toolPatterns);

    // Analyze error recovery patterns
    const errorPatterns = this.analyzeErrorRecovery(profile);
    patterns.push(...errorPatterns);

    // Update profile with new patterns
    profile.behaviorPatterns = patterns;
    profile.lastUpdated = Date.now();
    this.userProfiles.set(userId, profile);

    return {
      success: true,
      data: {
        patterns,
        insights: this.learningInsights.get(userId) || [],
      },
      metadata: {
        duration: 0,
        confidence: patterns.length > 0 
          ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
          : 0,
      },
    };
  }

  /**
   * Anticipate user needs based on current context
   */
  private async anticipateNeeds(
    userId: string,
    task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const currentContext = task.payload.context as Record<string, unknown>;

    const anticipatedNeeds: PersonalizationRecommendation[] = [];

    // Based on behavior patterns
    for (const pattern of profile.behaviorPatterns) {
      if (pattern.type === 'task-completion' && pattern.confidence > 0.7) {
        anticipatedNeeds.push({
          id: `need-${Date.now()}-${anticipatedNeeds.length}`,
          type: 'action',
          title: `Next likely action: ${pattern.pattern}`,
          description: `Based on your past behavior, you might want to ${pattern.pattern}`,
          confidence: pattern.confidence,
          reasoning: `Pattern observed ${pattern.frequency} times`,
          contextual: true,
          priority: 8,
        });
      }
    }

    // Based on goals
    for (const goal of profile.goals) {
      anticipatedNeeds.push({
        id: `goal-need-${Date.now()}-${anticipatedNeeds.length}`,
        type: 'workflow',
        title: `Progress towards: ${goal}`,
        description: `Suggested next step for achieving ${goal}`,
        confidence: 0.75,
        reasoning: `Aligned with your stated goal`,
        contextual: false,
        priority: 7,
      });
    }

    // Based on current context
    if (currentContext && currentContext.currentTask) {
      const contextTask = currentContext.currentTask as string;
      anticipatedNeeds.push({
        id: `context-need-${Date.now()}`,
        type: 'tool',
        title: `Tools for ${contextTask}`,
        description: `Recommended tools based on current task`,
        confidence: 0.8,
        reasoning: `Contextually relevant to current activity`,
        contextual: true,
        priority: 9,
      });
    }

    return {
      success: true,
      data: { anticipatedNeeds },
      metadata: {
        duration: 0,
        confidence: anticipatedNeeds.length > 0 
          ? anticipatedNeeds.reduce((sum, n) => sum + n.confidence, 0) / anticipatedNeeds.length 
          : 0,
      },
    };
  }

  /**
   * Adapt response style to user preferences
   */
  private async adaptResponse(
    userId: string,
    task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const content = task.payload.content as string;

    const adaptedResponse: AdaptiveResponse = {
      content: this.adjustContentStyle(content, profile),
      style: profile.preferences.communicationStyle || 'detailed',
      technicality: this.calculateTechnicality(profile.expertise),
      examples: this.generateExamples(content, profile),
      nextSteps: this.suggestNextSteps(content, profile),
    };

    // Add resources based on learning style
    if (profile.preferences.learningStyle === 'visual') {
      adaptedResponse.additionalResources = ['diagrams', 'videos', 'infographics'];
    } else if (profile.preferences.learningStyle === 'theoretical') {
      adaptedResponse.additionalResources = ['documentation', 'articles', 'papers'];
    }

    return {
      success: true,
      data: { response: adaptedResponse },
      metadata: { duration: 0, confidence: 0.85 },
    };
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    
    return {
      success: true,
      data: { profile },
      metadata: { duration: 0 },
    };
  }

  /**
   * Learn from user feedback
   */
  private async learnFromFeedback(
    userId: string,
    task: AgentTask
  ): Promise<AgentResult> {
    const profile = this.getOrCreateProfile(userId);
    const feedback = task.payload.feedback as UserFeedback;
    const interactionId = task.payload.interactionId as string | undefined;

    // Find the interaction to attach feedback to
    if (interactionId) {
      const interaction = profile.interactionHistory.find(i => i.id === interactionId);
      if (interaction) {
        interaction.feedback = feedback;
      }
    }

    // Extract insights from feedback
    const insight: LearningInsight = {
      category: 'preference',
      insight: this.extractInsightFromFeedback(feedback),
      confidence: feedback.rating ? feedback.rating / 5 : 0.5,
      basedOn: ['user-feedback'],
      timestamp: Date.now(),
    };
    this.addLearningInsight(userId, insight);

    // Adjust user profile based on feedback
    if (feedback.type === 'negative' && feedback.aspects) {
      this.adjustPreferencesFromNegativeFeedback(profile, feedback.aspects);
    }

    profile.lastUpdated = Date.now();
    this.userProfiles.set(userId, profile);

    return {
      success: true,
      data: { 
        learningApplied: true,
        insight,
      },
      metadata: { duration: 0 },
    };
  }

  // Helper methods

  private getOrCreateProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      const newProfile: UserProfile = {
        id: userId,
        goals: [],
        expertise: 'intermediate',
        preferences: {
          communicationStyle: 'detailed',
        },
        behaviorPatterns: [],
        interactionHistory: [],
        lastUpdated: Date.now(),
        created: Date.now(),
      };
      this.userProfiles.set(userId, newProfile);
    }
    return this.userProfiles.get(userId)!;
  }

  private addLearningInsight(userId: string, insight: LearningInsight): void {
    const insights = this.learningInsights.get(userId) || [];
    insights.push(insight);
    
    // Limit insights history
    if (insights.length > 100) {
      insights.splice(0, insights.length - 100);
    }
    
    this.learningInsights.set(userId, insights);
  }

  private getExpertiseBasedRecommendations(profile: UserProfile): PersonalizationRecommendation[] {
    const recommendations: PersonalizationRecommendation[] = [];
    
    switch (profile.expertise) {
      case 'beginner':
        recommendations.push({
          id: `expertise-rec-${Date.now()}-1`,
          type: 'content',
          title: 'Getting Started Guide',
          description: 'Learn the fundamentals with our beginner-friendly tutorials',
          confidence: 0.9,
          reasoning: 'Tailored for beginner expertise level',
          contextual: false,
          priority: 8,
        });
        break;
      case 'advanced':
      case 'expert':
        recommendations.push({
          id: `expertise-rec-${Date.now()}-2`,
          type: 'feature',
          title: 'Advanced Features',
          description: 'Explore advanced capabilities and optimization techniques',
          confidence: 0.85,
          reasoning: 'Matches your advanced expertise level',
          contextual: false,
          priority: 7,
        });
        break;
    }
    
    return recommendations;
  }

  private getGoalBasedRecommendations(profile: UserProfile): PersonalizationRecommendation[] {
    return profile.goals.slice(0, 3).map((goal, index) => ({
      id: `goal-rec-${Date.now()}-${index}`,
      type: 'workflow',
      title: `Progress: ${goal}`,
      description: `Next steps to achieve ${goal}`,
      confidence: 0.8,
      reasoning: `Aligned with your stated goal: ${goal}`,
      contextual: false,
      priority: 8,
    }));
  }

  private getBehaviorBasedRecommendations(profile: UserProfile): PersonalizationRecommendation[] {
    return profile.behaviorPatterns
      .filter(p => p.confidence > 0.7)
      .slice(0, 3)
      .map((pattern, index) => ({
        id: `behavior-rec-${Date.now()}-${index}`,
        type: 'action',
        title: `Frequent action: ${pattern.pattern}`,
        description: `Based on your usage patterns`,
        confidence: pattern.confidence,
        reasoning: `Observed ${pattern.frequency} times`,
        contextual: false,
        priority: 6,
      }));
  }

  private getContextualRecommendations(
    profile: UserProfile,
    context: Record<string, unknown>
  ): PersonalizationRecommendation[] {
    const recommendations: PersonalizationRecommendation[] = [];
    
    if (context.currentTask) {
      recommendations.push({
        id: `context-rec-${Date.now()}`,
        type: 'tool',
        title: `Tools for ${context.currentTask}`,
        description: `Recommended based on current context`,
        confidence: 0.85,
        reasoning: 'Contextually relevant',
        contextual: true,
        priority: 9,
      });
    }
    
    return recommendations;
  }

  private async extractPatternsFromInteraction(
    userId: string,
    interaction: InteractionRecord
  ): Promise<void> {
    const profile = this.getOrCreateProfile(userId);
    
    // Simple pattern extraction based on task type frequency
    const taskTypeCount = profile.interactionHistory.filter(
      i => i.taskType === interaction.taskType
    ).length;
    
    if (taskTypeCount >= 3) {
      const existingPattern = profile.behaviorPatterns.find(
        p => p.pattern === interaction.taskType
      );
      
      if (existingPattern) {
        existingPattern.frequency += 1;
        existingPattern.confidence = Math.min(
          existingPattern.confidence + 0.05,
          0.95
        );
        existingPattern.lastObserved = Date.now();
      } else {
        profile.behaviorPatterns.push({
          id: `pattern-${Date.now()}`,
          type: 'task-completion',
          pattern: interaction.taskType,
          frequency: taskTypeCount,
          confidence: 0.6,
          lastObserved: Date.now(),
        });
      }
    }
  }

  private analyzeTaskPatterns(profile: UserProfile): BehaviorPattern[] {
    const taskCounts = new Map<string, number>();
    
    profile.interactionHistory.forEach(interaction => {
      const count = taskCounts.get(interaction.taskType) || 0;
      taskCounts.set(interaction.taskType, count + 1);
    });
    
    const patterns: BehaviorPattern[] = [];
    taskCounts.forEach((count, taskType) => {
      if (count >= 3) {
        patterns.push({
          id: `task-pattern-${Date.now()}-${taskType}`,
          type: 'task-completion',
          pattern: taskType,
          frequency: count,
          confidence: Math.min(0.5 + (count / 10), 0.95),
          lastObserved: Date.now(),
        });
      }
    });
    
    return patterns;
  }

  private analyzeToolUsage(_profile: UserProfile): BehaviorPattern[] {
    // Placeholder for tool usage analysis
    return [];
  }

  private analyzeErrorRecovery(profile: UserProfile): BehaviorPattern[] {
    const errorInteractions = profile.interactionHistory.filter(i => !i.success);
    
    if (errorInteractions.length > 0) {
      return [{
        id: `error-pattern-${Date.now()}`,
        type: 'error-recovery',
        pattern: 'error-handling-style',
        frequency: errorInteractions.length,
        confidence: 0.6,
        lastObserved: Date.now(),
      }];
    }
    
    return [];
  }

  private adjustContentStyle(content: string, profile: UserProfile): string {
    const style = profile.preferences.communicationStyle;
    
    switch (style) {
      case 'concise':
        return this.makeConcise(content);
      case 'technical':
        return this.makeTechnical(content);
      case 'casual':
        return this.makeCasual(content);
      default:
        return content;
    }
  }

  private makeConcise(content: string): string {
    // Simplify by taking first sentence or summary
    const sentences = content.split('. ');
    return sentences.length > 2 ? sentences.slice(0, 2).join('. ') + '.' : content;
  }

  private makeTechnical(content: string): string {
    // Add technical context (placeholder)
    return content;
  }

  private makeCasual(content: string): string {
    // Make more conversational (placeholder)
    return content;
  }

  private calculateTechnicality(expertise: ExpertiseLevel): number {
    const levels: Record<ExpertiseLevel, number> = {
      beginner: 0.2,
      intermediate: 0.5,
      advanced: 0.8,
      expert: 0.95,
    };
    return levels[expertise];
  }

  private generateExamples(content: string, profile: UserProfile): string[] {
    // Generate examples based on expertise level
    const numExamples = profile.expertise === 'beginner' ? 3 : 1;
    return Array(numExamples).fill('Example placeholder');
  }

  private suggestNextSteps(content: string, profile: UserProfile): string[] {
    // Suggest next steps based on goals and patterns
    return profile.goals.slice(0, 2).map(goal => `Continue working on: ${goal}`);
  }

  private extractInsightFromFeedback(feedback: UserFeedback): string {
    if (feedback.comment) {
      return `User feedback: ${feedback.type} - ${feedback.comment}`;
    }
    return `User provided ${feedback.type} feedback with rating ${feedback.rating || 'N/A'}`;
  }

  private adjustPreferencesFromNegativeFeedback(
    profile: UserProfile,
    aspects: string[]
  ): void {
    // Adjust preferences based on negative feedback
    if (aspects.includes('too-technical') && profile.preferences.communicationStyle === 'technical') {
      profile.preferences.communicationStyle = 'detailed';
    }
    if (aspects.includes('too-detailed') && profile.preferences.communicationStyle === 'detailed') {
      profile.preferences.communicationStyle = 'concise';
    }
  }
}
