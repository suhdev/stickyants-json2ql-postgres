import { operatorToString } from '../src/util';
import { SqlOperator } from 'json2ql';
describe('Util tests', () => {
  it('should generate appropriate grouping operator', () => {
    expect(operatorToString(SqlOperator.AND)).toEqual('AND');
    expect(operatorToString(SqlOperator.OR)).toEqual('OR');
  });
});
