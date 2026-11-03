import { it } from 'vitest';
import assert from 'node:assert/strict';
import { registerSaveCases } from '../cases/saveCases.mjs';
registerSaveCases(it, assert);
