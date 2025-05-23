/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/balanced-match/index.js":
/*!**********************************************!*\
  !*** ./node_modules/balanced-match/index.js ***!
  \**********************************************/
/***/ ((module) => {

"use strict";

module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    if(a===b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}


/***/ }),

/***/ "./node_modules/brace-expansion/index.js":
/*!***********************************************!*\
  !*** ./node_modules/brace-expansion/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var concatMap = __webpack_require__(/*! concat-map */ "./node_modules/concat-map/index.js");
var balanced = __webpack_require__(/*! balanced-match */ "./node_modules/balanced-match/index.js");

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}



/***/ }),

/***/ "./node_modules/concat-map/index.js":
/*!******************************************!*\
  !*** ./node_modules/concat-map/index.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),

/***/ "./node_modules/json5/lib/index.js":
/*!*****************************************!*\
  !*** ./node_modules/json5/lib/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const parse = __webpack_require__(/*! ./parse */ "./node_modules/json5/lib/parse.js")
const stringify = __webpack_require__(/*! ./stringify */ "./node_modules/json5/lib/stringify.js")

const JSON5 = {
    parse,
    stringify,
}

module.exports = JSON5


/***/ }),

/***/ "./node_modules/json5/lib/parse.js":
/*!*****************************************!*\
  !*** ./node_modules/json5/lib/parse.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const util = __webpack_require__(/*! ./util */ "./node_modules/json5/lib/util.js")

let source
let parseState
let stack
let pos
let line
let column
let token
let key
let root

module.exports = function parse (text, reviver) {
    source = String(text)
    parseState = 'start'
    stack = []
    pos = 0
    line = 1
    column = 0
    token = undefined
    key = undefined
    root = undefined

    do {
        token = lex()

        // This code is unreachable.
        // if (!parseStates[parseState]) {
        //     throw invalidParseState()
        // }

        parseStates[parseState]()
    } while (token.type !== 'eof')

    if (typeof reviver === 'function') {
        return internalize({'': root}, '', reviver)
    }

    return root
}

function internalize (holder, name, reviver) {
    const value = holder[name]
    if (value != null && typeof value === 'object') {
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const key = String(i)
                const replacement = internalize(value, key, reviver)
                if (replacement === undefined) {
                    delete value[key]
                } else {
                    Object.defineProperty(value, key, {
                        value: replacement,
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    })
                }
            }
        } else {
            for (const key in value) {
                const replacement = internalize(value, key, reviver)
                if (replacement === undefined) {
                    delete value[key]
                } else {
                    Object.defineProperty(value, key, {
                        value: replacement,
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    })
                }
            }
        }
    }

    return reviver.call(holder, name, value)
}

let lexState
let buffer
let doubleQuote
let sign
let c

function lex () {
    lexState = 'default'
    buffer = ''
    doubleQuote = false
    sign = 1

    for (;;) {
        c = peek()

        // This code is unreachable.
        // if (!lexStates[lexState]) {
        //     throw invalidLexState(lexState)
        // }

        const token = lexStates[lexState]()
        if (token) {
            return token
        }
    }
}

function peek () {
    if (source[pos]) {
        return String.fromCodePoint(source.codePointAt(pos))
    }
}

function read () {
    const c = peek()

    if (c === '\n') {
        line++
        column = 0
    } else if (c) {
        column += c.length
    } else {
        column++
    }

    if (c) {
        pos += c.length
    }

    return c
}

const lexStates = {
    default () {
        switch (c) {
        case '\t':
        case '\v':
        case '\f':
        case ' ':
        case '\u00A0':
        case '\uFEFF':
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
            read()
            return

        case '/':
            read()
            lexState = 'comment'
            return

        case undefined:
            read()
            return newToken('eof')
        }

        if (util.isSpaceSeparator(c)) {
            read()
            return
        }

        // This code is unreachable.
        // if (!lexStates[parseState]) {
        //     throw invalidLexState(parseState)
        // }

        return lexStates[parseState]()
    },

    comment () {
        switch (c) {
        case '*':
            read()
            lexState = 'multiLineComment'
            return

        case '/':
            read()
            lexState = 'singleLineComment'
            return
        }

        throw invalidChar(read())
    },

    multiLineComment () {
        switch (c) {
        case '*':
            read()
            lexState = 'multiLineCommentAsterisk'
            return

        case undefined:
            throw invalidChar(read())
        }

        read()
    },

    multiLineCommentAsterisk () {
        switch (c) {
        case '*':
            read()
            return

        case '/':
            read()
            lexState = 'default'
            return

        case undefined:
            throw invalidChar(read())
        }

        read()
        lexState = 'multiLineComment'
    },

    singleLineComment () {
        switch (c) {
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
            read()
            lexState = 'default'
            return

        case undefined:
            read()
            return newToken('eof')
        }

        read()
    },

    value () {
        switch (c) {
        case '{':
        case '[':
            return newToken('punctuator', read())

        case 'n':
            read()
            literal('ull')
            return newToken('null', null)

        case 't':
            read()
            literal('rue')
            return newToken('boolean', true)

        case 'f':
            read()
            literal('alse')
            return newToken('boolean', false)

        case '-':
        case '+':
            if (read() === '-') {
                sign = -1
            }

            lexState = 'sign'
            return

        case '.':
            buffer = read()
            lexState = 'decimalPointLeading'
            return

        case '0':
            buffer = read()
            lexState = 'zero'
            return

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            buffer = read()
            lexState = 'decimalInteger'
            return

        case 'I':
            read()
            literal('nfinity')
            return newToken('numeric', Infinity)

        case 'N':
            read()
            literal('aN')
            return newToken('numeric', NaN)

        case '"':
        case "'":
            doubleQuote = (read() === '"')
            buffer = ''
            lexState = 'string'
            return
        }

        throw invalidChar(read())
    },

    identifierNameStartEscape () {
        if (c !== 'u') {
            throw invalidChar(read())
        }

        read()
        const u = unicodeEscape()
        switch (u) {
        case '$':
        case '_':
            break

        default:
            if (!util.isIdStartChar(u)) {
                throw invalidIdentifier()
            }

            break
        }

        buffer += u
        lexState = 'identifierName'
    },

    identifierName () {
        switch (c) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
            buffer += read()
            return

        case '\\':
            read()
            lexState = 'identifierNameEscape'
            return
        }

        if (util.isIdContinueChar(c)) {
            buffer += read()
            return
        }

        return newToken('identifier', buffer)
    },

    identifierNameEscape () {
        if (c !== 'u') {
            throw invalidChar(read())
        }

        read()
        const u = unicodeEscape()
        switch (u) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
            break

        default:
            if (!util.isIdContinueChar(u)) {
                throw invalidIdentifier()
            }

            break
        }

        buffer += u
        lexState = 'identifierName'
    },

    sign () {
        switch (c) {
        case '.':
            buffer = read()
            lexState = 'decimalPointLeading'
            return

        case '0':
            buffer = read()
            lexState = 'zero'
            return

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            buffer = read()
            lexState = 'decimalInteger'
            return

        case 'I':
            read()
            literal('nfinity')
            return newToken('numeric', sign * Infinity)

        case 'N':
            read()
            literal('aN')
            return newToken('numeric', NaN)
        }

        throw invalidChar(read())
    },

    zero () {
        switch (c) {
        case '.':
            buffer += read()
            lexState = 'decimalPoint'
            return

        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return

        case 'x':
        case 'X':
            buffer += read()
            lexState = 'hexadecimal'
            return
        }

        return newToken('numeric', sign * 0)
    },

    decimalInteger () {
        switch (c) {
        case '.':
            buffer += read()
            lexState = 'decimalPoint'
            return

        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalPointLeading () {
        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalFraction'
            return
        }

        throw invalidChar(read())
    },

    decimalPoint () {
        switch (c) {
        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalFraction'
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalFraction () {
        switch (c) {
        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalExponent () {
        switch (c) {
        case '+':
        case '-':
            buffer += read()
            lexState = 'decimalExponentSign'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalExponentInteger'
            return
        }

        throw invalidChar(read())
    },

    decimalExponentSign () {
        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalExponentInteger'
            return
        }

        throw invalidChar(read())
    },

    decimalExponentInteger () {
        if (util.isDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    hexadecimal () {
        if (util.isHexDigit(c)) {
            buffer += read()
            lexState = 'hexadecimalInteger'
            return
        }

        throw invalidChar(read())
    },

    hexadecimalInteger () {
        if (util.isHexDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    string () {
        switch (c) {
        case '\\':
            read()
            buffer += escape()
            return

        case '"':
            if (doubleQuote) {
                read()
                return newToken('string', buffer)
            }

            buffer += read()
            return

        case "'":
            if (!doubleQuote) {
                read()
                return newToken('string', buffer)
            }

            buffer += read()
            return

        case '\n':
        case '\r':
            throw invalidChar(read())

        case '\u2028':
        case '\u2029':
            separatorChar(c)
            break

        case undefined:
            throw invalidChar(read())
        }

        buffer += read()
    },

    start () {
        switch (c) {
        case '{':
        case '[':
            return newToken('punctuator', read())

        // This code is unreachable since the default lexState handles eof.
        // case undefined:
        //     return newToken('eof')
        }

        lexState = 'value'
    },

    beforePropertyName () {
        switch (c) {
        case '$':
        case '_':
            buffer = read()
            lexState = 'identifierName'
            return

        case '\\':
            read()
            lexState = 'identifierNameStartEscape'
            return

        case '}':
            return newToken('punctuator', read())

        case '"':
        case "'":
            doubleQuote = (read() === '"')
            lexState = 'string'
            return
        }

        if (util.isIdStartChar(c)) {
            buffer += read()
            lexState = 'identifierName'
            return
        }

        throw invalidChar(read())
    },

    afterPropertyName () {
        if (c === ':') {
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    beforePropertyValue () {
        lexState = 'value'
    },

    afterPropertyValue () {
        switch (c) {
        case ',':
        case '}':
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    beforeArrayValue () {
        if (c === ']') {
            return newToken('punctuator', read())
        }

        lexState = 'value'
    },

    afterArrayValue () {
        switch (c) {
        case ',':
        case ']':
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    end () {
        // This code is unreachable since it's handled by the default lexState.
        // if (c === undefined) {
        //     read()
        //     return newToken('eof')
        // }

        throw invalidChar(read())
    },
}

function newToken (type, value) {
    return {
        type,
        value,
        line,
        column,
    }
}

function literal (s) {
    for (const c of s) {
        const p = peek()

        if (p !== c) {
            throw invalidChar(read())
        }

        read()
    }
}

function escape () {
    const c = peek()
    switch (c) {
    case 'b':
        read()
        return '\b'

    case 'f':
        read()
        return '\f'

    case 'n':
        read()
        return '\n'

    case 'r':
        read()
        return '\r'

    case 't':
        read()
        return '\t'

    case 'v':
        read()
        return '\v'

    case '0':
        read()
        if (util.isDigit(peek())) {
            throw invalidChar(read())
        }

        return '\0'

    case 'x':
        read()
        return hexEscape()

    case 'u':
        read()
        return unicodeEscape()

    case '\n':
    case '\u2028':
    case '\u2029':
        read()
        return ''

    case '\r':
        read()
        if (peek() === '\n') {
            read()
        }

        return ''

    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
        throw invalidChar(read())

    case undefined:
        throw invalidChar(read())
    }

    return read()
}

function hexEscape () {
    let buffer = ''
    let c = peek()

    if (!util.isHexDigit(c)) {
        throw invalidChar(read())
    }

    buffer += read()

    c = peek()
    if (!util.isHexDigit(c)) {
        throw invalidChar(read())
    }

    buffer += read()

    return String.fromCodePoint(parseInt(buffer, 16))
}

function unicodeEscape () {
    let buffer = ''
    let count = 4

    while (count-- > 0) {
        const c = peek()
        if (!util.isHexDigit(c)) {
            throw invalidChar(read())
        }

        buffer += read()
    }

    return String.fromCodePoint(parseInt(buffer, 16))
}

const parseStates = {
    start () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        push()
    },

    beforePropertyName () {
        switch (token.type) {
        case 'identifier':
        case 'string':
            key = token.value
            parseState = 'afterPropertyName'
            return

        case 'punctuator':
            // This code is unreachable since it's handled by the lexState.
            // if (token.value !== '}') {
            //     throw invalidToken()
            // }

            pop()
            return

        case 'eof':
            throw invalidEOF()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    afterPropertyName () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator' || token.value !== ':') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        parseState = 'beforePropertyValue'
    },

    beforePropertyValue () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        push()
    },

    beforeArrayValue () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        if (token.type === 'punctuator' && token.value === ']') {
            pop()
            return
        }

        push()
    },

    afterPropertyValue () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        switch (token.value) {
        case ',':
            parseState = 'beforePropertyName'
            return

        case '}':
            pop()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    afterArrayValue () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        switch (token.value) {
        case ',':
            parseState = 'beforeArrayValue'
            return

        case ']':
            pop()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    end () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'eof') {
        //     throw invalidToken()
        // }
    },
}

function push () {
    let value

    switch (token.type) {
    case 'punctuator':
        switch (token.value) {
        case '{':
            value = {}
            break

        case '[':
            value = []
            break
        }

        break

    case 'null':
    case 'boolean':
    case 'numeric':
    case 'string':
        value = token.value
        break

    // This code is unreachable.
    // default:
    //     throw invalidToken()
    }

    if (root === undefined) {
        root = value
    } else {
        const parent = stack[stack.length - 1]
        if (Array.isArray(parent)) {
            parent.push(value)
        } else {
            Object.defineProperty(parent, key, {
                value,
                writable: true,
                enumerable: true,
                configurable: true,
            })
        }
    }

    if (value !== null && typeof value === 'object') {
        stack.push(value)

        if (Array.isArray(value)) {
            parseState = 'beforeArrayValue'
        } else {
            parseState = 'beforePropertyName'
        }
    } else {
        const current = stack[stack.length - 1]
        if (current == null) {
            parseState = 'end'
        } else if (Array.isArray(current)) {
            parseState = 'afterArrayValue'
        } else {
            parseState = 'afterPropertyValue'
        }
    }
}

function pop () {
    stack.pop()

    const current = stack[stack.length - 1]
    if (current == null) {
        parseState = 'end'
    } else if (Array.isArray(current)) {
        parseState = 'afterArrayValue'
    } else {
        parseState = 'afterPropertyValue'
    }
}

// This code is unreachable.
// function invalidParseState () {
//     return new Error(`JSON5: invalid parse state '${parseState}'`)
// }

// This code is unreachable.
// function invalidLexState (state) {
//     return new Error(`JSON5: invalid lex state '${state}'`)
// }

function invalidChar (c) {
    if (c === undefined) {
        return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
    }

    return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
}

function invalidEOF () {
    return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
}

// This code is unreachable.
// function invalidToken () {
//     if (token.type === 'eof') {
//         return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
//     }

//     const c = String.fromCodePoint(token.value.codePointAt(0))
//     return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
// }

function invalidIdentifier () {
    column -= 5
    return syntaxError(`JSON5: invalid identifier character at ${line}:${column}`)
}

function separatorChar (c) {
    console.warn(`JSON5: '${formatChar(c)}' in strings is not valid ECMAScript; consider escaping`)
}

function formatChar (c) {
    const replacements = {
        "'": "\\'",
        '"': '\\"',
        '\\': '\\\\',
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\v': '\\v',
        '\0': '\\0',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
    }

    if (replacements[c]) {
        return replacements[c]
    }

    if (c < ' ') {
        const hexString = c.charCodeAt(0).toString(16)
        return '\\x' + ('00' + hexString).substring(hexString.length)
    }

    return c
}

function syntaxError (message) {
    const err = new SyntaxError(message)
    err.lineNumber = line
    err.columnNumber = column
    return err
}


/***/ }),

/***/ "./node_modules/json5/lib/stringify.js":
/*!*********************************************!*\
  !*** ./node_modules/json5/lib/stringify.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const util = __webpack_require__(/*! ./util */ "./node_modules/json5/lib/util.js")

module.exports = function stringify (value, replacer, space) {
    const stack = []
    let indent = ''
    let propertyList
    let replacerFunc
    let gap = ''
    let quote

    if (
        replacer != null &&
        typeof replacer === 'object' &&
        !Array.isArray(replacer)
    ) {
        space = replacer.space
        quote = replacer.quote
        replacer = replacer.replacer
    }

    if (typeof replacer === 'function') {
        replacerFunc = replacer
    } else if (Array.isArray(replacer)) {
        propertyList = []
        for (const v of replacer) {
            let item

            if (typeof v === 'string') {
                item = v
            } else if (
                typeof v === 'number' ||
                v instanceof String ||
                v instanceof Number
            ) {
                item = String(v)
            }

            if (item !== undefined && propertyList.indexOf(item) < 0) {
                propertyList.push(item)
            }
        }
    }

    if (space instanceof Number) {
        space = Number(space)
    } else if (space instanceof String) {
        space = String(space)
    }

    if (typeof space === 'number') {
        if (space > 0) {
            space = Math.min(10, Math.floor(space))
            gap = '          '.substr(0, space)
        }
    } else if (typeof space === 'string') {
        gap = space.substr(0, 10)
    }

    return serializeProperty('', {'': value})

    function serializeProperty (key, holder) {
        let value = holder[key]
        if (value != null) {
            if (typeof value.toJSON5 === 'function') {
                value = value.toJSON5(key)
            } else if (typeof value.toJSON === 'function') {
                value = value.toJSON(key)
            }
        }

        if (replacerFunc) {
            value = replacerFunc.call(holder, key, value)
        }

        if (value instanceof Number) {
            value = Number(value)
        } else if (value instanceof String) {
            value = String(value)
        } else if (value instanceof Boolean) {
            value = value.valueOf()
        }

        switch (value) {
        case null: return 'null'
        case true: return 'true'
        case false: return 'false'
        }

        if (typeof value === 'string') {
            return quoteString(value, false)
        }

        if (typeof value === 'number') {
            return String(value)
        }

        if (typeof value === 'object') {
            return Array.isArray(value) ? serializeArray(value) : serializeObject(value)
        }

        return undefined
    }

    function quoteString (value) {
        const quotes = {
            "'": 0.1,
            '"': 0.2,
        }

        const replacements = {
            "'": "\\'",
            '"': '\\"',
            '\\': '\\\\',
            '\b': '\\b',
            '\f': '\\f',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\v': '\\v',
            '\0': '\\0',
            '\u2028': '\\u2028',
            '\u2029': '\\u2029',
        }

        let product = ''

        for (let i = 0; i < value.length; i++) {
            const c = value[i]
            switch (c) {
            case "'":
            case '"':
                quotes[c]++
                product += c
                continue

            case '\0':
                if (util.isDigit(value[i + 1])) {
                    product += '\\x00'
                    continue
                }
            }

            if (replacements[c]) {
                product += replacements[c]
                continue
            }

            if (c < ' ') {
                let hexString = c.charCodeAt(0).toString(16)
                product += '\\x' + ('00' + hexString).substring(hexString.length)
                continue
            }

            product += c
        }

        const quoteChar = quote || Object.keys(quotes).reduce((a, b) => (quotes[a] < quotes[b]) ? a : b)

        product = product.replace(new RegExp(quoteChar, 'g'), replacements[quoteChar])

        return quoteChar + product + quoteChar
    }

    function serializeObject (value) {
        if (stack.indexOf(value) >= 0) {
            throw TypeError('Converting circular structure to JSON5')
        }

        stack.push(value)

        let stepback = indent
        indent = indent + gap

        let keys = propertyList || Object.keys(value)
        let partial = []
        for (const key of keys) {
            const propertyString = serializeProperty(key, value)
            if (propertyString !== undefined) {
                let member = serializeKey(key) + ':'
                if (gap !== '') {
                    member += ' '
                }
                member += propertyString
                partial.push(member)
            }
        }

        let final
        if (partial.length === 0) {
            final = '{}'
        } else {
            let properties
            if (gap === '') {
                properties = partial.join(',')
                final = '{' + properties + '}'
            } else {
                let separator = ',\n' + indent
                properties = partial.join(separator)
                final = '{\n' + indent + properties + ',\n' + stepback + '}'
            }
        }

        stack.pop()
        indent = stepback
        return final
    }

    function serializeKey (key) {
        if (key.length === 0) {
            return quoteString(key, true)
        }

        const firstChar = String.fromCodePoint(key.codePointAt(0))
        if (!util.isIdStartChar(firstChar)) {
            return quoteString(key, true)
        }

        for (let i = firstChar.length; i < key.length; i++) {
            if (!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
                return quoteString(key, true)
            }
        }

        return key
    }

    function serializeArray (value) {
        if (stack.indexOf(value) >= 0) {
            throw TypeError('Converting circular structure to JSON5')
        }

        stack.push(value)

        let stepback = indent
        indent = indent + gap

        let partial = []
        for (let i = 0; i < value.length; i++) {
            const propertyString = serializeProperty(String(i), value)
            partial.push((propertyString !== undefined) ? propertyString : 'null')
        }

        let final
        if (partial.length === 0) {
            final = '[]'
        } else {
            if (gap === '') {
                let properties = partial.join(',')
                final = '[' + properties + ']'
            } else {
                let separator = ',\n' + indent
                let properties = partial.join(separator)
                final = '[\n' + indent + properties + ',\n' + stepback + ']'
            }
        }

        stack.pop()
        indent = stepback
        return final
    }
}


/***/ }),

/***/ "./node_modules/json5/lib/unicode.js":
/*!*******************************************!*\
  !*** ./node_modules/json5/lib/unicode.js ***!
  \*******************************************/
/***/ ((module) => {

// This is a generated file. Do not edit.
module.exports.Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/
module.exports.ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/
module.exports.ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/


/***/ }),

/***/ "./node_modules/json5/lib/util.js":
/*!****************************************!*\
  !*** ./node_modules/json5/lib/util.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const unicode = __webpack_require__(/*! ../lib/unicode */ "./node_modules/json5/lib/unicode.js")

module.exports = {
    isSpaceSeparator (c) {
        return typeof c === 'string' && unicode.Space_Separator.test(c)
    },

    isIdStartChar (c) {
        return typeof c === 'string' && (
            (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c === '$') || (c === '_') ||
        unicode.ID_Start.test(c)
        )
    },

    isIdContinueChar (c) {
        return typeof c === 'string' && (
            (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        (c === '$') || (c === '_') ||
        (c === '\u200C') || (c === '\u200D') ||
        unicode.ID_Continue.test(c)
        )
    },

    isDigit (c) {
        return typeof c === 'string' && /[0-9]/.test(c)
    },

    isHexDigit (c) {
        return typeof c === 'string' && /[0-9A-Fa-f]/.test(c)
    },
}


/***/ }),

/***/ "./node_modules/lookpath/lib/index.js":
/*!********************************************!*\
  !*** ./node_modules/lookpath/lib/index.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lookpath = void 0;
var fs = __importStar(__webpack_require__(/*! fs */ "fs"));
var path = __importStar(__webpack_require__(/*! path */ "path"));
var isWindows = /^win/i.test(process.platform);
/**
 * Sometimes, people want to look for local executable files
 * which are specified with either relative or absolute file path.
 * @private
 * @param cmd
 * @return {string} An absolute path of given command, or undefined.
 */
var isFilepath = function (cmd) {
    return cmd.includes(path.sep) ? path.resolve(cmd) : undefined;
};
/**
 * Just promisifies "fs.access"
 * @private
 * @param {string} fpath An absolute file path with an applicable extension appended.
 * @return {Promise<string>} Resolves absolute path or empty string.
 */
var access = function (fpath) {
    return new Promise(function (resolve) { return fs.access(fpath, fs.constants.X_OK, function (err) { return resolve(err ? undefined : fpath); }); });
};
/**
 * Resolves if the given file is executable or not, regarding "PATHEXT" to be applied.
 * @private
 * @param {string} abspath A file path to be checked.
 * @return {Promise<string>} Resolves the absolute file path just checked, or undefined.
 */
var isExecutable = function (abspath, opt) {
    if (opt === void 0) { opt = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var envvars, exts, bins;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    envvars = opt.env || process.env;
                    exts = (envvars.PATHEXT || '').split(path.delimiter).concat('');
                    return [4 /*yield*/, Promise.all(exts.map(function (ext) { return access(abspath + ext); }))];
                case 1:
                    bins = _a.sent();
                    return [2 /*return*/, bins.find(function (bin) { return !!bin; })];
            }
        });
    });
};
/**
 * Returns a list of directories on which the target command should be looked for.
 * @private
 * @param {string[]} opt.include Will be added to "PATH" env.
 * @param {string[]} opt.exclude Will be filtered from "PATH" env.
 * @return {string[]} Directories to dig into.
 */
var getDirsToWalkThrough = function (opt) {
    var envvars = opt.env || process.env;
    var envname = isWindows ? 'Path' : 'PATH';
    return (envvars[envname] || '').split(path.delimiter).concat(opt.include || []).filter(function (p) { return !(opt.exclude || []).includes(p); });
};
/**
 * Returns async promise with absolute file path of given command,
 * and resolves with undefined if the command not found.
 * @param {string} command Command name to look for.
 * @param {LookPathOption} opt Options for lookpath.
 * @return {Promise<string|undefined>} Resolves absolute file path, or undefined if not found.
 */
function lookpath(command, opt) {
    if (opt === void 0) { opt = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var directpath, dirs, bins;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    directpath = isFilepath(command);
                    if (directpath)
                        return [2 /*return*/, isExecutable(directpath, opt)];
                    dirs = getDirsToWalkThrough(opt);
                    return [4 /*yield*/, Promise.all(dirs.map(function (dir) { return isExecutable(path.join(dir, command), opt); }))];
                case 1:
                    bins = _a.sent();
                    return [2 /*return*/, bins.find(function (bin) { return !!bin; })];
            }
        });
    });
}
exports.lookpath = lookpath;


/***/ }),

/***/ "./node_modules/minimatch/minimatch.js":
/*!*********************************************!*\
  !*** ./node_modules/minimatch/minimatch.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = (function () { try { return __webpack_require__(/*! path */ "path") } catch (e) {}}()) || {
  sep: '/'
}
minimatch.sep = path.sep

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = __webpack_require__(/*! brace-expansion */ "./node_modules/brace-expansion/index.js")

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  b = b || {}
  var t = {}
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
    return minimatch
  }

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }
  m.Minimatch.defaults = function defaults (options) {
    return orig.defaults(ext(def, options)).Minimatch
  }

  m.filter = function filter (pattern, options) {
    return orig.filter(pattern, ext(def, options))
  }

  m.defaults = function defaults (options) {
    return orig.defaults(ext(def, options))
  }

  m.makeRe = function makeRe (pattern, options) {
    return orig.makeRe(pattern, ext(def, options))
  }

  m.braceExpand = function braceExpand (pattern, options) {
    return orig.braceExpand(pattern, ext(def, options))
  }

  m.match = function (list, pattern, options) {
    return orig.match(list, pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  assertValidPattern(pattern)

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  assertValidPattern(pattern)

  if (!options) options = {}

  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (!options.allowWindowsEscape && path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false
  this.partial = !!options.partial

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = function debug() { console.error.apply(console, arguments) }

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  assertValidPattern(pattern)

  // Thanks to Yeting Li <https://github.com/yetingli> for
  // improving this regexp to avoid a ReDOS vulnerability.
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

var MAX_PATTERN_LENGTH = 1024 * 64
var assertValidPattern = function (pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern')
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError('pattern is too long')
  }
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  assertValidPattern(pattern)

  var options = this.options

  // shortcuts
  if (pattern === '**') {
    if (!options.noglobstar)
      return GLOBSTAR
    else
      pattern = '*'
  }
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      /* istanbul ignore next */
      case '/': {
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false
      }

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        // split where the last [ was, make sure we don't have
        // an invalid re. if so, re-walk the contents of the
        // would-be class to re-translate any characters that
        // were passed through as-is
        // TODO: It would probably be faster to determine this
        // without a try/catch and a new RegExp, but it's tricky
        // to do safely.  For now, this is safe and works.
        var cs = pattern.substring(classStart + 1, i)
        try {
          RegExp('[' + cs + ']')
        } catch (er) {
          // not a valid class!
          var sp = this.parse(cs, SUBPARSE)
          re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
          hasMagic = hasMagic || sp[1]
          inClass = false
          continue
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '[': case '.': case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) /* istanbul ignore next - should be impossible */ {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) /* istanbul ignore next - should be impossible */ {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = function match (f, partial) {
  if (typeof partial === 'undefined') partial = this.partial
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    /* istanbul ignore if */
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      /* istanbul ignore if */
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      hit = f === p
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else /* istanbul ignore else */ if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    return (fi === fl - 1) && (file[fi] === '')
  }

  // should be unreachable.
  /* istanbul ignore next */
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}


/***/ }),

/***/ "./src/executor/assembler.ts":
/*!***********************************!*\
  !*** ./src/executor/assembler.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateAssemblerCode = void 0;
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
const cuda_1 = __webpack_require__(/*! ./builder/unix/cuda */ "./src/executor/builder/unix/cuda.ts");
const msvc_1 = __webpack_require__(/*! ./builder/win/msvc */ "./src/executor/builder/win/msvc.ts");
async function generateAssemblerCode(settingsProvider, activeFolder, buildMode, singleFileBuild) {
    const { files: files, language: language } = (0, fileUtils_1.getAllSourceFilesInDir)(activeFolder, singleFileBuild);
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    if (!(0, fileUtils_1.pathExists)(modeDir)) {
        (0, fileUtils_1.mkdirRecursive)(modeDir);
    }
    const operatingSystem = settingsProvider.operatingSystem;
    let commandLine;
    if (operatingSystem === enums_1.OperatingSystems.windows &&
        settingsProvider.useMsvc) {
        commandLine = (0, msvc_1.generateAssemblerMsvcBased)(settingsProvider, activeFolder, buildMode, language, files, modeDir, params_1.APPEND_SYMBOL);
    }
    else {
        commandLine = (0, cuda_1.generateAssemblerUnixBased)(settingsProvider, activeFolder, buildMode, language, files, modeDir);
    }
    if (!commandLine)
        return;
    const task_name = 'Build';
    await (0, vscodeUtils_1.runVscodeTask)(task_name, commandLine, activeFolder, operatingSystem, undefined, settingsProvider.useMsvc);
}
exports.generateAssemblerCode = generateAssemblerCode;


/***/ }),

/***/ "./src/executor/builder.ts":
/*!*********************************!*\
  !*** ./src/executor/builder.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executeBuildTask = exports.getExecutableName = void 0;
const path = __webpack_require__(/*! path */ "path");
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
const cuda_1 = __webpack_require__(/*! ./builder/unix/cuda */ "./src/executor/builder/unix/cuda.ts");
const gcc_clang_1 = __webpack_require__(/*! ./builder/unix/gcc_clang */ "./src/executor/builder/unix/gcc_clang.ts");
const msvc_1 = __webpack_require__(/*! ./builder/win/msvc */ "./src/executor/builder/win/msvc.ts");
function getExecutableName(operatingSystem, buildMode) {
    if (operatingSystem === enums_1.OperatingSystems.windows)
        return `out${buildMode}.exe`;
    return `out${buildMode}`;
}
exports.getExecutableName = getExecutableName;
async function executeBuildTask(settingsProvider, activeFolder, buildMode, singleFileBuild) {
    const { files: files, language: language } = (0, fileUtils_1.getAllSourceFilesInDir)(activeFolder, singleFileBuild);
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    if (!(0, fileUtils_1.pathExists)(modeDir)) {
        (0, fileUtils_1.mkdirRecursive)(modeDir);
    }
    const operatingSystem = settingsProvider.operatingSystem;
    const executableName = getExecutableName(operatingSystem, buildMode);
    const executablePath = path.join(modeDir, executableName);
    let commandLine;
    if (operatingSystem === enums_1.OperatingSystems.windows &&
        settingsProvider.useMsvc &&
        language !== enums_1.Languages.cuda) {
        commandLine = (0, msvc_1.executeBuildTaskMsvcBased)(settingsProvider, activeFolder, buildMode, language, files, modeDir, params_1.APPEND_SYMBOL, executablePath, singleFileBuild);
    }
    else if (language !== enums_1.Languages.cuda) {
        commandLine = (0, gcc_clang_1.executeBuildTaskUnixBased)(settingsProvider, activeFolder, buildMode, language, files, modeDir, params_1.APPEND_SYMBOL, executablePath, singleFileBuild);
    }
    else {
        commandLine = (0, cuda_1.executeCudaBuildTask)(settingsProvider, activeFolder, buildMode, language, files, modeDir, params_1.APPEND_SYMBOL, executablePath);
    }
    if (!commandLine)
        return;
    const problemMatcher = operatingSystem === enums_1.OperatingSystems.windows && settingsProvider.useMsvc
        ? ['$msCompile']
        : ['$gcc'];
    const task_name = 'Build';
    await (0, vscodeUtils_1.runVscodeTask)(task_name, commandLine, activeFolder, operatingSystem, problemMatcher, settingsProvider.useMsvc);
}
exports.executeBuildTask = executeBuildTask;


/***/ }),

/***/ "./src/executor/builder/build_utils.ts":
/*!*********************************************!*\
  !*** ./src/executor/builder/build_utils.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetWildcardPatterns = exports.isNonMatchingSourceFile = void 0;
const enums_1 = __webpack_require__(/*! ../../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../../utils/fileUtils */ "./src/utils/fileUtils.ts");
function isNonMatchingSourceFile(language, fileExtension) {
    if (language === enums_1.Languages.c && !(0, fileUtils_1.isCSourceFile)(fileExtension)) {
        return true;
    }
    if (language === enums_1.Languages.cpp && !(0, fileUtils_1.isCppSourceFile)(fileExtension)) {
        return true;
    }
    if (language === enums_1.Languages.cuda && !(0, fileUtils_1.isCudaSourceFile)(fileExtension)) {
        return true;
    }
    return false;
}
exports.isNonMatchingSourceFile = isNonMatchingSourceFile;
function GetWildcardPatterns(files) {
    const has_cpp = files.some((f) => f.endsWith('.cpp'));
    const has_cc = files.some((f) => f.endsWith('.cc'));
    const has_cxx = files.some((f) => f.endsWith('.cxx'));
    if (has_cpp && !has_cc && !has_cxx)
        return ' *.cpp';
    if (!has_cpp && has_cc && !has_cxx)
        return ' *.cc';
    if (!has_cpp && !has_cc && has_cxx)
        return ' *.cxx';
    if (!has_cpp && has_cc && has_cxx)
        return ' *.cc *.cxx';
    if (has_cpp && !has_cc && has_cxx)
        return ' *.cpp *.cxx';
    if (has_cpp && has_cc && !has_cxx)
        return ' *.cpp *.cc';
    if (has_cpp && has_cc && has_cxx)
        return ' *.cpp *.cc *.cxx';
    return '';
}
exports.GetWildcardPatterns = GetWildcardPatterns;


/***/ }),

/***/ "./src/executor/builder/unix/cuda.ts":
/*!*******************************************!*\
  !*** ./src/executor/builder/unix/cuda.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateAssemblerUnixBased = exports.executeCudaBuildTask = void 0;
const path = __webpack_require__(/*! path */ "path");
const params_1 = __webpack_require__(/*! ../../../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../../../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../../../utils/fileUtils */ "./src/utils/fileUtils.ts");
const build_utils_1 = __webpack_require__(/*! ../build_utils */ "./src/executor/builder/build_utils.ts");
const unix_utils_1 = __webpack_require__(/*! ./unix_utils */ "./src/executor/builder/unix/unix_utils.ts");
function executeCudaBuildTask(settingsProvider, activeFolder, buildMode, language, files, modeDir, appendSymbol, executablePath) {
    const compiler = 'nvcc';
    const standard = settingsProvider.cppStandard !== '' ? settingsProvider.cppStandard : '';
    const includePaths = settingsProvider.includePaths;
    const compilerArgs = settingsProvider.compilerArgs;
    const linkerArgs = settingsProvider.linkerArgs;
    let fullCompilerArgs = '';
    let fullLinkerArgs = '';
    const showCompilationTime = settingsProvider.showCompilationTime;
    if (showCompilationTime) {
        fullCompilerArgs += ' --time -';
    }
    if (standard) {
        fullCompilerArgs += ` --std=${standard}`;
    }
    if (buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' -g -O0';
    }
    else {
        fullCompilerArgs += ' -O3';
    }
    if (compilerArgs && compilerArgs.length > 0) {
        fullCompilerArgs += ' ' + compilerArgs.join(' ');
    }
    fullCompilerArgs += (0, unix_utils_1.gatherIncludeDirsUnix)(includePaths);
    if (linkerArgs && linkerArgs.length > 0) {
        fullLinkerArgs += ' ' + linkerArgs.join(' ');
    }
    let commandLine = '';
    const objectFiles = [];
    const fullFileArgs = [];
    const useLto = settingsProvider.useLinkTimeOptimization && buildMode === enums_1.Builds.release;
    const ltoFlag = useLto ? '--lto' : '';
    const operatingSystem = settingsProvider.operatingSystem;
    for (const file of files) {
        const fileExtension = path.parse(file).ext;
        if ((0, build_utils_1.isNonMatchingSourceFile)(language, fileExtension))
            continue;
        const fileBaseName = path.parse(file).name.replace(' ', '');
        modeDir = modeDir.replace(activeFolder, '');
        let objectFilePath;
        if (operatingSystem === enums_1.OperatingSystems.windows) {
            objectFilePath = path.join(modeDir, fileBaseName + '.obj');
        }
        else {
            objectFilePath = path.join(modeDir, fileBaseName + '.o');
        }
        if (!objectFilePath.startsWith('.')) {
            objectFilePath = '.' + objectFilePath;
        }
        const fullFileArg = (0, unix_utils_1.getUnixFileArgs)(file, ltoFlag, objectFilePath);
        objectFiles.push(objectFilePath);
        fullFileArgs.push(fullFileArg);
    }
    commandLine += (0, unix_utils_1.mergeUnixCompileFilesStr)(objectFiles, fullFileArgs, compiler, fullCompilerArgs, appendSymbol);
    const objectFilesStr = (0, unix_utils_1.getUnixObjectFilesStr)(objectFiles);
    if (objectFilesStr === '')
        return;
    executablePath = executablePath.replace(activeFolder, '');
    if (!executablePath.startsWith('.')) {
        executablePath = '.' + executablePath;
    }
    if (objectFiles.length >= params_1.LOWER_LIMIT_WILDARD_COMPILE) {
        commandLine += `${compiler} ${fullCompilerArgs}`;
        if (language === enums_1.Languages.cpp) {
            commandLine += (0, build_utils_1.GetWildcardPatterns)(files);
        }
        else {
            commandLine += ' *.c';
        }
        commandLine += ` -o ${executablePath}`;
    }
    if (objectFiles.length < params_1.LOWER_LIMIT_WILDARD_COMPILE) {
        const fullObjectFileArgs = `${ltoFlag} ${objectFilesStr} -o ${executablePath}`;
        commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullObjectFileArgs}`;
    }
    if (fullLinkerArgs && fullLinkerArgs !== '') {
        commandLine += fullLinkerArgs;
    }
    commandLine = commandLine.replace('  ', ' ');
    return commandLine;
}
exports.executeCudaBuildTask = executeCudaBuildTask;
function generateAssemblerUnixBased(settingsProvider, activeFolder, buildMode, language, files, modeDir) {
    let compiler;
    let standard;
    if (language === enums_1.Languages.cpp) {
        compiler = settingsProvider.cppCompilerPath.replace('.exe', '');
        standard = settingsProvider.cppStandard;
    }
    else {
        compiler = settingsProvider.cCompilerPath.replace('.exe', '');
        standard = settingsProvider.cStandard;
    }
    const includePaths = settingsProvider.includePaths;
    const compilerArgs = settingsProvider.compilerArgs;
    let fullCompilerArgs = '';
    if (standard) {
        fullCompilerArgs += ` --std=${standard}`;
    }
    if (buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' -g3 -O0';
    }
    else {
        fullCompilerArgs += ' -O3 -DNDEBUG';
    }
    if (compilerArgs && compilerArgs.length > 0 && !settingsProvider.useMsvc) {
        fullCompilerArgs += ' ' + compilerArgs.join(' ');
    }
    fullCompilerArgs += (0, unix_utils_1.gatherIncludeDirsUnix)(includePaths);
    const assemblerFiles = [];
    const fullFileArgs = [];
    for (const file of files) {
        const fileExtension = path.parse(file).ext;
        if (language === enums_1.Languages.c && !(0, fileUtils_1.isCSourceFile)(fileExtension)) {
            continue;
        }
        else if (language === enums_1.Languages.cpp && !(0, fileUtils_1.isCppSourceFile)(fileExtension)) {
            continue;
        }
        else if (language === enums_1.Languages.cuda) {
            continue;
        }
        const hasSpace = file.includes(' ');
        const fileBaseName = path.parse(file).name.replace(' ', '');
        modeDir = modeDir.replace(activeFolder, '');
        let assemblerFilePath = path.join(modeDir, fileBaseName + '.s');
        if (!assemblerFilePath.startsWith('.')) {
            assemblerFilePath = '.' + assemblerFilePath;
        }
        let fullFileArg;
        if (hasSpace) {
            fullFileArg = `-S -o ${assemblerFilePath} '${file}'`;
        }
        else {
            fullFileArg = `-S -o ${assemblerFilePath} ${file}`;
        }
        assemblerFiles.push(assemblerFilePath);
        fullFileArgs.push(fullFileArg);
    }
    return ` ${compiler} ${fullCompilerArgs} ${fullFileArgs}`;
}
exports.generateAssemblerUnixBased = generateAssemblerUnixBased;


/***/ }),

/***/ "./src/executor/builder/unix/gcc_clang.ts":
/*!************************************************!*\
  !*** ./src/executor/builder/unix/gcc_clang.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executeBuildTaskUnixBased = void 0;
const path = __webpack_require__(/*! path */ "path");
const params_1 = __webpack_require__(/*! ../../../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../../../types/enums */ "./src/types/enums.ts");
const build_utils_1 = __webpack_require__(/*! ../build_utils */ "./src/executor/builder/build_utils.ts");
const unix_utils_1 = __webpack_require__(/*! ./unix_utils */ "./src/executor/builder/unix/unix_utils.ts");
function executeBuildTaskUnixBased(settingsProvider, activeFolder, buildMode, language, files, modeDir, appendSymbol, executablePath, singleFileBuild) {
    let compiler;
    let standard;
    if (language === enums_1.Languages.cpp) {
        compiler = settingsProvider.cppCompilerPath.replace('.exe', '');
        standard = settingsProvider.cppStandard;
    }
    else {
        compiler = settingsProvider.cCompilerPath.replace('.exe', '');
        standard = settingsProvider.cStandard;
    }
    const useWarnings = settingsProvider.enableWarnings;
    const warningsAsErrors = settingsProvider.warningsAsError;
    let warnings = '';
    if (useWarnings) {
        warnings = settingsProvider.warnings.join(' ');
    }
    if (warningsAsErrors) {
        warnings += ' -Werror';
    }
    const includePaths = settingsProvider.includePaths;
    const compilerArgs = settingsProvider.compilerArgs;
    const linkerArgs = settingsProvider.linkerArgs;
    let fullCompilerArgs = warnings;
    let fullLinkerArgs = '';
    const useAddressSanitizer = settingsProvider.useAddressSanitizer;
    if (useAddressSanitizer && buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' -fsanitize=address';
    }
    const useUndefinedSanitizer = settingsProvider.useUndefinedSanitizer;
    if (useUndefinedSanitizer && buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' -fsanitize=undefined';
    }
    const useLeakSanitizer = settingsProvider.useLeakSanitizer;
    if (useLeakSanitizer && buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' -fsanitize=leak';
    }
    const showCompilationTime = settingsProvider.showCompilationTime;
    if (showCompilationTime) {
        fullCompilerArgs += ' -ftime-report';
    }
    if (standard) {
        fullCompilerArgs += ` --std=${standard}`;
    }
    if (buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' -g3 -O0';
    }
    else {
        fullCompilerArgs += ' -O3 -DNDEBUG';
    }
    if (compilerArgs && compilerArgs.length > 0) {
        fullCompilerArgs += ' ' + compilerArgs.join(' ');
    }
    fullCompilerArgs += (0, unix_utils_1.gatherIncludeDirsUnix)(includePaths);
    if (linkerArgs && linkerArgs.length > 0) {
        fullLinkerArgs += ' ' + linkerArgs.join(' ');
    }
    let commandLine = '';
    const objectFiles = [];
    const fullFileArgs = [];
    const useLto = settingsProvider.useLinkTimeOptimization &&
        buildMode === enums_1.Builds.release &&
        !singleFileBuild;
    const ltoFlag = useLto ? '-flto' : '';
    for (const file of files) {
        const fileExtension = path.parse(file).ext;
        if ((0, build_utils_1.isNonMatchingSourceFile)(language, fileExtension))
            continue;
        const fileBaseName = path.parse(file).name.replace(' ', '');
        modeDir = modeDir.replace(activeFolder, '');
        let objectFilePath = path.join(modeDir, fileBaseName + '.o');
        if (!objectFilePath.startsWith('.')) {
            objectFilePath = '.' + objectFilePath;
        }
        const fullFileArg = (0, unix_utils_1.getUnixFileArgs)(file, ltoFlag, objectFilePath);
        objectFiles.push(objectFilePath);
        fullFileArgs.push(fullFileArg);
    }
    commandLine += (0, unix_utils_1.mergeUnixCompileFilesStr)(objectFiles, fullFileArgs, compiler, fullCompilerArgs, appendSymbol);
    const objectFilesStr = (0, unix_utils_1.getUnixObjectFilesStr)(objectFiles);
    if (objectFilesStr === '')
        return;
    executablePath = executablePath.replace(activeFolder, '');
    if (!executablePath.startsWith('.')) {
        executablePath = '.' + executablePath;
    }
    if (objectFiles.length >= params_1.LOWER_LIMIT_WILDARD_COMPILE) {
        commandLine += `${compiler} ${fullCompilerArgs}`;
        if (language === enums_1.Languages.cpp) {
            commandLine += (0, build_utils_1.GetWildcardPatterns)(files);
        }
        else {
            commandLine += ' *.c';
        }
        commandLine += ` -o ${executablePath}`;
    }
    if (objectFiles.length < params_1.LOWER_LIMIT_WILDARD_COMPILE) {
        const fullObjectFileArgs = `${ltoFlag} ${objectFilesStr} -o ${executablePath}`;
        commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullObjectFileArgs}`;
    }
    if (fullLinkerArgs && fullLinkerArgs !== '') {
        commandLine += fullLinkerArgs;
    }
    commandLine = commandLine.replace('  ', ' ');
    return commandLine;
}
exports.executeBuildTaskUnixBased = executeBuildTaskUnixBased;


/***/ }),

/***/ "./src/executor/builder/unix/unix_utils.ts":
/*!*************************************************!*\
  !*** ./src/executor/builder/unix/unix_utils.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getUnixFileArgs = exports.gatherIncludeDirsUnix = exports.getUnixObjectFilesStr = exports.mergeUnixCompileFilesStr = void 0;
const params_1 = __webpack_require__(/*! ../../../params/params */ "./src/params/params.ts");
function mergeUnixCompileFilesStr(objectFiles, fullFileArgs, compiler, fullCompilerArgs, appendSymbol) {
    let commandLine = '';
    let idx = 0;
    if (objectFiles.length < params_1.LOWER_LIMIT_WILDARD_COMPILE) {
        for (const fullFileArg of fullFileArgs) {
            if (idx === 0) {
                commandLine += `${compiler} ${fullCompilerArgs} ${fullFileArg}`;
            }
            else {
                commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullFileArg}`;
            }
            idx++;
        }
    }
    return commandLine;
}
exports.mergeUnixCompileFilesStr = mergeUnixCompileFilesStr;
function getUnixObjectFilesStr(objectFiles) {
    let objectFilesStr = '';
    for (const objectfile of objectFiles) {
        if (objectfile.includes(' '))
            objectFilesStr += ` "${objectfile}"`;
        else
            objectFilesStr += ` ${objectfile}`;
    }
    return objectFilesStr;
}
exports.getUnixObjectFilesStr = getUnixObjectFilesStr;
function gatherIncludeDirsUnix(includePaths) {
    let args = '';
    if (includePaths && includePaths.length > 0) {
        for (const includePath of includePaths) {
            if (includePath.includes('$(default)'))
                continue;
            const hasSpace = includePath.includes(' ');
            if (hasSpace) {
                args += ` -I"${includePath}"`;
            }
            else {
                args += ` -I${includePath}`;
            }
        }
    }
    return args;
}
exports.gatherIncludeDirsUnix = gatherIncludeDirsUnix;
function getUnixFileArgs(file, ltoFlag, objectFilePath) {
    const hasSpace = file.includes(' ');
    const hasAmpersand = file.includes('&');
    if (hasSpace || hasAmpersand)
        return `${ltoFlag} -c '${file}' -o '${objectFilePath}'`;
    return `${ltoFlag} -c ${file} -o ${objectFilePath}`;
}
exports.getUnixFileArgs = getUnixFileArgs;


/***/ }),

/***/ "./src/executor/builder/win/msvc.ts":
/*!******************************************!*\
  !*** ./src/executor/builder/win/msvc.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateAssemblerMsvcBased = exports.executeBuildTaskMsvcBased = void 0;
const path = __webpack_require__(/*! path */ "path");
const params_1 = __webpack_require__(/*! ../../../params/params */ "./src/params/params.ts");
const settingsProvider_1 = __webpack_require__(/*! ../../../provider/settingsProvider */ "./src/provider/settingsProvider.ts");
const enums_1 = __webpack_require__(/*! ../../../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../../../utils/fileUtils */ "./src/utils/fileUtils.ts");
const build_utils_1 = __webpack_require__(/*! ../build_utils */ "./src/executor/builder/build_utils.ts");
const msvc_utils_1 = __webpack_require__(/*! ./msvc_utils */ "./src/executor/builder/win/msvc_utils.ts");
function executeBuildTaskMsvcBased(settingsProvider, activeFolder, buildMode, language, files, modeDir, appendSymbol, executablePath, singleFileBuild) {
    let compiler;
    let standard;
    let hadSpaces = false;
    if (language === enums_1.Languages.cpp) {
        compiler = settingsProvider_1.SettingsProvider.MSVC_COMPILER_NAME;
        standard = settingsProvider.cppStandard;
    }
    else {
        compiler = settingsProvider_1.SettingsProvider.MSVC_COMPILER_NAME;
        standard = settingsProvider.cStandard;
    }
    const useWarnings = settingsProvider.enableWarnings;
    const warningsAsErrors = settingsProvider.warningsAsError;
    let warnings = '';
    if (useWarnings) {
        warnings = settingsProvider.msvcWarnings.join(' ');
    }
    if (warningsAsErrors) {
        warnings += ' /WX';
    }
    const includePaths = settingsProvider.includePaths;
    const compilerArgs = settingsProvider.compilerArgs;
    const linkerArgs = settingsProvider.linkerArgs;
    let fullCompilerArgs = warnings;
    const useAddressSanitizer = settingsProvider.useAddressSanitizer;
    if (useAddressSanitizer && buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' /fsanitize=address';
    }
    const showCompilationTime = settingsProvider.showCompilationTime;
    if (showCompilationTime) {
        fullCompilerArgs += ' /Bt /d2cgsummary';
    }
    const old_standard = ['c89', 'c99', 'gnu89', 'gnu99'].some((ext) => settingsProvider.cStandard === ext);
    if (standard && (language === enums_1.Languages.cpp || !old_standard)) {
        fullCompilerArgs += ` /std:${standard}`;
    }
    if (language === enums_1.Languages.c) {
        if (old_standard || settingsProvider.msvcSecureNoWarnings) {
            fullCompilerArgs += ' /D_CRT_SECURE_NO_WARNINGS';
        }
    }
    else if (language === enums_1.Languages.cpp &&
        settingsProvider.msvcSecureNoWarnings) {
        fullCompilerArgs += ' /D_CRT_SECURE_NO_WARNINGS';
    }
    if (buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' /Od /Zi';
    }
    else {
        fullCompilerArgs += ' /Ox /GL /DNDEBUG';
    }
    fullCompilerArgs += ' /EHsc';
    fullCompilerArgs += (0, msvc_utils_1.gatherIncludeDirsMsvc)(includePaths);
    let fullLinkerArgs = '';
    if (linkerArgs && linkerArgs.length > 0) {
        fullLinkerArgs += ' ' + linkerArgs.join(' ');
    }
    if (fullLinkerArgs.length > 0)
        fullLinkerArgs = ' /link ' + fullLinkerArgs;
    if (settingsProvider.useLinkTimeOptimization &&
        buildMode === enums_1.Builds.release &&
        !singleFileBuild)
        fullLinkerArgs += ' /LTCG';
    if (compilerArgs && compilerArgs.length > 0) {
        fullCompilerArgs += ' ' + compilerArgs.join(' ');
    }
    let commandLine = `"${settingsProvider.msvcBatchPath}" ${settingsProvider.architecture} ${appendSymbol} `;
    modeDir = modeDir.replace(activeFolder, '.');
    executablePath = executablePath.replace(activeFolder, '.');
    const pathArgs = `/Fd${modeDir}\\ /Fo${modeDir}\\ /Fe${executablePath}`;
    const objectFiles = [];
    let fullFileArgs = '';
    for (const file of files) {
        const fileExtension = path.parse(file).ext;
        if ((0, build_utils_1.isNonMatchingSourceFile)(language, fileExtension))
            continue;
        objectFiles.push(file);
        const hasSpace = file.includes(' ');
        if (hasSpace) {
            fullFileArgs += ` "${file}"`;
            hadSpaces = true;
        }
        else {
            fullFileArgs += ` ${file}`;
        }
    }
    if (fullFileArgs === '')
        return;
    if (objectFiles.length >= params_1.LOWER_LIMIT_WILDARD_COMPILE) {
        commandLine += ` cd ${activeFolder} &&`;
        commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullLinkerArgs} `;
        if (language === enums_1.Languages.cpp) {
            commandLine += (0, build_utils_1.GetWildcardPatterns)(files);
        }
        else {
            commandLine += ' *.c';
        }
    }
    else {
        commandLine += ` cd ${activeFolder} &&`;
        commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullFileArgs} ${fullLinkerArgs}`;
    }
    if (hadSpaces) {
        commandLine = `"${commandLine}"`;
    }
    return commandLine;
}
exports.executeBuildTaskMsvcBased = executeBuildTaskMsvcBased;
function generateAssemblerMsvcBased(settingsProvider, activeFolder, buildMode, language, files, modeDir, appendSymbol) {
    let compiler;
    let standard;
    let hadSpaces = false;
    if (language === enums_1.Languages.cpp) {
        compiler = settingsProvider_1.SettingsProvider.MSVC_COMPILER_NAME;
        standard = settingsProvider.cppStandard;
    }
    else {
        compiler = settingsProvider_1.SettingsProvider.MSVC_COMPILER_NAME;
        standard = settingsProvider.cStandard;
    }
    const includePaths = settingsProvider.includePaths;
    const compilerArgs = settingsProvider.compilerArgs;
    let fullCompilerArgs = '';
    const old_standard = ['c89', 'c99', 'gnu89', 'gnu99'].some((ext) => settingsProvider.cStandard === ext);
    if (standard && (language === enums_1.Languages.cpp || !old_standard)) {
        fullCompilerArgs += ` /std:${standard}`;
    }
    if (language === enums_1.Languages.c) {
        if (old_standard) {
            fullCompilerArgs += ' /D_CRT_SECURE_NO_WARNINGS';
        }
    }
    if (buildMode === enums_1.Builds.debug) {
        fullCompilerArgs += ' /Od /Zi';
    }
    else {
        fullCompilerArgs += ' /Ox /GL /DNDEBUG';
    }
    fullCompilerArgs += ' /EHsc';
    if (includePaths && includePaths.length > 0) {
        for (const includePath of includePaths) {
            if (includePath.includes('$(default)'))
                continue;
            const hasSpace = includePath.includes(' ');
            if (hasSpace) {
                fullCompilerArgs += ` /I"${includePath}"`;
            }
            else {
                fullCompilerArgs += ` /I${includePath}`;
            }
        }
    }
    if (compilerArgs && compilerArgs.length > 0) {
        fullCompilerArgs += ' ' + compilerArgs.join(' ');
    }
    let commandLine = `"${settingsProvider.msvcBatchPath}" ${settingsProvider.architecture} ${appendSymbol} `;
    modeDir = modeDir.replace(activeFolder, '.');
    const executablePath = activeFolder + 'main.exe';
    const pathArgs = `/Fa${modeDir}\\ /Fd${modeDir}\\ /Fo${modeDir}\\ /Fe${executablePath}`;
    const assemblerFiles = [];
    let fullFileArgs = '';
    for (const file of files) {
        const fileExtension = path.parse(file).ext;
        if (language === enums_1.Languages.c && !(0, fileUtils_1.isCSourceFile)(fileExtension)) {
            continue;
        }
        else if (language === enums_1.Languages.cpp && !(0, fileUtils_1.isCppSourceFile)(fileExtension)) {
            continue;
        }
        else if (language === enums_1.Languages.cuda) {
            continue;
        }
        assemblerFiles.push(file);
        const hasSpace = file.includes(' ');
        if (hasSpace) {
            fullFileArgs += ` "${file}"`;
            hadSpaces = true;
        }
        else {
            fullFileArgs += ` ${file}`;
        }
    }
    if (fullFileArgs === '')
        return;
    commandLine += ` cd ${activeFolder} &&`;
    commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullFileArgs}`;
    if (hadSpaces) {
        commandLine = `"${commandLine}"`;
    }
    return commandLine;
}
exports.generateAssemblerMsvcBased = generateAssemblerMsvcBased;


/***/ }),

/***/ "./src/executor/builder/win/msvc_utils.ts":
/*!************************************************!*\
  !*** ./src/executor/builder/win/msvc_utils.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gatherIncludeDirsMsvc = void 0;
function gatherIncludeDirsMsvc(includePaths) {
    let args = '';
    if (includePaths && includePaths.length > 0) {
        for (const includePath of includePaths) {
            if (includePath.includes('$(default)'))
                continue;
            const hasSpace = includePath.includes(' ');
            if (hasSpace) {
                args += ` /I"${includePath}"`;
            }
            else {
                args += ` /I${includePath}`;
            }
        }
    }
    return args;
}
exports.gatherIncludeDirsMsvc = gatherIncludeDirsMsvc;


/***/ }),

/***/ "./src/executor/cleaner.ts":
/*!*********************************!*\
  !*** ./src/executor/cleaner.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executeCleanTask = void 0;
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
async function executeCleanTask(activeFolder, buildMode, workspaceFolder, operatingSystem) {
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    let relativeModeDir = modeDir.replace(workspaceFolder, '');
    relativeModeDir = (0, fileUtils_1.replaceBackslashes)(relativeModeDir);
    const commandLine = `echo Cleaning ${modeDir.replace(workspaceFolder, '.')} ...`;
    if (!(0, fileUtils_1.pathExists)(modeDir))
        return;
    (0, fileUtils_1.rmdirRecursive)(modeDir);
    if (!commandLine)
        return;
    const task_name = 'Clean';
    await (0, vscodeUtils_1.runVscodeTask)(task_name, commandLine, activeFolder, operatingSystem);
}
exports.executeCleanTask = executeCleanTask;


/***/ }),

/***/ "./src/executor/debugger.ts":
/*!**********************************!*\
  !*** ./src/executor/debugger.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runDebugger = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
const builder_1 = __webpack_require__(/*! ./builder */ "./src/executor/builder.ts");
async function runDebugger(activeFolder, workspaceFolder, buildMode, settingsProvider) {
    const uriWorkspaceFolder = vscode.Uri.file(workspaceFolder);
    const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
    const launchPath = path.join(workspaceFolder, '.vscode', 'launch.json');
    const configJson = (0, fileUtils_1.readJsonFile)(launchPath);
    if (!configJson)
        return;
    const configIdx = (0, vscodeUtils_1.getLaunchConfigIndex)(configJson, params_1.DEBUG_CONFIG_NAME);
    if (configIdx === undefined)
        return;
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    const executableName = (0, builder_1.getExecutableName)(settingsProvider.operatingSystem, buildMode);
    const executablePath = path.join(modeDir, executableName);
    if (!(0, fileUtils_1.pathExists)(modeDir) || !(0, fileUtils_1.pathExists)(executablePath))
        return;
    if (!configJson.configurations === undefined ||
        !configJson.configurations[configIdx] === undefined)
        return;
    await vscode.debug.startDebugging(folder, configJson.configurations[configIdx]);
}
exports.runDebugger = runDebugger;


/***/ }),

/***/ "./src/executor/runner.ts":
/*!********************************!*\
  !*** ./src/executor/runner.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executeRunTask = void 0;
const path = __webpack_require__(/*! path */ "path");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
async function executeRunTask(activeFolder, buildMode, argumentsString, operatingSystem) {
    const modeDir = path.join('build', buildMode);
    if (!(0, fileUtils_1.pathExists)(path.join(activeFolder, modeDir)))
        return;
    let executableName;
    let executablePath;
    if (operatingSystem === enums_1.OperatingSystems.windows) {
        executableName = `out${buildMode}.exe`;
        executablePath = `.\\${path.join(modeDir, executableName)}`;
    }
    else {
        executableName = `out${buildMode}`;
        executablePath = `./${path.join(modeDir, executableName)}`;
    }
    let commandLine = '';
    const executablePathHasSpace = executablePath.includes(' ');
    if (executablePathHasSpace) {
        commandLine = `"${executablePath}"`;
    }
    else {
        commandLine = executablePath;
    }
    if (argumentsString) {
        commandLine += ` ${argumentsString}`;
    }
    if (!commandLine)
        return;
    const task_name = 'Run';
    await (0, vscodeUtils_1.runVscodeTask)(task_name, commandLine, activeFolder, operatingSystem);
}
exports.executeRunTask = executeRunTask;


/***/ }),

/***/ "./src/extension.ts":
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = exports.extensionPath = exports.extensionState = exports.extensionContext = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const assembler_1 = __webpack_require__(/*! ./executor/assembler */ "./src/executor/assembler.ts");
const builder_1 = __webpack_require__(/*! ./executor/builder */ "./src/executor/builder.ts");
const cleaner_1 = __webpack_require__(/*! ./executor/cleaner */ "./src/executor/cleaner.ts");
const debugger_1 = __webpack_require__(/*! ./executor/debugger */ "./src/executor/debugger.ts");
const runner_1 = __webpack_require__(/*! ./executor/runner */ "./src/executor/runner.ts");
const folderHandler_1 = __webpack_require__(/*! ./handler/folderHandler */ "./src/handler/folderHandler.ts");
const modeHandler_1 = __webpack_require__(/*! ./handler/modeHandler */ "./src/handler/modeHandler.ts");
const statusBarItems_1 = __webpack_require__(/*! ./items/statusBarItems */ "./src/items/statusBarItems.ts");
const params_1 = __webpack_require__(/*! ./params/params */ "./src/params/params.ts");
const launchProvider_1 = __webpack_require__(/*! ./provider/launchProvider */ "./src/provider/launchProvider.ts");
const propertiesProvider_1 = __webpack_require__(/*! ./provider/propertiesProvider */ "./src/provider/propertiesProvider.ts");
const settingsProvider_1 = __webpack_require__(/*! ./provider/settingsProvider */ "./src/provider/settingsProvider.ts");
const enums_1 = __webpack_require__(/*! ./types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ./utils/fileUtils */ "./src/utils/fileUtils.ts");
const systemUtils_1 = __webpack_require__(/*! ./utils/systemUtils */ "./src/utils/systemUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ./utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
let folderContextMenuDisposable;
let commandHandlerDisposable;
let commandToggleStateDisposable;
let commandFolderDisposable;
let commandModeDisposable;
let commandBuildDisposable;
let commandRunDisposable;
let commandBuildSingleFileDisposable;
let commandRunCurrentSelectionDisposable;
let commandDebugCurrentSelectionDisposable;
let commandDebugDisposable;
let commandCleanDisposable;
let commandArgumentDisposable;
let commandResetDisposable;
let commanAssemblerDisposable;
let eventConfigurationDisposable;
let eventRenameFilesDisposable;
let eventDeleteFilesDisposable;
let settingsProvider;
let launchProvider;
let propertiesProvider;
let folderStatusBar;
let modeStatusBar;
let buildStatusBar;
let runStatusBar;
let debugStatusBar;
let cleanStatusBar;
let argumentsString;
let workspaceFolder;
let activeFolder;
let buildMode = enums_1.Builds.debug;
let showStatusBarItems = true;
let createExtensionFiles = true;
let updatedFileContent = false;
function activate(context) {
    if (!vscode.workspace.workspaceFolders ||
        vscode.workspace.workspaceFolders.length === 0) {
        return;
    }
    if (!vscode.workspace.workspaceFolders[0] ||
        !vscode.workspace.workspaceFolders[0].uri) {
        return;
    }
    if (vscode.workspace.workspaceFolders.length === 1) {
        workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    const cmakeFileFound = (0, vscodeUtils_1.isCmakeProject)();
    if (cmakeFileFound) {
        showStatusBarItems = false;
        createExtensionFiles = false;
    }
    exports.extensionContext = context;
    exports.extensionPath = context.extensionPath;
    exports.extensionState = context.workspaceState;
    (0, vscodeUtils_1.setContextValue)(`${params_1.EXTENSION_NAME}:activatedExtension`, true);
    (0, vscodeUtils_1.updateActivationState)(true);
    initFolderStatusBar();
    initModeStatusBar();
    initBuildStatusBar();
    initRunStatusBar();
    initDebugStatusBar();
    initCleanStatusBar();
    initAssemblerGenerator();
    initBuildSingleFile();
    initRunCurrentSelection();
    initDebugCurrentSelection();
    initWorkspaceProvider();
    initWorkspaceDisposables();
    initEventListener();
    initEditorBuildDebug();
    initEditorBuildRun();
}
exports.activate = activate;
function deactivate() {
    (0, vscodeUtils_1.setContextValue)(`${params_1.EXTENSION_NAME}:activatedExtension`, false);
    (0, vscodeUtils_1.updateActivationState)(false);
    (0, vscodeUtils_1.disposeItem)(folderStatusBar);
    (0, vscodeUtils_1.disposeItem)(modeStatusBar);
    (0, vscodeUtils_1.disposeItem)(buildStatusBar);
    (0, vscodeUtils_1.disposeItem)(runStatusBar);
    (0, vscodeUtils_1.disposeItem)(debugStatusBar);
    (0, vscodeUtils_1.disposeItem)(cleanStatusBar);
    (0, vscodeUtils_1.disposeItem)(folderContextMenuDisposable);
    (0, vscodeUtils_1.disposeItem)(commandHandlerDisposable);
    (0, vscodeUtils_1.disposeItem)(commandToggleStateDisposable);
    (0, vscodeUtils_1.disposeItem)(commandFolderDisposable);
    (0, vscodeUtils_1.disposeItem)(commandModeDisposable);
    (0, vscodeUtils_1.disposeItem)(commandBuildDisposable);
    (0, vscodeUtils_1.disposeItem)(commandRunDisposable);
    (0, vscodeUtils_1.disposeItem)(commandBuildSingleFileDisposable);
    (0, vscodeUtils_1.disposeItem)(commandRunCurrentSelectionDisposable);
    (0, vscodeUtils_1.disposeItem)(commandDebugCurrentSelectionDisposable);
    (0, vscodeUtils_1.disposeItem)(commandDebugDisposable);
    (0, vscodeUtils_1.disposeItem)(commandCleanDisposable);
    (0, vscodeUtils_1.disposeItem)(commandArgumentDisposable);
    (0, vscodeUtils_1.disposeItem)(commandResetDisposable);
    (0, vscodeUtils_1.disposeItem)(eventConfigurationDisposable);
    (0, vscodeUtils_1.disposeItem)(eventDeleteFilesDisposable);
    (0, vscodeUtils_1.disposeItem)(eventRenameFilesDisposable);
}
exports.deactivate = deactivate;
async function initWorkspaceProvider() {
    if (!workspaceFolder || !createExtensionFiles || !activeFolder)
        return;
    if (!settingsProvider) {
        settingsProvider = new settingsProvider_1.SettingsProvider(workspaceFolder, activeFolder);
        const cCompilerIsValid = await (0, systemUtils_1.checkForCompilerIsValid)(`${settingsProvider.cCompilerPath} --version`);
        const cppCompilerIsValid = await (0, systemUtils_1.checkForCompilerIsValid)(`${settingsProvider.cppCompilerPath} --version`);
        if (!cCompilerIsValid && !cppCompilerIsValid) {
            vscode.window.showErrorMessage("The compiler that you have set does not exist or wasn't installed properly.");
        }
    }
    if (!propertiesProvider) {
        propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspaceFolder, activeFolder);
    }
    if (!launchProvider) {
        launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspaceFolder, activeFolder);
    }
}
function initWorkspaceDisposables() {
    initArgumentParser();
    initContextMenuDisposable();
    initReset();
    initToggleDisposable();
}
function initToggleDisposable() {
    if (commandToggleStateDisposable)
        return;
    commandToggleStateDisposable = vscode.commands.registerCommand(`${params_1.EXTENSION_NAME}.toggleExtensionState`, () => {
        showStatusBarItems = !showStatusBarItems;
        toggleStatusBarItems();
        createExtensionFiles = !createExtensionFiles;
        if (createExtensionFiles) {
            initWorkspaceProvider();
            initWorkspaceDisposables();
            settingsProvider?.createFileData();
            propertiesProvider?.createFileData();
        }
        const extensionIsDisabled = !showStatusBarItems && !createExtensionFiles;
        if (extensionIsDisabled) {
            (0, vscodeUtils_1.setContextValue)(`${params_1.EXTENSION_NAME}:activatedExtension`, !extensionIsDisabled);
            (0, vscodeUtils_1.updateActivationState)(!extensionIsDisabled);
        }
        else {
            (0, vscodeUtils_1.setContextValue)(`${params_1.EXTENSION_NAME}:activatedExtension`, !extensionIsDisabled);
            (0, vscodeUtils_1.updateActivationState)(!extensionIsDisabled);
        }
    });
    exports.extensionContext?.subscriptions.push(commandToggleStateDisposable);
}
function initContextMenuDisposable() {
    if (folderContextMenuDisposable)
        return;
    folderContextMenuDisposable = vscode.commands.registerCommand(`${params_1.EXTENSION_NAME}.folderContextMenu`, async (clickedUriItem, selectedUriItems) => {
        if (selectedUriItems.length > 1)
            return;
        const workspaceItem = vscode.workspace.getWorkspaceFolder(clickedUriItem);
        if (!workspaceItem)
            return;
        activeFolder = clickedUriItem.fsPath;
        workspaceFolder = workspaceItem.uri.fsPath;
        updateFolderData();
    });
    exports.extensionContext?.subscriptions.push(folderContextMenuDisposable);
}
function initEventListener() {
    initConfigurationChangeDisposable();
    initFileRenameDisposable();
    initFileDeleteDisposable();
}
function initEditorBuildDebug() {
    exports.extensionContext?.subscriptions.push(vscode.commands.registerTextEditorCommand(`${params_1.EXTENSION_NAME}.BuildAndDebugFile`, async () => {
        const commandNameBuild = `${params_1.EXTENSION_NAME}.buildSingleFile`;
        await vscode.commands.executeCommand(commandNameBuild);
        const commandNameDebug = `${params_1.EXTENSION_NAME}.debugCurrentSelection`;
        await vscode.commands.executeCommand(commandNameDebug);
    }));
}
function initEditorBuildRun() {
    exports.extensionContext?.subscriptions.push(vscode.commands.registerTextEditorCommand(`${params_1.EXTENSION_NAME}.BuildAndRunFile`, async () => {
        await vscode.commands.executeCommand(`${params_1.EXTENSION_NAME}.buildSingleFile`);
        await vscode.commands.executeCommand(`${params_1.EXTENSION_NAME}.runCurrentSelection`);
    }));
}
function initConfigurationChangeDisposable() {
    if (eventConfigurationDisposable)
        return;
    eventConfigurationDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        const isChanged = e.affectsConfiguration(params_1.EXTENSION_NAME);
        const extensionIsActive = (0, vscodeUtils_1.getActivationState)();
        if (isChanged && extensionIsActive) {
            if (updatedFileContent) {
                updatedFileContent = false;
                return;
            }
            propertiesProvider?.updateFileContent();
            launchProvider?.updateFileContent();
        }
    });
    exports.extensionContext?.subscriptions.push(eventConfigurationDisposable);
}
function initFileRenameDisposable() {
    if (eventRenameFilesDisposable)
        return;
    eventRenameFilesDisposable = vscode.workspace.onDidRenameFiles((e) => {
        const extensionIsActive = (0, vscodeUtils_1.getActivationState)();
        if (!extensionIsActive)
            return;
        e.files.forEach((file) => {
            const oldName = file.oldUri.fsPath;
            const newName = file.newUri.fsPath;
            if (workspaceFolder && oldName === workspaceFolder) {
                workspaceFolder = newName;
                updateFolderData();
            }
            else if (activeFolder && oldName === activeFolder) {
                activeFolder = newName;
                updateFolderData();
            }
        });
    });
    exports.extensionContext?.subscriptions.push(eventRenameFilesDisposable);
}
function initFileDeleteDisposable() {
    if (!eventDeleteFilesDisposable)
        return;
    eventDeleteFilesDisposable = vscode.workspace.onDidDeleteFiles((e) => {
        const extensionIsActive = (0, vscodeUtils_1.getActivationState)();
        if (!extensionIsActive)
            return;
        e.files.forEach((file) => {
            const oldName = file.fsPath;
            if (workspaceFolder && oldName === workspaceFolder) {
                workspaceFolder = undefined;
                updateFolderData();
                (0, statusBarItems_1.updateFolderStatus)(folderStatusBar, workspaceFolder, activeFolder, showStatusBarItems);
            }
            else if (activeFolder && oldName === activeFolder) {
                activeFolder = undefined;
                updateFolderData();
                (0, statusBarItems_1.updateFolderStatus)(folderStatusBar, workspaceFolder, activeFolder, showStatusBarItems);
            }
        });
    });
    exports.extensionContext?.subscriptions.push(eventDeleteFilesDisposable);
}
function toggleStatusBarItems() {
    if (showStatusBarItems) {
        folderStatusBar?.show();
        modeStatusBar?.show();
        buildStatusBar?.show();
        runStatusBar?.show();
        debugStatusBar?.show();
        cleanStatusBar?.show();
    }
    else {
        folderStatusBar?.hide();
        modeStatusBar?.hide();
        buildStatusBar?.hide();
        runStatusBar?.hide();
        debugStatusBar?.hide();
        cleanStatusBar?.hide();
    }
}
function updateFolderData() {
    initWorkspaceProvider();
    initWorkspaceDisposables();
    argumentsString = '';
    if (workspaceFolder && activeFolder) {
        if (settingsProvider) {
            updatedFileContent = true;
            settingsProvider.updateFolderData(workspaceFolder);
            settingsProvider.updateFileContent();
            if (propertiesProvider) {
                propertiesProvider.updateFolderData(workspaceFolder);
            }
            if (launchProvider) {
                launchProvider.updateFolderData(workspaceFolder, activeFolder);
                launchProvider.updateModeData(buildMode);
                launchProvider.updateArgumentsData(argumentsString);
                launchProvider.updateFileContent();
            }
        }
    }
    if (folderStatusBar) {
        (0, statusBarItems_1.updateFolderStatus)(folderStatusBar, workspaceFolder, activeFolder, showStatusBarItems);
    }
    if (modeStatusBar) {
        (0, statusBarItems_1.updateModeStatus)(modeStatusBar, showStatusBarItems, activeFolder, buildMode);
    }
    if (buildStatusBar) {
        (0, statusBarItems_1.updateBuildStatus)(buildStatusBar, showStatusBarItems, activeFolder);
    }
    if (runStatusBar) {
        (0, statusBarItems_1.updateRunStatus)(runStatusBar, showStatusBarItems, activeFolder);
    }
    if (cleanStatusBar) {
        (0, statusBarItems_1.updateCleanStatus)(cleanStatusBar, showStatusBarItems, activeFolder);
    }
    if (debugStatusBar) {
        (0, statusBarItems_1.updateDebugStatus)(debugStatusBar, showStatusBarItems, activeFolder);
    }
}
function initFolderStatusBar() {
    if (folderStatusBar)
        return;
    folderStatusBar = (0, vscodeUtils_1.createStatusBarItem)();
    folderStatusBar.tooltip = 'Which Folder to Compile';
    exports.extensionContext?.subscriptions.push(folderStatusBar);
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders === undefined)
        return;
    if (workspaceFolders.length > 1)
        return;
    if (!workspaceFolders[0] || !workspaceFolders[0].uri.fsPath)
        return;
    const workspaceFolderFs = workspaceFolders[0].uri.fsPath;
    let folders = (0, fileUtils_1.foldersInDir)(workspaceFolderFs);
    folders = (0, fileUtils_1.excludePatternFromList)(settingsProvider_1.SettingsProvider.DEFAULT_EXCLUDE_SEARCH, folders);
    if (folders.length === 0) {
        workspaceFolder = workspaceFolderFs;
        activeFolder = workspaceFolderFs;
        updateFolderData();
    }
    else {
        if (workspaceFolder && !activeFolder) {
            const { files: filesFolder, language: _ } = (0, fileUtils_1.getAllSourceFilesFolderBased)(workspaceFolder);
            const { files: filesSingle, language: __ } = (0, fileUtils_1.getAllSourceFilesSingleFileBased)();
            if (filesFolder.length > 0) {
                activeFolder = workspaceFolder;
            }
            else if (filesSingle.length > 0 && filesSingle[0] !== undefined) {
                const openedFile = filesSingle[0];
                const openedFileDir = path.dirname(openedFile);
                activeFolder = openedFileDir;
            }
        }
        updateFolderData();
    }
    (0, statusBarItems_1.updateFolderStatus)(folderStatusBar, workspaceFolder, activeFolder, showStatusBarItems);
    if (commandFolderDisposable)
        return;
    const commandName = `${params_1.EXTENSION_NAME}.selectFolder`;
    commandFolderDisposable = vscode.commands.registerCommand(commandName, async () => {
        const ret = await (0, folderHandler_1.folderHandler)(settingsProvider);
        if (ret && ret.activeFolder && ret.workspaceFolder) {
            activeFolder = ret.activeFolder;
            workspaceFolder = ret.workspaceFolder;
            updateFolderData();
        }
    });
    folderStatusBar.command = commandName;
    exports.extensionContext?.subscriptions.push(commandFolderDisposable);
}
function initModeStatusBar() {
    if (modeStatusBar)
        return;
    modeStatusBar = (0, vscodeUtils_1.createStatusBarItem)();
    modeStatusBar.tooltip = 'Select Compilation Mode';
    exports.extensionContext?.subscriptions.push(modeStatusBar);
    (0, statusBarItems_1.updateModeStatus)(modeStatusBar, showStatusBarItems, activeFolder, buildMode);
    const commandName = `${params_1.EXTENSION_NAME}.selectMode`;
    commandModeDisposable = vscode.commands.registerCommand(commandName, async () => {
        const pickedMode = await (0, modeHandler_1.modeHandler)();
        if (pickedMode) {
            buildMode = pickedMode;
            (0, statusBarItems_1.updateModeStatus)(modeStatusBar, showStatusBarItems, activeFolder, buildMode);
            if (!launchProvider)
                return;
            launchProvider.updateModeData(buildMode);
            launchProvider.updateFileContent();
        }
    });
    modeStatusBar.command = commandName;
    exports.extensionContext?.subscriptions.push(commandModeDisposable);
}
function initArgumentParser() {
    if (commandArgumentDisposable)
        return;
    const commandName = `${params_1.EXTENSION_NAME}.addCmdArgs`;
    commandArgumentDisposable = vscode.commands.registerCommand(commandName, async () => {
        argumentsString = await vscode.window.showInputBox();
        launchProvider?.updateArgumentsData(argumentsString);
        launchProvider?.updateFileContent();
    });
    exports.extensionContext?.subscriptions.push(commandArgumentDisposable);
}
function initReset() {
    if (commandResetDisposable)
        return;
    const commandName = `${params_1.EXTENSION_NAME}.resetLocalSettings`;
    commandResetDisposable = vscode.commands.registerCommand(commandName, async () => {
        settingsProvider?.reset();
        propertiesProvider?.updateFileContent();
        launchProvider?.updateFileContent();
    });
    exports.extensionContext?.subscriptions.push(commandResetDisposable);
}
function initBuildStatusBar() {
    if (buildStatusBar)
        return;
    buildStatusBar = (0, vscodeUtils_1.createStatusBarItem)();
    buildStatusBar.tooltip = 'Start Compilation';
    exports.extensionContext?.subscriptions.push(buildStatusBar);
    (0, statusBarItems_1.updateBuildStatus)(buildStatusBar, showStatusBarItems, activeFolder);
    const commandName = `${params_1.EXTENSION_NAME}.buildFolder`;
    commandBuildDisposable = vscode.commands.registerCommand(commandName, async () => buildTaskCallback(false));
    buildStatusBar.command = commandName;
    exports.extensionContext?.subscriptions.push(commandBuildDisposable);
}
function initRunStatusBar() {
    if (runStatusBar)
        return;
    runStatusBar = (0, vscodeUtils_1.createStatusBarItem)();
    runStatusBar.tooltip = 'Run Executable';
    exports.extensionContext?.subscriptions.push(runStatusBar);
    (0, statusBarItems_1.updateRunStatus)(runStatusBar, showStatusBarItems, activeFolder);
    const commandName = `${params_1.EXTENSION_NAME}.runFolder`;
    commandRunDisposable = vscode.commands.registerCommand(commandName, async () => runTaskCallback());
    runStatusBar.command = commandName;
    exports.extensionContext?.subscriptions.push(commandRunDisposable);
}
function initDebugStatusBar() {
    if (debugStatusBar)
        return;
    debugStatusBar = (0, vscodeUtils_1.createStatusBarItem)();
    debugStatusBar.tooltip = 'Start Debugging';
    exports.extensionContext?.subscriptions.push(debugStatusBar);
    (0, statusBarItems_1.updateDebugStatus)(debugStatusBar, showStatusBarItems, activeFolder);
    const commandName = `${params_1.EXTENSION_NAME}.debugFolder`;
    commandDebugDisposable = vscode.commands.registerCommand(commandName, () => debugTaskCallback());
    debugStatusBar.command = commandName;
    exports.extensionContext?.subscriptions.push(commandDebugDisposable);
}
async function initCleanStatusBar() {
    if (cleanStatusBar)
        return;
    cleanStatusBar = (0, vscodeUtils_1.createStatusBarItem)();
    cleanStatusBar.tooltip = 'Clean Build';
    exports.extensionContext?.subscriptions.push(cleanStatusBar);
    (0, statusBarItems_1.updateCleanStatus)(cleanStatusBar, showStatusBarItems, activeFolder);
    const commandName = `${params_1.EXTENSION_NAME}.cleanFolder`;
    commandCleanDisposable = vscode.commands.registerCommand(commandName, async () => {
        cleanTaskCallback();
    });
    cleanStatusBar.command = commandName;
    exports.extensionContext?.subscriptions.push(commandCleanDisposable);
}
function initProviderBasedOnSingleFile() {
    const currentFile = vscode.window.activeTextEditor?.document.fileName;
    if (!currentFile)
        return;
    const currentFolder = path.dirname(currentFile);
    if (activeFolder !== currentFolder) {
        activeFolder = currentFolder;
        initWorkspaceProvider();
        updateFolderData();
    }
}
function initBuildSingleFile() {
    const commandName = `${params_1.EXTENSION_NAME}.buildSingleFile`;
    commandBuildSingleFileDisposable = vscode.commands.registerCommand(commandName, async () => {
        initProviderBasedOnSingleFile();
        buildTaskCallback(true);
    });
    exports.extensionContext?.subscriptions.push(commandBuildSingleFileDisposable);
}
function initRunCurrentSelection() {
    const commandName = `${params_1.EXTENSION_NAME}.runCurrentSelection`;
    commandRunCurrentSelectionDisposable = vscode.commands.registerCommand(commandName, async () => {
        initProviderBasedOnSingleFile();
        runTaskCallback();
    });
    exports.extensionContext?.subscriptions.push(commandRunCurrentSelectionDisposable);
}
function initDebugCurrentSelection() {
    const commandName = `${params_1.EXTENSION_NAME}.debugCurrentSelection`;
    commandDebugCurrentSelectionDisposable = vscode.commands.registerCommand(commandName, () => {
        initProviderBasedOnSingleFile();
        debugTaskCallback();
    });
    exports.extensionContext?.subscriptions.push(commandDebugCurrentSelectionDisposable);
}
function initAssemblerGenerator() {
    if (commanAssemblerDisposable)
        return;
    const commandName = `${params_1.EXTENSION_NAME}.generateAssembler`;
    commanAssemblerDisposable = vscode.commands.registerCommand(commandName, async () => {
        if (!activeFolder) {
            initProviderBasedOnSingleFile();
        }
        generateAssemblerCallback();
    });
    exports.extensionContext?.subscriptions.push(commanAssemblerDisposable);
}
async function generateAssemblerCallback() {
    if (!activeFolder)
        return;
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    if (!(0, fileUtils_1.pathExists)(modeDir))
        (0, fileUtils_1.mkdirRecursive)(modeDir);
    if (!settingsProvider)
        return;
    await (0, assembler_1.generateAssemblerCode)(settingsProvider, activeFolder, buildMode, true);
}
function fallbackToInitFolderData() {
    if (activeFolder !== undefined)
        return activeFolder;
    const currentFile = vscode.window.activeTextEditor?.document.fileName;
    if (!currentFile)
        return;
    const currentFolder = path.dirname(currentFile);
    activeFolder = currentFolder;
    updateFolderData();
    return activeFolder;
}
async function buildTaskCallback(singleFileBuild) {
    activeFolder = fallbackToInitFolderData();
    if (activeFolder === undefined)
        return;
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    if (!(0, fileUtils_1.pathExists)(modeDir))
        (0, fileUtils_1.mkdirRecursive)(modeDir);
    if (!settingsProvider)
        return;
    if (singleFileBuild && !settingsProvider.useMsvc) {
        const { files: _, language: language } = (0, fileUtils_1.getAllSourceFilesSingleFileBased)();
        if (language === enums_1.Languages.c &&
            (0, fileUtils_1.isNonRelativePath)(settingsProvider.cCompilerPath)) {
            if (!(0, fileUtils_1.pathExists)(settingsProvider.cCompilerPath)) {
                vscode.window.showErrorMessage("The C compiler (gcc/clang) that you have set does not exist or wasn't installed properly.");
                return;
            }
        }
        if (language === enums_1.Languages.cpp &&
            (0, fileUtils_1.isNonRelativePath)(settingsProvider.cppCompilerPath)) {
            if (!(0, fileUtils_1.pathExists)(settingsProvider.cppCompilerPath)) {
                vscode.window.showErrorMessage("The C++ compiler (g++/clang++) that you have set does not exist or wasn't installed properly.");
                return;
            }
        }
    }
    await (0, builder_1.executeBuildTask)(settingsProvider, activeFolder, buildMode, singleFileBuild);
}
async function runTaskCallback() {
    activeFolder = fallbackToInitFolderData();
    if (activeFolder === undefined)
        return;
    if (!settingsProvider)
        return;
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    const executableName = (0, builder_1.getExecutableName)(settingsProvider.operatingSystem, buildMode);
    const executablePath = path.join(modeDir, executableName);
    if (!(0, fileUtils_1.pathExists)(modeDir) || !(0, fileUtils_1.pathExists)(executablePath)) {
        vscode.window.showErrorMessage('The executable you want to run does not (yet) exist. You need to build it first.');
        return;
    }
    await (0, runner_1.executeRunTask)(activeFolder, buildMode, argumentsString, settingsProvider.operatingSystem);
}
async function cleanTaskCallback() {
    if (!settingsProvider ||
        !settingsProvider.operatingSystem ||
        !activeFolder ||
        !workspaceFolder) {
        return;
    }
    await (0, cleaner_1.executeCleanTask)(activeFolder, buildMode, workspaceFolder, settingsProvider.operatingSystem);
}
function debugTaskCallback() {
    if (!workspaceFolder)
        return;
    activeFolder = fallbackToInitFolderData();
    if (activeFolder === undefined || settingsProvider === undefined)
        return;
    const modeDir = (0, fileUtils_1.getBuildModeDir)(activeFolder, buildMode);
    const executableName = (0, builder_1.getExecutableName)(settingsProvider.operatingSystem, buildMode);
    const executablePath = path.join(modeDir, executableName);
    if (!(0, fileUtils_1.pathExists)(modeDir) || !(0, fileUtils_1.pathExists)(executablePath)) {
        vscode.window.showErrorMessage('The executable you want to debug does not (yet) exist. You need to build it first.');
        return;
    }
    (0, debugger_1.runDebugger)(activeFolder, workspaceFolder, buildMode, settingsProvider);
}


/***/ }),

/***/ "./src/handler/folderHandler.ts":
/*!**************************************!*\
  !*** ./src/handler/folderHandler.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.folderHandler = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const settingsProvider_1 = __webpack_require__(/*! ../provider/settingsProvider */ "./src/provider/settingsProvider.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
async function folderHandler(settingsProvider) {
    const workspacesFolders = vscode.workspace.workspaceFolders;
    if (!workspacesFolders)
        return;
    let foldersList = [];
    workspacesFolders.forEach((folder) => {
        const directories = [folder.name];
        const recursiveDirectories = (0, fileUtils_1.getDirectoriesRecursive)(folder.uri.fsPath);
        if (recursiveDirectories) {
            directories.push(...recursiveDirectories);
        }
        directories.forEach((dir) => {
            let text = dir.replace(folder.uri.fsPath, folder.name);
            text = (0, fileUtils_1.replaceBackslashes)(text);
            foldersList.push(text);
        });
        if (settingsProvider) {
            foldersList = (0, fileUtils_1.includePatternFromList)(settingsProvider.includeSearch, foldersList);
        }
        if (settingsProvider) {
            foldersList = (0, fileUtils_1.excludePatternFromList)(settingsProvider.excludeSearch, foldersList);
        }
        else {
            foldersList = (0, fileUtils_1.excludePatternFromList)(settingsProvider_1.SettingsProvider.DEFAULT_EXCLUDE_SEARCH, foldersList);
        }
        const foldersSet = new Set(foldersList);
        foldersList = Array.from(foldersSet);
        foldersList = (0, fileUtils_1.naturalSort)(foldersList);
    });
    const activeFolderStr = await vscode.window.showQuickPick(foldersList, {
        placeHolder: 'Select folder to init the C/C++ Runner extension.',
    });
    let activeFolder;
    let workspaceFolder;
    if (activeFolderStr) {
        const folderSplit = activeFolderStr.split('/');
        const workspaceName = folderSplit[0];
        workspacesFolders.forEach((folder) => {
            if (folder.name === workspaceName) {
                workspaceFolder = folder.uri.fsPath;
            }
        });
        if (workspaceFolder) {
            activeFolder = path.join(workspaceFolder, ...folderSplit.slice(1));
        }
    }
    return { activeFolder, workspaceFolder };
}
exports.folderHandler = folderHandler;


/***/ }),

/***/ "./src/handler/modeHandler.ts":
/*!************************************!*\
  !*** ./src/handler/modeHandler.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.modeHandler = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
async function modeHandler() {
    const combinations = [enums_1.Builds.debug, enums_1.Builds.release];
    const pickedCombination = await vscode.window.showQuickPick(combinations, {
        placeHolder: 'Select a build mode',
    });
    if (!pickedCombination)
        return undefined;
    const pickedMode = pickedCombination.includes(enums_1.Builds.debug)
        ? enums_1.Builds.debug
        : enums_1.Builds.release;
    return pickedMode;
}
exports.modeHandler = modeHandler;


/***/ }),

/***/ "./src/items/statusBarItems.ts":
/*!*************************************!*\
  !*** ./src/items/statusBarItems.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateCleanStatus = exports.updateDebugStatus = exports.updateRunStatus = exports.updateBuildStatus = exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
function updateFolderStatus(status, workspaceFolder, activeFolder, showStatusBarItems) {
    if (!status)
        return;
    if (workspaceFolder && activeFolder) {
        const workspaceName = path.basename(workspaceFolder);
        let text = activeFolder.replace(workspaceFolder, workspaceName);
        text = (0, fileUtils_1.replaceBackslashes)(text);
        const dirs = text.split('/');
        if (dirs.length > 2) {
            const lastElement = dirs.length - 1;
            text = `${dirs[0]}/.../${dirs[lastElement]}`;
        }
        status.backgroundColor = '';
        status.text = `$(folder-active) ${text}`;
    }
    else {
        status.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        status.text = '$(alert) Select folder.';
    }
    if (showStatusBarItems) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateFolderStatus = updateFolderStatus;
function updateModeStatus(status, showStatusBarItems, activeFolder, buildMode) {
    if (!status)
        return;
    status.text = `$(tools) ${buildMode}`;
    toggleShow(status, showStatusBarItems, activeFolder);
}
exports.updateModeStatus = updateModeStatus;
function updateBuildStatus(status, showStatusBarItems, activeFolder) {
    if (!status)
        return;
    status.text = `$(gear)`;
    toggleShow(status, showStatusBarItems, activeFolder);
}
exports.updateBuildStatus = updateBuildStatus;
function updateRunStatus(status, showStatusBarItems, activeFolder) {
    if (!status)
        return;
    status.text = `$(play)`;
    toggleShow(status, showStatusBarItems, activeFolder);
}
exports.updateRunStatus = updateRunStatus;
function updateDebugStatus(status, showStatusBarItems, activeFolder) {
    if (!status)
        return;
    status.text = `$(bug)`;
    toggleShow(status, showStatusBarItems, activeFolder);
}
exports.updateDebugStatus = updateDebugStatus;
function updateCleanStatus(status, showStatusBarItems, activeFolder) {
    if (!status)
        return;
    status.text = `$(trash)`;
    toggleShow(status, showStatusBarItems, activeFolder);
}
exports.updateCleanStatus = updateCleanStatus;
function toggleShow(status, showStatusBarItems, activeFolder) {
    if (!status)
        return;
    if (showStatusBarItems && activeFolder) {
        status.show();
    }
    else {
        status.hide();
    }
}


/***/ }),

/***/ "./src/params/params.ts":
/*!******************************!*\
  !*** ./src/params/params.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LAUNCH_OUTPUT_FILENAME = exports.LAUNCH_TEMPLATE_FILENAME = exports.PROPERTIES_INCLUDE_PATTERN = exports.PROPERTIES_OUTPUT_FILENAME = exports.PROPERTIES_TEMPLATE_FILENAME = exports.SETTINGS_OUTPUT_FILENAME = exports.STATUS_BAR_PRIORITY = exports.STATUS_BAR_ALIGN = exports.DEBUG_CONFIG_NAME = exports.APPEND_SYMBOL = exports.EXTENSION_NAME = exports.LOWER_LIMIT_WILDARD_COMPILE = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
exports.LOWER_LIMIT_WILDARD_COMPILE = 7;
exports.EXTENSION_NAME = 'C_Cpp_Runner';
exports.APPEND_SYMBOL = '&&';
exports.DEBUG_CONFIG_NAME = 'C/C++ Runner: Debug Session';
exports.STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
exports.STATUS_BAR_PRIORITY = 50;
exports.SETTINGS_OUTPUT_FILENAME = 'settings.json';
exports.PROPERTIES_TEMPLATE_FILENAME = 'properties_template.json';
exports.PROPERTIES_OUTPUT_FILENAME = 'c_cpp_properties.json';
exports.PROPERTIES_INCLUDE_PATTERN = '${workspaceFolder}/**';
exports.LAUNCH_TEMPLATE_FILENAME = 'launch_template.json';
exports.LAUNCH_OUTPUT_FILENAME = 'launch.json';


/***/ }),

/***/ "./src/provider/callbackProvider.ts":
/*!******************************************!*\
  !*** ./src/provider/callbackProvider.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CallbackProvider = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
class CallbackProvider {
    constructor(_workspaceFolder, templateFileName, outputFileName) {
        this._workspaceFolder = _workspaceFolder;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
        this._vscodeDirectory = path.join(this._workspaceFolder, '.vscode');
        this._outputPath = path.join(this._vscodeDirectory, outputFileName);
        this.createFileWatcher();
    }
    createFileWatcher() {
        const filePattern = new vscode.RelativePattern(this._workspaceFolder, '.vscode/**');
        this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(filePattern, true, true, false);
        this._fileWatcherOnChange = vscode.workspace.createFileSystemWatcher(filePattern, true, false, true);
        this._fileWatcherOnDelete.onDidDelete((e) => {
            const pathName = e.fsPath;
            if (pathName === this._vscodeDirectory || pathName === this._outputPath) {
                const extensionIsActive = (0, vscodeUtils_1.getActivationState)();
                if (extensionIsActive)
                    this.deleteCallback();
            }
        });
        this._fileWatcherOnChange.onDidChange((e) => {
            const pathName = e.fsPath;
            if (pathName === this._outputPath) {
                this.changeCallback();
            }
        });
        return;
    }
}
exports.CallbackProvider = CallbackProvider;


/***/ }),

/***/ "./src/provider/fileProvider.ts":
/*!**************************************!*\
  !*** ./src/provider/fileProvider.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileProvider = void 0;
const path = __webpack_require__(/*! path */ "path");
const extension_1 = __webpack_require__(/*! ../extension */ "./src/extension.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
const callbackProvider_1 = __webpack_require__(/*! ./callbackProvider */ "./src/provider/callbackProvider.ts");
class FileProvider extends callbackProvider_1.CallbackProvider {
    constructor(workspaceFolder, templateFileName, outputFileName) {
        super(workspaceFolder, templateFileName, outputFileName);
        const templateDirectory = path.join(extension_1.extensionPath ? extension_1.extensionPath : '', 'templates');
        if (templateFileName) {
            this.templatePath = path.join(templateDirectory, templateFileName);
        }
        if (!(0, fileUtils_1.pathExists)(this._vscodeDirectory)) {
            (0, fileUtils_1.mkdirRecursive)(this._vscodeDirectory);
        }
    }
    createFileData() {
        if (!(0, fileUtils_1.pathExists)(this._vscodeDirectory)) {
            (0, fileUtils_1.mkdirRecursive)(this._vscodeDirectory);
        }
        this.writeFileData();
    }
    updateFileContent() {
        this.writeFileData();
    }
    deleteCallback() {
        const extensionIsActive = (0, vscodeUtils_1.getActivationState)();
        if (extensionIsActive)
            this.createFileData();
    }
    _updateFolderData(_workspaceFolder) {
        this._workspaceFolder = _workspaceFolder;
        this._vscodeDirectory = path.join(this._workspaceFolder, '.vscode');
        this._outputPath = path.join(this._vscodeDirectory, this.outputFileName);
        this.createFileWatcher();
    }
}
exports.FileProvider = FileProvider;


/***/ }),

/***/ "./src/provider/launchProvider.ts":
/*!****************************************!*\
  !*** ./src/provider/launchProvider.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LaunchProvider = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const vscodeUtils_1 = __webpack_require__(/*! ../utils/vscodeUtils */ "./src/utils/vscodeUtils.ts");
const fileProvider_1 = __webpack_require__(/*! ./fileProvider */ "./src/provider/fileProvider.ts");
const settingsProvider_1 = __webpack_require__(/*! ./settingsProvider */ "./src/provider/settingsProvider.ts");
class LaunchProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspaceFolder, activeFolder) {
        super(workspaceFolder, params_1.LAUNCH_TEMPLATE_FILENAME, params_1.LAUNCH_OUTPUT_FILENAME);
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this.activeFolder = activeFolder;
        this.buildMode = enums_1.Builds.debug;
        if (!this.activeFolder) {
            this.activeFolder = this.workspaceFolder;
        }
        const updateRequired = this.updateCheck();
        if (updateRequired && activeFolder) {
            this.createFileData();
        }
    }
    updateCheck() {
        if (!(0, fileUtils_1.pathExists)(this._outputPath)) {
            return true;
        }
        else {
            const configJson = (0, fileUtils_1.readJsonFile)(this._outputPath);
            if (configJson) {
                configJson.configurations.forEach((config) => {
                    const triplet = config.name;
                    if (triplet.includes(this.settings.operatingSystem)) {
                        return true;
                    }
                });
            }
        }
        return false;
    }
    writeFileData() {
        if (!this.workspaceFolder && !this.activeFolder)
            return;
        if (!this.activeFolder) {
            this.activeFolder = this.workspaceFolder;
        }
        if (!this.templatePath)
            return;
        const launchTemplate = (0, fileUtils_1.readJsonFile)(this.templatePath);
        if (!launchTemplate)
            return;
        const is_clang_compiler = this.settings.cCompilerPath.toLowerCase().includes('clang') ||
            this.settings.cppCompilerPath.toLowerCase().includes('clang++');
        const is_clang_debugger = this.settings.debuggerPath
            .toLowerCase()
            .includes('lldb');
        if (is_clang_compiler && !is_clang_debugger) {
            vscode.window.showErrorMessage('You have to use the LLDB Debugger for the Clang/Clang++ Compiler!');
        }
        const is_windows = this.settings.operatingSystem === enums_1.OperatingSystems.windows;
        const is_windows_based_compiler = this.settings.useMsvc || is_clang_compiler;
        if (is_windows) {
            if (is_windows_based_compiler) {
                this.msvcBasedDebugger(launchTemplate);
                delete launchTemplate.configurations[0]?.externalConsole;
            }
            else if (launchTemplate.configurations[0]) {
                this.unixBasedDebugger(launchTemplate);
                delete launchTemplate.configurations[0]?.console;
                launchTemplate.configurations[0].externalConsole = true;
            }
        }
        else {
            this.unixBasedDebugger(launchTemplate);
            delete launchTemplate.configurations[0]?.console;
        }
        const launchLocal = (0, fileUtils_1.readJsonFile)(this._outputPath);
        if (!launchLocal) {
            (0, fileUtils_1.writeJsonFile)(this._outputPath, launchTemplate);
            return;
        }
        let configIdx = (0, vscodeUtils_1.getLaunchConfigIndex)(launchLocal, params_1.DEBUG_CONFIG_NAME);
        if (configIdx === undefined) {
            configIdx = launchLocal.configurations.length;
        }
        if (!launchTemplate.configurations[0])
            return;
        if (launchLocal && launchLocal.configurations.length === configIdx) {
            launchLocal.configurations.push(launchTemplate.configurations[0]);
        }
        else {
            if (!launchLocal.configurations[configIdx])
                return;
            launchLocal.configurations[configIdx] = launchTemplate.configurations[0];
        }
        (0, fileUtils_1.writeJsonFile)(this._outputPath, launchLocal);
    }
    updateFolderData(workspaceFolder, activeFolder) {
        this.activeFolder = activeFolder;
        super._updateFolderData(workspaceFolder);
    }
    updateModeData(buildMode) {
        this.buildMode = buildMode;
    }
    updateArgumentsData(argumentsString) {
        if (argumentsString === undefined)
            return;
        if (argumentsString === '') {
            this.argumentsString = [];
            return;
        }
        if (!argumentsString.includes(' ')) {
            this.argumentsString = [argumentsString];
        }
        if (!argumentsString.includes('"')) {
            this.argumentsString = argumentsString.split(' ');
            return;
        }
        const indicies = (0, fileUtils_1.getOccurenceIndicies)(argumentsString, '"');
        this.argumentsString = [];
        const strsToReplace = [];
        if (!indicies || indicies.length < 2)
            return;
        for (let i = 0; i < indicies.length; i += 2) {
            const sub = argumentsString.slice(indicies[i] + 1, indicies[i + 1]);
            this.argumentsString.push(sub);
            strsToReplace.push(sub);
        }
        for (const strReplace of strsToReplace) {
            argumentsString = argumentsString.replace(strReplace, '');
        }
        argumentsString = argumentsString.replace(/"/g, '');
        if (argumentsString.startsWith(' ')) {
            argumentsString = argumentsString.slice(1);
        }
        if (argumentsString.endsWith(' ')) {
            argumentsString = argumentsString.slice(0, argumentsString.length - 2);
        }
        this.argumentsString.push(...argumentsString.split(' ').filter((str) => Boolean(str)));
        this.argumentsString.map((str) => str.replace(/"/g, ''));
    }
    changeCallback() {
        const launchLocal = (0, fileUtils_1.readJsonFile)(this._outputPath);
        if (!launchLocal)
            return;
        const configIdx = (0, vscodeUtils_1.getLaunchConfigIndex)(launchLocal, params_1.DEBUG_CONFIG_NAME);
        if (configIdx !== undefined) {
            const currentConfig = launchLocal.configurations[configIdx];
            if (currentConfig === undefined)
                return;
        }
        else {
            this.writeFileData();
        }
    }
    msvcBasedDebugger(launchTemplate) {
        if (launchTemplate.configurations[0] === undefined)
            return;
        launchTemplate.configurations[0].name = params_1.DEBUG_CONFIG_NAME;
        delete launchTemplate.configurations[0].MIMode;
        delete launchTemplate.configurations[0].miDebuggerPath;
        delete launchTemplate.configurations[0].setupCommands;
        launchTemplate.configurations[0].type = 'cppvsdbg';
        if (this.argumentsString) {
            launchTemplate.configurations[0].args = this.argumentsString;
        }
        else {
            launchTemplate.configurations[0].args = [];
        }
        launchTemplate.configurations[0].cwd = (0, fileUtils_1.replaceBackslashes)(this.activeFolder);
        const debugPath = path.join(this.activeFolder, `build/${this.buildMode}/out${this.buildMode}`);
        launchTemplate.configurations[0].program = (0, fileUtils_1.replaceBackslashes)(debugPath);
        return launchTemplate;
    }
    unixBasedDebugger(launchTemplate) {
        if (launchTemplate.configurations[0] === undefined)
            return;
        launchTemplate.configurations[0].name = params_1.DEBUG_CONFIG_NAME;
        if (this.settings.debuggerPath) {
            launchTemplate.configurations[0].MIMode = this.settings.debuggerPath
                .toLowerCase()
                .includes(enums_1.Debuggers.gdb)
                ? enums_1.Debuggers.gdb
                : enums_1.Debuggers.lldb;
            launchTemplate.configurations[0].miDebuggerPath =
                this.settings.debuggerPath;
        }
        else {
            launchTemplate.configurations[0].MIMode =
                settingsProvider_1.SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC;
            launchTemplate.configurations[0].miDebuggerPath =
                settingsProvider_1.SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC;
        }
        if ((this.settings.debuggerPath.toLowerCase().includes('lldb') &&
            this.settings.operatingSystem === enums_1.OperatingSystems.linux) ||
            this.settings.operatingSystem === enums_1.OperatingSystems.mac) {
            launchTemplate.configurations[0].type = 'lldb';
            delete launchTemplate.configurations[0]?.setupCommands;
            delete launchTemplate.configurations[0]?.miDebuggerPath;
            delete launchTemplate.configurations[0]?.MIMode;
            delete launchTemplate.configurations[0]?.stopAtEntry;
            delete launchTemplate.configurations[0]?.externalConsole;
        }
        if (this.argumentsString && this.argumentsString.length > 0) {
            launchTemplate.configurations[0].args = this.argumentsString;
        }
        else {
            launchTemplate.configurations[0].args = [];
        }
        if (this.settings.operatingSystem === enums_1.OperatingSystems.windows) {
            launchTemplate.configurations[0].cwd = (0, fileUtils_1.replaceBackslashes)(this.activeFolder);
        }
        else {
            launchTemplate.configurations[0].cwd = this.activeFolder;
        }
        const debugPath = path.join(this.activeFolder, `build/${this.buildMode}/out${this.buildMode}`);
        if (this.settings.operatingSystem === enums_1.OperatingSystems.windows) {
            launchTemplate.configurations[0].program = (0, fileUtils_1.replaceBackslashes)(debugPath);
        }
        else {
            launchTemplate.configurations[0].program = debugPath;
        }
        return launchTemplate;
    }
}
exports.LaunchProvider = LaunchProvider;


/***/ }),

/***/ "./src/provider/propertiesProvider.ts":
/*!********************************************!*\
  !*** ./src/provider/propertiesProvider.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PropertiesProvider = void 0;
const path = __webpack_require__(/*! path */ "path");
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const systemUtils_1 = __webpack_require__(/*! ../utils/systemUtils */ "./src/utils/systemUtils.ts");
const fileProvider_1 = __webpack_require__(/*! ./fileProvider */ "./src/provider/fileProvider.ts");
const settingsProvider_1 = __webpack_require__(/*! ./settingsProvider */ "./src/provider/settingsProvider.ts");
class PropertiesProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspaceFolder, activeFolder) {
        super(workspaceFolder, params_1.PROPERTIES_TEMPLATE_FILENAME, params_1.PROPERTIES_OUTPUT_FILENAME);
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this.activeFolder = activeFolder;
        const updateRequired = this.updateCheck();
        if (updateRequired && activeFolder) {
            this.createFileData();
        }
        if ((0, fileUtils_1.pathExists)(this._outputPath)) {
            this.lastConfig = (0, fileUtils_1.readJsonFile)(this._outputPath);
        }
    }
    updateCheck() {
        if (!(0, fileUtils_1.pathExists)(this._outputPath))
            return true;
        const currentConfig = (0, fileUtils_1.readJsonFile)(this._outputPath);
        if (!currentConfig)
            return true;
        const currentConfigEntry = currentConfig.configurations[0];
        if (currentConfigEntry === undefined)
            return true;
        const triplet = currentConfigEntry.name;
        if (!triplet.includes(this.settings.operatingSystem))
            return true;
        if (this.settings.useMsvc &&
            !currentConfigEntry.intelliSenseMode.includes('msvc')) {
            return true;
        }
        return false;
    }
    async writeFileData() {
        let configLocal;
        if (!this.templatePath)
            return;
        if (!(0, fileUtils_1.pathExists)(this._outputPath)) {
            configLocal = (0, fileUtils_1.readJsonFile)(this.templatePath);
        }
        else {
            configLocal = (0, fileUtils_1.readJsonFile)(this._outputPath);
        }
        if (!configLocal)
            return;
        if (!this.settings.cCompilerPath && !this.settings.useMsvc)
            return;
        const os = this.settings.operatingSystem.toLowerCase();
        let arch;
        if (!this.settings.architecture) {
            arch = enums_1.Architectures.x64;
        }
        else {
            arch = this.settings.architecture.toLowerCase();
        }
        let compiler;
        if (this.settings.useMsvc) {
            compiler = enums_1.CompilerSystems.msvc;
        }
        else if (this.settings.cCompilerPath) {
            compiler = this.settings.cCompilerPath.toLowerCase().includes('gcc')
                ? enums_1.CompilerSystems.gcc
                : enums_1.CompilerSystems.clang;
        }
        else {
            return;
        }
        const triplet = `${os}-${compiler}-${arch}`;
        const configLocalEntry = configLocal.configurations[0];
        if (configLocalEntry === undefined)
            return;
        if (this.settings.includePaths.length > 0) {
            configLocalEntry.includePath = [params_1.PROPERTIES_INCLUDE_PATTERN];
            for (const path of this.settings.includePaths) {
                const includePathSet = new Set(configLocalEntry.includePath);
                if (!includePathSet.has(path) &&
                    path !== params_1.PROPERTIES_INCLUDE_PATTERN &&
                    !path.includes('$(default)')) {
                    configLocalEntry.includePath.push(path);
                }
            }
        }
        else {
            configLocalEntry.includePath = [params_1.PROPERTIES_INCLUDE_PATTERN];
        }
        const old_standard = ['c89', 'c99', 'gnu89', 'gnu99'].some((ext) => this.settings.cStandard === ext);
        configLocalEntry.cStandard = this.settings.cStandard
            ? this.settings.cStandard
            : this.settings.useMsvc
                ? settingsProvider_1.SettingsProvider.DEFAULT_C_STANDARD_MSVC
                : '${default}';
        if (this.settings.operatingSystem === enums_1.OperatingSystems.windows &&
            this.settings.useMsvc &&
            old_standard) {
            configLocalEntry.cStandard = 'c11';
        }
        configLocalEntry.cppStandard = this.settings.cppStandard
            ? this.settings.cppStandard
            : '${default}';
        if (this.settings.useMsvc) {
            configLocalEntry.compilerPath = path.join(this.settings.msvcToolsPath, settingsProvider_1.SettingsProvider.MSVC_COMPILER_NAME);
        }
        else {
            if ((0, fileUtils_1.pathExists)(this.settings.cCompilerPath)) {
                configLocalEntry.compilerPath = this.settings.cCompilerPath;
            }
            else {
                const ret = await (0, systemUtils_1.commandExists)(this.settings.cCompilerPath);
                if (!ret ||
                    !ret.p ||
                    ret.p.includes('perl') ||
                    ret.p.includes('ruby')) {
                    configLocalEntry.compilerPath = this.settings.cCompilerPath;
                }
                else {
                    configLocalEntry.compilerPath = (0, fileUtils_1.replaceBackslashes)(ret.p);
                }
            }
        }
        if (this.settings.isCygwin &&
            !this.settings.useMsvc &&
            this.settings.operatingSystem === enums_1.OperatingSystems.windows) {
            configLocalEntry.name = triplet.replace('windows', 'windows-cygwin');
            configLocalEntry.intelliSenseMode = triplet.replace('windows', 'linux');
        }
        else {
            configLocalEntry.name = triplet;
            configLocalEntry.intelliSenseMode = triplet;
        }
        (0, fileUtils_1.writeJsonFile)(this._outputPath, configLocal);
    }
    updateFolderData(workspaceFolder) {
        super._updateFolderData(workspaceFolder);
    }
    changeCallback() { }
}
exports.PropertiesProvider = PropertiesProvider;


/***/ }),

/***/ "./src/provider/settingsProvider.ts":
/*!******************************************!*\
  !*** ./src/provider/settingsProvider.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SettingsProvider = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/utils/fileUtils.ts");
const systemUtils_1 = __webpack_require__(/*! ../utils/systemUtils */ "./src/utils/systemUtils.ts");
const fileProvider_1 = __webpack_require__(/*! ./fileProvider */ "./src/provider/fileProvider.ts");
class SettingsProvider extends fileProvider_1.FileProvider {
    constructor(workspaceFolder, activeFolder) {
        super(workspaceFolder, undefined, params_1.SETTINGS_OUTPUT_FILENAME);
        this.workspaceFolder = workspaceFolder;
        this.activeFolder = activeFolder;
        this._configGlobal = vscode.workspace.getConfiguration(params_1.EXTENSION_NAME);
        this.operatingSystem = (0, systemUtils_1.getOperatingSystem)();
        this.isCygwin = false;
        this.cCompilerPath = SettingsProvider.DEFAULT_C_COMPILER_PATH_NON_MAC;
        this.cppCompilerPath = SettingsProvider.DEFAULT_CPP_COMPILER_PATH_NON_MAC;
        this.debuggerPath = SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC;
        this.msvcBatchPath = SettingsProvider.DEFAULT_MSVC_BATCH_PATH;
        this.msvcToolsPath = SettingsProvider.DEFAULT_MSVC_TOOLS_PATH;
        this.useMsvc = SettingsProvider.DEFAULT_USE_MSVC;
        this.cStandard = SettingsProvider.DEFAULT_C_STANDARD_UNIX;
        this.cppStandard = SettingsProvider.DEFAULT_CPP_STANDARD;
        this.compilerArgs = SettingsProvider.DEFAULT_COMPILER_ARGS;
        this.linkerArgs = SettingsProvider.DEFAULT_LINKER_ARGS;
        this.includePaths = SettingsProvider.DEFAULT_INCLUDE_PATHS;
        this.includeSearch = SettingsProvider.DEFAULT_INCLUDE_SEARCH;
        this.excludeSearch = SettingsProvider.DEFAULT_EXCLUDE_SEARCH;
        this.enableWarnings = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
        this.warningsAsError = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
        this.warnings = SettingsProvider.DEFAULT_WARNINGS_UNIX;
        this.msvcWarnings = SettingsProvider.DEFAULT_WARNINGS_MSVC;
        this.useAddressSanitizer = SettingsProvider.DEFAULT_MEMORY_SANITIZER;
        this.useUndefinedSanitizer = SettingsProvider.DEFAULT_UNDEFINED_SANITIZER;
        this.useLeakSanitizer = SettingsProvider.DEFAULT_LEAK_SANITIZER;
        this.showCompilationTime = SettingsProvider.DEFAULT_SHOW_COMPILATION_TIME;
        this.useLinkTimeOptimization = SettingsProvider.DEFAULT_USE_LTO;
        this.msvcSecureNoWarnings = SettingsProvider.DEFAULT_MSVC_SECURE_NO_WARNINGS;
        this.cCompilerPath =
            this.operatingSystem !== enums_1.OperatingSystems.mac
                ? SettingsProvider.DEFAULT_C_COMPILER_PATH_NON_MAC
                : SettingsProvider.DEFAULT_C_COMPILER_PATH_MAC;
        this.cppCompilerPath =
            this.operatingSystem !== enums_1.OperatingSystems.mac
                ? SettingsProvider.DEFAULT_CPP_COMPILER_PATH_NON_MAC
                : SettingsProvider.DEFAULT_CPP_COMPILER_PATH_MAC;
        this.debuggerPath =
            this.operatingSystem !== enums_1.OperatingSystems.mac
                ? SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC
                : SettingsProvider.DEFAULT_DEBUGGER_PATH_MAC;
        const settingsFileMissing = this.localFileExist('settings.json');
        const settingsMissing = this.updateCheck();
        const propertiesFileMissing = this.localFileExist('c_cpp_properties.json');
        const allInfoMissing = settingsMissing && propertiesFileMissing && activeFolder;
        const onlySettingsMissing = settingsFileMissing && !propertiesFileMissing && activeFolder;
        if (allInfoMissing) {
            this.loadGlobalSettings();
            this.createFileData();
            this.getArchitecture();
            return;
        }
        if (onlySettingsMissing) {
            this.getSettingsFromProperties();
            this.createFileData();
            this.getArchitecture();
            return;
        }
        if (activeFolder) {
            this.loadLocalSettings();
            this.getArchitecture();
            return;
        }
    }
    updateCheck() {
        if (!(0, fileUtils_1.pathExists)(this._outputPath)) {
            return true;
        }
        else if (!this.commandsAlreadyStored()) {
            return true;
        }
        return false;
    }
    localFileExist(name) {
        let settingsFileMissing = false;
        const settingsPath = path.join(this._vscodeDirectory, name);
        if (!(0, fileUtils_1.pathExists)(settingsPath)) {
            settingsFileMissing = true;
        }
        return settingsFileMissing;
    }
    commandsAlreadyStored() {
        if ((0, fileUtils_1.pathExists)(this._outputPath)) {
            const settingsJson = (0, fileUtils_1.readJsonFile)(this._outputPath);
            if (!settingsJson)
                return false;
            if ((0, fileUtils_1.localSettingExist)(`${params_1.EXTENSION_NAME}.cCompilerPath`, settingsJson) &&
                (0, fileUtils_1.localSettingExist)(`${params_1.EXTENSION_NAME}.cppCompilerPath`, settingsJson) &&
                (0, fileUtils_1.localSettingExist)(`${params_1.EXTENSION_NAME}.debuggerPath`, settingsJson)) {
                return true;
            }
        }
        return false;
    }
    writeFileData() {
        this.storeSettings();
    }
    deleteCallback() {
        this.storeSettings();
    }
    changeCallback() {
        this.loadLocalSettings();
    }
    updateFolderData(workspaceFolder) {
        super._updateFolderData(workspaceFolder);
    }
    loadLocalSettings() {
        const settingsLocal = (0, fileUtils_1.readJsonFile)(this._outputPath);
        this.cCompilerPath = this.getSettingsValue(settingsLocal, 'cCompilerPath', this.operatingSystem !== enums_1.OperatingSystems.mac
            ? SettingsProvider.DEFAULT_C_COMPILER_PATH_NON_MAC
            : SettingsProvider.DEFAULT_C_COMPILER_PATH_MAC);
        this.cppCompilerPath = this.getSettingsValue(settingsLocal, 'cppCompilerPath', this.operatingSystem !== enums_1.OperatingSystems.mac
            ? SettingsProvider.DEFAULT_CPP_COMPILER_PATH_NON_MAC
            : SettingsProvider.DEFAULT_CPP_COMPILER_PATH_MAC);
        this.debuggerPath = this.getSettingsValue(settingsLocal, 'debuggerPath', this.operatingSystem !== enums_1.OperatingSystems.mac
            ? SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC
            : SettingsProvider.DEFAULT_DEBUGGER_PATH_MAC);
        this.msvcBatchPath = this.getSettingsValue(settingsLocal, 'msvcBatchPath', SettingsProvider.DEFAULT_MSVC_BATCH_PATH);
        const isMsvcPathNotSet = this.msvcBatchPath === SettingsProvider.DEFAULT_MSVC_BATCH_PATH ||
            this.msvcBatchPath === '';
        if (this.operatingSystem === enums_1.OperatingSystems.windows && isMsvcPathNotSet) {
            if ((0, fileUtils_1.pathExists)(this.msvcBatchPath.replace('VR_NR', '2022'))) {
                this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2022');
                this.update('msvcBatchPath', this.msvcBatchPath);
            }
            else if ((0, fileUtils_1.pathExists)(this.msvcBatchPath.replace('VR_NR', '2017'))) {
                this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2017');
                this.update('msvcBatchPath', this.msvcBatchPath);
            }
            else if ((0, fileUtils_1.pathExists)(this.msvcBatchPath.replace('VR_NR', '2015'))) {
                this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2015');
                this.update('msvcBatchPath', this.msvcBatchPath);
            }
            else if ((0, fileUtils_1.pathExists)(this.msvcBatchPath.replace('VR_NR', '2013'))) {
                this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2013');
                this.update('msvcBatchPath', this.msvcBatchPath);
            }
        }
        else if (this.operatingSystem !== enums_1.OperatingSystems.windows &&
            this.msvcBatchPath !== '') {
            this.msvcBatchPath = '';
            this.update('msvcBatchPath', this.msvcBatchPath);
        }
        if (this.operatingSystem === enums_1.OperatingSystems.windows) {
            this.useMsvc = this.getSettingsValue(settingsLocal, 'useMsvc', SettingsProvider.DEFAULT_USE_MSVC);
        }
        else {
            this.useMsvc = false;
        }
        if (this.operatingSystem === enums_1.OperatingSystems.windows && this.useMsvc) {
            this.searchMsvcToolsPath();
        }
        this.enableWarnings = this.getSettingsValue(settingsLocal, 'enableWarnings', SettingsProvider.DEFAULT_ENABLE_WARNINGS);
        this.warnings = this.getSettingsValue(settingsLocal, 'warnings', SettingsProvider.DEFAULT_WARNINGS_UNIX);
        this.msvcWarnings = this.getSettingsValue(settingsLocal, 'msvcWarnings', SettingsProvider.DEFAULT_WARNINGS_MSVC);
        this.warningsAsError = this.getSettingsValue(settingsLocal, 'warningsAsError', SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS);
        this.cStandard = this.getSettingsValue(settingsLocal, 'cStandard', SettingsProvider.DEFAULT_C_STANDARD_UNIX);
        this.cppStandard = this.getSettingsValue(settingsLocal, 'cppStandard', SettingsProvider.DEFAULT_CPP_STANDARD);
        this.compilerArgs = this.getSettingsValue(settingsLocal, 'compilerArgs', SettingsProvider.DEFAULT_COMPILER_ARGS);
        this.linkerArgs = this.getSettingsValue(settingsLocal, 'linkerArgs', SettingsProvider.DEFAULT_LINKER_ARGS);
        this.includePaths = this.getSettingsValue(settingsLocal, 'includePaths', SettingsProvider.DEFAULT_INCLUDE_PATHS);
        this.includeSearch = this.getSettingsValue(settingsLocal, 'includeSearch', SettingsProvider.DEFAULT_INCLUDE_SEARCH);
        this.excludeSearch = this.getSettingsValue(settingsLocal, 'excludeSearch', SettingsProvider.DEFAULT_EXCLUDE_SEARCH);
        this.useAddressSanitizer = this.getSettingsValue(settingsLocal, 'useAddressSanitizer', SettingsProvider.DEFAULT_MEMORY_SANITIZER);
        this.useUndefinedSanitizer = this.getSettingsValue(settingsLocal, 'useUndefinedSanitizer', SettingsProvider.DEFAULT_UNDEFINED_SANITIZER);
        this.useLeakSanitizer = this.getSettingsValue(settingsLocal, 'useLeakSanitizer', SettingsProvider.DEFAULT_LEAK_SANITIZER);
        this.showCompilationTime = this.getSettingsValue(settingsLocal, 'showCompilationTime', SettingsProvider.DEFAULT_SHOW_COMPILATION_TIME);
        this.useLinkTimeOptimization = this.getSettingsValue(settingsLocal, 'useLinkTimeOptimization', SettingsProvider.DEFAULT_USE_LTO);
        this.msvcSecureNoWarnings = this.getSettingsValue(settingsLocal, 'msvcSecureNoWarnings', SettingsProvider.DEFAULT_MSVC_SECURE_NO_WARNINGS);
    }
    getSettingsFromProperties() {
        const propertiesPath = path.join(this._vscodeDirectory, 'c_cpp_properties.json');
        const propertiesConfig = (0, fileUtils_1.readJsonFile)(propertiesPath);
        if (!propertiesConfig)
            return;
        const currentConfigEntry = propertiesConfig.configurations[0];
        if (!currentConfigEntry)
            return;
        this.cCompilerPath = this.getPropertiesValue(currentConfigEntry, 'compilerPath', this.cCompilerPath);
        const isGccBased = this.cCompilerPath.includes(enums_1.CompilerSystems.gcc);
        const isClangBased = this.cCompilerPath.includes(enums_1.CompilerSystems.clang);
        if (isGccBased) {
            const cppPath = this.cCompilerPath.replace('gcc', 'g++');
            const dbgPath = this.cCompilerPath.replace('gcc', 'gdb');
            this.cppCompilerPath = cppPath;
            this.debuggerPath = dbgPath;
        }
        else if (isClangBased) {
            const cppPath = this.cCompilerPath.replace('clang', 'clang++');
            const dbgPath = this.cCompilerPath.replace('clang', 'lldb');
            this.cppCompilerPath = path.join(cppPath);
            this.debuggerPath = dbgPath;
        }
        const _cStandard = this.getPropertiesValue(currentConfigEntry, 'cStandard', this.cStandard);
        this.cStandard =
            _cStandard !== '${default}'
                ? _cStandard
                : SettingsProvider.DEFAULT_C_STANDARD_UNIX;
        const _cppStandard = this.getPropertiesValue(currentConfigEntry, 'cppStandard', this.cppStandard);
        this.cppStandard =
            _cppStandard !== '${default}'
                ? _cppStandard
                : SettingsProvider.DEFAULT_CPP_STANDARD;
        const _includePaths = this.getPropertiesValue(currentConfigEntry, 'includePath', this.includePaths);
        this.includePaths =
            _includePaths.length !== 0
                ? _includePaths
                : SettingsProvider.DEFAULT_INCLUDE_PATHS;
    }
    searchMsvcToolsPath() {
        let msvcBasePath = this.msvcBatchPath.split('VC')[0];
        if (!msvcBasePath)
            return;
        msvcBasePath += 'VC/Tools/MSVC';
        const installed_versions = (0, fileUtils_1.foldersInDir)(msvcBasePath);
        const newst_version_path = installed_versions[installed_versions.length - 1];
        if (installed_versions.length === 0 || !newst_version_path)
            return;
        const newst_version_path_splitted = newst_version_path.split('\\');
        if (newst_version_path_splitted.length === 0)
            return;
        const versionNumber = newst_version_path_splitted[newst_version_path_splitted.length - 1];
        if (!versionNumber)
            return;
        let architecturePath;
        if (this.architecture === enums_1.Architectures.x64 ||
            this.architecture === undefined) {
            architecturePath = 'bin/Hostx64/x64';
        }
        else {
            architecturePath = 'bin/Hostx86/x86';
        }
        if (!(0, fileUtils_1.pathExists)(architecturePath))
            return;
        this.msvcToolsPath = path.join(msvcBasePath, versionNumber, architecturePath);
    }
    getArchitecture() {
        if (this.useMsvc && this.operatingSystem === enums_1.OperatingSystems.windows) {
            this.architecture = enums_1.Architectures.x64;
            this.isCygwin = false;
            return;
        }
        if (this.cCompilerPath) {
            const ret = (0, systemUtils_1.getCompilerArchitecture)(this.cCompilerPath);
            this.architecture = ret.architecture;
            this.isCygwin = ret.isCygwin;
            return;
        }
        if (this.cppCompilerPath) {
            const ret = (0, systemUtils_1.getCompilerArchitecture)(this.cppCompilerPath);
            this.architecture = ret.architecture;
            this.isCygwin = ret.isCygwin;
            return;
        }
        this.architecture = enums_1.Architectures.x64;
        this.isCygwin = false;
    }
    reset() {
        this.loadGlobalSettings();
        this.storeSettings();
    }
    loadGlobalSettings() {
        this.cCompilerPath = this.getGlobalSettingsValue('cCompilerPath', this.operatingSystem !== enums_1.OperatingSystems.mac
            ? SettingsProvider.DEFAULT_C_COMPILER_PATH_NON_MAC
            : SettingsProvider.DEFAULT_C_COMPILER_PATH_MAC);
        this.cppCompilerPath = this.getGlobalSettingsValue('cppCompilerPath', this.operatingSystem !== enums_1.OperatingSystems.mac
            ? SettingsProvider.DEFAULT_CPP_COMPILER_PATH_NON_MAC
            : SettingsProvider.DEFAULT_CPP_COMPILER_PATH_MAC);
        this.debuggerPath = this.getGlobalSettingsValue('debuggerPath', this.operatingSystem !== enums_1.OperatingSystems.mac
            ? SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC
            : SettingsProvider.DEFAULT_DEBUGGER_PATH_MAC);
        this.msvcBatchPath = this.getGlobalSettingsValue('msvcBatchPath', SettingsProvider.DEFAULT_MSVC_BATCH_PATH);
        this.msvcToolsPath = this.getGlobalSettingsValue('msvcToolsPath', SettingsProvider.DEFAULT_MSVC_TOOLS_PATH);
        this.useMsvc = this.getGlobalSettingsValue('useMsvc', SettingsProvider.DEFAULT_USE_MSVC);
        this.enableWarnings = this.getGlobalSettingsValue('enableWarnings', SettingsProvider.DEFAULT_ENABLE_WARNINGS);
        this.warnings = this.getGlobalSettingsValue('warnings', SettingsProvider.DEFAULT_WARNINGS_UNIX);
        this.msvcWarnings = this.getGlobalSettingsValue('msvcWarnings', SettingsProvider.DEFAULT_WARNINGS_MSVC);
        this.enableWarnings = this.getGlobalSettingsValue('enableWarnings', SettingsProvider.DEFAULT_ENABLE_WARNINGS);
        this.warningsAsError = this.getGlobalSettingsValue('warningsAsError', SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS);
        this.cStandard = this.getGlobalSettingsValue('cStandard', SettingsProvider.DEFAULT_C_STANDARD_UNIX);
        this.cppStandard = this.getGlobalSettingsValue('cppStandard', SettingsProvider.DEFAULT_CPP_STANDARD);
        this.compilerArgs = this.getGlobalSettingsValue('compilerArgs', SettingsProvider.DEFAULT_COMPILER_ARGS);
        this.linkerArgs = this.getGlobalSettingsValue('linkerArgs', SettingsProvider.DEFAULT_LINKER_ARGS);
        this.includePaths = this.getGlobalSettingsValue('includePaths', SettingsProvider.DEFAULT_INCLUDE_PATHS);
        this.excludeSearch = this.getGlobalSettingsValue('excludeSearch', SettingsProvider.DEFAULT_EXCLUDE_SEARCH);
        this.useAddressSanitizer = this.getGlobalSettingsValue('useAddressSanitizer', SettingsProvider.DEFAULT_MEMORY_SANITIZER);
        this.useUndefinedSanitizer = this.getGlobalSettingsValue('useUndefinedSanitizer', SettingsProvider.DEFAULT_UNDEFINED_SANITIZER);
        this.useLeakSanitizer = this.getGlobalSettingsValue('useLeakSanitizer', SettingsProvider.DEFAULT_LEAK_SANITIZER);
        this.showCompilationTime = this.getGlobalSettingsValue('showCompilationTime', SettingsProvider.DEFAULT_SHOW_COMPILATION_TIME);
        this.useLinkTimeOptimization = this.getGlobalSettingsValue('useLinkTimeOptimization', SettingsProvider.DEFAULT_USE_LTO);
        this.msvcSecureNoWarnings = this.getGlobalSettingsValue('msvcSecureNoWarnings', SettingsProvider.DEFAULT_MSVC_SECURE_NO_WARNINGS);
    }
    storeSettings() {
        let settingsJson = (0, fileUtils_1.readJsonFile)(this._outputPath);
        if (!settingsJson)
            settingsJson = {};
        this.updateKeyBasedOnEnv(settingsJson, 'cCompilerPath', this.cCompilerPath);
        this.updateKeyBasedOnEnv(settingsJson, 'cppCompilerPath', this.cppCompilerPath);
        this.updateKeyBasedOnEnv(settingsJson, 'debuggerPath', this.debuggerPath);
        this.updateKey(settingsJson, 'cStandard', this.cStandard);
        this.updateKey(settingsJson, 'cppStandard', this.cppStandard);
        this.updateKey(settingsJson, 'msvcBatchPath', this.msvcBatchPath);
        this.updateKey(settingsJson, 'useMsvc', this.useMsvc);
        this.updateKey(settingsJson, 'warnings', this.warnings);
        this.updateKey(settingsJson, 'msvcWarnings', this.msvcWarnings);
        this.updateKey(settingsJson, 'enableWarnings', this.enableWarnings);
        this.updateKey(settingsJson, 'warningsAsError', this.warningsAsError);
        this.updateKey(settingsJson, 'compilerArgs', this.compilerArgs);
        this.updateKey(settingsJson, 'linkerArgs', this.linkerArgs);
        this.updateKey(settingsJson, 'includePaths', this.includePaths);
        this.updateKey(settingsJson, 'includeSearch', this.includeSearch);
        this.updateKey(settingsJson, 'excludeSearch', this.excludeSearch);
        this.updateKey(settingsJson, 'useAddressSanitizer', this.useAddressSanitizer);
        this.updateKey(settingsJson, 'useUndefinedSanitizer', this.useUndefinedSanitizer);
        this.updateKey(settingsJson, 'useLeakSanitizer', this.useLeakSanitizer);
        this.updateKey(settingsJson, 'showCompilationTime', this.showCompilationTime);
        this.updateKey(settingsJson, 'useLinkTimeOptimization', this.useLinkTimeOptimization);
        this.updateKey(settingsJson, 'msvcSecureNoWarnings', this.msvcSecureNoWarnings);
        (0, fileUtils_1.writeJsonFile)(this._outputPath, settingsJson);
    }
    getGlobalSettingsValue(name, defaultValue) {
        const fullSettingInfo = this._configGlobal.inspect(name);
        return fullSettingInfo?.globalValue
            ? fullSettingInfo.globalValue
            : defaultValue;
    }
    getSettingsValue(settingsLocal, name, defaultValue) {
        const settingName = `${params_1.EXTENSION_NAME}.${name}`;
        if (settingsLocal && settingsLocal[settingName] !== undefined) {
            return settingsLocal[settingName];
        }
        return this.getGlobalSettingsValue(name, defaultValue);
    }
    getPropertiesValue(properties, name, defaultValue) {
        if (properties && properties[name] !== undefined) {
            return properties[name];
        }
        return defaultValue;
    }
    update(key, value) {
        let settingsJson = (0, fileUtils_1.readJsonFile)(this._outputPath);
        if (!settingsJson)
            settingsJson = {};
        const settingName = `${params_1.EXTENSION_NAME}.${key}`;
        settingsJson[settingName] = value;
        (0, fileUtils_1.writeJsonFile)(this._outputPath, settingsJson);
    }
    updateKey(settingsJson, key, value) {
        const settingName = `${params_1.EXTENSION_NAME}.${key}`;
        settingsJson[settingName] = value;
    }
    updateKeyBasedOnEnv(settingsJson, settingsName, settingsValue) {
        if (this.operatingSystem === enums_1.OperatingSystems.windows) {
            this.updateKey(settingsJson, settingsName, (0, fileUtils_1.replaceBackslashes)(settingsValue));
        }
        else {
            this.updateKey(settingsJson, settingsName, settingsValue);
        }
    }
}
exports.SettingsProvider = SettingsProvider;
SettingsProvider.DEFAULT_C_COMPILER_PATH_NON_MAC = 'gcc';
SettingsProvider.DEFAULT_C_COMPILER_PATH_MAC = 'clang';
SettingsProvider.DEFAULT_CPP_COMPILER_PATH_NON_MAC = 'g++';
SettingsProvider.DEFAULT_CPP_COMPILER_PATH_MAC = 'clang++';
SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC = 'gdb';
SettingsProvider.DEFAULT_DEBUGGER_PATH_MAC = 'lldb';
SettingsProvider.DEFAULT_MSVC_BATCH_PATH = 'C:/Program Files/Microsoft Visual Studio/' +
    'VR_NR/Community/VC/Auxiliary/Build/vcvarsall.bat';
SettingsProvider.DEFAULT_MSVC_TOOLS_PATH = '';
SettingsProvider.DEFAULT_C_STANDARD_UNIX = '';
SettingsProvider.DEFAULT_C_STANDARD_MSVC = 'c11';
SettingsProvider.DEFAULT_CPP_STANDARD = '';
SettingsProvider.DEFAULT_INCLUDE_SEARCH = ['*', '**/*'];
SettingsProvider.DEFAULT_EXCLUDE_SEARCH = [
    '**/build',
    '**/build/**',
    '**/.*',
    '**/.*/**',
    '**/.vscode',
    '**/.vscode/**',
];
SettingsProvider.DEFAULT_ENABLE_WARNINGS = true;
SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS = false;
SettingsProvider.DEFAULT_MEMORY_SANITIZER = false;
SettingsProvider.DEFAULT_UNDEFINED_SANITIZER = false;
SettingsProvider.DEFAULT_LEAK_SANITIZER = false;
SettingsProvider.DEFAULT_SHOW_COMPILATION_TIME = false;
SettingsProvider.DEFAULT_USE_LTO = false;
SettingsProvider.DEFAULT_MSVC_SECURE_NO_WARNINGS = false;
SettingsProvider.DEFAULT_WARNINGS_UNIX = [
    '-Wall',
    '-Wextra',
    '-Wpedantic',
    '-Wshadow',
    '-Wformat=2',
    '-Wcast-align',
    '-Wconversion',
    '-Wsign-conversion',
    '-Wnull-dereference',
];
SettingsProvider.DEFAULT_WARNINGS_MSVC = [
    '/W4',
    '/permissive-',
    '/w14242',
    '/w14287',
    '/w14296',
    '/w14311',
    '/w14826',
    '/w44062',
    '/w44242',
    '/w14905',
    '/w14906',
    '/w14263',
    '/w44265',
    '/w14928',
];
SettingsProvider.DEFAULT_COMPILER_ARGS = [];
SettingsProvider.DEFAULT_LINKER_ARGS = [];
SettingsProvider.DEFAULT_INCLUDE_PATHS = [];
SettingsProvider.DEFAULT_USE_MSVC = false;
SettingsProvider.MSVC_COMPILER_NAME = 'cl.exe';


/***/ }),

/***/ "./src/types/enums.ts":
/*!****************************!*\
  !*** ./src/types/enums.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Builds = exports.Architectures = exports.OperatingSystems = exports.Debuggers = exports.CompilerSystems = exports.Languages = void 0;
var Languages;
(function (Languages) {
    Languages["c"] = "C";
    Languages["cpp"] = "Cpp";
    Languages["cuda"] = "Cuda";
})(Languages = exports.Languages || (exports.Languages = {}));
var CompilerSystems;
(function (CompilerSystems) {
    CompilerSystems["gcc"] = "gcc";
    CompilerSystems["clang"] = "clang";
    CompilerSystems["msvc"] = "msvc";
})(CompilerSystems = exports.CompilerSystems || (exports.CompilerSystems = {}));
var Debuggers;
(function (Debuggers) {
    Debuggers["lldb"] = "lldb";
    Debuggers["gdb"] = "gdb";
})(Debuggers = exports.Debuggers || (exports.Debuggers = {}));
var OperatingSystems;
(function (OperatingSystems) {
    OperatingSystems["windows"] = "windows";
    OperatingSystems["linux"] = "linux";
    OperatingSystems["mac"] = "macos";
})(OperatingSystems = exports.OperatingSystems || (exports.OperatingSystems = {}));
var Architectures;
(function (Architectures) {
    Architectures["x86"] = "x86";
    Architectures["x64"] = "x64";
    Architectures["ARM64"] = "ARM64";
})(Architectures = exports.Architectures || (exports.Architectures = {}));
var Builds;
(function (Builds) {
    Builds["debug"] = "Debug";
    Builds["release"] = "Release";
})(Builds = exports.Builds || (exports.Builds = {}));


/***/ }),

/***/ "./src/utils/fileUtils.ts":
/*!********************************!*\
  !*** ./src/utils/fileUtils.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isNonRelativePath = exports.getBuildModeDir = exports.getAllSourceFilesInDir = exports.getAllSourceFilesSingleFileBased = exports.getAllSourceFilesFolderBased = exports.getOccurenceIndicies = exports.getBasename = exports.removeExtension = exports.hasPathSeperators = exports.localSettingExist = exports.naturalSort = exports.writeJsonFile = exports.readJsonFile = exports.foldersInDir = exports.excludePatternFromList = exports.includePatternFromList = exports.filesInDir = exports.readDir = exports.getDirectoriesRecursive = exports.getLanguage = exports.isCudaSourceFile = exports.isCSourceFile = exports.isCppSourceFile = exports.isHeaderFile = exports.addFileExtensionDot = exports.isSourceFile = exports.pathIsRelative = exports.pathIsAbsolute = exports.pathExists = exports.filterOnString = exports.rmdirRecursive = exports.mkdirRecursive = exports.replaceBackslashes = void 0;
const fs = __webpack_require__(/*! fs */ "fs");
const JSON5 = __webpack_require__(/*! json5 */ "./node_modules/json5/lib/index.js");
const minimatch = __webpack_require__(/*! minimatch */ "./node_modules/minimatch/minimatch.js");
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
function replaceBackslashes(text) {
    return text.replace(/\\/g, '/');
}
exports.replaceBackslashes = replaceBackslashes;
function mkdirRecursive(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
    }
    catch (err) { }
}
exports.mkdirRecursive = mkdirRecursive;
function rmdirRecursive(dir) {
    try {
        fs.rmdirSync(dir, { recursive: true });
    }
    catch (err) { }
}
exports.rmdirRecursive = rmdirRecursive;
function filterOnString(names, filterName) {
    return names.filter((name) => !name.includes(filterName));
}
exports.filterOnString = filterOnString;
function pathExists(filepath) {
    try {
        fs.accessSync(filepath);
    }
    catch (err) {
        return false;
    }
    return true;
}
exports.pathExists = pathExists;
function pathIsAbsolute(filepath) {
    return path.isAbsolute(filepath);
}
exports.pathIsAbsolute = pathIsAbsolute;
function pathIsRelative(filepath) {
    return !pathIsAbsolute(filepath);
}
exports.pathIsRelative = pathIsRelative;
function isSourceFile(fileExt) {
    const fileExtLower = fileExt.toLowerCase();
    if (isHeaderFile(fileExtLower)) {
        return false;
    }
    if (!isCSourceFile(fileExtLower) &&
        !isCppSourceFile(fileExtLower) &&
        !isCudaSourceFile(fileExtLower)) {
        return false;
    }
    return true;
}
exports.isSourceFile = isSourceFile;
function addFileExtensionDot(fileExt) {
    if (!fileExt.includes('.')) {
        fileExt = `.${fileExt}`;
    }
    return fileExt;
}
exports.addFileExtensionDot = addFileExtensionDot;
function isHeaderFile(fileExtLower) {
    fileExtLower = addFileExtensionDot(fileExtLower);
    return ['.hpp', '.hh', '.hxx', '.h'].some((ext) => fileExtLower === ext);
}
exports.isHeaderFile = isHeaderFile;
function isCppSourceFile(fileExtLower) {
    fileExtLower = addFileExtensionDot(fileExtLower);
    return ['.cpp', '.cc', '.cxx'].some((ext) => fileExtLower === ext);
}
exports.isCppSourceFile = isCppSourceFile;
function isCSourceFile(fileExtLower) {
    fileExtLower = addFileExtensionDot(fileExtLower);
    return fileExtLower === '.c';
}
exports.isCSourceFile = isCSourceFile;
function isCudaSourceFile(fileExtLower) {
    fileExtLower = addFileExtensionDot(fileExtLower);
    return fileExtLower === '.cu';
}
exports.isCudaSourceFile = isCudaSourceFile;
function getLanguage(dir) {
    const files = filesInDir(dir);
    const anyCudaFile = files.some((file) => isCudaSourceFile(path.extname(file)));
    const anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));
    if (anyCudaFile) {
        return enums_1.Languages.cuda;
    }
    else if (anyCppFile) {
        return enums_1.Languages.cpp;
    }
    else {
        return enums_1.Languages.c;
    }
}
exports.getLanguage = getLanguage;
function getDirectoriesRecursive(dir) {
    const directories = foldersInDir(dir);
    if (directories.length === 0)
        return;
    directories.forEach((dir) => getDirectoriesRecursive(dir)?.forEach((newDir) => directories.push(newDir)));
    return directories;
}
exports.getDirectoriesRecursive = getDirectoriesRecursive;
function readDir(dir) {
    try {
        return fs.readdirSync(dir, { withFileTypes: true });
    }
    catch (err) { }
}
exports.readDir = readDir;
function filesInDir(dir) {
    const fileDirents = readDir(dir);
    if (!fileDirents)
        return [];
    const hasSpace = dir.includes(' ');
    const files = fileDirents
        .filter((file) => file.isFile())
        .map((file) => (hasSpace ? file.name : path.join(dir, file.name)));
    return files;
}
exports.filesInDir = filesInDir;
function includePatternFromList(includeSearch, foldersList) {
    const result = [];
    for (const pattern of includeSearch) {
        result.push(...foldersList.filter((folder) => minimatch(folder, pattern)));
    }
    return result;
}
exports.includePatternFromList = includePatternFromList;
function excludePatternFromList(excludeSearch, foldersList) {
    for (const pattern of excludeSearch) {
        foldersList = foldersList.filter((folder) => !minimatch(folder, pattern));
    }
    return foldersList;
}
exports.excludePatternFromList = excludePatternFromList;
function foldersInDir(dir) {
    const fileDirents = readDir(dir);
    if (!fileDirents)
        return [];
    const folders = fileDirents.filter((folder) => folder.isDirectory());
    const folderNames = folders.map((folder) => path.join(dir.toString(), folder.name));
    return folderNames;
}
exports.foldersInDir = foldersInDir;
function readJsonFile(filepath) {
    let configJson;
    try {
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        configJson = JSON5.parse(fileContent);
    }
    catch (err) { }
    return configJson;
}
exports.readJsonFile = readJsonFile;
function writeJsonFile(outputFilePath, jsonContent) {
    if (jsonContent === undefined)
        return;
    const dirname = path.dirname(outputFilePath);
    if (!pathExists(dirname)) {
        mkdirRecursive(dirname);
    }
    const jsonString = JSON.stringify(jsonContent, null, 2);
    try {
        fs.writeFileSync(outputFilePath, jsonString);
    }
    catch (err) { }
}
exports.writeJsonFile = writeJsonFile;
function naturalSort(names) {
    return names.sort((a, b) => a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
    }));
}
exports.naturalSort = naturalSort;
function localSettingExist(key, jsonData) {
    const commandPath = jsonData[key];
    if (!commandPath)
        return false;
    if (pathIsAbsolute(commandPath) && !pathExists(commandPath))
        return false;
    return true;
}
exports.localSettingExist = localSettingExist;
function hasPathSeperators(pathStr) {
    return pathStr.includes('/') || pathStr.includes('\\');
}
exports.hasPathSeperators = hasPathSeperators;
function removeExtension(pathStr, ext) {
    const extStr = addFileExtensionDot(ext);
    if (pathStr.includes(extStr)) {
        return pathStr.replace(extStr, '');
    }
    return pathStr;
}
exports.removeExtension = removeExtension;
function getBasename(pathStr) {
    if (hasPathSeperators(pathStr)) {
        return path.basename(pathStr);
    }
    return pathStr;
}
exports.getBasename = getBasename;
function getOccurenceIndicies(text, char) {
    const indices = [];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === char)
            indices.push(i);
    }
    return indices;
}
exports.getOccurenceIndicies = getOccurenceIndicies;
function getAllSourceFilesFolderBased(dir) {
    const language = getLanguage(dir);
    let files = [];
    files = filesInDir(dir);
    const filteredFiles = files.filter((file) => isSourceFile(path.extname(file)));
    return { files: filteredFiles, language: language };
}
exports.getAllSourceFilesFolderBased = getAllSourceFilesFolderBased;
function getAllSourceFilesSingleFileBased() {
    let language = enums_1.Languages.c;
    let files = [];
    const currentFile = vscode.window.activeTextEditor?.document.fileName;
    if (!currentFile)
        return { files: [], language: language };
    if (isCppSourceFile(path.extname(currentFile))) {
        language = enums_1.Languages.cpp;
    }
    else if (isCSourceFile(path.extname(currentFile))) {
        language = enums_1.Languages.c;
    }
    else {
        language = enums_1.Languages.cuda;
    }
    const isSource = isSourceFile(path.extname(currentFile));
    if (!isSource)
        return { files: [], language: language };
    if (currentFile.includes(' ')) {
        files = [path.basename(currentFile)];
    }
    else {
        files = [currentFile];
    }
    return { files: files, language: language };
}
exports.getAllSourceFilesSingleFileBased = getAllSourceFilesSingleFileBased;
function getAllSourceFilesInDir(dir, singleFileBuild) {
    if (singleFileBuild)
        return getAllSourceFilesSingleFileBased();
    return getAllSourceFilesFolderBased(dir);
}
exports.getAllSourceFilesInDir = getAllSourceFilesInDir;
function getBuildModeDir(activeFolder, buildMode) {
    const buildDir = path.join(activeFolder, 'build');
    const modeDir = path.join(buildDir, `${buildMode}`);
    return modeDir;
}
exports.getBuildModeDir = getBuildModeDir;
function isNonRelativePath(path) {
    return path.includes('/') || path.includes('\\');
}
exports.isNonRelativePath = isNonRelativePath;


/***/ }),

/***/ "./src/utils/systemUtils.ts":
/*!**********************************!*\
  !*** ./src/utils/systemUtils.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkForCompilerIsValid = exports.getCompilerArchitecture = exports.getOperatingSystem = exports.commandExists = void 0;
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const lookpath_1 = __webpack_require__(/*! lookpath */ "./node_modules/lookpath/lib/index.js");
const os_1 = __webpack_require__(/*! os */ "os");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
async function commandExists(command) {
    let commandPath = await (0, lookpath_1.lookpath)(command);
    if (!commandPath) {
        return { f: false, p: commandPath };
    }
    if (commandPath.includes('.EXE')) {
        commandPath = commandPath.replace('.EXE', '.exe');
    }
    return { f: true, p: commandPath };
}
exports.commandExists = commandExists;
function getOperatingSystem() {
    const platformName = (0, os_1.platform)();
    let operatingSystem;
    if (platformName === 'win32') {
        operatingSystem = enums_1.OperatingSystems.windows;
    }
    else if (platformName === 'darwin') {
        operatingSystem = enums_1.OperatingSystems.mac;
    }
    else {
        operatingSystem = enums_1.OperatingSystems.linux;
    }
    return operatingSystem;
}
exports.getOperatingSystem = getOperatingSystem;
function getCompilerArchitecture(compiler) {
    const command = `${compiler} -dumpmachine`;
    let byteArray;
    try {
        byteArray = (0, child_process_1.execSync)(command);
    }
    catch (err) {
        byteArray = Buffer.from('x64', 'utf-8');
    }
    const str = String.fromCharCode(...byteArray);
    let architecture = enums_1.Architectures.x64;
    let isCygwin = false;
    if (str.toLowerCase().includes('arm') ||
        str.toLowerCase().includes('aarch')) {
        architecture = enums_1.Architectures.ARM64;
    }
    else if (str.includes('64')) {
        architecture = enums_1.Architectures.x64;
    }
    else {
        architecture = enums_1.Architectures.x86;
    }
    if (str.includes('cygwin')) {
        isCygwin = true;
    }
    return { architecture: architecture, isCygwin: isCygwin };
}
exports.getCompilerArchitecture = getCompilerArchitecture;
async function executeCommand(command) {
    return new Promise((resolve) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, stderr: stderr || error.message });
            }
            else {
                resolve({ success: true, stdout: stdout.trim() });
            }
        });
    });
}
async function checkForCompilerIsValid(command) {
    const result = await executeCommand(command);
    return result.success;
}
exports.checkForCompilerIsValid = checkForCompilerIsValid;


/***/ }),

/***/ "./src/utils/vscodeUtils.ts":
/*!**********************************!*\
  !*** ./src/utils/vscodeUtils.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runVscodeTask = exports.getProcessExecution = exports.isCmakeProject = exports.getActivationState = exports.updateActivationState = exports.getLaunchConfigIndex = exports.setContextValue = exports.createStatusBarItem = exports.disposeItem = void 0;
const path = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const extension_1 = __webpack_require__(/*! ../extension */ "./src/extension.ts");
const params_1 = __webpack_require__(/*! ../params/params */ "./src/params/params.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "./src/types/enums.ts");
const fileUtils_1 = __webpack_require__(/*! ./fileUtils */ "./src/utils/fileUtils.ts");
function disposeItem(disposableItem) {
    disposableItem?.dispose();
}
exports.disposeItem = disposeItem;
function createStatusBarItem() {
    return vscode.window.createStatusBarItem(params_1.STATUS_BAR_ALIGN, params_1.STATUS_BAR_PRIORITY);
}
exports.createStatusBarItem = createStatusBarItem;
function setContextValue(key, value) {
    return vscode.commands.executeCommand('setContext', key, value);
}
exports.setContextValue = setContextValue;
function getLaunchConfigIndex(configJson, configName) {
    let configIdx = 0;
    if (configJson) {
        for (const config of configJson.configurations) {
            if (config.name !== configName) {
                configIdx++;
            }
            else {
                return configIdx;
            }
        }
    }
    return undefined;
}
exports.getLaunchConfigIndex = getLaunchConfigIndex;
function updateActivationState(newState) {
    extension_1.extensionState?.update('activatedExtension', newState);
}
exports.updateActivationState = updateActivationState;
function getActivationState() {
    if (extension_1.extensionState) {
        return extension_1.extensionState.get('activatedExtension');
    }
    return false;
}
exports.getActivationState = getActivationState;
function isCmakeProject() {
    let cmakeFileFound = false;
    const workspaceFodlers = vscode.workspace.workspaceFolders;
    const cmakeExtensionName = 'cmake';
    const cmakeSettingName = 'sourceDirectory';
    if (workspaceFodlers) {
        workspaceFodlers.forEach((folder) => {
            if (!cmakeFileFound) {
                const files = (0, fileUtils_1.filesInDir)(folder.uri.fsPath);
                files.forEach((file) => {
                    if (file.toLowerCase().includes('CMakeLists.txt'.toLowerCase())) {
                        cmakeFileFound = true;
                    }
                });
                const settingsPath = path.join(folder.uri.fsPath, '.vscode', 'settings.json');
                if ((0, fileUtils_1.pathExists)(settingsPath)) {
                    const configLocal = (0, fileUtils_1.readJsonFile)(settingsPath);
                    if (configLocal &&
                        configLocal[`${cmakeExtensionName}.${cmakeSettingName}`]) {
                        cmakeFileFound = true;
                    }
                }
            }
        });
    }
    if (!cmakeFileFound) {
        const config = vscode.workspace.getConfiguration(cmakeExtensionName);
        const cmakeSetting = config.get(cmakeSettingName);
        if (cmakeSetting && cmakeSetting !== '${workspaceFolder}') {
            cmakeFileFound = true;
        }
    }
    return cmakeFileFound;
}
exports.isCmakeProject = isCmakeProject;
function getProcessExecution(operatingSystem, isMsvcBuildTask, commandLine, activeFolder) {
    const options = {
        cwd: activeFolder,
    };
    if (operatingSystem === enums_1.OperatingSystems.windows) {
        return winProcessExecution(isMsvcBuildTask, commandLine, options);
    }
    else {
        return unixProcessExecution(commandLine, options);
    }
}
exports.getProcessExecution = getProcessExecution;
function winProcessExecution(isMsvcBuildTask, commandLine, options) {
    const drive = process.env['SystemDrive'] ? process.env['SystemDrive'] : 'C:';
    if (isMsvcBuildTask) {
        const shellOptions = {
            executable: drive + '/Windows/System32/cmd.exe',
            shellArgs: ['/d', '/c'],
        };
        return new vscode.ShellExecution(commandLine, shellOptions);
    }
    else {
        return new vscode.ProcessExecution(drive + '/Windows/System32/cmd.exe', ['/d', '/c', commandLine], options);
    }
}
function unixProcessExecution(commandLine, options) {
    const standard_shell = process.env['SHELL']
        ? process.env['SHELL']
        : '/bin/bash';
    return new vscode.ProcessExecution(standard_shell, ['-c', commandLine], options);
}
async function runVscodeTask(task_name, commandLine, activeFolder, operatingSystem, problemMatcher = undefined, isMsvcTask = false) {
    const execution = getProcessExecution(operatingSystem, isMsvcTask, commandLine, activeFolder);
    const definition = {
        type: 'shell',
        task: task_name,
    };
    let task;
    if (problemMatcher !== undefined) {
        task = new vscode.Task(definition, vscode.TaskScope.Workspace, task_name, params_1.EXTENSION_NAME, execution, problemMatcher);
    }
    else {
        task = new vscode.Task(definition, vscode.TaskScope.Workspace, task_name, params_1.EXTENSION_NAME, execution);
    }
    await vscode.tasks.executeTask(task);
}
exports.runVscodeTask = runVscodeTask;


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extension.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map