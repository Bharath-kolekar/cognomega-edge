// Export all types and functions, handling duplicate names
export * from './v0/advanced-reasoning-engine';
export { 
  MemoryEntry,
  UserProfile,
  ProjectContext,
  SessionContext,
  ContextualMemory
} from './v0/contextual-memory';
export * from './v0/semantic-nlp-engine';
export * from './v0/smart-ai-router';
export * from './v0/type-safety-utils';
export * from './v0/utils';

// Super Intelligence Registry - export specific items to avoid conflicts
export { 
  AIEngine,
  SuperIntelligenceEngines,
  AIConversationEngine,
  AdvancedDecisionEngine,
  ContextAwarenessEngine,
  SemanticNLPEngine,
  EnhancedSemanticEngine,
  VoiceNavigationEngine,
  AdvancedVoiceEngine,
  PredictiveIntelligenceEngine,
  QuantumIntelligenceEngine,
  EmotionalIntelligenceEngine,
  GoalIntegrityEngine,
  CreativitySuperIntelligenceEngine,
  OmniIntelligenceEngine,
  DualAIEngine
} from './v0/super-intelligence-registry';

// Multi-agent system
export * from './v0/agents';