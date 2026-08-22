# Git Flow Guidelines

## Branch Management
- **Shiva's Branch**: `feature/shiva-event-ingestion-risk`
- **Teammates' Branches**: Teammates work independently on their own feature branches (e.g. `feature/orchestrator-core`, `feature/graph-rl`).

## Integration Guidelines
- Develop and test all modules locally before merging into `main`.
- Only completed, fully tested (passing `pytest` checks) feature additions should be merged.
- Standardize on Pydantic contracts in the main codebase to prevent integration drift.
