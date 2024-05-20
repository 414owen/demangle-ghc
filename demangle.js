(function(input) {
  var inputEl = document.getElementById("ghc-input");
  var outputEl = document.getElementById("ghc-output");
  var examplesEl = document.getElementById("demangle-ghc-examples");

  var ordZero = '0'.charCodeAt(0);

  function isDigit(c) {
    return c >= '0' && c <= '9';
  }

  function isHexDigit(c) {
    return c >= '0' && c <= '9'
      || c >= 'a' && c <= 'f';
  }

  function run() {
    var input = inputEl.value;
    var output = [];

    // Points to the next unseen char of the input
    var index = 0;

    var char;
    var haveErrored = false;

    function peek() {
      if (char === undefined) {
        error("Tried to read beyond the end of the input");
      }
      return char;
    }

    function error(msg) {
      if (haveErrored) return;
      output =
        [ "Error: ", msg, ".\n"
        , "This probably means your input isn't valid ghc-encoding.\n"
        , "\n"
        , "If you think this is a bug in the online decoder you're using\n"
        , "Please submit an issue at:\n"
        , "https://github.com/414owen/demangle-ghc/issues"
        ];
      haveErrored = true;
    }

    function advance() {
      char = input[index++];
    }

    function push(s) {
      if (haveErrored) return;
      output.push(s);
    }

    advance();

    function pushTuple(arity, start, end) {
      push(start);
      if (arity > 5000) {
        error("I refuse to believe that anyone has produced a tuple of arity >5000");
      }
      for (var i = 1; i < arity; i++) {
        push(',');
      }
      push(end);
    }

    while (index < input.length && !haveErrored) {
      switch (peek()) {
        case 'z':
          advance();
          switch (peek()) {
            case 'a': output.push('&'); advance(); break;
            case 'b': output.push('|'); advance(); break;
            case 'c': output.push('^'); advance(); break;
            case 'd': output.push('$'); advance(); break;
            case 'e': output.push('='); advance(); break;
            case 'g': output.push('>'); advance(); break;
            case 'h': output.push('#'); advance(); break;
            case 'i': output.push('.'); advance(); break;
            case 'l': output.push('<'); advance(); break;
            case 'm': output.push('-'); advance(); break;
            case 'n': output.push('!'); advance(); break;
            case 'p': output.push('+'); advance(); break;
            case 'q': output.push("'"); advance(); break;
            case 'r': output.push('\\'); advance(); break;
            case 's': output.push('/'); advance(); break;
            case 't': output.push('*'); advance(); break;
            case 'u': output.push('_'); advance(); break;
            case 'v': output.push('%'); advance(); break;
            case 'z': output.push('z'); advance(); break;

            // Although this is a hex number, a '0' is placed before
            // any number that starts with an alpha digit.
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9': {
              var charCode = 0;
              do {
                charCode *= 16;
                charCode += parseInt(peek(), 16);
                advance();
              } while (isHexDigit(peek()));
              switch (peek()) {
                case 'U':
                  // Not checking char code ranges, in case GHC allows unicode...
                  push(String.fromCharCode(charCode))
                  advance();
                  break;
                default: {
                  error("Expected 'U' to terminate char code escape. Got '" + peek() + "'");
                  break;
                }
              }
              break;
            }
            default: 
              error("Unknown 'z' escape: '" + peek() + "'");
              break;
          }
          break;
        case 'Z':
          advance();
          switch (peek()) {
            case 'L': output.push('('); advance(); break;
            case 'R': output.push(')'); advance(); break;
            case 'M': output.push('['); advance(); break;
            case 'N': output.push(']'); advance(); break;
            case 'C': output.push(':'); advance(); break;
            case 'Z': output.push('Z'); advance(); break;
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9': {
              var arity = 0;
              do {
                arity *= 10;
                arity += char.charCodeAt(0) - ordZero;
                advance();
              } while (isDigit(peek()));
              switch (peek()) {
                case 'T':
                  if (arity === 1) {
                    error("Tuples can't have an arity of 1")
                    break;
                  }
                  pushTuple(arity, '(', ')');
                  advance();
                  break;
                case 'H':
                  if (arity === 0) {
                    error("Unboxed tuples must have an arity of >=1")
                    break;
                  }
                  advance();
                  if (arity == 1) {
                    push("(# #)");
                  } else {
                    pushTuple(arity, '(#', '#)');
                  }
                  break;
                default:
                  error("Unknown quantified escape terminator: '" + peek() + "'");
                  break;
              }
              break;
            }
            default: 
              error("Unknown 'Z' escape: '" + peek() + "'");
              break;
          }
          break;
        default:
          push(peek());
          advance();
          break;
      }
    }
    var res = output.join("");
    console.log("Decoded value to: ", res.slice(0, 100), "...");
    outputEl.textContent = res;
  }
  run();
  inputEl.addEventListener("input", run);
  examplesEl.addEventListener("change", function() {
    inputEl.value = examplesEl.value;
    run();
  });
})();
