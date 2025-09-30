/**
 * Knowledge Transfer Agent
 * Transfers learned knowledge and embeddings between domains
 * Enables cross-domain learning and knowledge reuse
 */

import { BaseAgent } from './base-agent';
import {
  AgentTask,
  AgentResult,
} from './types';

/**
 * Domain embedding representation
 * Represents learned knowledge in a domain as a vector
 */
export interface DomainEmbedding {
  domain: string;
  vector: number[];
  concepts: Map<string, number>;
  metadata: {
    samples: number;
    lastUpdated: number;
    confidence: number;
  };
}

/**
 * Knowledge transfer request
 */
export interface KnowledgeTransferRequest {
  sourceDomain: string;
  targetDomain: string;
  concepts?: string[];
  transferDepth?: 'surface' | 'deep' | 'full';
}

/**
 * Knowledge transfer result
 */
export interface KnowledgeTransferResult {
  sourceDomain: string;
  targetDomain: string;
  transferredConcepts: string[];
  adaptedEmbeddings: DomainEmbedding;
  bridgeStrength: number;
  applicability: number;
  insights: string[];
}

/**
 * Neural transfer network stub
 * Simulates a neural network that learns to transfer knowledge between domains
 */
class NeuralTransferNetwork {
  private transferWeights: Map<string, Map<string, number[]>> = new Map();
  private transferHistory: Array<{ from: string; to: string; timestamp: number }> = [];

  /**
   * Transfer embeddings from source domain to target domain
   */
  transfer(
    sourceEmbedding: DomainEmbedding,
    targetDomain: string
  ): { transformedVector: number[]; confidence: number } {
    const key = `${sourceEmbedding.domain}->${targetDomain}`;
    
    // Simulate neural transfer with transformation
    const transformedVector = sourceEmbedding.vector.map((value, idx) => {
      // Simple transformation: apply domain-specific scaling and offset
      const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const offset = (Math.random() - 0.5) * 0.1;
      return value * scale + offset;
    });

    // Calculate confidence based on transfer history
    const transferCount = this.transferHistory.filter(
      h => h.from === sourceEmbedding.domain && h.to === targetDomain
    ).length;
    const confidence = Math.min(0.5 + transferCount * 0.05, 0.95);

    // Record transfer
    this.transferHistory.push({
      from: sourceEmbedding.domain,
      to: targetDomain,
      timestamp: Date.now(),
    });

    return { transformedVector, confidence };
  }

  /**
   * Learn transfer patterns between domains
   */
  learn(sourceDomain: string, targetDomain: string, feedback: number): void {
    const key = `${sourceDomain}->${targetDomain}`;
    
    // Stub: In a real implementation, this would update neural network weights
    // based on feedback to improve future transfers
    if (!this.transferWeights.has(sourceDomain)) {
      this.transferWeights.set(sourceDomain, new Map());
    }
    
    const sourceMap = this.transferWeights.get(sourceDomain)!;
    const currentWeight = sourceMap.get(targetDomain) || [];
    
    // Simple weight update simulation
    const updatedWeight = currentWeight.length > 0 
      ? currentWeight.map(w => w * 0.9 + feedback * 0.1)
      : Array(10).fill(feedback);
    
    sourceMap.set(targetDomain, updatedWeight);
  }

  /**
   * Get transfer statistics
   */
  getTransferStats(): {
    totalTransfers: number;
    uniquePairs: number;
    mostFrequentTransfer: { from: string; to: string; count: number } | null;
  } {
    const totalTransfers = this.transferHistory.length;
    const pairCounts = new Map<string, number>();
    
    this.transferHistory.forEach(h => {
      const key = `${h.from}->${h.to}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });
    
    let mostFrequent: { from: string; to: string; count: number } | null = null;
    pairCounts.forEach((count, key) => {
      const [from, to] = key.split('->');
      if (!mostFrequent || count > mostFrequent.count) {
        mostFrequent = { from, to, count };
      }
    });
    
    return {
      totalTransfers,
      uniquePairs: pairCounts.size,
      mostFrequentTransfer: mostFrequent,
    };
  }
}

/**
 * Knowledge Transfer Agent
 * Handles cross-domain knowledge transfer and embedding adaptation
 */
export class KnowledgeTransferAgent extends BaseAgent {
  private domainEmbeddings: Map<string, DomainEmbedding> = new Map();
  private transferNetwork: NeuralTransferNetwork = new NeuralTransferNetwork();
  private crossDomainBridges: Map<string, Map<string, number>> = new Map();

  constructor() {
    super(
      'knowledge-transfer',
      'KnowledgeTransferAgent',
      [
        'cross-domain-transfer',
        'embedding-adaptation',
        'knowledge-synthesis',
        'domain-bridging',
        'concept-mapping',
      ],
      8 // High priority for knowledge operations
    );
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Initializing Knowledge Transfer Agent');
    
    // Initialize default domain embeddings
    this.initializeDefaultDomains();
    
    // Build cross-domain bridges
    this.buildCrossDomainBridges();
    
    this.log('info', 'Knowledge Transfer Agent initialized with domain knowledge');
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing knowledge transfer task: ${task.id}`);

    const request = task.payload as unknown as KnowledgeTransferRequest;
    
    if (!request.sourceDomain || !request.targetDomain) {
      return {
        success: false,
        error: 'Missing source or target domain in transfer request',
      };
    }

    try {
      const result = await this.performKnowledgeTransfer(request);
      
      return {
        success: true,
        data: result,
        metadata: {
          duration: 0, // Will be set by base class
          confidence: result.bridgeStrength,
          suggestions: this.generateTransferSuggestions(result),
        },
        nextSteps: [
          'Apply transferred knowledge to target domain tasks',
          'Validate transfer accuracy with domain experts',
          'Refine embeddings based on feedback',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transfer knowledge',
      };
    }
  }

  /**
   * Perform knowledge transfer between domains
   */
  private async performKnowledgeTransfer(
    request: KnowledgeTransferRequest
  ): Promise<KnowledgeTransferResult> {
    const { sourceDomain, targetDomain, concepts, transferDepth = 'deep' } = request;

    // Get or create source domain embedding
    let sourceEmbedding = this.domainEmbeddings.get(sourceDomain);
    if (!sourceEmbedding) {
      sourceEmbedding = this.createDomainEmbedding(sourceDomain);
      this.domainEmbeddings.set(sourceDomain, sourceEmbedding);
    }

    // Get or create target domain embedding
    let targetEmbedding = this.domainEmbeddings.get(targetDomain);
    if (!targetEmbedding) {
      targetEmbedding = this.createDomainEmbedding(targetDomain);
      this.domainEmbeddings.set(targetDomain, targetEmbedding);
    }

    // Use neural transfer network to adapt embeddings
    const { transformedVector, confidence } = this.transferNetwork.transfer(
      sourceEmbedding,
      targetDomain
    );

    // Identify transferable concepts
    const transferredConcepts = this.identifyTransferableConcepts(
      sourceEmbedding,
      targetEmbedding,
      concepts
    );

    // Calculate bridge strength between domains
    const bridgeStrength = this.calculateBridgeStrength(sourceDomain, targetDomain);

    // Create adapted embedding for target domain
    const adaptedEmbedding: DomainEmbedding = {
      domain: targetDomain,
      vector: transformedVector,
      concepts: new Map(
        transferredConcepts.map(concept => [
          concept,
          this.calculateConceptRelevance(concept, targetDomain),
        ])
      ),
      metadata: {
        samples: targetEmbedding.metadata.samples + 1,
        lastUpdated: Date.now(),
        confidence,
      },
    };

    // Generate insights about the transfer
    const insights = this.generateTransferInsights(
      sourceDomain,
      targetDomain,
      transferredConcepts,
      bridgeStrength
    );

    // Calculate applicability score
    const applicability = this.calculateApplicability(
      sourceEmbedding,
      targetEmbedding,
      bridgeStrength
    );

    return {
      sourceDomain,
      targetDomain,
      transferredConcepts,
      adaptedEmbeddings: adaptedEmbedding,
      bridgeStrength,
      applicability,
      insights,
    };
  }

  /**
   * Initialize default domain embeddings with sample data
   */
  private initializeDefaultDomains(): void {
    const defaultDomains = [
      'web_development',
      'ui_components',
      'backend_api',
      'database_design',
      'devops',
      'testing',
      'machine_learning',
      'data_science',
    ];

    defaultDomains.forEach(domain => {
      const embedding = this.createDomainEmbedding(domain);
      this.domainEmbeddings.set(domain, embedding);
    });

    this.log('info', `Initialized ${defaultDomains.length} default domains`);
  }

  /**
   * Create a domain embedding with initial values
   */
  private createDomainEmbedding(domain: string): DomainEmbedding {
    // Generate a random vector for the domain (in practice, this would be learned)
    const vectorSize = 128;
    const vector = Array.from({ length: vectorSize }, () => Math.random() * 2 - 1);

    // Create initial concept map based on domain
    const concepts = this.getDefaultConceptsForDomain(domain);

    return {
      domain,
      vector,
      concepts,
      metadata: {
        samples: 0,
        lastUpdated: Date.now(),
        confidence: 0.5,
      },
    };
  }

  /**
   * Get default concepts for a domain
   */
  private getDefaultConceptsForDomain(domain: string): Map<string, number> {
    const conceptMap = new Map<string, number>();

    // Domain-specific concepts (simplified representation)
    const domainConcepts: Record<string, string[]> = {
      web_development: ['frontend', 'backend', 'api', 'responsive', 'user_interface'],
      ui_components: ['interactive', 'visual', 'navigation', 'forms', 'buttons'],
      backend_api: ['endpoints', 'middleware', 'authentication', 'database', 'routing'],
      database_design: ['schema', 'relationships', 'queries', 'indexes', 'normalization'],
      devops: ['deployment', 'containers', 'ci_cd', 'monitoring', 'infrastructure'],
      testing: ['unit_tests', 'integration', 'e2e', 'coverage', 'mocking'],
      machine_learning: ['models', 'training', 'features', 'prediction', 'evaluation'],
      data_science: ['analysis', 'visualization', 'statistics', 'patterns', 'insights'],
    };

    const concepts = domainConcepts[domain] || ['general', 'concepts', 'knowledge'];
    concepts.forEach((concept, idx) => {
      conceptMap.set(concept, 0.9 - idx * 0.1); // Decreasing weights
    });

    return conceptMap;
  }

  /**
   * Build bridges between related domains
   */
  private buildCrossDomainBridges(): void {
    // Define bridge strengths between domains (0.0 to 1.0)
    const bridges: Array<{ from: string; to: string; strength: number }> = [
      { from: 'web_development', to: 'ui_components', strength: 0.9 },
      { from: 'web_development', to: 'backend_api', strength: 0.85 },
      { from: 'backend_api', to: 'database_design', strength: 0.8 },
      { from: 'devops', to: 'backend_api', strength: 0.7 },
      { from: 'testing', to: 'web_development', strength: 0.75 },
      { from: 'machine_learning', to: 'data_science', strength: 0.9 },
      { from: 'ui_components', to: 'web_development', strength: 0.85 },
      { from: 'database_design', to: 'backend_api', strength: 0.8 },
    ];

    bridges.forEach(({ from, to, strength }) => {
      if (!this.crossDomainBridges.has(from)) {
        this.crossDomainBridges.set(from, new Map());
      }
      this.crossDomainBridges.get(from)!.set(to, strength);
    });

    this.log('info', `Built ${bridges.length} cross-domain bridges`);
  }

  /**
   * Identify concepts that can be transferred between domains
   */
  private identifyTransferableConcepts(
    source: DomainEmbedding,
    target: DomainEmbedding,
    requestedConcepts?: string[]
  ): string[] {
    const transferable: string[] = [];

    // If specific concepts requested, filter by those
    if (requestedConcepts && requestedConcepts.length > 0) {
      requestedConcepts.forEach(concept => {
        if (source.concepts.has(concept)) {
          transferable.push(concept);
        }
      });
    } else {
      // Transfer high-confidence concepts
      source.concepts.forEach((weight, concept) => {
        if (weight > 0.6) {
          transferable.push(concept);
        }
      });
    }

    // Add some general transferable concepts
    if (transferable.length < 3) {
      transferable.push('patterns', 'architecture', 'best_practices');
    }

    return transferable;
  }

  /**
   * Calculate bridge strength between two domains
   */
  private calculateBridgeStrength(sourceDomain: string, targetDomain: string): number {
    // Check if explicit bridge exists
    const bridgeStrength = this.crossDomainBridges.get(sourceDomain)?.get(targetDomain);
    if (bridgeStrength !== undefined) {
      return bridgeStrength;
    }

    // Check reverse bridge
    const reverseBridge = this.crossDomainBridges.get(targetDomain)?.get(sourceDomain);
    if (reverseBridge !== undefined) {
      return reverseBridge * 0.9; // Slightly lower for reverse
    }

    // Calculate similarity-based bridge strength
    const sourceEmbedding = this.domainEmbeddings.get(sourceDomain);
    const targetEmbedding = this.domainEmbeddings.get(targetDomain);

    if (sourceEmbedding && targetEmbedding) {
      return this.calculateEmbeddingSimilarity(
        sourceEmbedding.vector,
        targetEmbedding.vector
      );
    }

    // Default low bridge strength for unknown domains
    return 0.3;
  }

  /**
   * Calculate similarity between two embedding vectors using cosine similarity
   */
  private calculateEmbeddingSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    // Normalize to 0-1 range
    const similarity = (dotProduct / denominator + 1) / 2;
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Calculate concept relevance to a domain
   */
  private calculateConceptRelevance(concept: string, domain: string): number {
    const domainEmbedding = this.domainEmbeddings.get(domain);
    
    if (domainEmbedding?.concepts.has(concept)) {
      return domainEmbedding.concepts.get(concept)!;
    }

    // Default relevance for unknown concepts
    return 0.5;
  }

  /**
   * Generate insights about the knowledge transfer
   */
  private generateTransferInsights(
    sourceDomain: string,
    targetDomain: string,
    concepts: string[],
    bridgeStrength: number
  ): string[] {
    const insights: string[] = [];

    // Bridge strength insights
    if (bridgeStrength > 0.8) {
      insights.push(
        `Strong semantic relationship between ${sourceDomain} and ${targetDomain} enables high-fidelity transfer`
      );
    } else if (bridgeStrength > 0.6) {
      insights.push(
        `Moderate relationship between domains; concepts may require adaptation`
      );
    } else {
      insights.push(
        `Weak domain relationship; transferred concepts should be carefully validated`
      );
    }

    // Concept insights
    if (concepts.length > 5) {
      insights.push(
        `Rich knowledge transfer with ${concepts.length} concepts providing comprehensive coverage`
      );
    } else if (concepts.length === 0) {
      insights.push('Limited transferable concepts; consider domain-specific learning');
    }

    // Domain-specific insights
    if (sourceDomain.includes('development') && targetDomain.includes('development')) {
      insights.push('Development patterns are highly transferable across tech stacks');
    }

    if (sourceDomain.includes('design') && targetDomain.includes('components')) {
      insights.push('Design principles map naturally to component architecture');
    }

    return insights;
  }

  /**
   * Calculate applicability score for transferred knowledge
   */
  private calculateApplicability(
    source: DomainEmbedding,
    target: DomainEmbedding,
    bridgeStrength: number
  ): number {
    // Base applicability on bridge strength
    let applicability = bridgeStrength;

    // Adjust based on embedding confidence
    const avgConfidence = (source.metadata.confidence + target.metadata.confidence) / 2;
    applicability = applicability * 0.7 + avgConfidence * 0.3;

    // Adjust based on sample size (more samples = higher confidence)
    const sampleFactor = Math.min(
      (source.metadata.samples + target.metadata.samples) / 100,
      1.0
    );
    applicability = applicability * 0.9 + sampleFactor * 0.1;

    return Math.max(0, Math.min(1, applicability));
  }

  /**
   * Generate suggestions for improving knowledge transfer
   */
  private generateTransferSuggestions(result: KnowledgeTransferResult): string[] {
    const suggestions: string[] = [];

    if (result.bridgeStrength < 0.5) {
      suggestions.push('Consider establishing stronger bridges through intermediate domains');
    }

    if (result.transferredConcepts.length < 3) {
      suggestions.push('Enrich source domain with more concept examples for better transfer');
    }

    if (result.applicability < 0.6) {
      suggestions.push('Validate transferred concepts with domain experts before application');
      suggestions.push('Consider collecting more samples in target domain for better adaptation');
    }

    if (result.bridgeStrength > 0.8 && result.applicability > 0.7) {
      suggestions.push('Transfer quality is high; consider bi-directional knowledge sharing');
    }

    return suggestions;
  }

  /**
   * Get domain embedding for external use
   */
  public getDomainEmbedding(domain: string): DomainEmbedding | undefined {
    return this.domainEmbeddings.get(domain);
  }

  /**
   * Update domain embedding with new knowledge
   */
  public updateDomainEmbedding(
    domain: string,
    concepts: Map<string, number>,
    feedback?: number
  ): void {
    let embedding = this.domainEmbeddings.get(domain);
    
    if (!embedding) {
      embedding = this.createDomainEmbedding(domain);
      this.domainEmbeddings.set(domain, embedding);
    }

    // Merge new concepts
    concepts.forEach((weight, concept) => {
      embedding!.concepts.set(concept, weight);
    });

    // Update metadata
    embedding.metadata.samples++;
    embedding.metadata.lastUpdated = Date.now();
    
    if (feedback !== undefined) {
      embedding.metadata.confidence = 
        embedding.metadata.confidence * 0.8 + feedback * 0.2;
    }

    this.log('info', `Updated domain embedding for ${domain}`);
  }

  /**
   * Get transfer network statistics
   */
  public getTransferStats() {
    return this.transferNetwork.getTransferStats();
  }

  /**
   * List all available domains
   */
  public listDomains(): string[] {
    return Array.from(this.domainEmbeddings.keys());
  }
}
