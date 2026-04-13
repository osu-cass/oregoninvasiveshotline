# Important rules/notes

- Do not run python tests unless explicitly instructed to by the user
- Entire project is greenfield, ok to change whatever
- Do not have multiple react components in the same file
- Comments should be short and to the point, but should generally have a capitol letter at the start and end with a period
- While much of this project is unfortunately untyped, new code should include types (but don't be overly verbose)
- This project uses the react compiler, be aware of this and do not add uneeded useMemos/useCallbacks

## Documentation Conventions

Use concise summary documentation for all new or changed functions and methods.

For Python code, follow PEP 257: https://peps.python.org/pep-0257/. By default, prefer short summary docstrings. Add `Args` and `Returns` sections only when they improve clarity. In typed Python code, avoid repeating type information that is already obvious from annotations unless the extra detail is genuinely useful.

For TypeScript/JavaScript code, use TypeScript-supported JSDoc tags: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html. For React components with typed props, document prop fields on the props interface or type. Avoid duplicating the same prop descriptions in both props interfaces and function-level `@param` docs. Use function-level `@param` docs for non-prop parameters when they help readability.
