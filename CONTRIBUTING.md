# Contributing to Vertex Lab

Thank you for your interest in contributing to Vertex Lab! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/vertex-lab-app.git
   cd vertex-lab-app
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm test
   npm run test:e2e
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Making Changes

1. Create a new branch from `main`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Run linter: `npm run lint`
6. Commit with clear messages

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(canvas): add triangle node shape

fix(plugins): prevent duplicate plugin IDs from crashing

docs(readme): update keyboard shortcuts section

test(canvas): add pinch-to-zoom test coverage
```

### Pull Requests

1. Push your branch to your fork
2. Open a PR against `main` branch
3. Fill out the PR template (if provided)
4. Link related issues
5. Wait for review

**PR Title Format:**
```
[Type] Brief description of changes
```

**PR Description Should Include:**
- What changed and why
- Screenshots/GIFs for UI changes
- Testing instructions
- Breaking changes (if any)

## Code Standards

### JavaScript/React

- Use functional components with hooks
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Keep components small and focused

**Example:**
```javascript
/**
 * Calculates the bounding box for a set of nodes
 * @param {Array<Node>} nodes - Array of node objects
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
function calculateBounds(nodes) {
  // implementation
}
```

### File Organization

- Components: `src/components/`
- Utilities: `src/utils/`
- Hooks: `src/hooks/`
- Plugins: `src/plugins/core/` or `src/plugins/examples/`
- Tests: Co-locate with source or in `src/__tests__/`

### Testing Requirements

**Unit Tests:**
- Test utilities and pure functions thoroughly
- Mock external dependencies
- Test edge cases and error conditions

**Component Tests:**
- Test user interactions
- Verify rendering with different props
- Test accessibility (screen readers, keyboard navigation)

**E2E Tests:**
- Add for critical user flows
- Test on mobile profiles when relevant
- Keep tests fast and focused

## Plugin Development

### Creating a Plugin

1. Create file in `src/plugins/examples/yourPlugin.jsx`
2. Follow plugin spec (`doc/PLUGIN_SPEC.md`)
3. Add tests in `src/__tests__/plugins/YourPlugin.test.jsx`
4. Document in plugin's `aboutPage`

**Plugin Checklist:**
- [ ] Unique ID (reverse-DNS format)
- [ ] Name, description, version, author
- [ ] Error handling in all callbacks
- [ ] Accessibility (keyboard, screen readers)
- [ ] Mobile-friendly (touch targets ≥44px)
- [ ] i18n strings for user-facing text
- [ ] Tests for visibility predicates and render
- [ ] Documentation in `aboutPage`

### Plugin Best Practices

- Use `api.plugin.log()` for debugging
- Persist settings in localStorage with unique prefix
- Handle missing API fields gracefully (feature detection)
- Keep panels width ~320px, avoid overlapping global UI
- Test with plugin enabled/disabled
- Verify error boundary isolation

## Internationalization (i18n)

### Adding Translations

1. Add key to all locale files:
   - `src/i18n/locales/en.json`
   - `src/i18n/locales/zh-CN.json`
   - `src/i18n/locales/es.json`

2. Use in JSX:
   ```javascript
   <FormattedMessage id="your.key" defaultMessage="Default Text" />
   ```

3. Use in JavaScript:
   ```javascript
   const intl = useIntl();
   const text = intl.formatMessage({ id: 'your.key' });
   ```

**Translation Guidelines:**
- Keep keys organized by feature/component
- Provide default message for fallback
- Avoid hardcoded strings in code
- Test with different locales

## Accessibility

### Requirements

- Keyboard navigation for all interactive elements
- ARIA labels for icon buttons
- Focus indicators visible
- Color contrast ratio ≥4.5:1
- Screen reader friendly
- Mobile touch targets ≥44px

### Testing Accessibility

```bash
# Manual testing
- Tab through all interactive elements
- Use screen reader (VoiceOver, NVDA)
- Test with keyboard only (no mouse)
- Verify focus indicators

# Automated tools
npm run test  # includes jest-axe checks
```

## Performance

### Guidelines

- Minimize re-renders with `useMemo`/`useCallback`
- Debounce expensive operations (layout, search)
- Lazy-load heavy dependencies
- Optimize canvas drawing (batch operations)
- Profile with React DevTools

### Canvas Performance

- Avoid redrawing entire canvas on every state change
- Use custom 'redraw' event to trigger canvas updates
- Filter visible nodes before drawing
- Cache expensive calculations

## Documentation

### When to Update Docs

- New features → Update README.md and relevant doc/
- API changes → Update doc/PLUGIN_SPEC.md
- Breaking changes → Update CHANGELOG.md and migration guide
- Bug fixes → Add to CHANGELOG.md Unreleased section

### Documentation Style

- Use clear, concise language
- Provide code examples
- Include screenshots for UI features
- Link to related documentation

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, browser, Node version)
- Screenshots/console errors

### Feature Requests

Include:
- Use case and motivation
- Proposed API/UI design
- Alternative solutions considered
- Willingness to contribute implementation

## Code Review

### As a Reviewer

- Be respectful and constructive
- Ask questions rather than make demands
- Praise good solutions
- Test changes locally when possible
- Approve if looks good, request changes if needed

### As an Author

- Respond to all comments
- Ask for clarification if unclear
- Make requested changes or explain why not
- Mark conversations as resolved
- Be patient and open to feedback

## Release Process

Maintainers handle releases:

1. Update CHANGELOG.md
2. Bump version in package.json
3. Create git tag: `v0.2.0`
4. Push tag: `git push origin v0.2.0`
5. Create GitHub release with notes

## Community

- Be respectful and inclusive
- Follow code of conduct
- Help others in discussions/issues
- Share your plugins and creations

## Questions?

- Check existing issues/discussions
- Read documentation in `doc/`
- Ask in GitHub Discussions
- Open an issue if stuck

Thank you for contributing! 🎉
