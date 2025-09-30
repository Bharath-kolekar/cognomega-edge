/**
 * UI Design Agent
 * Creates user interface designs, prototypes, and component specifications
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, ProjectRequirements } from './types';

export interface UIDesign {
  id: string;
  theme: UITheme;
  components: UIComponent[];
  layouts: Layout[];
  styles: StyleGuide;
  accessibility: AccessibilitySpec;
  responsiveBreakpoints: Record<string, number>;
}

export interface UITheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
  };
  typography: {
    fontFamily: string;
    headingSizes: Record<string, string>;
    bodySize: string;
    lineHeight: number;
  };
  spacing: {
    unit: number;
    scale: number[];
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface UIComponent {
  name: string;
  type: string;
  props: ComponentProp[];
  variants: ComponentVariant[];
  states: string[];
  examples: string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, unknown>;
}

export interface Layout {
  name: string;
  description: string;
  type: 'grid' | 'flex' | 'stack' | 'sidebar' | 'dashboard';
  regions: LayoutRegion[];
  responsive: boolean;
}

export interface LayoutRegion {
  name: string;
  position: string;
  size: string;
  content: string[];
}

export interface StyleGuide {
  naming: 'BEM' | 'CSS-in-JS' | 'Tailwind' | 'Module CSS';
  cssFramework?: string;
  conventions: string[];
}

export interface AccessibilitySpec {
  wcagLevel: 'A' | 'AA' | 'AAA';
  features: string[];
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
}

export class UIDesignAgent extends BaseAgent {
  constructor() {
    super(
      'ui-design',
      'UIDesignAgent',
      [
        'ui-design',
        'component-design',
        'theme-creation',
        'layout-design',
        'accessibility',
        'responsive-design',
      ],
      8
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing UI design task: ${task.id}`);

    const requirements = task.payload.requirements as ProjectRequirements;
    const projectPlan = task.payload.projectPlan;

    if (!requirements) {
      return {
        success: false,
        error: 'Missing project requirements',
      };
    }

    try {
      const design = await this.createUIDesign(requirements);
      
      return {
        success: true,
        data: design,
        metadata: {
          duration: 0,
          confidence: 0.85,
          suggestions: [
            'Review color contrast for accessibility',
            'Consider adding dark mode variant',
            'Validate responsive breakpoints with target devices',
          ],
        },
        nextSteps: [
          'Generate component code',
          'Create style tokens',
          'Build prototype',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create UI design',
      };
    }
  }

  private async createUIDesign(requirements: ProjectRequirements): Promise<UIDesign> {
    const theme = this.createTheme(requirements);
    const components = this.designComponents(requirements);
    const layouts = this.createLayouts(requirements);
    const styles = this.defineStyleGuide(requirements);
    const accessibility = this.defineAccessibility();

    return {
      id: `ui-design-${Date.now()}`,
      theme,
      components,
      layouts,
      styles,
      accessibility,
      responsiveBreakpoints: {
        mobile: 640,
        tablet: 768,
        desktop: 1024,
        wide: 1280,
      },
    };
  }

  private createTheme(requirements: ProjectRequirements): UITheme {
    // Create a default modern theme that can be customized
    return {
      name: `${requirements.name} Theme`,
      colors: {
        primary: '#3B82F6', // Blue
        secondary: '#8B5CF6', // Purple
        accent: '#10B981', // Green
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        headingSizes: {
          h1: '2.25rem',
          h2: '1.875rem',
          h3: '1.5rem',
          h4: '1.25rem',
          h5: '1.125rem',
          h6: '1rem',
        },
        bodySize: '1rem',
        lineHeight: 1.5,
      },
      spacing: {
        unit: 4,
        scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    };
  }

  private designComponents(requirements: ProjectRequirements): UIComponent[] {
    const components: UIComponent[] = [];

    // Base components
    components.push(
      {
        name: 'Button',
        type: 'interactive',
        props: [
          { name: 'variant', type: 'string', required: false, defaultValue: 'primary', description: 'Button style variant' },
          { name: 'size', type: 'string', required: false, defaultValue: 'md', description: 'Button size' },
          { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false', description: 'Disabled state' },
          { name: 'onClick', type: 'function', required: false, description: 'Click handler' },
        ],
        variants: [
          { name: 'primary', description: 'Primary action button', props: { color: 'primary' } },
          { name: 'secondary', description: 'Secondary action button', props: { color: 'secondary' } },
          { name: 'outline', description: 'Outlined button', props: { variant: 'outline' } },
        ],
        states: ['default', 'hover', 'active', 'disabled', 'loading'],
        examples: ['Submit Form', 'Cancel', 'Save Changes'],
      },
      {
        name: 'Input',
        type: 'form',
        props: [
          { name: 'type', type: 'string', required: false, defaultValue: 'text', description: 'Input type' },
          { name: 'placeholder', type: 'string', required: false, description: 'Placeholder text' },
          { name: 'value', type: 'string', required: false, description: 'Input value' },
          { name: 'onChange', type: 'function', required: false, description: 'Change handler' },
          { name: 'error', type: 'string', required: false, description: 'Error message' },
        ],
        variants: [
          { name: 'text', description: 'Text input', props: { type: 'text' } },
          { name: 'email', description: 'Email input', props: { type: 'email' } },
          { name: 'password', description: 'Password input', props: { type: 'password' } },
        ],
        states: ['default', 'focus', 'error', 'disabled'],
        examples: ['Username', 'Email', 'Password'],
      },
      {
        name: 'Card',
        type: 'container',
        props: [
          { name: 'title', type: 'string', required: false, description: 'Card title' },
          { name: 'children', type: 'ReactNode', required: true, description: 'Card content' },
          { name: 'footer', type: 'ReactNode', required: false, description: 'Card footer' },
        ],
        variants: [
          { name: 'default', description: 'Standard card', props: {} },
          { name: 'elevated', description: 'Card with shadow', props: { elevation: 2 } },
        ],
        states: ['default', 'hover'],
        examples: ['Content Card', 'Profile Card', 'Info Card'],
      }
    );

    // Add feature-specific components based on requirements
    if (requirements.features?.some(f => f.toLowerCase().includes('auth') || f.toLowerCase().includes('login'))) {
      components.push({
        name: 'AuthForm',
        type: 'form',
        props: [
          { name: 'mode', type: 'string', required: true, description: 'Auth mode: login or signup' },
          { name: 'onSubmit', type: 'function', required: true, description: 'Form submit handler' },
        ],
        variants: [
          { name: 'login', description: 'Login form', props: { mode: 'login' } },
          { name: 'signup', description: 'Signup form', props: { mode: 'signup' } },
        ],
        states: ['default', 'loading', 'error', 'success'],
        examples: ['User Login', 'User Registration'],
      });
    }

    if (requirements.features?.some(f => f.toLowerCase().includes('dashboard'))) {
      components.push({
        name: 'DashboardWidget',
        type: 'container',
        props: [
          { name: 'title', type: 'string', required: true, description: 'Widget title' },
          { name: 'data', type: 'any', required: true, description: 'Widget data' },
          { name: 'type', type: 'string', required: false, defaultValue: 'chart', description: 'Widget type' },
        ],
        variants: [
          { name: 'chart', description: 'Chart widget', props: { type: 'chart' } },
          { name: 'stats', description: 'Statistics widget', props: { type: 'stats' } },
          { name: 'table', description: 'Table widget', props: { type: 'table' } },
        ],
        states: ['loading', 'loaded', 'error'],
        examples: ['Sales Chart', 'User Statistics', 'Recent Activity'],
      });
    }

    return components;
  }

  private createLayouts(requirements: ProjectRequirements): Layout[] {
    const layouts: Layout[] = [];

    // Main application layout
    layouts.push({
      name: 'AppLayout',
      description: 'Main application layout with header, content, and footer',
      type: 'flex',
      regions: [
        { name: 'header', position: 'top', size: 'auto', content: ['navigation', 'logo', 'user-menu'] },
        { name: 'main', position: 'center', size: '1fr', content: ['page-content'] },
        { name: 'footer', position: 'bottom', size: 'auto', content: ['copyright', 'links'] },
      ],
      responsive: true,
    });

    // Dashboard layout if needed
    if (requirements.features?.some(f => f.toLowerCase().includes('dashboard'))) {
      layouts.push({
        name: 'DashboardLayout',
        description: 'Dashboard layout with sidebar and main content',
        type: 'sidebar',
        regions: [
          { name: 'sidebar', position: 'left', size: '250px', content: ['navigation', 'menu'] },
          { name: 'main', position: 'center', size: '1fr', content: ['widgets', 'charts'] },
        ],
        responsive: true,
      });
    }

    // Grid layout for content
    layouts.push({
      name: 'GridLayout',
      description: 'Responsive grid layout for content',
      type: 'grid',
      regions: [
        { name: 'grid', position: 'center', size: '1fr', content: ['cards', 'items'] },
      ],
      responsive: true,
    });

    return layouts;
  }

  private defineStyleGuide(requirements: ProjectRequirements): StyleGuide {
    // Default to Tailwind for modern projects, can be configured
    const framework = requirements.framework?.toLowerCase() || '';
    
    let naming: StyleGuide['naming'] = 'Tailwind';
    let cssFramework = 'tailwindcss';
    
    if (framework.includes('styled') || framework.includes('emotion')) {
      naming = 'CSS-in-JS';
      cssFramework = 'styled-components';
    } else if (framework.includes('module')) {
      naming = 'Module CSS';
      cssFramework = undefined;
    }

    return {
      naming,
      cssFramework,
      conventions: [
        'Use semantic HTML elements',
        'Follow mobile-first approach',
        'Maintain consistent spacing using theme values',
        'Use design tokens for colors and typography',
        'Keep styles modular and reusable',
      ],
    };
  }

  private defineAccessibility(): AccessibilitySpec {
    return {
      wcagLevel: 'AA',
      features: [
        'Semantic HTML',
        'ARIA labels',
        'Keyboard navigation',
        'Focus indicators',
        'Color contrast compliance',
        'Screen reader optimization',
        'Skip to content links',
      ],
      ariaLabels: true,
      keyboardNavigation: true,
      screenReaderOptimized: true,
    };
  }
}
