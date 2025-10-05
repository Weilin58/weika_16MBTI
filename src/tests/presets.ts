export const testPresets = {
  ntp_a: {E:6, I:2, N:7, S:1, T:6, F:2, P:7, J:1, ESPlus:6, ESMinus:2, SAPlus:6, SAMinus:3, ICPlus:6, ICMinus:3, ST:6, SE:2, OP:7, CO:1},
  stj_a: {E:2, I:6, S:7, N:1, T:7, F:1, J:7, P:1, ESPlus:6, ESMinus:2, SAPlus:6, SAMinus:3, ICPlus:7, ICMinus:2, ST:1, SE:7, OP:1, CO:7},
  nfp_t: {E:2, I:6, N:7, S:1, T:1, F:7, P:7, J:1, ESPlus:2, ESMinus:6, SAPlus:4, SAMinus:4, ICPlus:3, ICMinus:5, ST:7, SE:1, OP:5, CO:5},
  entj_a: {E:6, I:2, N:6, S:3, T:6, F:3, J:6, P:3, ESPlus:6, ESMinus:2, SAPlus:5, SAMinus:3, ICPlus:5, ICMinus:3, ST:4, SE:6, OP:4, CO:6},
  intj_t: {E:2, I:6, N:6, S:3, T:6, F:3, J:6, P:3, ESPlus:4, ESMinus:4, SAPlus:4, SAMinus:4, ICPlus:4, ICMinus:4, ST:5, SE:5, OP:5, CO:5},
  isfp_a: {E:3, I:5, N:3, S:6, T:3, F:6, J:3, P:6, ESPlus:6, ESMinus:2, SAPlus:4, SAMinus:3, ICPlus:4, ICMinus:3, ST:5, SE:4, OP:4, CO:4},
  enfp_t: {E:6, I:2, N:6, S:3, T:3, F:6, J:3, P:6, ESPlus:3, ESMinus:6, SAPlus:4, SAMinus:4, ICPlus:4, ICMinus:4, ST:6, SE:4, OP:6, CO:3},
} as const;

export type TestPresetKey = keyof typeof testPresets;
export type TestPreset = typeof testPresets[TestPresetKey];
