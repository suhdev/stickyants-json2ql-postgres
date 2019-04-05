"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json2ql_1 = require("json2ql");
function operatorToString(op) {
    if (op === json2ql_1.SqlOperator.AND) {
        return 'AND';
    }
    return 'OR';
}
exports.operatorToString = operatorToString;
function cleanKey(key) {
    return key.replace('[', '')
        .replace(']', '')
        .replace('.', '');
}
exports.cleanKey = cleanKey;
