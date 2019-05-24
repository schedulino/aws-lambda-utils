/**
 * Parse an AWS Lambda function name into a name and a qualifier. The qualifier of an AWS Lambda
 * function name is the version or alias of that function.
 *
 * @example
 * const parseName = require('parse-aws-lambda-name');
 *
 * parseName('foo');
 * //=> {functionName: 'foo'}
 *
 * parseName('foo:bar');
 * //=> {functionName: 'foo', qualifier: 'bar'}
 *
 * parseName('foo:1');
 * //=> {functionName: 'foo', qualifier: '1'}
 *
 * parseName('123456789876:foo');
 * //=> {functionName: '123456789876:foo'}
 *
 * parseName('123456789876:foo:bar');
 * //=> {functionName: '123456789876:foo', qualifier: 'bar'}
 *
 * parseName('arn:aws:lambda:eu-west-1:123456789876:function:foo');
 * //=> {functionName: 'arn:aws:lambda:eu-west-1:123456789876:function:foo'}
 *
 * parseName('arn:aws:lambda:eu-west-1:123456789876:function:foo:bar');
 * //=> {functionName: 'arn:aws:lambda:eu-west-1:123456789876:function:foo', qualifier: 'bar'}
 */
export function parseAwsLambdaName(
  arn: string
): { functionName: string; qualifier?: string } | undefined {
  const regex = [
    /^([0-9]{12}:[a-z0-9\-_]+):?([a-z0-9\-_]+)?$/i,
    /^([a-z0-9\-_]+):?([a-z0-9\-_]+)?$/i,
    /^(arn:aws:lambda:[a-z0-9\-]+:[0-9]{12}:function:[a-z0-9\-_]+):?([a-zA-Z0-9-_]+)?$/i,
  ];

  for (let i = 0; i < regex.length; i += 1) {
    const match = arn.match(regex[i]);

    if (match) {
      if (!match[2]) {
        return { functionName: match[1] };
      }

      return { functionName: match[1], qualifier: match[2] };
    }
  }

  return undefined;
}
