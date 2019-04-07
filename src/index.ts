import {
  SqlOperator, SqlQueryFlags,
  SqlRefinerType, JoinType,
  ISqlRefiner, ISqlQuery, SqlModifier,
} from 'json2ql';
import { cleanKey, operatorToString } from './util';
import { ISqlJoin } from 'json2ql/lib/ISqlJoin';

export interface ISqlParameter {
  key: string;
  value: any;
}

export class Join {
  to: string;
  toAlias: string;
  on: SqlCondition[];
  type: JoinType;

  toString() {
    let type = 'LEFT JOIN';
    switch (this.type) {
      case JoinType.InnerJoin:
        type = 'INNER JOIN';
        break;
      case JoinType.OuterJoin:
        type = 'OUTER JOIN';
        break;
      case JoinType.RightJoin:
        type = 'RIGHT JOIN';
        break;
      default:
        type = 'LEFT JOIN';
        break;
    }

    const alias = this.toAlias ? `AS ${this.toAlias}` : '';

    return `${type} ${this.to} ${alias} ON (${this.on.map(e => e.getSqlStatement(), ' AND ')})`;
  }

  static fromJson(json: Partial<ISqlJoin>) {
    const j = new Join();
    j.on = json.on.map(e => SqlCondition.fromJson(e));
    j.to = json.to;
    j.toAlias = json.alias;
    j.type = json.type;
    return j;
  }
}

export class SqlCondition {
  static id: number = 1;
  $id: number = -1;
  flags: number;
  as: string;
  type: SqlRefinerType;
  value: any;
  key: string;
  refiners: SqlCondition[];
  operator: SqlOperator;
  relation: QueryModel;
  get id() {
    if (this.$id === -1) {
      SqlCondition.id += 1;
      this.$id = SqlCondition.id + Math.floor(Math.random() * 1000);
    }
    return this.$id;
  }

  get isExact() {
    return (this.flags & SqlQueryFlags.EXACT) === SqlQueryFlags.EXACT;
  }

  get isCaseSensitive() {
    return (this.flags & SqlQueryFlags.CASE_SENSETIVE) === SqlQueryFlags.CASE_SENSETIVE;
  }

  get isValueMagicParameter() {
    return (this.flags &
      SqlQueryFlags.USE_MAGIC_PARAMS) === SqlQueryFlags.USE_MAGIC_PARAMS;
  }

  constructor() {
    this.flags = 0;
  }

  getArrayForValue(value: any[]) {
    return (value && value.map((e, i) => i)) || [];
  }

  getSqlStatement() {
    switch (this.type) {
      case SqlRefinerType.DateRange:
        const op = operatorToString(this.operator);
        return `(${this.key} ${op} @${this.key}${this.id}From AND @${this.key}${this.id}To)`;
      case SqlRefinerType.Date:
      case SqlRefinerType.DateTime:
        const opz = operatorToString(this.operator);
        return `(${this.key} ${opz} @${this.key}${this.id})`;
      case SqlRefinerType.Selection:
        const sv = this.getArrayForValue(this.value);
        const o = operatorToString(this.operator);
        return `(${this.key} ${o} (${sv.map((_, i) => `@${this.key}${this.id}${i}`).join(', ')}))`;
      case SqlRefinerType.Sort:
        const asc = this.value === 1 ? 'ASC' : 'DESC';
        return `${this.key} ${asc}`;
      case SqlRefinerType.Relation:
        const op2 = operatorToString(this.operator);
        return `(${this.key} ${op2} (${this.relation.getSqlQuery(-1)}))`;
      case SqlRefinerType.Any:
        // tslint:disable-next-line: max-line-length
        return `(${this.key} ${operatorToString(this.operator)} ANY(${this.relation.getSqlQuery(-1)}))`;
      case SqlRefinerType.All:
        // tslint:disable-next-line: max-line-length
        return `(${this.key} ${operatorToString(this.operator)} ALL(${this.relation.getSqlQuery(-1)}))`;
      case SqlRefinerType.Grouping:
        const groupOp = this.operator === SqlOperator.OR ? ' OR ' : ' AND ';
        return this.refiners && this.refiners.length > 0 ?
          `(${this.refiners.map(e => e.getSqlStatement()).join(groupOp)})` : '';
      default:
        return `(${this.defaultToString()})`;
    }
  }

  defaultToString() {
    let key = `@${cleanKey(this.key)}${this.id}`;
    if (this.isValueMagicParameter) {
      key = this.value;
    }
    switch (this.operator) {

      case SqlOperator.NE:
        return `${this.key} <> ${key}`;
      case SqlOperator.GE:
        return `${this.key} >= ${key}`;
      case SqlOperator.NOT_IN:
        return `${this.key} NOT IN (${key})`;
      case SqlOperator.GT:
        return `${this.key} > ${key}`;
      case SqlOperator.LE:
        return `${this.key} <= ${key}`;
      case SqlOperator.LT:
        return `${this.key} < ${key}`;
      case SqlOperator.IS_NOT_NULL:
        return `${this.key} IS NOT NULL`;
      case SqlOperator.IS_NULL:
        return `${this.key} IS NULL`;
      case SqlOperator.LIKE:
      case SqlOperator.SW:
      case SqlOperator.EW:
        return `${this.key} LIKE ${key}`;
      case SqlOperator.IN:
        return `${this.key} IN (${key})`;
      default:
        if (this.value === null) {
          return `${this.key} = NULL`;
        }
        return `${this.key} = ${key}`;
    }
  }

  arrayToSqlParameter(arr: any[]) {
    return arr && arr.length ?
      arr.map((e, i) => ({ key: `@${cleanKey(this.key)}${this.id}${i}`, value: e })) : [];
  }

  getParameters(): ISqlParameter[] {
    const list: ISqlParameter[] = [];
    if (this.isValueMagicParameter) {
      return list;
    }
    switch (this.type) {
      case SqlRefinerType.Date:
      case SqlRefinerType.DateTime:
        list.push({
          key: `@${cleanKey(this.key)}${this.id}`,
          value: typeof this.value === 'string' ? Date.parse(this.value) : new Date(this.value),
        });
        break;
      case SqlRefinerType.DateRange:
        list.push({ key: `@${cleanKey(this.key)}${this.id}From`, value: this.value[0] });
        list.push({ key: `@${cleanKey(this.key)}${this.id}To`, value: this.value[1] });
        break;
      case SqlRefinerType.Selection:
        list.push(...this.arrayToSqlParameter(this.value));
        break;
      case SqlRefinerType.Relation:
        list.push(...this.relation.getParameters());
        break;
      case SqlRefinerType.Grouping:
        list.push(...[].concat(...this.refiners.map(v => v.getParameters())));
        break;
      default:
        if (this.value === null) {
          break;
        }
        if (this.operator === SqlOperator.LIKE) {
          list.push({ key: `@${cleanKey(this.key)}${this.id}`, value: `${this.value}` });
        } else {
          list.push({ key: `@${cleanKey(this.key)}${this.id}`, value: this.value });
        }
        break;
    }
    return list;
  }

  static fromJson(json: Partial<ISqlQuery & ISqlRefiner>) {
    const c = new SqlCondition();
    c.key = json.key;
    c.flags = json.flags;
    c.operator = json.operator;
    c.type = json.type;
    c.value = json.value;
    c.as = json['as'];
    c.relation = json.relation && QueryModel.fromJson(json.relation);
    c.refiners = json.refiners && json.refiners.map(e => SqlCondition.fromJson(e));
    return c;
  }
}

export class QueryModel {
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

  get isDistinct(): boolean {
    return (SqlModifier.Distinct & this.modifiers) === SqlModifier.Distinct;
  }

  get entityName(): string {
    return this.as ? this.as : this.table;
  }

  get entityIdentifier() {
    return this.tableIdentifier ? this.tableIdentifier.trim() : 'Id';
  }

  static fromJson(json: Partial<ISqlQuery & ISqlRefiner>) {
    const m = new QueryModel();
    m.joins = json.joins && json.joins.map(e => Join.fromJson(e));
    m.as = json.as;
    m.count = json.count;
    m.skip = json.skip;
    m.table = json.table;
    m.selection = json.selection;
    m.operator = json.operator;
    m.modifiers = json.modifiers;
    m.groupBy = json.groupBy;
    m.having = json.having && json.having.map(e => SqlCondition.fromJson(e));
    m.refiners = json.refiners && json.refiners.map(e => SqlCondition.fromJson(e));
    m.sorters = json.sorters && json.sorters.map(e => SqlCondition.fromJson(e));
    m.with = json.with && json.with.map(e => QueryModel.fromJson(e));
    return m;
  }

  getParameters(): ISqlParameter[] {
    const pr: ISqlParameter[] = [];
    if (this.refiners && this.refiners.length > 0) {
      pr.push(...[].concat(...this.refiners.map(e => e.getParameters())));
    }
    if (this.with && this.with.length > 0) {
      pr.push(...[].concat(...this.with.map(e => e.getParameters())));
    }
    if (this.joins && this.joins.length > 0) {
      pr.push(
        ...[].concat(...this.joins.map(e => [].concat(...e.on.map(v => v.getParameters())))));
    }
    return pr;
  }

  getSqlQuery(count = this.count, skip = this.skip, isWith = false) {
    let sb = '';
    let hb = '';

    let orderby = '';

    if (this.sorters != null) {
      const sorters = this.sorters.filter(ee => ee.type === SqlRefinerType.Sort);
      if (sorters.length > 0) {
        orderby = `ORDER BY ${sorters.map(e => e.getSqlStatement())}`;
      }
    }

    let limit = `LIMIT ${count} OFFSET ${skip}`;
    if (count === -1 || !orderby) {
      limit = '';
    }

    let sel = '*';
    if (this.selection && this.selection.length > 0) {
      sel = this.selection.join(', ');
    }

    let entityName = this.as && !isWith ? this.as : '';
    if (!isWith) {
      if (entityName) {
        entityName = ` AS ${entityName}`;
      }
    }

    if (this.refiners && this.refiners.length > 0) {
      const op = this.operator === SqlOperator.OR ? ' OR ' : ' AND ';
      sb += `(${this.refiners.map(e => e.getSqlStatement()).join(op)})`;
    }

    if (this.having && this.having.length > 0) {
      const op = this.operator === SqlOperator.OR ? ' OR ' : ' AND ';
      hb += `(${this.having.map(e => e.getSqlStatement()).join(op)})`;
    }

    const join = this.joins && this.joins.length ?
      this.joins.map(e => e.toString()).join(' ') : '';

    const distinct = this.isDistinct ? ' DISTINCT ' : '';

    const where = this.refiners && this.refiners.length > 0 && sb !== '()' ? `WHERE ${sb} ` : '';

    const groupBy = this.groupBy && this.groupBy.length > 0 ?
      `GROUP BY ${this.groupBy.map(e => e).join(', ')} ` : '';

    const having = this.having && this.having.length > 0 ? `HAVING ${hb}` : '';

    const wwith = this.with && this.with.length ?
      // tslint:disable-next-line: max-line-length
      `WITH ${this.with.map(e => `${e.as} AS (${e.getSqlQuery(e.count, e.skip, true)})`).join(',')}` : '';

    // tslint:disable-next-line: max-line-length
    return `${wwith} SELECT ${distinct} ${sel} FROM ${this.table} ${join} ${entityName} ${where} ${groupBy} ${having} ${orderby} ${limit}`;
  }
}

export function createQuery(model: QueryModel) {
  const params = model.getParameters();
  const map = params.reduce(
    (prev, curr, i) => {
      prev[curr.key] = `$${i + 1}`;
      return prev;
    },
    {});
  return [
    model.getSqlQuery(model.count, model.skip)
      .replace(
        /([^a-zA-Z0-9_])(@[a-zA-Z_][a-zA-Z0-9_]+)([^_a-zA-Z0-9])/g,
        (_, prefix, key, postfix) => `${prefix}${map[key]}${postfix}`),
    params];
}
