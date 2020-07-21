// See https://github.com/nadeesha/ts-prune/issues/38

export const usedInThisFile = {};

// ts-prune-ignore-next
export const usedInAnotherFile = {...usedInThisFile};
