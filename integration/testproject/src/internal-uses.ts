// See https://github.com/nadeesha/ts-prune/issues/38

// This is exported but never imported.
// However, it is used in this file, so it's not dead code.
export const usedInThisFile = {};

// ts-prune-ignore-next
export const usedInAnotherFile = {...usedInThisFile};
