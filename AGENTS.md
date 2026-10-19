# AGENTS.md

Frontend of Voice Office Booking: employees book office desks on an SVG map or by voice. It talks to the backend API at `/api/v1` from the `OPractica/backend` repository. The stack isn't chosen yet. When it is, add the install, run, lint and test commands here.

## Read when relevant

- Branches, commit messages, pull requests, CI checks: `CONTRIBUTING.md`
- What to build and when it's done: the GitHub issue, `gh issue view <number>`
- Available endpoints and their data: the backend's `/docs` page (FastAPI Swagger)

## Never

- Never push to `main` or `release`, force-push, or merge pull requests. Work in a task branch and open a pull request, as described in `CONTRIBUTING.md`.
- Never commit or print secrets. Don't read `.env` values into the chat or logs. Never commit `node_modules`, build output or other generated files.
- Never change `.github/`, `CONTRIBUTING.md`, `AGENTS.md` or repository settings unless the task is about them. Never turn off a lint rule or a CI check to make CI pass. Fix the code instead.
- Never add `Co-Authored-By` trailers or "Generated with" lines to commits or pull requests.

## Use your judgment

- Stay inside the task. If you notice something else worth fixing, mention it instead of fixing it in the same pull request.
- Read the nearby code first and write in the same style. A small change to an existing file beats a new layer or abstraction.
- Don't invent API endpoints or fields. Check the backend docs, and ask if what you need doesn't exist yet.
- Ask before big or shared changes: a new dependency, a new library for state or styling, or rewriting someone else's code.
- Before you say the work is done, run the lint and the related tests, and say plainly what you didn't check.
