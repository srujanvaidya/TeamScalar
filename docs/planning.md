# Shiva's Phased Implementation Plan

This document outlines the sequential phases for building Shiva's portion of the system.

## Phase 1: Shared Contracts & Models
- Establish Pydantic schemas in `src/contracts/schemas.py`.
- Ensure standard integration types like severity, sources, disruption event payload, and safeguard outputs are fully typed.

## Phase 2: Agent 1A — News/Semantic Event Parser
- Develop news parser logic using LLMs via the provider-agnostic interface.
- Implement structured output validation to guarantee incoming news articles map cleanly to `UnifiedDisruptionEvent`.

## Phase 3: Agent 1B — Weather/Environmental/Telemetry Agent
- Develop telemetry and weather parsing logic.
- Process alerts (sensor data, severe weather forecasts) and emit standardized `UnifiedDisruptionEvent` data.

## Phase 4: Agent 5 — Financial & Risk Safeguard
- Implement deterministic financial rules (delta cost limits, SLA checks, HazMat presence).
- Build the final evaluation matrix to tag plans as `AUTO_APPROVE` or `HUMAN_APPROVAL_REQUIRED`.
- Generate detailed explainable audit trail justifications.

## Phase 5: Testing
- Build validation tests for news/weather extraction.
- Implement comprehensive unit tests for Agent 5 financial threshold safeguards.

## Phase 6: Integration & Adapter Hooks
- Connect and test Shiva's modules with Agent 0 (Master Orchestrator) mock environments.

## Phase 7: Provider Abstraction
- Design a configurable adapter pattern to easily swap between local inference (Ollama/Transformers) and the Hugging Face API without changing the agent logic.
