export interface CodeQualityIssue {
  type: "security" | "performance" | "maintainability" | "accessibility" | "type-safety"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  line?: number
  column?: number
  rule: string
  fix?: string
}

export interface CodeQualityReport {
  issues: CodeQualityIssue[]
  score: number
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
}

export class CodeQualityValidator {
  private static securityPatterns = [
    {
      pattern: /eval\s*\(/g,
      message: "Use of eval() is dangerous and should be avoided",
      severity: "critical" as const,
      rule: "no-eval",
      fix: "Use safer alternatives like JSON.parse() or Function constructor with proper validation",
    },
    {
      pattern: /innerHTML\s*=/g,
      message: "Direct innerHTML assignment can lead to XSS vulnerabilities",
      severity: "high" as const,
      rule: "no-inner-html",
      fix: "Use textContent or sanitize HTML with DOMPurify",
    },
    {
      pattern: /document\.write\s*\(/g,
      message: "document.write is deprecated and can cause security issues",
      severity: "high" as const,
      rule: "no-document-write",
      fix: "Use modern DOM manipulation methods",
    },
    {
      pattern: /localStorage\.setItem\s*$$\s*[^,]+,\s*[^)]+$$/g,
      message: "Direct localStorage usage without error handling",
      severity: "medium" as const,
      rule: "safe-local-storage",
      fix: "Use SecurityUtils.safeLocalStorage wrapper",
    },
  ]

  private static performancePatterns = [
    {
      pattern: /setInterval\s*\(/g,
      message: "Unmanaged setInterval can cause memory leaks",
      severity: "medium" as const,
      rule: "managed-intervals",
      fix: "Use PerformanceUtils.createManagedInterval()",
    },
    {
      pattern: /while\s*$$\s*true\s*$$/g,
      message: "Infinite loops can freeze the application",
      severity: "critical" as const,
      rule: "no-infinite-loops",
      fix: "Add proper exit conditions",
    },
    {
      pattern: /for\s*$$[^)]*;\s*;\s*[^)]*$$/g,
      message: "Infinite for loop detected",
      severity: "critical" as const,
      rule: "no-infinite-for-loops",
      fix: "Add proper loop conditions",
    },
  ]

  private static typePatterns = [
    {
      pattern: /:\s*any\b/g,
      message: 'Use of "any" type reduces type safety',
      severity: "medium" as const,
      rule: "no-any-type",
      fix: "Use specific types or generic constraints",
    },
    {
      pattern: /@ts-ignore/g,
      message: "TypeScript ignore comments should be avoided",
      severity: "medium" as const,
      rule: "no-ts-ignore",
      fix: "Fix the underlying type issue instead",
    },
    {
      pattern: /as\s+any\b/g,
      message: 'Type assertion to "any" defeats type checking',
      severity: "medium" as const,
      rule: "no-any-assertion",
      fix: "Use proper type assertions or type guards",
    },
  ]

  private static maintainabilityPatterns = [
    {
      pattern: /console\.log\s*\(/g,
      message: "Console.log statements should be removed in production",
      severity: "low" as const,
      rule: "no-console-log",
      fix: "Use proper logging library or remove debug statements",
    },
    {
      pattern: /alert\s*\(/g,
      message: "Alert dialogs provide poor user experience",
      severity: "medium" as const,
      rule: "no-alert",
      fix: "Use toast notifications or modal dialogs",
    },
    {
      pattern: /TODO|FIXME|HACK|XXX/g,
      message: "TODO/FIXME comments indicate incomplete code",
      severity: "low" as const,
      rule: "no-todo-comments",
      fix: "Complete the implementation or create proper tickets",
    },
  ]

  static validateCode(code: string, filename?: string): CodeQualityReport {
    const issues: CodeQualityIssue[] = []
    const lines = code.split("\n")

    // Check security patterns
    this.checkPatterns(code, lines, this.securityPatterns, "security", issues)

    // Check performance patterns
    this.checkPatterns(code, lines, this.performancePatterns, "performance", issues)

    // Check type safety patterns
    this.checkPatterns(code, lines, this.typePatterns, "type-safety", issues)

    // Check maintainability patterns
    this.checkPatterns(code, lines, this.maintainabilityPatterns, "maintainability", issues)

    // Calculate score
    const score = this.calculateScore(issues)

    // Generate summary
    const summary = this.generateSummary(issues)

    return {
      issues,
      score,
      summary,
    }
  }

  private static checkPatterns(
    code: string,
    lines: string[],
    patterns: any[],
    type: CodeQualityIssue["type"],
    issues: CodeQualityIssue[],
  ): void {
    patterns.forEach(({ pattern, message, severity, rule, fix }) => {
      let match
      while ((match = pattern.exec(code)) !== null) {
        const lineNumber = this.getLineNumber(code, match.index)
        const column = this.getColumnNumber(code, match.index)

        issues.push({
          type,
          severity,
          message,
          line: lineNumber,
          column,
          rule,
          fix,
        })
      }
    })
  }

  private static getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split("\n").length
  }

  private static getColumnNumber(code: string, index: number): number {
    const lines = code.substring(0, index).split("\n")
    return lines[lines.length - 1].length + 1
  }

  private static calculateScore(issues: CodeQualityIssue[]): number {
    const weights = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
    }

    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + weights[issue.severity]
    }, 0)

    // Start with 100 and subtract penalties
    const score = Math.max(0, 100 - totalPenalty)
    return Math.round(score)
  }

  private static generateSummary(issues: CodeQualityIssue[]) {
    const summary = {
      total: issues.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    issues.forEach((issue) => {
      summary[issue.severity]++
    })

    return summary
  }

  static generateReport(report: CodeQualityReport): string {
    const { issues, score, summary } = report

    let output = `Code Quality Report\n`
    output += `==================\n\n`
    output += `Overall Score: ${score}/100\n\n`
    output += `Issues Summary:\n`
    output += `- Total: ${summary.total}\n`
    output += `- Critical: ${summary.critical}\n`
    output += `- High: ${summary.high}\n`
    output += `- Medium: ${summary.medium}\n`
    output += `- Low: ${summary.low}\n\n`

    if (issues.length > 0) {
      output += `Detailed Issues:\n`
      output += `================\n\n`

      issues.forEach((issue, index) => {
        output += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`
        if (issue.line) {
          output += `   Location: Line ${issue.line}${issue.column ? `, Column ${issue.column}` : ""}\n`
        }
        output += `   Rule: ${issue.rule}\n`
        if (issue.fix) {
          output += `   Fix: ${issue.fix}\n`
        }
        output += `\n`
      })
    }

    return output
  }
}
