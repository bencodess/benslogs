# Installation

```bash
npm install meowcaller-js
```

Or with yarn:

```bash
yarn add meowcaller-js
```

## Peer dependency

meowcaller-js requires Baileys as a peer dependency. If you don't already have it:

```bash
npm install @whiskeysockets/baileys
```

## Requirements

- **Node.js 20+** — uses `node:test`, `node:crypto`, `node:dgram` built-ins
- **ES Modules** — the package uses `"type": "module"`, so your project needs `"type": "module"` in `package.json` or files must use `.mjs` extension

## TypeScript

Type definitions are included at `types/index.d.ts`. No separate `@types` package needed.

```ts
import { Client, Call, CallPhase } from 'meowcaller-js';
```

The `typecheck` script runs `tsc --noEmit` against the bundled types:

```bash
npm run typecheck
```
