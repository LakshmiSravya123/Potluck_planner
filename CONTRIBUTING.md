# Contributing to Potluck Planner

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs 🐛

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/potluckplanner/issues)
2. If not, create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS info
   - Screenshots if applicable

### Suggesting Features 💡

1. Check [Issues](https://github.com/yourusername/potluckplanner/issues) for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Why it would be useful
   - How it might work

### Submitting Code 🔧

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/potluckplanner.git
   cd potluckplanner
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**
5. **Test thoroughly**:
   - Test on Chrome, Firefox, Safari
   - Test on mobile devices
   - Test real-time sync with multiple tabs
6. **Commit** with clear messages:
   ```bash
   git commit -m "Add: feature description"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

## Code Style

### HTML
- Use semantic HTML5 elements
- Indent with 4 spaces
- Use descriptive IDs and classes

### CSS
- Follow existing naming conventions
- Use CSS variables for colors
- Keep selectors specific but not overly nested
- Add comments for complex sections

### JavaScript
- Use ES6+ features
- Use `const` and `let`, not `var`
- Add comments for complex logic
- Keep functions small and focused
- Handle errors gracefully

### Example:
```javascript
// Good
function createDishCard(dish) {
    const isOwner = dish.contributor === currentUserName;
    // ... rest of function
}

// Avoid
function createDishCard(d) {
    var x = d.contributor === currentUserName;
    // ... rest of function
}
```

## Testing Checklist

Before submitting a PR, verify:

- [ ] Code works in Chrome, Firefox, Safari
- [ ] Mobile responsive (test on phone or dev tools)
- [ ] No console errors
- [ ] Real-time sync works (test with 2+ tabs)
- [ ] All existing features still work
- [ ] Code follows style guidelines
- [ ] Comments added for complex code

## Areas for Contribution

### Easy (Good First Issues)
- UI improvements
- Additional color themes
- More dish categories
- Better error messages
- Accessibility improvements

### Medium
- Event details (date, time, location)
- Dietary restriction tags
- Print-friendly view
- Export to PDF

### Advanced
- User authentication
- Email notifications
- Photo uploads
- Recipe links
- Advanced security rules

## Questions?

Feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Potluck Planner better! 🙏
