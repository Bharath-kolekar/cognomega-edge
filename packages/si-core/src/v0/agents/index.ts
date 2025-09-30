/**
 * Multi-Agent AI System for Cognomega
 * Export all agents and types for external use
 */

// Core types and interfaces
export * from './types';

// Base agent
export { BaseAgent } from './base-agent';

// Specialized agents
export { ProjectPlanningAgent } from './project-planning-agent';
export { UIDesignAgent } from './ui-design-agent';
export { FrontendDevAgent } from './frontend-dev-agent';
export { BackendDevAgent } from './backend-dev-agent';
export { DatabaseAgent } from './database-agent';
export { DevOpsAgent } from './devops-agent';
export { TestingAgent } from './testing-agent';
export { EthicsAlignmentAgent } from './ethics-alignment-agent';

// Orchestrator
export { FullStackAIAssistant } from './fullstack-ai-assistant';

// Integration with SuperIntelligenceEngine
export * from './integration';

// Convenience factory function
import { FullStackAIAssistant } from './fullstack-ai-assistant';

/**
 * Create a new FullStackAIAssistant instance
 * This is the main entry point for using the multi-agent system
 */
export function createFullStackAssistant(): FullStackAIAssistant {
  return new FullStackAIAssistant();
}
