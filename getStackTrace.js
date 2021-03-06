(function () {

/**
 * Ientifies the available logic fork.
 * 1 : Error().stack (FireFox)
 * 2 : Error().message (Opera)
 * 3 : arguments.callee.caller (IE, Safari - not a true stack trace)
 */
var mode;

try {0()} catch (e) {
    mode = e.stack ? 1 : e.message.indexOf('stacktrace') > -1 ? 2 : 3;
}

YOUR_NAMESPACE.getStackTrace = (
    // Firefox includes a stack string in thrown Errors
    mode === 1 :
    function () {
        try {0()} catch (e) {
            return e.stack.replace(/^.*?\n/,'').
                           replace(/(?:\n@:0)?\s+$/m,'').
                           replace(/^\(/gm,'{anonymous}(').
                           split("\n");
        }
    } :

    // Opera includes stack info in thrown Errors' .message
    mode === 2 :
    function () {
        try {0()} catch (e) {
            var lines = e.message.split("\n"),
                ANON = '{anonymous}(..)@',
                lineRE = /Line\s+(\d+).*?(http\S+)(?:.*?in\s+function\s+(\S+))?/i,
                i,j,len,m;

            for (i=4,j=0,len=lines.length; i<len; i+=2) {
                m = lines[i].match(lineRE);
                if (m) {
                    lines[j++] = (m[3] ? m[3] + '(..)@' + m[2] + m[1] :
                        ANON + m[2] + ':' + m[1]) + ' -- ' +
                        lines[i+1].replace(/^\s+/,'');
                }
            }

            lines.splice(j,lines.length-j);
            return lines;
        }
    } :

    // IE and Safari support fn.caller, which is limited to the function's
    // last execution rather than tracing each execution context, and thus is
    // unable to trace across recursive functions.
    function () {
        var curr  = arguments.callee.caller,
            FUNC  = 'function', ANON = "{anonymous}",
            fnRE  = /function\s*([\w\-$]+)?\s*\(/i,
            callers = [arguments.callee],
            stack = [],j=0,
            fn,args,i;

        trace: while (curr) {
            // recursion protection
            i = callers.length;
            while (i--) {
                if (curr === callers[i]) {
                    curr = null;
                    break trace;
                }
            }

            callers.push(curr);

            fn    = (curr.toString().match(fnRE) || [])[1] || ANON;
            args  = stack.slice.call(curr.arguments);
            i     = args.length;

            while (i--) {
                switch (typeof args[i]) {
                    case 'string'  : args[i] = '"'+args[i].replace(/"/g,'\\"')+'"'; break;
                    // TODO: use fnRE to get function's name
                    case 'function': args[i] = FUNC; break;
                    // TODO: better type forking
                    default        : args[i] = args[i] == null ? 'null' : args[i].toString();
                }
            }

            stack[j++] = fn + '(' + args.join() + ')';

            curr = curr.caller;
        }

        return stack;
    });

})();
