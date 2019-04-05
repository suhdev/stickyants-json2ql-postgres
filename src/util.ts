import { SqlOperator } from 'json2ql';

export function operatorToString(op: SqlOperator) {
  switch (op) {
    case SqlOperator.AND:
      return 'AND';
    case SqlOperator.NOT_IN:
      return 'NOT_IN';
    case SqlOperator.IN:
      return 'IN';
    case SqlOperator.BETWEEN:
      return 'BETWEEN';
    case SqlOperator.NE:
      return '<>';
    case SqlOperator.LE:
      return '<=';
    case SqlOperator.GE:
      return '>=';
    case SqlOperator.LT:
      return '<';
    case SqlOperator.GT:
      return '>';
    case SqlOperator.LIKE:
      return 'LIKE';
    case SqlOperator.NOT_LIKE:
      return 'NOT LIKE';
    case SqlOperator.IS_NULL:
      return 'IS';
    case SqlOperator.IS_NOT_NULL:
      return 'IS NOT';
    case SqlOperator.OR:
      return 'OR';
    case SqlOperator.EQ:
      return '=';
  }
  return '=';
}

export function cleanKey(key: string) {
  return key.replace('[', '')
    .replace(']', '')
    .replace('.', '');
}
