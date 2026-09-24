# NEXUM

A private single-user knowledge and execution operating system.

**Capture everything useful. Connect what you learn. Turn knowledge into action.**

## System

NEXUM brings together:

- **Command Center** for daily execution and system pulse
- **Inbox** for rapid capture and later organization
- **Tasks** with priorities, schedules, recurring series, reminders, and timezones
- **Knowledge** for durable notes and learning
- **Research** for questions, evidence, sources, and insights
- **Content** for turning research into publishable work
- **Library** for documents, PDFs, extracted text, and document analysis
- **Semantic search** across the archive
- **AI assistant** for grounded questions, synthesis, connections, and next actions
- **Connections** for relationships between knowledge, research, content, projects, and files
- **Journal** for reflection and long-term pattern tracking
- **Private access** for a single-user deployment

Core loop:

**Capture → Organize → Research → Understand → Create → Act → Reflect → Learn → Capture again.**

## Deployment

NEXUM is designed for a private single-user deployment.

Configure the variables in `.env.example` with real deployment secrets. Keep real secrets and personal archive data out of GitHub.

Before first production use:

1. Provision PostgreSQL.
2. Run `prisma generate`.
3. Apply the Prisma schema with your deployment migration workflow.
4. Configure the OpenAI key/models if AI features are required.
5. Configure persistent storage for uploaded documents with `NEXUM_STORAGE_PATH` when local file storage is used.
6. Configure VAPID keys and `NEXUM_CRON_SECRET` for background push reminders.
7. Configure `NEXUM_ACCESS_TOKEN` as a long random secret.
8. Configure the scheduler for `/api/notifications/dispatch`.
9. Verify the private login flow and health endpoint.
10. Run an end-to-end smoke test before putting personal data into the system.

## Security

- Never commit `.env` files, API keys, VAPID private keys, access tokens, database credentials, or personal archive data.
- The health endpoint requires the access token even though its route remains publicly reachable through middleware.
- Background reminder dispatch requires the configured cron secret.
- Uploaded library files are private application data and should live on persistent protected storage in production.
