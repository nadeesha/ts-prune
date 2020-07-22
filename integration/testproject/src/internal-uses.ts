// See https://github.com/nadeesha/ts-prune/issues/38

// This is exported but never imported.
// However, it is used in this file, so it's not dead code.
export const usedInThisFile = {};

export const thisOneIsUnused = {...usedInThisFile};

export interface UsedInThisFile {}

export interface Unused extends UsedInThisFile {}
