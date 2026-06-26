# Git Push Checklist

> [!WARNING]
> These steps require explicit authentication to the GitHub remote repository. An authorized repository maintainer must execute these locally.

## 1. Verify Local State

Ensure you are on the `master` branch and have no uncommitted changes outside of the release prep:

```bash
git status
git pull origin master
```

## 2. Stage Changes

Add the newly created release documentation, updated `package.json`, and other certified files.

```bash
git add .
```

## 3. Semantic Commit

Commit the release changes using conventional commits:

```bash
git commit -m "chore(release): publish v1.0.0 🚀

- Add comprehensive documentation (MIGRATION, UPGRADE, INSTALLATION, COMPATIBILITY)
- Update GitHub Issue/PR templates and CODEOWNERS
- Enhance SECURITY.md with explicit secret scanning guidance
- Bump package versions to stable v1.0.0"
```

## 4. Tag the Release

Create a localized Git tag for the `v1.0.0` release:

```bash
git tag v1.0.0
```

## 5. Remote Verification

Double-check your remotes to ensure you're pushing to the correct repository:

```bash
git remote -v
```

## 6. Push to GitHub

Push the commit and the tags simultaneously.

```bash
git push origin master
git push origin v1.0.0
```

*Congratulations, the codebase is now ready for the GitHub UI Release publishing!*
