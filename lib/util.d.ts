import { SqlOperator } from 'json2ql';
export declare function operatorToString(op: SqlOperator): "AND" | "NOT_IN" | "IN" | "BETWEEN" | "<>" | "<=" | ">=" | "<" | ">" | "LIKE" | "NOT LIKE" | "IS" | "IS NOT" | "OR" | "=";
export declare function cleanKey(key: string): string;
