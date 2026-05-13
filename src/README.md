# Source Layout

```text
src/
├── core/          # App-wide infrastructure: auth, config, redis, mail, database providers
├── common/        # Generic reusable utilities: pipes, decorators, filters, types
├── integrations/  # External/internal service wrappers: Stripe, AWS, Firebase, APIs
├── modules/       # Domain-driven modules: user, account, payment, game, room, match
├── events/        # Domain event publishers/listeners and event payloads
├── commands/      # CLI jobs, CRON logic, workers, maintenance tasks
├── app.module.ts
└── main.ts
```

Prefer placing new business features under `modules/`. Use `core/` for application-wide infrastructure and `common/` only for reusable, domain-neutral helpers.
