// RESOLVED CONFLICT: Merged features from both branches without dropping any functionality.

// ---- Shared Types ----
export type ContextItem = Record<string, unknown>;

export interface ReasoningStep {
  // From feat/v0-import
  type?: "premise" | "inference" | "deduction" | "induction" | "abduction";
  content?: string;
  evidence?: string[];
  confidence?: number;
  // From main
  step?: string;
  rationale?: string;
  outcome?: string;
  feedback?: string;
  quantumState?: string;
}

// From feat/v0-import
export interface ReasoningChain {
  id: string;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  timestamp: number;
}

// From feat/v0-import
export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  success_rate: number;
  context: string[];
  adaptations: string[];
}

// From main
export interface QuantumFact {
  key: string;
  value: string | number | boolean | object;
  certainty?: number;
  superposition?: (string | number | boolean | object)[];
  entanglement?: string[];
  constraints?: Record<string, string | number | boolean | object>;
}

export interface EvolvingGoal {
  description: string;
  constraints?: Record<string, string | number | boolean | object>;
  priority?: number;
  status?: 'pending' | 'in-progress' | 'succeeded' | 'failed';
  evolution?: string[];
}

export interface ReasoningContext {
  facts: QuantumFact[];
  goals: EvolvingGoal[];
  history?: string[];
  quantumState?: string;
}

// ---- Engine ----
export class AdvancedReasoningEngine {
  // feat/v0-import: knowledge, learning, metacognition
  private reasoningChains: Map<string, ReasoningChain> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private knowledgeGraph: Map<string, Set<string>> = new Map();
  private metacognition = {
    self_awareness: 0.8,
    reasoning_quality: 0.85,
    learning_efficiency: 0.9,
    adaptation_rate: 0.75,
  };

  // main: quantum history, context, factIndex
  private history: ReasoningStep[] = [];
  private factIndex: Record<string, number[]> = {};
  private context: ReasoningContext;

  constructor(context?: ReasoningContext) {
    this.context = context || { facts: [], goals: [] };
    this.buildFactIndex();
  }

  // ---- Quantum Engine (main) ----
  private buildFactIndex(): void {
    this.context.facts.forEach((fact, idx) => {
      Object.keys(fact.constraints ?? {}).forEach(key => {
        if (!this.factIndex[key]) this.factIndex[key] = [];
        this.factIndex[key].push(idx);
      });
    });
  }

  solve(batchSize: number = 2, complexity: number = 1): ReasoningStep[] {
    this.context.quantumState = "superposition";
    let processed = 0;
    for (const goal of this.context.goals) {
      if (processed >= batchSize * complexity) break;
      let relevantFacts: QuantumFact[] = [];
      if (goal.constraints) {
        Object.keys(goal.constraints).forEach(key => {
          (this.factIndex[key] ?? []).forEach(idx => {
            const fact = this.context.facts[idx];
            if (fact && fact.constraints && fact.constraints[key] === goal.constraints![key]) relevantFacts.push(fact);
          });
        });
      }
      const certainty = relevantFacts.reduce((sum, fact) => sum + (fact.certainty ?? 1), 0) / Math.max(1, relevantFacts.length);
      const quantumState = relevantFacts.flatMap(f => f.superposition ?? [f.value]).join('|');
      this.history.push({
        step: `QuantumSolve for ${goal.description}`,
        rationale: `Sparse reasoning using ${relevantFacts.length} indexed facts (Q-state: ${quantumState})`,
        outcome: relevantFacts.length ? "Goal satisfied" : "Goal not satisfied",
        certainty,
        feedback: relevantFacts.length
          ? "Goal achieved via quantum state collapse."
          : "No direct facts; superposition maintained.",
        quantumState,
      });
      processed++;
    }
    this.context.quantumState = "collapsed";
    return this.history;
  }

  addFact(fact: QuantumFact): void {
    this.context.facts.push(fact);
    this.buildFactIndex();
  }

  addGoal(goal: EvolvingGoal): void {
    this.context.goals.push(goal);
  }

  getHistory(): ReasoningStep[] {
    return this.history;
  }

  // ---- Advanced Reasoning (feat/v0-import) ----
  async performAdvancedReasoning(query: string, contextArr: ContextItem[]): Promise<ReasoningChain> {
    const reasoningId = `reasoning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const complexity = this.analyzeQueryComplexity(query);
    // approach is computed but not used in this implementation
    // const approach = this.selectReasoningApproach(complexity, contextArr);
    const steps: ReasoningStep[] = [];
    // Deductive reasoning
    const deductiveSteps = await this.performDeductiveReasoning(query, contextArr);
    steps.push(...deductiveSteps);
    // Inductive reasoning
    const inductiveSteps = await this.performInductiveReasoning(query, contextArr);
    steps.push(...inductiveSteps);
    // Abductive reasoning
    const abductiveSteps = await this.performAbductiveReasoning(query, contextArr);
    steps.push(...abductiveSteps);
    // Metacognitive analysis
    const reflectionStep = await this.performMetacognitiveReflection(steps);
    steps.push(reflectionStep);
    // Synthesize conclusion
    const conclusion = await this.synthesizeConclusion(steps);
    const confidence = this.calculateConfidence(steps);
    const reasoningChain: ReasoningChain = {
      id: reasoningId,
      steps,
      conclusion,
      confidence,
      timestamp: Date.now(),
    };
    this.reasoningChains.set(reasoningId, reasoningChain);
    // Learn from reasoning process
    await this.learnFromReasoning(reasoningChain);
    return reasoningChain;
  }

  async learnFromExperience(experience: ContextItem, outcome: "success" | "failure", feedback?: string): Promise<void> {
    const patternId = this.extractPatternId(experience);
    let pattern = this.learningPatterns.get(patternId);
    if (!pattern) {
      pattern = {
        id: patternId,
        pattern: JSON.stringify(experience),
        frequency: 0,
        success_rate: 0,
        context: [],
        adaptations: [],
      };
    }
    // Update pattern statistics
    pattern.frequency++;
    const previousSuccesses = pattern.success_rate * (pattern.frequency - 1);
    pattern.success_rate = (previousSuccesses + (outcome === "success" ? 1 : 0)) / pattern.frequency;
    // Extract contextual information
    const contextInfo = this.extractContextualInfo(experience);
    pattern.context = [...new Set([...pattern.context, ...contextInfo])];
    // Generate adaptations based on feedback
    if (feedback && outcome === "failure") {
      const adaptation = await this.generateAdaptation(pattern, feedback);
      pattern.adaptations.push(adaptation);
    }
    this.learningPatterns.set(patternId, pattern);
    // Update metacognitive awareness
    this.updateMetacognition(outcome, feedback);
    // Evolve knowledge graph
    this.evolveKnowledgeGraph(experience, outcome);
  }

  private async performMetacognitiveReflection(steps: ReasoningStep[]): Promise<ReasoningStep> {
    const reflection = {
      reasoning_quality: this.assessReasoningQuality(steps),
      logical_consistency: this.checkLogicalConsistency(steps),
      evidence_strength: this.evaluateEvidenceStrength(steps),
      potential_biases: this.identifyPotentialBiases(steps),
      improvement_suggestions: this.generateImprovementSuggestions(steps),
    };
    return {
      type: "inference",
      content: `Metacognitive reflection: ${JSON.stringify(reflection)}`,
      evidence: [`Self-assessment score: ${reflection.reasoning_quality}`],
      confidence: this.metacognition.self_awareness,
    };
  }

  private evolveKnowledgeGraph(experience: ContextItem, outcome: "success" | "failure"): void {
    const concepts = this.extractConcepts(experience);
    concepts.forEach((concept) => {
      if (!this.knowledgeGraph.has(concept)) {
        this.knowledgeGraph.set(concept, new Set());
      }
      // Create connections
      concepts.forEach((otherConcept) => {
        if (concept !== otherConcept) {
          this.knowledgeGraph.get(concept)?.add(otherConcept);
        }
      });
    });
    // Strengthen/weaken connections
    if (outcome === "success") {
      this.strengthenConnections(concepts);
    } else {
      this.weakenConnections(concepts);
    }
  }

  // Helper methods for reasoning processes
  private analyzeQueryComplexity(query: string): number {
    const factors = [
      query.length / 100,
      (query.match(/\?/g) || []).length * 0.2,
      (query.match(/\b(if|when|how|why|what|where)\b/gi) || []).length * 0.3,
      (query.match(/\b(and|or|but|however|therefore)\b/gi) || []).length * 0.1,
    ];
    return Math.min(
      factors.reduce((sum, factor) => sum + factor, 0),
      1,
    );
  }

  private selectReasoningApproach(complexity: number, _context: ContextItem[]): string {
    if (complexity > 0.8) return "comprehensive";
    if (complexity > 0.5) return "analytical";
    return "direct";
  }

  private async performDeductiveReasoning(query: string, context: ContextItem[]): Promise<ReasoningStep[]> {
    return [
      {
        type: "deduction",
        content: `Deductive analysis of: ${query}`,
        evidence: context.map((c) => JSON.stringify(c)),
        confidence: 0.85,
      },
    ];
  }

  private async performInductiveReasoning(query: string, context: ContextItem[]): Promise<ReasoningStep[]> {
    return [
      {
        type: "induction",
        content: `Pattern-based inductive reasoning for: ${query}`,
        evidence: [`Found ${context.length} relevant patterns`],
        confidence: 0.75,
      },
    ];
  }

  private async performAbductiveReasoning(query: string, _context: ContextItem[]): Promise<ReasoningStep[]> {
    return [
      {
        type: "abduction",
        content: `Best explanation hypothesis for: ${query}`,
        evidence: ["Generated multiple hypotheses", "Selected most probable explanation"],
        confidence: 0.7,
      },
    ];
  }

  private async synthesizeConclusion(steps: ReasoningStep[]): Promise<string> {
    const conclusions = steps.map((step) => step.content).join(" → ");
    return `Synthesized conclusion based on ${steps.length} reasoning steps: ${conclusions}`;
  }

  private calculateConfidence(steps: ReasoningStep[]): number {
    const avgConfidence = steps.reduce((sum, step) => sum + (step.confidence ?? 0), 0) / steps.length;
    return Math.min(avgConfidence * this.metacognition.reasoning_quality, 1);
  }

  private async learnFromReasoning(chain: ReasoningChain): Promise<void> {
    const learningOpportunities = this.identifyLearningOpportunities(chain);
    for (const opportunity of learningOpportunities) {
      await this.learnFromExperience(opportunity, "success");
    }
  }

  private extractPatternId(experience: ContextItem): string {
    return `pattern_${JSON.stringify(experience)
      .slice(0, 50)
      .replace(/[^a-zA-Z0-9]/g, "_")}`;
  }

  private extractContextualInfo(experience: ContextItem): string[] {
    return Object.keys(experience).filter((key) => typeof experience[key] === "string");
  }

  private async generateAdaptation(pattern: LearningPattern, feedback: string): Promise<string> {
    return `Adaptation based on feedback: ${feedback} - Adjust pattern ${pattern.id}`;
  }

  private updateMetacognition(outcome: "success" | "failure", feedback?: string): void {
    const adjustment = outcome === "success" ? 0.01 : -0.005;
    this.metacognition.reasoning_quality = Math.max(0.1, Math.min(1, this.metacognition.reasoning_quality + adjustment));
    this.metacognition.learning_efficiency = Math.max(
      0.1,
      Math.min(1, this.metacognition.learning_efficiency + adjustment),
    );
    if (feedback) {
      this.metacognition.self_awareness = Math.max(0.1, Math.min(1, this.metacognition.self_awareness + 0.005));
    }
  }

  private assessReasoningQuality(steps: ReasoningStep[]): number {
    return steps.reduce((sum, step) => sum + (step.confidence ?? 0), 0) / steps.length;
  }

  private checkLogicalConsistency(steps: ReasoningStep[]): boolean {
    return steps.every((step) => (step.confidence ?? 0) > 0.3);
  }

  private evaluateEvidenceStrength(_steps: ReasoningStep[]): number {
    return _steps.reduce((sum, step) => sum + (step.evidence?.length ?? 0), 0) / _steps.length;
  }

  private identifyPotentialBiases(_steps: ReasoningStep[]): string[] {
    // Identify potential cognitive biases in reasoning
    return ["confirmation_bias", "availability_heuristic"].filter(() => Math.random() > 0.7);
  }

  private generateImprovementSuggestions(_steps: ReasoningStep[]): string[] {
    return ["Consider alternative perspectives", "Gather more evidence", "Question assumptions"];
  }

  private extractConcepts(experience: ContextItem): string[] {
    return Object.keys(experience).filter((key) => typeof experience[key] === "string");
  }

  private strengthenConnections(concepts: string[]): void {
    concepts.forEach((concept) => {
      const connections = this.knowledgeGraph.get(concept);
      if (connections) {
        concepts.forEach((otherConcept) => {
          if (concept !== otherConcept) {
            connections.add(otherConcept);
          }
        });
      }
    });
  }

  private weakenConnections(concepts: string[]): void {
    concepts.forEach((concept) => {
      const connections = this.knowledgeGraph.get(concept);
      if (connections && connections.size > 1) {
        const toRemove = Array.from(connections)[Math.floor(Math.random() * connections.size)];
        connections.delete(toRemove);
      }
    });
  }

  private identifyLearningOpportunities(chain: ReasoningChain): ContextItem[] {
    return chain.steps.map((step) => ({
      type: step.type,
      content: step.content,
      confidence: step.confidence,
    }));
  }

  // Public methods for integration
  getMetacognitionStatus() {
    return this.metacognition;
  }

  getKnowledgeGraphSize(): number {
    return this.knowledgeGraph.size;
  }

  getLearningPatternsCount(): number {
    return this.learningPatterns.size;
  }

  getQuantumHistory(): ReasoningStep[] {
    return this.history;
  }
}

// Singleton export for integration
export const advancedReasoningEngine = new AdvancedReasoningEngine();