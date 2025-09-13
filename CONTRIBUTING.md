# Contributing to Easy Debug

Thank you for your interest in contributing to Easy Debug! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Ways to Contribute
- 🐛 **Bug Reports**: Found a bug? Please report it!
- ✨ **Feature Requests**: Have an idea? We'd love to hear it!
- 📝 **Documentation**: Help improve our docs
- 🧪 **Testing**: Help test new features and platforms
- 💻 **Code**: Submit pull requests for bug fixes and features

## 🚀 Getting Started

### Development Setup
1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/easy-debug.git
   cd easy-debug
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm start
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Scripts
```bash
npm start                   # Start in development mode
npm run dev                 # Start with nodemon
npm test                    # Run unit tests
npm run test:watch          # Watch mode testing
npm run webpack:watch       # Webpack development build
npm run analyze             # Performance analysis
```

## 📋 Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ conventions
- Add JSDoc comments for functions
- Use meaningful variable and function names
- Follow existing patterns in the codebase

### Commit Messages
Follow conventional commit format:
```
type(scope): description

Examples:
feat(terminal): add new terminal tab functionality
fix(ui): resolve button click issues
docs(readme): update installation instructions
test(commands): add unit tests for git commands
```

### Pull Request Process
1. **Update your fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new features
   - Ensure all tests pass
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm test
   npm run analyze
   ```

4. **Submit pull request**
   - Create a descriptive title
   - Explain what changes you made
   - Link related issues
   - Add screenshots for UI changes

## 🧪 Testing Guidelines

### Unit Tests
- Write tests for new functionality
- Update existing tests when modifying features
- Ensure >80% test coverage
- Use descriptive test names

### Cross-Platform Testing
Test on multiple platforms when possible:
- **Windows**: PowerShell and Command Prompt
- **macOS**: Terminal with zsh/bash
- **Linux**: Various distributions and shells

### Manual Testing Checklist
- [ ] App launches correctly
- [ ] All command buttons work
- [ ] Terminal integration functions
- [ ] Theme toggle works
- [ ] Project detection works
- [ ] Custom commands work
- [ ] Settings persist

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try the latest version
3. Reproduce the bug
4. Gather system information

### Bug Report Template
```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
Add screenshots if applicable.

**System Information**
- OS: [e.g. Windows 11]
- Node.js version: [e.g. 18.17.0]
- Electron version: [e.g. 28.0.0]
- Easy Debug version: [e.g. 1.0.0]

**Additional Context**
Any other relevant information.
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature you'd like.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How would you implement this?

**Alternatives**
Other solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples.
```

## 🏗️ Architecture Guidelines

### Project Structure
```
easy-debug/
├── main.js                 # Electron main process
├── renderer/               # Frontend application
│   ├── index.html         # Main UI
│   ├── styles/            # CSS styles
│   └── scripts/           # JavaScript logic
├── terminal/              # Terminal integration
├── tests/                 # Test suites
├── tools/                 # Development tools
└── docs/                  # Documentation
```

### Key Components
- **Main Process**: Electron main process with IPC handlers
- **Renderer Process**: Frontend UI and logic
- **Terminal Manager**: xterm.js integration
- **Command System**: Pluggable command architecture
- **Storage**: electron-store for settings persistence

### Adding New Features

#### New Command Types
1. Create command class in `renderer/scripts/commands/`
2. Add detection logic in `project-detector.js`
3. Add UI buttons in `index.html`
4. Add tests in `tests/commands/`

#### New UI Components
1. Add HTML structure in `index.html`
2. Add styles in `renderer/styles/main.css`
3. Add JavaScript logic in appropriate script file
4. Add event listeners and validation

## 🔒 Security Guidelines

### Security Considerations
- Never execute user input directly
- Validate all file paths
- Sanitize command arguments
- Use electron's security best practices
- Avoid `nodeIntegration: true`

### Reporting Security Issues
Email security issues privately rather than creating public issues.

## 📄 Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up to date
- Follow Markdown conventions

### Documentation Types
- **README.md**: Project overview and quick start
- **USER_GUIDE.md**: Comprehensive user instructions
- **CONTRIBUTING.md**: Contributor guidelines
- **API_REFERENCE.md**: Developer API documentation

## 🏷️ Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Release Checklist
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite
- [ ] Test on all platforms
- [ ] Create git tag
- [ ] Build distributables
- [ ] Create GitHub release

## 🎯 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Spam or off-topic discussions

## 📞 Getting Help

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussions
- **Documentation**: Check existing documentation first

### Questions?
- Read the documentation thoroughly
- Search existing issues
- Check GitHub Discussions
- Create a new issue with detailed information

## 🙏 Recognition

Contributors will be recognized in:
- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributor graphs and statistics

Thank you for contributing to Easy Debug! 🚀