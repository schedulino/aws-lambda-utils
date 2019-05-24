import { parseAwsLambdaName } from '../src/parser';

describe('parseAwsLambdaName', () => {
  test('undefined', () => {
    expect(parseAwsLambdaName('')).toBe(undefined);
    expect(
      parseAwsLambdaName('arn:aws:lambda:eu-west-1:12345678:function:foo')
    ).toBe(undefined);
  });

  test('short arn', () => {
    expect(parseAwsLambdaName('foo')).toEqual({ functionName: 'foo' });
    expect(parseAwsLambdaName('foo:bar')).toEqual({
      functionName: 'foo',
      qualifier: 'bar',
    });
    expect(parseAwsLambdaName('foo:1')).toEqual({
      functionName: 'foo',
      qualifier: '1',
    });
    expect(parseAwsLambdaName('123456:1')).toEqual({
      functionName: '123456',
      qualifier: '1',
    });
  });

  test('full arn', () => {
    expect(
      parseAwsLambdaName('arn:aws:lambda:eu-west-1:123456789876:function:foo')
    ).toEqual({
      functionName: 'arn:aws:lambda:eu-west-1:123456789876:function:foo',
    });
    expect(
      parseAwsLambdaName(
        'arn:aws:lambda:eu-west-1:123456789876:function:foo:bar'
      )
    ).toEqual({
      functionName: 'arn:aws:lambda:eu-west-1:123456789876:function:foo',
      qualifier: 'bar',
    });
    expect(
      parseAwsLambdaName('arn:aws:lambda:eu-west-1:123456789876:function:foo:1')
    ).toEqual({
      functionName: 'arn:aws:lambda:eu-west-1:123456789876:function:foo',
      qualifier: '1',
    });
  });

  test('account arn', () => {
    expect(parseAwsLambdaName('123456789876:foo')).toEqual({
      functionName: '123456789876:foo',
    });
    expect(parseAwsLambdaName('123456789876:foo:bar')).toEqual({
      functionName: '123456789876:foo',
      qualifier: 'bar',
    });
    expect(parseAwsLambdaName('123456789876:foo:1')).toEqual({
      functionName: '123456789876:foo',
      qualifier: '1',
    });
  });
});
