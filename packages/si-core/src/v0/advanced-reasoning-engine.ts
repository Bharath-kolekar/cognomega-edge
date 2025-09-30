export interface QuantumFact {
  key: string;
  value: string | number | boolean | object;
  certainty?: number;
  superposition?: (string | number | boolean | object)[];
  entanglement?: string[];
}

export interface EvolvingGoal {
  description: string;
  constraints?: Record<string, string | number | boolean | object>;
  priority?: number;
  status?: 'pending' | 'in-progress' | 'succeeded' | 'failed';
  evolution?: string[];
}

export interface ReasoningStep {
  step: string;
  rationale: string;
  outcome: string;
  certainty?: number;
  feedback?: string;
  quantumState?: string;
}

export interface ReasoningContext {
  facts: QuantumFact[];
  goals: EvolvingGoal[];
  history?: string[];
  quantumState?: string;
}

export class AdvancedReasoningEngine {
  private history: ReasoningStep[] = [];
  private factIndex: Record<string, number[]> = {}; // Sparse index for fast lookup

  constructor(private context: ReasoningContext) {
    this.buildFactIndex();
  }

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
            if (fact && fact[key] === goal.constraints![key]) relevantFacts.push(fact);
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
}