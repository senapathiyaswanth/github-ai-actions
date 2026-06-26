import { describe, it, expect } from "vitest";

import {
  formatScoreBar,
  formatSeverityBadge,
  formatFinding,
  formatFindings,
  formatScoreCard,
  formatReleaseNotes,
  escapeMarkdown,
  codeBlock,
  type Finding,
  type ScoreCard,
} from "../src/formatter.js";

const mockFinding: Finding = {
  severity: "high",
  category: "Security",
  title: "SQL Injection vulnerability",
  description: "User input is not sanitized before database query.",
  file: "src/db.ts",
  line: 42,
  suggestion: "Use parameterized queries",
  codeExample: "db.query('SELECT * FROM users WHERE id = ?', [userId])",
};

describe("formatScoreBar", () => {
  it("shows full bar for 100", () => {
    const result = formatScoreBar(100);
    expect(result).toContain("100/100");
    expect(result).toContain("✅");
  });

  it("shows warning for score < 70", () => {
    const result = formatScoreBar(65);
    expect(result).toContain("⚠️");
  });

  it("shows error for score < 40", () => {
    const result = formatScoreBar(30);
    expect(result).toContain("❌");
  });

  it("clamps values to 0-100", () => {
    expect(formatScoreBar(-10)).toContain("0/100");
    expect(formatScoreBar(150)).toContain("100/100");
  });
});

describe("formatSeverityBadge", () => {
  it("formats critical badge", () => {
    const result = formatSeverityBadge("critical");
    expect(result).toContain("🔴");
    expect(result).toContain("CRITICAL");
  });

  it("formats info badge", () => {
    const result = formatSeverityBadge("info");
    expect(result).toContain("⚪");
    expect(result).toContain("INFO");
  });
});

describe("formatFinding", () => {
  it("includes severity badge and title", () => {
    const result = formatFinding(mockFinding, 0);
    expect(result).toContain("HIGH");
    expect(result).toContain("SQL Injection vulnerability");
  });

  it("includes file and line", () => {
    const result = formatFinding(mockFinding, 0);
    expect(result).toContain("src/db.ts:42");
  });

  it("includes suggestion", () => {
    const result = formatFinding(mockFinding, 0);
    expect(result).toContain("parameterized queries");
  });

  it("includes code example in code block", () => {
    const result = formatFinding(mockFinding, 0);
    expect(result).toContain("```typescript");
  });

  it("uses 1-based index in heading", () => {
    const result = formatFinding(mockFinding, 0);
    expect(result).toContain("### 1.");
  });
});

describe("formatFindings", () => {
  it("returns no-issues message for empty findings", () => {
    const result = formatFindings([]);
    expect(result).toContain("No Issues Found");
  });

  it("groups findings by severity", () => {
    const findings: Finding[] = [
      { ...mockFinding, severity: "low", title: "Low Finding" },
      { ...mockFinding, severity: "critical", title: "Critical Finding" },
    ];
    const result = formatFindings(findings);
    // Critical should appear before Low
    const criticalPos = result.indexOf("CRITICAL");
    const lowPos = result.indexOf("LOW");
    expect(criticalPos).toBeLessThan(lowPos);
  });
});

describe("formatScoreCard", () => {
  const mockScoreCard: ScoreCard = {
    overall: 75,
    breakdown: {
      correctness: 80,
      security: 70,
      maintainability: 75,
      performance: 85,
      style: 65,
    },
    summary: "Good code with minor issues",
  };

  it("includes overall score", () => {
    const result = formatScoreCard(mockScoreCard);
    expect(result).toContain("75/100");
  });

  it("includes all breakdown dimensions", () => {
    const result = formatScoreCard(mockScoreCard);
    expect(result).toContain("Correctness");
    expect(result).toContain("Security");
    expect(result).toContain("Maintainability");
  });

  it("includes summary", () => {
    const result = formatScoreCard(mockScoreCard);
    expect(result).toContain("Good code with minor issues");
  });
});

describe("formatReleaseNotes", () => {
  it("formats version and date in header", () => {
    const result = formatReleaseNotes("1.0.0", "2026-01-01", { Features: ["New feature"] }, []);
    expect(result).toContain("Release 1.0.0");
    expect(result).toContain("2026-01-01");
  });

  it("includes breaking changes section when present", () => {
    const result = formatReleaseNotes("2.0.0", "2026-01-01", {}, ["Removed old API"]);
    expect(result).toContain("Breaking Changes");
    expect(result).toContain("Removed old API");
  });

  it("omits breaking changes when none", () => {
    const result = formatReleaseNotes("1.0.0", "2026-01-01", { Features: ["feat"] }, []);
    expect(result).not.toContain("Breaking Changes");
  });

  it("lists feature items as bullet points", () => {
    const result = formatReleaseNotes("1.0.0", "2026-01-01", { Features: ["feat A", "feat B"] }, []);
    expect(result).toContain("- feat A");
    expect(result).toContain("- feat B");
  });
});

describe("escapeMarkdown", () => {
  it("escapes asterisks", () => {
    expect(escapeMarkdown("**bold**")).toContain("\\*");
  });

  it("escapes backticks", () => {
    expect(escapeMarkdown("`code`")).toContain("\\`");
  });
});

describe("codeBlock", () => {
  it("wraps code in fenced block", () => {
    const result = codeBlock("const x = 1;", "typescript");
    expect(result).toBe("```typescript\nconst x = 1;\n```");
  });

  it("uses empty language by default", () => {
    const result = codeBlock("some code");
    expect(result).toContain("```\n");
  });
});
