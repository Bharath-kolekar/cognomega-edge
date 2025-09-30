/**
 * Multi-Modal Reasoning Agent
 * Integrates and reasons across multiple modalities: text, code, vision, audio, sensor data
 * Fuses insights from different modalities and generates outputs in user's preferred format
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult } from './types';

// ============================================================================
// Multi-Modal Types
// ============================================================================

export type ModalityType = 'text' | 'code' | 'vision' | 'audio' | 'sensor' | 'haptic' | 'gesture';

export interface MultiModalInput {
  text?: TextInput;
  code?: CodeInput;
  vision?: VisionInput;
  audio?: AudioInput;
  sensor?: SensorInput;
  gesture?: GestureInput;
  context?: MultiModalContext;
}

export interface TextInput {
  content: string;
  language?: string;
  sentiment?: string;
  entities?: string[];
  confidence: number;
}

export interface CodeInput {
  content: string;
  language: string;
  ast?: unknown;
  dependencies?: string[];
  quality?: {
    complexity: number;
    maintainability: number;
    testability: number;
  };
  confidence: number;
}

export interface VisionInput {
  imageData?: string;
  videoData?: string;
  objects?: Array<{ name: string; confidence: number; bbox: number[] }>;
  scenes?: Array<{ name: string; confidence: number }>;
  text?: string[];
  faces?: Array<{ emotion: string; age?: number; confidence: number }>;
  confidence: number;
}

export interface AudioInput {
  transcript?: string;
  waveform?: number[];
  emotion?: string;
  speaker?: {
    id?: string;
    gender?: string;
    age?: number;
  };
  language?: string;
  confidence: number;
}

export interface SensorInput {
  type: 'accelerometer' | 'gyroscope' | 'temperature' | 'pressure' | 'location' | 'biometric';
  value: number | number[];
  unit?: string;
  timestamp: number;
  confidence: number;
}

export interface GestureInput {
  type: 'swipe' | 'tap' | 'pinch' | 'rotate' | 'hover' | 'point' | 'wave';
  direction?: string;
  intensity: number;
  duration: number;
  coordinates?: { x: number; y: number };
  confidence: number;
}

export interface MultiModalContext {
  timestamp: number;
  location?: { x: number; y: number; z?: number };
  environment?: {
    lighting?: number;
    noise?: number;
    temperature?: number;
  };
  device?: {
    type: string;
    orientation?: string;
    capabilities?: string[];
  };
  user?: {
    preferences?: {
      outputModality?: ModalityType;
      language?: string;
      verbosity?: 'concise' | 'moderate' | 'detailed';
    };
    history?: string[];
  };
}

export interface ModalityFusion {
  primary: ModalityType;
  supporting: ModalityType[];
  confidence: number;
  insights: ModalityInsight[];
  contradictions?: Contradiction[];
  consensus?: string;
}

export interface ModalityInsight {
  modality: ModalityType;
  insight: string;
  confidence: number;
  relevance: number;
  evidence?: unknown;
}

export interface Contradiction {
  modalities: [ModalityType, ModalityType];
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution?: string;
}

export interface MultiModalReasoning {
  conclusion: string;
  reasoning: string[];
  confidence: number;
  supportingModalities: ModalityType[];
  alternativeInterpretations?: Array<{
    interpretation: string;
    confidence: number;
    modalities: ModalityType[];
  }>;
}

export interface MultiModalOutput {
  modality: ModalityType;
  content: string | unknown;
  metadata?: {
    format?: string;
    encoding?: string;
    duration?: number;
    size?: number;
  };
  alternatives?: Array<{
    modality: ModalityType;
    content: string | unknown;
  }>;
}

// ============================================================================
// Multi-Modal Reasoning Agent
// ============================================================================

export class MultiModalReasoningAgent extends BaseAgent {
  constructor() {
    super(
      'multi-modal-reasoning' as any, // Extended AgentType
      'MultiModalReasoningAgent',
      [
        'multi-modal-integration',
        'cross-modal-reasoning',
        'modality-fusion',
        'multi-modal-output',
        'text-analysis',
        'code-analysis',
        'vision-analysis',
        'audio-analysis',
        'sensor-analysis',
        'gesture-recognition',
      ],
      8 // High priority for complex reasoning
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing multi-modal reasoning task: ${task.id}`);

    const { input, outputModality, options } = task.payload as {
      input: MultiModalInput;
      outputModality?: ModalityType;
      options?: {
        fusionStrategy?: 'consensus' | 'weighted' | 'hierarchical';
        minConfidence?: number;
        includeAlternatives?: boolean;
      };
    };

    if (!input || Object.keys(input).length === 0) {
      return {
        success: false,
        error: 'No multi-modal input provided',
      };
    }

    try {
      // Step 1: Analyze each modality
      const modalityAnalysis = await this.analyzeModalities(input);

      // Step 2: Fuse insights from multiple modalities
      const fusion = await this.fuseModalities(modalityAnalysis, options?.fusionStrategy);

      // Step 3: Perform cross-modal reasoning
      const reasoning = await this.reasonAcrossModalities(fusion, input);

      // Step 4: Generate output in preferred modality
      const preferredModality = outputModality || input.context?.user?.preferences?.outputModality || 'text';
      const output = await this.generateOutput(reasoning, preferredModality, options?.includeAlternatives);

      return {
        success: true,
        data: {
          fusion,
          reasoning,
          output,
          modalitiesAnalyzed: modalityAnalysis.length,
          overallConfidence: reasoning.confidence,
        },
        metadata: {
          duration: 0,
          confidence: reasoning.confidence,
          suggestions: this.generateSuggestions(fusion, reasoning),
        },
        nextSteps: this.determineNextSteps(reasoning, fusion),
      };
    } catch (error) {
      this.log('error', 'Failed to process multi-modal reasoning task', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during multi-modal reasoning',
      };
    }
  }

  /**
   * Analyze each input modality independently
   */
  private async analyzeModalities(input: MultiModalInput): Promise<ModalityInsight[]> {
    const insights: ModalityInsight[] = [];

    // Text analysis
    if (input.text) {
      insights.push({
        modality: 'text',
        insight: this.analyzeText(input.text),
        confidence: input.text.confidence,
        relevance: 1.0,
        evidence: {
          entities: input.text.entities,
          sentiment: input.text.sentiment,
        },
      });
    }

    // Code analysis
    if (input.code) {
      insights.push({
        modality: 'code',
        insight: this.analyzeCode(input.code),
        confidence: input.code.confidence,
        relevance: 0.95,
        evidence: {
          language: input.code.language,
          quality: input.code.quality,
        },
      });
    }

    // Vision analysis
    if (input.vision) {
      insights.push({
        modality: 'vision',
        insight: this.analyzeVision(input.vision),
        confidence: input.vision.confidence,
        relevance: 0.9,
        evidence: {
          objects: input.vision.objects?.length || 0,
          scenes: input.vision.scenes?.length || 0,
        },
      });
    }

    // Audio analysis
    if (input.audio) {
      insights.push({
        modality: 'audio',
        insight: this.analyzeAudio(input.audio),
        confidence: input.audio.confidence,
        relevance: 0.85,
        evidence: {
          transcript: input.audio.transcript,
          emotion: input.audio.emotion,
        },
      });
    }

    // Sensor analysis
    if (input.sensor) {
      insights.push({
        modality: 'sensor',
        insight: this.analyzeSensor(input.sensor),
        confidence: input.sensor.confidence,
        relevance: 0.8,
        evidence: {
          type: input.sensor.type,
          value: input.sensor.value,
        },
      });
    }

    // Gesture analysis
    if (input.gesture) {
      insights.push({
        modality: 'gesture',
        insight: this.analyzeGesture(input.gesture),
        confidence: input.gesture.confidence,
        relevance: 0.75,
        evidence: {
          type: input.gesture.type,
          intensity: input.gesture.intensity,
        },
      });
    }

    return insights;
  }

  /**
   * Analyze text input
   */
  private analyzeText(text: TextInput): string {
    const entities = text.entities?.join(', ') || 'none';
    const sentiment = text.sentiment || 'neutral';
    return `Text content (${text.language || 'unknown'} language) with ${sentiment} sentiment. Key entities: ${entities}. Content: "${text.content.substring(0, 100)}${text.content.length > 100 ? '...' : ''}"`;
  }

  /**
   * Analyze code input
   */
  private analyzeCode(code: CodeInput): string {
    const quality = code.quality;
    const qualityStr = quality
      ? `complexity: ${quality.complexity}, maintainability: ${quality.maintainability}`
      : 'unknown quality';
    return `${code.language} code with ${qualityStr}. Dependencies: ${code.dependencies?.length || 0}. Code structure analyzed.`;
  }

  /**
   * Analyze vision input
   */
  private analyzeVision(vision: VisionInput): string {
    const objects = vision.objects?.map(o => o.name).join(', ') || 'none';
    const scenes = vision.scenes?.map(s => s.name).join(', ') || 'none';
    const faces = vision.faces?.length || 0;
    return `Visual input contains objects: ${objects}. Scenes: ${scenes}. ${faces} face(s) detected. ${vision.text?.length || 0} text element(s) found.`;
  }

  /**
   * Analyze audio input
   */
  private analyzeAudio(audio: AudioInput): string {
    const transcript = audio.transcript || 'no transcript';
    const emotion = audio.emotion || 'neutral';
    return `Audio with ${emotion} emotion. Transcript: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}". Language: ${audio.language || 'unknown'}.`;
  }

  /**
   * Analyze sensor input
   */
  private analyzeSensor(sensor: SensorInput): string {
    const value = Array.isArray(sensor.value) ? sensor.value.join(', ') : sensor.value;
    return `${sensor.type} sensor reading: ${value} ${sensor.unit || ''}. Timestamp: ${sensor.timestamp}.`;
  }

  /**
   * Analyze gesture input
   */
  private analyzeGesture(gesture: GestureInput): string {
    const coords = gesture.coordinates ? `at (${gesture.coordinates.x}, ${gesture.coordinates.y})` : '';
    return `${gesture.type} gesture ${coords} with intensity ${gesture.intensity} for ${gesture.duration}ms. Direction: ${gesture.direction || 'none'}.`;
  }

  /**
   * Fuse insights from multiple modalities
   */
  private async fuseModalities(
    insights: ModalityInsight[],
    strategy: 'consensus' | 'weighted' | 'hierarchical' = 'weighted'
  ): Promise<ModalityFusion> {
    if (insights.length === 0) {
      throw new Error('No modality insights to fuse');
    }

    // Sort by relevance and confidence
    const sortedInsights = [...insights].sort(
      (a, b) => (b.confidence * b.relevance) - (a.confidence * a.relevance)
    );

    const primary = sortedInsights[0].modality;
    const supporting = sortedInsights.slice(1).map(i => i.modality);

    // Calculate overall confidence based on strategy
    let overallConfidence: number;
    switch (strategy) {
      case 'consensus':
        // Average confidence of all modalities
        overallConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
        break;
      case 'weighted':
        // Weighted by relevance
        const totalRelevance = insights.reduce((sum, i) => sum + i.relevance, 0);
        overallConfidence = insights.reduce(
          (sum, i) => sum + (i.confidence * i.relevance),
          0
        ) / totalRelevance;
        break;
      case 'hierarchical':
        // Use primary modality confidence with supporting boost
        overallConfidence = sortedInsights[0].confidence * 0.7 +
          (sortedInsights.length > 1 ? sortedInsights[1].confidence * 0.2 : 0) +
          (sortedInsights.length > 2 ? sortedInsights[2].confidence * 0.1 : 0);
        break;
    }

    // Detect contradictions between modalities
    const contradictions = this.detectContradictions(insights);

    // Generate consensus statement
    const consensus = this.generateConsensus(insights, contradictions);

    return {
      primary,
      supporting,
      confidence: overallConfidence,
      insights: sortedInsights,
      contradictions: contradictions.length > 0 ? contradictions : undefined,
      consensus,
    };
  }

  /**
   * Detect contradictions between modalities
   */
  private detectContradictions(insights: ModalityInsight[]): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Simple heuristic: compare sentiment/emotion across text and audio
    const textInsight = insights.find(i => i.modality === 'text');
    const audioInsight = insights.find(i => i.modality === 'audio');

    if (textInsight && audioInsight) {
      const textEvidence = textInsight.evidence as any;
      const audioEvidence = audioInsight.evidence as any;

      if (textEvidence?.sentiment && audioEvidence?.emotion) {
        if ((textEvidence.sentiment === 'positive' && audioEvidence.emotion === 'sad') ||
            (textEvidence.sentiment === 'negative' && audioEvidence.emotion === 'happy')) {
          contradictions.push({
            modalities: ['text', 'audio'],
            description: `Text sentiment (${textEvidence.sentiment}) contradicts audio emotion (${audioEvidence.emotion})`,
            severity: 'medium',
            resolution: 'Consider audio emotion as more reliable for emotional state',
          });
        }
      }
    }

    return contradictions;
  }

  /**
   * Generate consensus statement from multiple insights
   */
  private generateConsensus(insights: ModalityInsight[], contradictions: Contradiction[]): string {
    const modalityList = insights.map(i => i.modality).join(', ');
    const avgConfidence = (insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100).toFixed(1);

    let consensus = `Analysis across ${insights.length} modality/modalities (${modalityList}) with ${avgConfidence}% average confidence. `;

    if (contradictions.length > 0) {
      consensus += `${contradictions.length} contradiction(s) detected. `;
    }

    // Combine key insights
    const keyInsights = insights
      .filter(i => i.confidence > 0.7)
      .map(i => `${i.modality}: ${i.insight}`)
      .join('. ');

    consensus += keyInsights;

    return consensus;
  }

  /**
   * Perform reasoning across modalities
   */
  private async reasonAcrossModalities(
    fusion: ModalityFusion,
    input: MultiModalInput
  ): Promise<MultiModalReasoning> {
    const reasoningSteps: string[] = [];

    // Step 1: Establish context
    reasoningSteps.push(
      `Analyzing input from ${fusion.insights.length} modality/modalities with primary focus on ${fusion.primary}`
    );

    // Step 2: Synthesize information
    const synthesis = this.synthesizeInformation(fusion);
    reasoningSteps.push(synthesis);

    // Step 3: Apply cross-modal validation
    if (fusion.contradictions && fusion.contradictions.length > 0) {
      reasoningSteps.push(
        `Identified ${fusion.contradictions.length} contradiction(s) requiring resolution`
      );
      fusion.contradictions.forEach(c => {
        if (c.resolution) {
          reasoningSteps.push(`Resolution for ${c.modalities.join('-')} conflict: ${c.resolution}`);
        }
      });
    }

    // Step 4: Draw conclusion
    const conclusion = this.drawConclusion(fusion, input);
    reasoningSteps.push(`Conclusion: ${conclusion}`);

    // Generate alternative interpretations
    const alternatives = this.generateAlternatives(fusion);

    return {
      conclusion,
      reasoning: reasoningSteps,
      confidence: fusion.confidence,
      supportingModalities: [fusion.primary, ...fusion.supporting],
      alternativeInterpretations: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  /**
   * Synthesize information from multiple modalities
   */
  private synthesizeInformation(fusion: ModalityFusion): string {
    const highConfidenceInsights = fusion.insights.filter(i => i.confidence > 0.7);

    if (highConfidenceInsights.length === 0) {
      return 'Limited high-confidence information available across modalities';
    }

    const synthesis = highConfidenceInsights
      .map(i => `${i.modality} (${(i.confidence * 100).toFixed(0)}%)`)
      .join(', ');

    return `High-confidence insights from: ${synthesis}`;
  }

  /**
   * Draw conclusion from fused modalities
   */
  private drawConclusion(fusion: ModalityFusion, input: MultiModalInput): string {
    // Use the primary modality's insight as the base conclusion
    const primaryInsight = fusion.insights[0];

    let conclusion = `Based on ${fusion.primary} analysis: ${primaryInsight.insight.split('.')[0]}`;

    // Add supporting evidence
    if (fusion.supporting.length > 0) {
      conclusion += `. Supported by ${fusion.supporting.slice(0, 2).join(' and ')} modalities`;
    }

    return conclusion;
  }

  /**
   * Generate alternative interpretations
   */
  private generateAlternatives(fusion: ModalityFusion): Array<{
    interpretation: string;
    confidence: number;
    modalities: ModalityType[];
  }> {
    const alternatives: Array<{
      interpretation: string;
      confidence: number;
      modalities: ModalityType[];
    }> = [];

    // If we have contradictions, each represents an alternative interpretation
    if (fusion.contradictions) {
      fusion.contradictions.forEach(contradiction => {
        alternatives.push({
          interpretation: contradiction.description,
          confidence: 0.5, // Lower confidence for contradicting interpretations
          modalities: [...contradiction.modalities],
        });
      });
    }

    // Generate alternative based on secondary modalities
    if (fusion.insights.length > 1) {
      const secondaryInsight = fusion.insights[1];
      if (secondaryInsight.confidence > 0.6) {
        alternatives.push({
          interpretation: `Alternative perspective from ${secondaryInsight.modality}: ${secondaryInsight.insight.split('.')[0]}`,
          confidence: secondaryInsight.confidence * 0.8,
          modalities: [secondaryInsight.modality],
        });
      }
    }

    return alternatives;
  }

  /**
   * Generate output in user's preferred modality
   */
  private async generateOutput(
    reasoning: MultiModalReasoning,
    modality: ModalityType,
    includeAlternatives: boolean = false
  ): Promise<MultiModalOutput> {
    let content: string | unknown;
    const metadata: any = {};

    switch (modality) {
      case 'text':
        content = this.generateTextOutput(reasoning);
        metadata.format = 'plain-text';
        break;

      case 'code':
        content = this.generateCodeOutput(reasoning);
        metadata.format = 'code';
        metadata.encoding = 'utf-8';
        break;

      case 'vision':
        content = this.generateVisionOutput(reasoning);
        metadata.format = 'visualization-spec';
        break;

      case 'audio':
        content = this.generateAudioOutput(reasoning);
        metadata.format = 'speech-synthesis';
        metadata.duration = 5000; // estimated ms
        break;

      default:
        content = this.generateTextOutput(reasoning);
        metadata.format = 'plain-text';
    }

    const output: MultiModalOutput = {
      modality,
      content,
      metadata,
    };

    // Include alternatives if requested
    if (includeAlternatives) {
      output.alternatives = [];

      if (modality !== 'text') {
        output.alternatives.push({
          modality: 'text',
          content: this.generateTextOutput(reasoning),
        });
      }

      if (modality !== 'code' && reasoning.supportingModalities.includes('code')) {
        output.alternatives.push({
          modality: 'code',
          content: this.generateCodeOutput(reasoning),
        });
      }
    }

    return output;
  }

  /**
   * Generate text output
   */
  private generateTextOutput(reasoning: MultiModalReasoning): string {
    let output = `${reasoning.conclusion}\n\n`;
    output += `Reasoning Process:\n`;
    reasoning.reasoning.forEach((step, idx) => {
      output += `${idx + 1}. ${step}\n`;
    });
    output += `\nConfidence: ${(reasoning.confidence * 100).toFixed(1)}%`;

    if (reasoning.alternativeInterpretations && reasoning.alternativeInterpretations.length > 0) {
      output += `\n\nAlternative Interpretations:\n`;
      reasoning.alternativeInterpretations.forEach((alt, idx) => {
        output += `${idx + 1}. ${alt.interpretation} (${(alt.confidence * 100).toFixed(0)}% confidence)\n`;
      });
    }

    return output;
  }

  /**
   * Generate code output (structured representation)
   */
  private generateCodeOutput(reasoning: MultiModalReasoning): string {
    // Generate a code-like structured output
    const code = `// Multi-Modal Reasoning Result
const result = {
  conclusion: "${reasoning.conclusion.replace(/"/g, '\\"')}",
  confidence: ${reasoning.confidence.toFixed(3)},
  supportingModalities: [${reasoning.supportingModalities.map(m => `"${m}"`).join(', ')}],
  reasoning: [
${reasoning.reasoning.map(r => `    "${r.replace(/"/g, '\\"')}"`).join(',\n')}
  ]
};

export default result;`;

    return code;
  }

  /**
   * Generate vision output (visualization spec)
   */
  private generateVisionOutput(reasoning: MultiModalReasoning): unknown {
    // Generate a visualization specification
    return {
      type: 'reasoning-diagram',
      title: reasoning.conclusion,
      nodes: [
        {
          id: 'conclusion',
          label: reasoning.conclusion,
          type: 'conclusion',
          confidence: reasoning.confidence,
        },
        ...reasoning.supportingModalities.map((modality, idx) => ({
          id: `modality-${idx}`,
          label: modality,
          type: 'modality',
        })),
      ],
      edges: reasoning.supportingModalities.map((_, idx) => ({
        from: `modality-${idx}`,
        to: 'conclusion',
        label: 'supports',
      })),
      metadata: {
        confidence: reasoning.confidence,
        modalityCount: reasoning.supportingModalities.length,
      },
    };
  }

  /**
   * Generate audio output (speech synthesis spec)
   */
  private generateAudioOutput(reasoning: MultiModalReasoning): unknown {
    // Generate speech synthesis specification
    return {
      text: reasoning.conclusion,
      voice: {
        gender: 'neutral',
        age: 'adult',
        speed: 1.0,
        pitch: 1.0,
      },
      emphasis: [
        {
          text: 'conclusion',
          level: 'strong',
        },
      ],
      pauses: [
        {
          after: reasoning.conclusion,
          duration: 500,
        },
      ],
    };
  }

  /**
   * Generate suggestions based on analysis
   */
  private generateSuggestions(fusion: ModalityFusion, reasoning: MultiModalReasoning): string[] {
    const suggestions: string[] = [];

    // Low confidence suggestion
    if (fusion.confidence < 0.7) {
      suggestions.push('Consider gathering additional data to increase confidence');
    }

    // Contradiction suggestion
    if (fusion.contradictions && fusion.contradictions.length > 0) {
      suggestions.push('Resolve contradictions between modalities for clearer conclusions');
    }

    // Single modality suggestion
    if (fusion.insights.length === 1) {
      suggestions.push('Incorporate additional modalities for more robust reasoning');
    }

    // Alternative interpretations suggestion
    if (reasoning.alternativeInterpretations && reasoning.alternativeInterpretations.length > 0) {
      suggestions.push('Review alternative interpretations before taking action');
    }

    return suggestions;
  }

  /**
   * Determine next steps based on reasoning
   */
  private determineNextSteps(reasoning: MultiModalReasoning, fusion: ModalityFusion): string[] {
    const nextSteps: string[] = [];

    if (reasoning.confidence > 0.8) {
      nextSteps.push('Confidence is high - proceed with action based on conclusion');
    } else if (reasoning.confidence > 0.6) {
      nextSteps.push('Moderate confidence - consider validation before proceeding');
    } else {
      nextSteps.push('Low confidence - gather more data or use alternative approaches');
    }

    if (fusion.contradictions && fusion.contradictions.length > 0) {
      nextSteps.push('Investigate and resolve modality contradictions');
    }

    if (fusion.insights.some(i => i.confidence < 0.5)) {
      nextSteps.push('Re-process low-confidence modalities with improved methods');
    }

    return nextSteps;
  }
}
