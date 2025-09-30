/**
 * Example usage of the MultiModalReasoningAgent
 * Demonstrates multi-modal integration and reasoning capabilities
 */

import { MultiModalReasoningAgent } from './multi-modal-reasoning-agent';
import { AgentTask } from './types';
import type { MultiModalInput } from './multi-modal-reasoning-agent';

/**
 * Example 1: Analyze user input from text and audio
 */
export async function analyzeUserSentiment() {
  console.log('🧠 Example 1: Multi-Modal Sentiment Analysis\n');
  console.log('='.repeat(50));

  const agent = new MultiModalReasoningAgent();
  await agent.initialize();

  const input: MultiModalInput = {
    text: {
      content: 'This product is amazing! I love it!',
      language: 'en',
      sentiment: 'positive',
      entities: ['product'],
      confidence: 0.95,
    },
    audio: {
      transcript: 'This product is amazing! I love it!',
      emotion: 'excited',
      language: 'en',
      confidence: 0.92,
    },
    context: {
      timestamp: Date.now(),
      user: {
        preferences: {
          outputModality: 'text',
          verbosity: 'detailed',
        },
      },
    },
  };

  const task: AgentTask = {
    id: 'sentiment-analysis-1',
    type: 'multi-modal-reasoning',
    payload: {
      input,
      outputModality: 'text',
      options: {
        fusionStrategy: 'weighted',
        minConfidence: 0.7,
        includeAlternatives: true,
      },
    },
    priority: 8,
    createdAt: Date.now(),
  };

  console.log('Processing multi-modal sentiment analysis...\n');
  const result = await agent.execute(task);

  if (result.success) {
    console.log('✅ Analysis completed successfully\n');
    const data = result.data as any;
    console.log('Conclusion:', data.reasoning.conclusion);
    console.log('\nConfidence:', (data.reasoning.confidence * 100).toFixed(1) + '%');
    console.log('\nReasoning Steps:');
    data.reasoning.reasoning.forEach((step: string, idx: number) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
    console.log('\nOutput:');
    console.log(data.output.content);
  } else {
    console.log('❌ Analysis failed:', result.error);
  }
}

/**
 * Example 2: Code analysis with vision input
 */
export async function analyzeCodeWithScreenshot() {
  console.log('\n🧠 Example 2: Code Analysis with Visual Context\n');
  console.log('='.repeat(50));

  const agent = new MultiModalReasoningAgent();
  await agent.initialize();

  const input: MultiModalInput = {
    code: {
      content: `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`,
      language: 'javascript',
      quality: {
        complexity: 2,
        maintainability: 8,
        testability: 9,
      },
      confidence: 0.88,
    },
    vision: {
      objects: [
        { name: 'code-editor', confidence: 0.95, bbox: [0, 0, 800, 600] },
        { name: 'terminal', confidence: 0.87, bbox: [0, 600, 800, 800] },
      ],
      text: ['calculateTotal', 'items', 'reduce'],
      confidence: 0.85,
    },
    text: {
      content: 'Need to review this function for potential bugs',
      language: 'en',
      confidence: 0.9,
    },
    context: {
      timestamp: Date.now(),
      user: {
        preferences: {
          outputModality: 'code',
          verbosity: 'moderate',
        },
      },
    },
  };

  const task: AgentTask = {
    id: 'code-analysis-1',
    type: 'multi-modal-reasoning',
    payload: {
      input,
      outputModality: 'code',
      options: {
        fusionStrategy: 'hierarchical',
        includeAlternatives: false,
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  console.log('Processing code analysis with visual context...\n');
  const result = await agent.execute(task);

  if (result.success) {
    console.log('✅ Code analysis completed\n');
    const data = result.data as any;
    console.log('Analysis Result:');
    console.log(data.output.content);
    console.log('\nConfidence:', (data.reasoning.confidence * 100).toFixed(1) + '%');
  } else {
    console.log('❌ Code analysis failed:', result.error);
  }
}

/**
 * Example 3: Gesture-based interface control with sensor data
 */
export async function analyzeGestureControl() {
  console.log('\n🧠 Example 3: Gesture Control with Sensor Fusion\n');
  console.log('='.repeat(50));

  const agent = new MultiModalReasoningAgent();
  await agent.initialize();

  const input: MultiModalInput = {
    gesture: {
      type: 'swipe',
      direction: 'right',
      intensity: 0.85,
      duration: 250,
      coordinates: { x: 100, y: 200 },
      confidence: 0.92,
    },
    sensor: {
      type: 'accelerometer',
      value: [0.5, 0.2, -0.1],
      unit: 'g',
      timestamp: Date.now(),
      confidence: 0.88,
    },
    context: {
      timestamp: Date.now(),
      device: {
        type: 'mobile',
        orientation: 'portrait',
        capabilities: ['touch', 'accelerometer', 'gyroscope'],
      },
      environment: {
        lighting: 0.7,
        noise: 0.3,
      },
      user: {
        preferences: {
          outputModality: 'text',
          verbosity: 'concise',
        },
      },
    },
  };

  const task: AgentTask = {
    id: 'gesture-control-1',
    type: 'multi-modal-reasoning',
    payload: {
      input,
      outputModality: 'text',
      options: {
        fusionStrategy: 'consensus',
        minConfidence: 0.8,
      },
    },
    priority: 7,
    createdAt: Date.now(),
  };

  console.log('Processing gesture control with sensor fusion...\n');
  const result = await agent.execute(task);

  if (result.success) {
    console.log('✅ Gesture analysis completed\n');
    const data = result.data as any;
    console.log('Detected Action:', data.reasoning.conclusion);
    console.log('\nFusion Details:');
    console.log('  Primary Modality:', data.fusion.primary);
    console.log('  Supporting Modalities:', data.fusion.supporting.join(', '));
    console.log('  Overall Confidence:', (data.fusion.confidence * 100).toFixed(1) + '%');
    console.log('\nNext Steps:');
    result.nextSteps?.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
  } else {
    console.log('❌ Gesture analysis failed:', result.error);
  }
}

/**
 * Example 4: Comprehensive multi-modal scene understanding
 */
export async function comprehensiveSceneAnalysis() {
  console.log('\n🧠 Example 4: Comprehensive Multi-Modal Scene Understanding\n');
  console.log('='.repeat(50));

  const agent = new MultiModalReasoningAgent();
  await agent.initialize();

  const input: MultiModalInput = {
    text: {
      content: 'What is happening in this scene?',
      language: 'en',
      confidence: 0.95,
    },
    vision: {
      objects: [
        { name: 'person', confidence: 0.92, bbox: [100, 100, 200, 300] },
        { name: 'laptop', confidence: 0.89, bbox: [250, 200, 400, 300] },
        { name: 'coffee-cup', confidence: 0.85, bbox: [450, 220, 500, 280] },
      ],
      scenes: [
        { name: 'office', confidence: 0.88 },
        { name: 'workspace', confidence: 0.85 },
      ],
      faces: [{ emotion: 'focused', age: 30, confidence: 0.87 }],
      text: ['DEADLINE', 'Project Plan'],
      confidence: 0.88,
    },
    audio: {
      transcript: 'I need to finish this by tonight',
      emotion: 'stressed',
      language: 'en',
      confidence: 0.86,
    },
    sensor: {
      type: 'temperature',
      value: 22.5,
      unit: 'celsius',
      timestamp: Date.now(),
      confidence: 0.95,
    },
    context: {
      timestamp: Date.now(),
      location: { x: 100, y: 200 },
      environment: {
        lighting: 0.6,
        noise: 0.4,
        temperature: 22.5,
      },
      user: {
        preferences: {
          outputModality: 'text',
          verbosity: 'detailed',
        },
      },
    },
  };

  const task: AgentTask = {
    id: 'scene-analysis-1',
    type: 'multi-modal-reasoning',
    payload: {
      input,
      outputModality: 'text',
      options: {
        fusionStrategy: 'weighted',
        minConfidence: 0.7,
        includeAlternatives: true,
      },
    },
    priority: 10,
    createdAt: Date.now(),
  };

  console.log('Processing comprehensive scene analysis...\n');
  const result = await agent.execute(task);

  if (result.success) {
    console.log('✅ Scene analysis completed\n');
    const data = result.data as any;
    
    console.log('Scene Understanding:');
    console.log(data.output.content);
    
    console.log('\n\nModality Fusion:');
    console.log('  Modalities Analyzed:', data.modalitiesAnalyzed);
    console.log('  Overall Confidence:', (data.overallConfidence * 100).toFixed(1) + '%');
    
    if (data.fusion.contradictions) {
      console.log('\n⚠️  Contradictions Detected:');
      data.fusion.contradictions.forEach((c: any) => {
        console.log(`  - ${c.description} (${c.severity})`);
        if (c.resolution) {
          console.log(`    Resolution: ${c.resolution}`);
        }
      });
    }

    if (result.metadata?.suggestions) {
      console.log('\n💡 Suggestions:');
      result.metadata.suggestions.forEach((s: string) => {
        console.log(`  - ${s}`);
      });
    }
  } else {
    console.log('❌ Scene analysis failed:', result.error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await analyzeUserSentiment();
    await analyzeCodeWithScreenshot();
    await analyzeGestureControl();
    await comprehensiveSceneAnalysis();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All multi-modal reasoning examples completed!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples();
}
