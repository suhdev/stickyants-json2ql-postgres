"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json2ql_1 = require("json2ql");
function operatorToString(op) {
    switch (op) {
        case json2ql_1.SqlOperator.AND:
            return 'AND';
        case json2ql_1.SqlOperator.NOT_IN:
            return 'NOT_IN';
        case json2ql_1.SqlOperator.IN:
            return 'IN';
        case json2ql_1.SqlOperator.BETWEEN:
            return 'BETWEEN';
        case json2ql_1.SqlOperator.NE:
            return '<>';
        case json2ql_1.SqlOperator.LE:
            return '<=';
        case json2ql_1.SqlOperator.GE:
            return '>=';
        case json2ql_1.SqlOperator.LT:
            return '<';
        case json2ql_1.SqlOperator.GT:
            return '>';
        case json2ql_1.SqlOperator.LIKE:
            return 'LIKE';
        case json2ql_1.SqlOperator.NOT_LIKE:
            return 'NOT LIKE';
        case json2ql_1.SqlOperator.IS_NULL:
            return 'IS';
        case json2ql_1.SqlOperator.IS_NOT_NULL:
            return 'IS NOT';
        case json2ql_1.SqlOperator.OR:
            return 'OR';
        case json2ql_1.SqlOperator.EQ:
            return '=';
    }
    return '=';
}
exports.operatorToString = operatorToString;
function cleanKey(key) {
    return key.replace('[', '')
        .replace(']', '')
        .replace('.', '');
}
exports.cleanKey = cleanKey;
