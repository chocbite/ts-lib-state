export const OBJECT_READ_KEY = Symbol("state_object_read_key");

export type StateObjectRead<TYPE> = {
  [key: PropertyKey]: TYPE;
} & {
  [OBJECT_READ_KEY]?:
    | {
        type: "added";
        index: number;
        items: Readonly<{ [key: PropertyKey]: TYPE }>;
      }
    | {
        type: "removed";
        index: number;
        items: Readonly<{ [key: PropertyKey]: TYPE }>;
      }
    | {
        type: "changed";
        index: number;
        items: Readonly<{ [key: PropertyKey]: TYPE }>;
      }
    | {
        type: "fresh";
      };
};
export const OBJECT_WRITE_KEY = Symbol("state_object_write_key");

export type StateObjectWrite<TYPE> = {
  [key: PropertyKey]: TYPE;
} & {
  [OBJECT_WRITE_KEY]?:
    | {
        type: "add";
        items: { [key: PropertyKey]: TYPE };
      }
    | {
        type: "remove";
        items: readonly PropertyKey[];
      }
    | {
        type: "change";
        items: { [key: PropertyKey]: TYPE };
      };
};

export interface StateObjectMethods<T> {
  add(key: PropertyKey, value: T): void;
  remove(key: PropertyKey): void;
  change(key: PropertyKey, value: T): void;
}

export const OBJECT = {
  read_key: OBJECT_READ_KEY,
  write_key: OBJECT_WRITE_KEY,
};
