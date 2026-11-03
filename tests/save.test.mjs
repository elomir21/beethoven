import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerSaveCases } from './cases/saveCases.mjs';
registerSaveCases(test, assert);
