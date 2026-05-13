## Important rules/notes

- Do not run python tests unless explicitly instructed to by the user, or you are actively editing the tests
- Do not have multiple react components in the same file
- Comments should be short and to the point, but should generally have a capitol letter at the start and end with a period
- While much of this project is unfortunately untyped, new code should include types (but don't be overly verbose)
- This project uses the react compiler, be aware of this and do not add uneeded useMemos/useCallbacks

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Project Information

This project uses django and react. The react code is in `frontend/`. The django code is in `oregoninvasiveshotline/`.

## Documentation Conventions

Use concise summary documentation for all new or changed functions and methods.

For Python code, follow PEP 257: https://peps.python.org/pep-0257/. By default, prefer short summary docstrings. Add `Args` and `Returns` sections only when they improve clarity. In typed Python code, avoid repeating type information that is already obvious from annotations unless the extra detail is genuinely useful.

For TypeScript/JavaScript code, use TypeScript-supported JSDoc tags: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html. For React components with typed props, document prop fields on the props interface or type. Avoid duplicating the same prop descriptions in both props interfaces and function-level `@param` docs. Use function-level `@param` docs for non-prop parameters when they help readability.
