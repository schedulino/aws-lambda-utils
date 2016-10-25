'use strict';

const fs = require('fs');
const cmds = process.argv.slice(2);

function getDefaultJsonRequestTemplate(cmd) {
    return `
        #define( $loop )
          {
          #foreach($key in $map.keySet())
              "$util.escapeJavaScript($key)":
                "$util.escapeJavaScript($map.get($key))"
                #if( $foreach.hasNext ) , #end
          #end
          }
        #end
        {
          "cmd": "${ cmd }",
          "body": $input.json("$"),
          "method": "$context.httpMethod",
          "principalId": "$context.authorizer.principalId",
          "stage": "$context.stage",
          
          #set( $map = $input.params().header )
          "headers": $loop,
          
          #set( $map = $input.params().querystring )
          "query": $loop,
          
          #set( $map = $input.params().path )
          "params": $loop,
          
          #set( $map = $context.identity )
          "identity": $loop,
          
          #set( $map = $stageVariables )
          "stageVariables": $loop
        }
    `;
}

const requestsTemplates = {};
cmds.forEach(cmd => {
    const uppercaseCmd = cmd.charAt(0).toUpperCase() + cmd.slice(1).toLowerCase();
    requestsTemplates[`request${ uppercaseCmd }`] = {
        template: {
            'application/json': getDefaultJsonRequestTemplate(cmd)
        }

    };
});

fs.writeFileSync('./serverless-request-templates.json', JSON.stringify(requestsTemplates, null, 4), 'utf8');