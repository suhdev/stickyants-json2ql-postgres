"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json2ql_1 = require("json2ql");
var util_1 = require("./util");
var Join = /** @class */ (function () {
    function Join() {
    }
    Join.prototype.toString = function () {
        var type = 'LEFT JOIN';
        switch (this.type) {
            case json2ql_1.JoinType.InnerJoin:
                type = 'INNER JOIN';
                break;
            case json2ql_1.JoinType.OuterJoin:
                type = 'OUTER JOIN';
                break;
            case json2ql_1.JoinType.RightJoin:
                type = 'RIGHT JOIN';
                break;
            default:
                type = 'LEFT JOIN';
                break;
        }
        var alias = this.toAlias ? "AS " + this.toAlias : '';
        return type + " " + this.to + " " + alias + " ON (" + this.on.map(function (e) { return e.getSqlStatement(); }, ' AND ') + ")";
    };
    Join.fromJson = function (json) {
        var j = new Join();
        j.on = json.on.map(function (e) { return SqlCondition.fromJson(e); });
        j.to = json.to;
        j.toAlias = json.alias;
        j.type = json.type;
        return j;
    };
    return Join;
}());
exports.Join = Join;
var SqlCondition = /** @class */ (function () {
    function SqlCondition() {
        this.$id = -1;
        this.flags = 0;
    }
    Object.defineProperty(SqlCondition.prototype, "id", {
        get: function () {
            if (this.$id === -1) {
                SqlCondition.id += 1;
                this.$id = SqlCondition.id + Math.floor(Math.random() * 1000);
            }
            return this.$id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SqlCondition.prototype, "isExact", {
        get: function () {
            return (this.flags & json2ql_1.SqlQueryFlags.EXACT) === json2ql_1.SqlQueryFlags.EXACT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SqlCondition.prototype, "isCaseSensitive", {
        get: function () {
            return (this.flags & json2ql_1.SqlQueryFlags.CASE_SENSETIVE) === json2ql_1.SqlQueryFlags.CASE_SENSETIVE;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SqlCondition.prototype, "isValueMagicParameter", {
        get: function () {
            return (this.flags &
                json2ql_1.SqlQueryFlags.USE_MAGIC_PARAMS) === json2ql_1.SqlQueryFlags.USE_MAGIC_PARAMS;
        },
        enumerable: true,
        configurable: true
    });
    SqlCondition.prototype.getArrayForValue = function (value) {
        return (value && value.map(function (e, i) { return i; })) || [];
    };
    SqlCondition.prototype.getSqlStatement = function () {
        var _this = this;
        switch (this.type) {
            case json2ql_1.SqlRefinerType.DateRange:
                var op = util_1.operatorToString(this.operator);
                return "(" + this.key + " " + op + " @" + this.key + this.id + "From AND @" + this.key + this.id + "To)";
            case json2ql_1.SqlRefinerType.Date:
            case json2ql_1.SqlRefinerType.DateTime:
                var opz = util_1.operatorToString(this.operator);
                return "(" + this.key + " " + opz + " @" + this.key + this.id + ")";
            case json2ql_1.SqlRefinerType.Selection:
                var sv = this.getArrayForValue(this.value);
                var o = util_1.operatorToString(this.operator);
                return "(" + this.key + " " + o + " (" + sv.map(function (_, i) { return "@" + _this.key + _this.id + i; }).join(', ') + "))";
            case json2ql_1.SqlRefinerType.Sort:
                var asc = this.value === 1 ? 'ASC' : 'DESC';
                return this.key + " " + asc;
            case json2ql_1.SqlRefinerType.Relation:
                var op2 = util_1.operatorToString(this.operator);
                return "(" + this.key + " " + op2 + " (" + this.relation.getSqlQuery(-1) + "))";
            case json2ql_1.SqlRefinerType.Any:
                // tslint:disable-next-line: max-line-length
                return "(" + this.key + " " + util_1.operatorToString(this.operator) + " ANY(" + this.relation.getSqlQuery(-1) + "))";
            case json2ql_1.SqlRefinerType.All:
                // tslint:disable-next-line: max-line-length
                return "(" + this.key + " " + util_1.operatorToString(this.operator) + " ALL(" + this.relation.getSqlQuery(-1) + "))";
            case json2ql_1.SqlRefinerType.Grouping:
                var groupOp = this.operator === json2ql_1.SqlOperator.OR ? ' OR ' : ' AND ';
                return this.refiners && this.refiners.length > 0 ?
                    "(" + this.refiners.map(function (e) { return e.getSqlStatement(); }).join(groupOp) + ")" : '';
            default:
                return "(" + this.defaultToString() + ")";
        }
    };
    SqlCondition.prototype.defaultToString = function () {
        var key = "@" + util_1.cleanKey(this.key) + this.id;
        if (this.isValueMagicParameter) {
            key = this.value;
        }
        switch (this.operator) {
            case json2ql_1.SqlOperator.NE:
                return this.key + " <> " + key;
            case json2ql_1.SqlOperator.GE:
                return this.key + " >= " + key;
            case json2ql_1.SqlOperator.NOT_IN:
                return this.key + " NOT IN (" + key + ")";
            case json2ql_1.SqlOperator.GT:
                return this.key + " > " + key;
            case json2ql_1.SqlOperator.LE:
                return this.key + " <= " + key;
            case json2ql_1.SqlOperator.LT:
                return this.key + " < " + key;
            case json2ql_1.SqlOperator.IS_NOT_NULL:
                return this.key + " IS NOT NULL";
            case json2ql_1.SqlOperator.IS_NULL:
                return this.key + " IS NULL";
            case json2ql_1.SqlOperator.LIKE:
            case json2ql_1.SqlOperator.SW:
            case json2ql_1.SqlOperator.EW:
                return this.key + " LIKE " + key;
            case json2ql_1.SqlOperator.IN:
                return this.key + " IN (" + key + ")";
            default:
                if (this.value === null) {
                    return this.key + " = NULL";
                }
                return this.key + " = " + key;
        }
    };
    SqlCondition.prototype.arrayToSqlParameter = function (arr) {
        var _this = this;
        return arr && arr.length ?
            arr.map(function (e, i) { return ({ key: "@" + util_1.cleanKey(_this.key) + _this.id + i, value: e }); }) : [];
    };
    SqlCondition.prototype.getParameters = function () {
        var list = [];
        if (this.isValueMagicParameter) {
            return list;
        }
        switch (this.type) {
            case json2ql_1.SqlRefinerType.Date:
            case json2ql_1.SqlRefinerType.DateTime:
                list.push({
                    key: "@" + util_1.cleanKey(this.key) + this.id,
                    value: typeof this.value === 'string' ? Date.parse(this.value) : new Date(this.value),
                });
                break;
            case json2ql_1.SqlRefinerType.DateRange:
                list.push({ key: "@" + util_1.cleanKey(this.key) + this.id + "From", value: this.value[0] });
                list.push({ key: "@" + util_1.cleanKey(this.key) + this.id + "To", value: this.value[1] });
                break;
            case json2ql_1.SqlRefinerType.Selection:
                list.push.apply(list, this.arrayToSqlParameter(this.value));
                break;
            case json2ql_1.SqlRefinerType.Relation:
                list.push.apply(list, this.relation.getParameters());
                break;
            case json2ql_1.SqlRefinerType.Grouping:
                list.push.apply(list, [].concat.apply([], this.refiners.map(function (v) { return v.getParameters(); })));
                break;
            default:
                if (this.value === null) {
                    break;
                }
                if (this.operator === json2ql_1.SqlOperator.LIKE) {
                    list.push({ key: "@" + util_1.cleanKey(this.key) + this.id, value: "" + this.value });
                }
                else {
                    list.push({ key: "@" + util_1.cleanKey(this.key) + this.id, value: this.value });
                }
                break;
        }
        return list;
    };
    SqlCondition.fromJson = function (json) {
        var c = new SqlCondition();
        c.key = json.key;
        c.flags = json.flags;
        c.operator = json.operator;
        c.type = json.type;
        c.value = json.value;
        c.as = json['as'];
        c.relation = json.relation && QueryModel.fromJson(json.relation);
        c.refiners = json.refiners && json.refiners.map(function (e) { return SqlCondition.fromJson(e); });
        return c;
    };
    SqlCondition.id = 1;
    return SqlCondition;
}());
exports.SqlCondition = SqlCondition;
var QueryModel = /** @class */ (function () {
    function QueryModel() {
    }
    Object.defineProperty(QueryModel.prototype, "isDistinct", {
        get: function () {
            return (json2ql_1.SqlModifier.Distinct & this.modifiers) === json2ql_1.SqlModifier.Distinct;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryModel.prototype, "entityName", {
        get: function () {
            return this.as ? this.as : this.table;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryModel.prototype, "entityIdentifier", {
        get: function () {
            return this.tableIdentifier ? this.tableIdentifier.trim() : 'Id';
        },
        enumerable: true,
        configurable: true
    });
    QueryModel.fromJson = function (json) {
        var m = new QueryModel();
        m.joins = json.joins && json.joins.map(function (e) { return Join.fromJson(e); });
        m.as = json.as;
        m.count = json.count;
        m.skip = json.skip;
        m.table = json.table;
        m.selection = json.selection;
        m.operator = json.operator;
        m.modifiers = json.modifiers;
        m.groupBy = json.groupBy;
        m.having = json.having && json.having.map(function (e) { return SqlCondition.fromJson(e); });
        m.refiners = json.refiners && json.refiners.map(function (e) { return SqlCondition.fromJson(e); });
        m.sorters = json.sorters && json.sorters.map(function (e) { return SqlCondition.fromJson(e); });
        m.with = json.with && json.with.map(function (e) { return QueryModel.fromJson(e); });
        return m;
    };
    QueryModel.prototype.getParameters = function () {
        var pr = [];
        if (this.refiners && this.refiners.length > 0) {
            pr.push.apply(pr, [].concat.apply([], this.refiners.map(function (e) { return e.getParameters(); })));
        }
        if (this.with && this.with.length > 0) {
            pr.push.apply(pr, [].concat.apply([], this.with.map(function (e) { return e.getParameters(); })));
        }
        if (this.joins && this.joins.length > 0) {
            pr.push.apply(pr, [].concat.apply([], this.joins.map(function (e) { return [].concat.apply([], e.on.map(function (v) { return v.getParameters(); })); })));
        }
        return pr;
    };
    QueryModel.prototype.getSqlQuery = function (count, skip, isWith) {
        if (count === void 0) { count = 10; }
        if (skip === void 0) { skip = 0; }
        if (isWith === void 0) { isWith = false; }
        var sb = '';
        var hb = '';
        var orderby = '';
        if (this.sorters != null) {
            var sorters = this.sorters.filter(function (ee) { return ee.type === json2ql_1.SqlRefinerType.Sort; });
            if (sorters.length > 0) {
                orderby = "ORDER BY " + sorters.map(function (e) { return e.getSqlStatement(); });
            }
        }
        var limit = "LIMIT " + count + " OFFSET " + skip;
        if (count === -1 || !orderby) {
            limit = '';
        }
        var sel = '*';
        if (this.selection && this.selection.length > 0) {
            sel = this.selection.join(', ');
        }
        var entityName = this.as && !isWith ? this.as : '';
        if (!isWith) {
            if (entityName) {
                entityName = " AS " + entityName;
            }
        }
        if (this.refiners && this.refiners.length > 0) {
            var op = this.operator === json2ql_1.SqlOperator.OR ? ' OR ' : ' AND ';
            sb += "(" + this.refiners.map(function (e) { return e.getSqlStatement(); }).join(op) + ")";
        }
        if (this.having && this.having.length > 0) {
            var op = this.operator === json2ql_1.SqlOperator.OR ? ' OR ' : ' AND ';
            hb += "(" + this.having.map(function (e) { return e.getSqlStatement(); }).join(op) + ")";
        }
        var join = this.joins && this.joins.length ?
            this.joins.map(function (e) { return e.toString(); }).join(' ') : '';
        var distinct = this.isDistinct ? ' DISTINCT ' : '';
        var where = this.refiners && this.refiners.length > 0 && sb !== '()' ? "WHERE " + sb + " " : '';
        var groupBy = this.groupBy && this.groupBy.length > 0 ?
            "GROUP BY " + this.groupBy.map(function (e) { return e; }).join(', ') + " " : '';
        var having = this.having && this.having.length > 0 ? "HAVING " + hb : '';
        var wwith = this.with && this.with.length ?
            // tslint:disable-next-line: max-line-length
            "WITH " + this.with.map(function (e) { return e.as + " AS (" + e.getSqlQuery(e.count, e.skip, true) + ")"; }).join(',') : '';
        // tslint:disable-next-line: max-line-length
        return wwith + " SELECT " + distinct + " " + sel + " FROM " + this.table + " " + join + " " + entityName + " " + where + " " + groupBy + " " + having + " " + orderby + " " + limit;
    };
    return QueryModel;
}());
exports.QueryModel = QueryModel;
function createQuery(model) {
    var params = model.getParameters();
    var map = params.reduce(function (prev, curr, i) {
        prev[curr.key] = "$" + (i + 1);
        return prev;
    }, {});
    return [
        model.getSqlQuery()
            .replace(/([^a-zA-Z0-9_])(@[a-zA-Z_][a-zA-Z0-9_]+)([^_a-zA-Z0-9])/g, function (_, prefix, key, postfix) { return "" + prefix + map[key] + postfix; }),
        params
    ];
}
exports.createQuery = createQuery;
