# Contributing to AgentTrust

Thanks for your interest in contributing to AgentTrust! This guide will help you get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install dependencies** for the component you're working on:
   - Contracts: `rustup target add wasm32v1-none`
   - Frontend: `cd frontend && npm install`
   - SDK: `cd sdk && npm install`

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes and ensure they pass all checks:
   ```bash
   # Contracts
   cargo test --workspace
   cargo build --release --target wasm32v1-none

   # Frontend
   cd frontend && npm run lint && npm run type-check

   # SDK
   cd sdk && npm run build
   ```

3. Commit your changes with a clear message describing what and why.

4. Push to your fork and open a Pull Request against `main`.

## What to Work On

- **Bug fixes**: Check open issues labeled `bug`
- **Features**: Look for issues labeled `enhancement`
- **Docs**: Improvements to documentation are always welcome
- **Tests**: Additional test coverage for contracts or frontend

## Code Style

- **Rust**: Follow standard Rust conventions. All contracts use `#![no_std]`.
- **TypeScript**: ESLint and Prettier are configured in the frontend and SDK.
- **Commits**: Use clear, descriptive commit messages. Focus on the "why" not the "what".

## Contract Development Notes

- All amounts are in **stroops** (1 XLM = 10,000,000 stroops)
- Trust scores use **basis points** (0-10,000)
- Contracts reference each other by ID; see `scripts/initialize.sh` for linking order
- Run `cargo test --workspace` from the repo root to test all contracts

## Questions?

Open an issue on GitHub if you have questions or need help getting started.
