import { SQL, SqlQueryModel, SqlOperator, JoinType } from 'json2ql';
import { QueryModel } from '../src/index';
describe('QueryModelSpec', () => {
  it('should generate valid query', () => {
    const query = new SqlQueryModel()
      .table('Users')
      .filter(
        SQL.refiner('FirstName').equalTo('Suhail'),
      )
      .join((m) => {
        return m.toTable('Addresses')
          .left
          .on(SQL.refiner('users.id')
            .magicParams
            .equalTo('addresses.user_id'));
      })
      .count(10)
      .skip(0)
      .order(
        SQL.orderBy('CreatedAt').desc,
      )
      .build() as any;

    const m = QueryModel.fromJson(query);
    const params = m.getParameters();
    const map = params.reduce(
      (prev, curr, i) => {
        prev[curr.key] = `$${i + 1}`;
        return prev;
      },
      {});
    const queryStr = m.getSqlQuery()
      .replace(
        /([^a-zA-Z0-9])(@[a-zA-Z][a-zA-Z0-9]+)([^a-zA-Z0-9])/g,
        (_, prefix, key, postfix) => `${prefix}${map[key]}${postfix}`);
    expect(queryStr).toContain('LEFT JOIN Addresses');
    expect(queryStr).toContain('FROM Users');
    expect(queryStr).toContain('FirstName = $1');
    expect(queryStr).toContain('ORDER BY CreatedAt DESC');
    expect(queryStr).toContain('LIMIT 10 OFFSET 0');

  });

  it('should generate valid query', () => {
    const query = new SqlQueryModel()
      .table('Users')
      .filter(
        SQL.refiner('FirstName').contains('Suhail'),
        SQL.refiner('LastName').contains('Abood'),
        SQL.refiner('Age').greaterThan(18),
        SQL.refiner('MiddleName').magicParams.equalTo('LastName'),
        SQL.refiner('PostCode').isIn(['KT1', 'KT2', 'KT3', 'KT4', 'KT5']),
      )
      .join((m) => {
        return m.toTable('Addresses')
          .right
          .alias('Addr')
          .on(SQL.refiner('users.id')
            .magicParams
            .equalTo('Addr.user_id'));
      })
      .join((m) => {
        return m.toTable('Phones')
          .inner
          .on(SQL.refiner('users.id')
            .magicParams
            .equalTo('phones.user_id'));

      })
      .join((m) => {
        return m.toTable('OtherTable')
          .outer
          .on(SQL.refiner('users.id')
            .magicParams
            .equalTo('OtherTable.user_id'));

      })
      .count(10)
      .skip(0)
      .order(
        SQL.orderBy('CreatedAt').desc,
      )
      .build() as any;

    const m = QueryModel.fromJson(query);
    const params = m.getParameters();
    const map = params.reduce(
      (prev, curr, i) => {
        prev[curr.key] = `$${i + 1}`;
        return prev;
      },
      {});
    const queryStr = m.getSqlQuery()
      .replace(
        /([^a-zA-Z0-9])(@[a-zA-Z][a-zA-Z0-9]+)([^a-zA-Z0-9])/g,
        (_, prefix, key, postfix) => `${prefix}${map[key]}${postfix}`);
    expect(queryStr).toContain('RIGHT JOIN Addresses AS Addr');
    expect(queryStr).toContain('INNER JOIN Phones');
    expect(queryStr).toContain('OUTER JOIN OtherTable');
    expect(queryStr).toContain('FROM Users');
    expect(queryStr).toContain('FirstName LIKE $1');
    expect(queryStr).toContain('LastName LIKE $2');
    expect(queryStr).toContain('MiddleName = LastName');
    expect(queryStr).toContain('Age > $3');
    expect(queryStr).toContain('PostCode IN ($4, $5, $6, $7, $8)');
    expect(queryStr).toContain('ORDER BY CreatedAt DESC');
    expect(queryStr).toContain('LIMIT 10 OFFSET 0');

  });
});
