/**
 * @file edge-cases.ts
 * @description Edge cases: circular references, extreme nesting, size limits
 */

// Circular reference (self-referencing)
export interface TreeNode {
  value: string;
  left?: TreeNode;
  right?: TreeNode;
}

export interface LinkedListNode {
  data: number;
  next?: LinkedListNode;
}

// Mutual circular references
export interface Person {
  name: string;
  spouse?: Person;
  friends: Person[];
}

export interface GraphNode {
  id: string;
  neighbors: GraphNode[];
}

// Extreme nesting (50+ levels for depth limit testing)
export type DeepNest50 = {
  l1: { l2: { l3: { l4: { l5: {
    l6: { l7: { l8: { l9: { l10: {
      l11: { l12: { l13: { l14: { l15: {
        l16: { l17: { l18: { l19: { l20: {
          l21: { l22: { l23: { l24: { l25: {
            l26: { l27: { l28: { l29: { l30: {
              l31: { l32: { l33: { l34: { l35: {
                l36: { l37: { l38: { l39: { l40: {
                  l41: { l42: { l43: { l44: { l45: {
                    l46: { l47: { l48: { l49: { l50: {
                      value: string;
                    }}}}}
                  }}}}}
                }}}}}
              }}}}}
            }}}}}
          }}}}}
        }}}}}
      }}}}}
    }}}}}
  }}}}}
};

// Large object (100+ properties for size limit testing)
export interface LargeObject {
  prop1: string; prop2: string; prop3: string; prop4: string; prop5: string;
  prop6: string; prop7: string; prop8: string; prop9: string; prop10: string;
  prop11: string; prop12: string; prop13: string; prop14: string; prop15: string;
  prop16: string; prop17: string; prop18: string; prop19: string; prop20: string;
  prop21: string; prop22: string; prop23: string; prop24: string; prop25: string;
  prop26: string; prop27: string; prop28: string; prop29: string; prop30: string;
  prop31: string; prop32: string; prop33: string; prop34: string; prop35: string;
  prop36: string; prop37: string; prop38: string; prop39: string; prop40: string;
  prop41: string; prop42: string; prop43: string; prop44: string; prop45: string;
  prop46: string; prop47: string; prop48: string; prop49: string; prop50: string;
  prop51: string; prop52: string; prop53: string; prop54: string; prop55: string;
  prop56: string; prop57: string; prop58: string; prop59: string; prop60: string;
  prop61: string; prop62: string; prop63: string; prop64: string; prop65: string;
  prop66: string; prop67: string; prop68: string; prop69: string; prop70: string;
  prop71: string; prop72: string; prop73: string; prop74: string; prop75: string;
  prop76: string; prop77: string; prop78: string; prop79: string; prop80: string;
  prop81: string; prop82: string; prop83: string; prop84: string; prop85: string;
  prop86: string; prop87: string; prop88: string; prop89: string; prop90: string;
  prop91: string; prop92: string; prop93: string; prop94: string; prop95: string;
  prop96: string; prop97: string; prop98: string; prop99: string; prop100: string;
}

// Empty types
export type EmptyObject = Record<string, never>;
export type EmptyIntersection = string & Record<string, never>;

// Nullable and undefined unions
export type NullableString = string | null;
export type UndefinableNumber = number | undefined;
export type OptionalString = string | null | undefined;

// Any and unknown
export type AnyType = any;
export type UnknownType = unknown;

// Never type
export type NeverType = never;
