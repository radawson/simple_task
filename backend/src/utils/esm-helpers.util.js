// src/utils/esm-helpers.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const getDirname = (importMetaUrl) => dirname(fileURLToPath(importMetaUrl));
export const getFilename = (importMetaUrl) => fileURLToPath(importMetaUrl);