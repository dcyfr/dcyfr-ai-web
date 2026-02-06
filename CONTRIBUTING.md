# Contributing to @dcyfr/ai-web

## Development Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Server Components by default
- Zod validation for all API inputs
- Services layer for database access

## Testing

```bash
npm run test:run        # Run all tests
npm run test            # Watch mode
npm run test:coverage   # Coverage report
```

All changes must maintain 100% test pass rate.

## Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run typecheck && npm run test:run`
4. Submit PR with clear description
