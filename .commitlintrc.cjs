// @ts-check
/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "security",
      ],
    ],
    "scope-case": [2, "always", "kebab-case"],
    "subject-case": [2, "always", ["sentence-case", "lower-case"]],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
    "footer-max-line-length": [2, "always", 200],
  },
  prompt: {
    questions: {
      type: {
        description: "Select the type of change you are committing",
        enum: {
          feat: { description: "A new feature", title: "Features", emoji: "✨" },
          fix: { description: "A bug fix", title: "Bug Fixes", emoji: "🐛" },
          docs: { description: "Documentation only changes", title: "Documentation", emoji: "📝" },
          style: {
            description: "Changes that do not affect the meaning of the code",
            title: "Styles",
            emoji: "💎",
          },
          refactor: {
            description: "A code change that neither fixes a bug nor adds a feature",
            title: "Code Refactoring",
            emoji: "📦",
          },
          perf: {
            description: "A code change that improves performance",
            title: "Performance Improvements",
            emoji: "🚀",
          },
          test: {
            description: "Adding missing tests or correcting existing tests",
            title: "Tests",
            emoji: "🚨",
          },
          build: {
            description: "Changes that affect the build system or external dependencies",
            title: "Builds",
            emoji: "🛠",
          },
          ci: {
            description: "Changes to CI configuration files and scripts",
            title: "Continuous Integrations",
            emoji: "⚙️",
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: "Chores",
            emoji: "♻️",
          },
          revert: {
            description: "Reverts a previous commit",
            title: "Reverts",
            emoji: "🗑",
          },
          security: {
            description: "Security fixes or improvements",
            title: "Security",
            emoji: "🔒",
          },
        },
      },
    },
  },
};

module.exports = config;
