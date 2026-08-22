# Architectural Decisions Log

## 1. Contract-First Architecture
- **Decision**: All agents will be designed starting from strict interface contracts.
- **Rationale**: In a fast-paced 15-hour hackathon, contract-first design prevents teammate integration issues and allows parallel mock testing.

## 2. Canonical Schema Engine (Pydantic)
- **Decision**: Use Pydantic as the canonical serialization and validation engine for internal data models.
- **Rationale**: Out-of-the-box validation, type safety, and direct conversion to/from JSON.

## 3. Unified Event Format
- **Decision**: Agent 1A (News) and Agent 1B (Weather/Telemetry) must emit a common `UnifiedDisruptionEvent` model.
- **Rationale**: Agent 0 (Master Orchestrator) should handle a single unified ingestion contract regardless of the source type.

## 4. Deterministic Safeguards
- **Decision**: Agent 5 uses deterministic validation logic for financial bounds, HazMat, and SLAs.
- **Rationale**: LLMs are non-deterministic and can fail or hallucinate on quantitative constraints. Using rules guarantees correctness.

## 5. LLM Role Boundaries
- **Decision**: LLMs may be used for semantic parsing, classification, and generating narrative audit trails, but they cannot override safety rules or thresholds.
- **Rationale**: Maintains auditability and guarantees system safety.

## 6. Abstracted Model Providers
- **Decision**: The model provider layer must abstract Hugging Face API and local inference.
- **Rationale**: Allows offline development/demo fallback and easy model upgrades without rewriting agents.
