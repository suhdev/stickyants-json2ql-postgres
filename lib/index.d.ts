import { SqlOperator, SqlRefinerType, JoinType, ISqlRefiner, ISqlQuery } from 'json2ql';
import { ISqlJoin } from 'json2ql/lib/ISqlJoin';
export interface ISqlParameter {
    key: string;
    value: any;
}
export declare class Join {
    to: string;
    toAlias: string;
    on: SqlCondition[];
    type: JoinType;
    toString(): any;
    static fromJson(json: Partial<ISqlJoin>): Join;
}
export declare class SqlCondition {
    static id: number;
    $id: number;
    flags: number;
    as: string;
    type: SqlRefinerType;
    value: any;
    key: string;
    refiners: SqlCondition[];
    operator: SqlOperator;
    relation: QueryModel;
    readonly id: number;
    readonly isExact: boolean;
    readonly isCaseSensitive: boolean;
    readonly isValueMagicParameter: boolean;
    constructor();
    getArrayForValue(value: any[]): number[];
    getSqlStatement(): any;
    defaultToString(): string;
    arrayToSqlParameter(arr: any[]): {
        key: string;
        value: any;
    }[];
    getParameters(): ISqlParameter[];
    static fromJson(json: Partial<ISqlQuery & ISqlRefiner>): SqlCondition;
}
export declare class QueryModel {
    count: number;
    skip: number;
    joins: Join[];
    table: string;
    selection: string[];
    as: string;
    tableIdentifier: string;
    groupBy: string[];
    having: SqlCondition[];
    with: QueryModel[];
    refiners: SqlCondition[];
    sorters: SqlCondition[];
    operator: SqlOperator;
    modifiers: number;
    readonly isDistinct: boolean;
    readonly entityName: string;
    readonly entityIdentifier: string;
    static fromJson(json: Partial<ISqlQuery & ISqlRefiner>): QueryModel;
    getParameters(): ISqlParameter[];
    getSqlQuery(count?: number, skip?: number, isWith?: boolean): any;
}
export declare function createQuery(model: QueryModel): any[];
