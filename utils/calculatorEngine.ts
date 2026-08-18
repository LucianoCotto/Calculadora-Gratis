import { Decimal } from 'decimal.js';

// Configure Decimal precision and rounding mode for calculator
Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -12, toExpPos: 20 });

export interface EvaluationResult {
  success: boolean;
  result?: string;
  displayValue?: string;
  error?: string;
}

export type Operator = '+' | '-' | '*' | '/' | '^';

/**
 * Formats a Decimal or raw number string to human readable format with max precision
 */
export function formatNumberString(val: string | number | Decimal, maxDecimals = 10): string {
  try {
    const d = new Decimal(val);
    if (d.isNaN()) return 'Error';
    if (!d.isFinite()) return d.isPositive() ? '∞' : '-∞';

    // If it's zero
    if (d.isZero()) return '0';

    // Check if very large or very small
    const abs = d.abs();
    if (abs.gte('1e16') || (abs.lt('1e-7') && !abs.isZero())) {
      return d.toExponential(maxDecimals - 4).replace(/\+/, '');
    }

    // Standard notation with up to maxDecimals, trimming trailing zeros after decimal point
    const str = d.toFixed(maxDecimals);
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  } catch {
    return String(val);
  }
}

/**
 * Format expression with visual mathematical symbols for display
 */
export function formatExpressionForDisplay(expr: string): string {
  return expr
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/(?<![0-9)])-/g, ' - ') // spaced minus
    .replace(/\^/g, ' ^ ')
    .replace(/sqrt\(/g, '√(')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a character is an operator
 */
export function isOperator(char: string): boolean {
  return ['+', '-', '*', '/', '^'].includes(char);
}

/**
 * Tokenizes a mathematical expression into tokens (numbers, operators, parentheses, functions, percentages)
 */
export function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const cleanExpr = expr.replace(/\s+/g, '');

  while (i < cleanExpr.length) {
    const char = cleanExpr[i];

    // Numbers and decimals
    if (/[0-9.]/.test(char)) {
      let num = '';
      while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
        num += cleanExpr[i];
        i++;
      }
      tokens.push(num);
      continue;
    }

    // Function names like sqrt, sin, cos, ln, etc.
    if (/[a-zA-Z]/.test(char)) {
      let fn = '';
      while (i < cleanExpr.length && /[a-zA-Z]/.test(cleanExpr[i])) {
        fn += cleanExpr[i];
        i++;
      }
      tokens.push(fn);
      continue;
    }

    // Percentage
    if (char === '%') {
      tokens.push('%');
      i++;
      continue;
    }

    // Parentheses
    if (char === '(' || char === ')') {
      tokens.push(char);
      i++;
      continue;
    }

    // Operators (+, -, *, /, ^)
    if (isOperator(char)) {
      // Check for unary minus:
      // A minus is unary if it is at start or preceded by an operator or open parenthesis
      const prevToken = tokens[tokens.length - 1];
      const isUnaryMinus =
        char === '-' &&
        (tokens.length === 0 || isOperator(prevToken) || prevToken === '(');

      if (isUnaryMinus) {
        // Lookahead to see if next token is a number or parenthesized group
        if (i + 1 < cleanExpr.length && /[0-9.]/.test(cleanExpr[i + 1])) {
          let num = '-';
          i++;
          while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
            num += cleanExpr[i];
            i++;
          }
          tokens.push(num);
          continue;
        } else {
          // Unary minus operator token
          tokens.push('u-');
          i++;
          continue;
        }
      }

      tokens.push(char);
      i++;
      continue;
    }

    // Skip any unexpected char
    i++;
  }

  return tokens;
}

/**
 * Evaluates standard expression using Shunting-Yard Algorithm + Decimal.js AST Evaluation
 * Robust, open-source inspired financial & standard calculator engine.
 */
export function evaluateExpression(expressionStr: string): EvaluationResult {
  if (!expressionStr || expressionStr.trim() === '') {
    return { success: true, result: '0', displayValue: '0' };
  }

  try {
    let tokens = tokenize(expressionStr);
    if (tokens.length === 0) {
      return { success: true, result: '0', displayValue: '0' };
    }

    // Handle trailing operators gracefully (e.g. "5 +" evaluates to "5" in live preview)
    while (tokens.length > 0 && isOperator(tokens[tokens.length - 1])) {
      tokens.pop();
    }

    if (tokens.length === 0) {
      return { success: true, result: '0', displayValue: '0' };
    }

    // Process percentage tokens contextually
    // e.g., in [100, +, 10, %] -> becomes [100, +, 10] where 10% is 100 * 0.1 = 10
    // in [50, *, 20, %] -> becomes [50, *, 0.2]
    // in [25, %] -> becomes [0.25]
    const processedTokens: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '%') {
        if (processedTokens.length === 0) {
          continue;
        }
        const lastNumStr = processedTokens.pop()!;
        const lastNum = new Decimal(lastNumStr);

        // Look back to see if there is an operator and a base number before it
        if (processedTokens.length >= 2) {
          const op = processedTokens[processedTokens.length - 1];
          const baseNumStr = processedTokens[processedTokens.length - 2];

          try {
            const baseNum = new Decimal(baseNumStr);
            if (op === '+' || op === '-') {
              // Contextual percentage: baseNum ± (baseNum * (lastNum / 100))
              const percentVal = baseNum.times(lastNum.dividedBy(100));
              processedTokens.push(percentVal.toString());
              continue;
            } else if (op === '*' || op === '/') {
              // Direct percentage: lastNum / 100
              const percentVal = lastNum.dividedBy(100);
              processedTokens.push(percentVal.toString());
              continue;
            }
          } catch {
            // Fallback
          }
        }

        // Standalone percentage: lastNum / 100
        const percentVal = lastNum.dividedBy(100);
        processedTokens.push(percentVal.toString());
      } else {
        processedTokens.push(tokens[i]);
      }
    }

    tokens = processedTokens;
    if (tokens.length === 0) {
      return { success: true, result: '0', displayValue: '0' };
    }

    // Auto-balance open parentheses
    let openCount = 0;
    for (const t of tokens) {
      if (t === '(') openCount++;
      if (t === ')') openCount--;
    }
    while (openCount > 0) {
      tokens.push(')');
      openCount--;
    }

    // Operator precedence and associativity
    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3,
      'u-': 4,
      'sqrt': 5,
      'sin': 5,
      'cos': 5,
      'tan': 5,
      'ln': 5,
      'log': 5,
      'fact': 5,
    };

    // Shunting-Yard to Reverse Polish Notation (RPN)
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];

    for (const token of tokens) {
      // If number
      if (!isNaN(Number(token)) || token === 'pi' || token === 'e') {
        outputQueue.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '('
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
          operatorStack.pop();
        }
        // If top of stack is a function name, pop it onto output queue
        if (
          operatorStack.length > 0 &&
          ['sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'fact'].includes(
            operatorStack[operatorStack.length - 1]
          )
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
      } else if (['sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'fact'].includes(token)) {
        operatorStack.push(token);
      } else if (isOperator(token) || token === 'u-') {
        const p1 = precedence[token] || 0;
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top === '(') break;
          const p2 = precedence[top] || 0;
          if (p2 >= p1 && token !== '^') {
            outputQueue.push(operatorStack.pop()!);
          } else {
            break;
          }
        }
        operatorStack.push(token);
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop()!;
      if (top !== '(' && top !== ')') {
        outputQueue.push(top);
      }
    }

    // Evaluate RPN Queue
    const evalStack: Decimal[] = [];

    for (const token of outputQueue) {
      if (token === 'pi') {
        evalStack.push(new Decimal('3.1415926535897932384626433832795'));
      } else if (token === 'e') {
        evalStack.push(new Decimal('2.7182818284590452353602874713526'));
      } else if (!isNaN(Number(token))) {
        evalStack.push(new Decimal(token));
      } else if (token === 'u-') {
        if (evalStack.length < 1) throw new Error('Expresión incompleta');
        const a = evalStack.pop()!;
        evalStack.push(a.negated());
      } else if (['sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'fact'].includes(token)) {
        if (evalStack.length < 1) throw new Error('Expresión incompleta');
        const a = evalStack.pop()!;
        if (token === 'sqrt') {
          if (a.isNegative()) throw new Error('Raíz de número negativo');
          evalStack.push(a.squareRoot());
        } else if (token === 'fact') {
          if (a.isNegative() || !a.isInteger() || a.gt(100)) {
            throw new Error('Factorial no válido');
          }
          let res = new Decimal(1);
          const n = a.toNumber();
          for (let k = 2; k <= n; k++) {
            res = res.times(k);
          }
          evalStack.push(res);
        } else if (token === 'ln') {
          if (a.lte(0)) throw new Error('Logaritmo no válido');
          evalStack.push(a.naturalLogarithm());
        } else if (token === 'log') {
          if (a.lte(0)) throw new Error('Logaritmo no válido');
          evalStack.push(a.log());
        } else if (token === 'sin') {
          evalStack.push(new Decimal(Math.sin(a.toNumber())));
        } else if (token === 'cos') {
          evalStack.push(new Decimal(Math.cos(a.toNumber())));
        } else if (token === 'tan') {
          evalStack.push(new Decimal(Math.tan(a.toNumber())));
        }
      } else if (isOperator(token)) {
        if (evalStack.length < 2) throw new Error('Expresión incompleta');
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;

        switch (token) {
          case '+':
            evalStack.push(a.plus(b));
            break;
          case '-':
            evalStack.push(a.minus(b));
            break;
          case '*':
            evalStack.push(a.times(b));
            break;
          case '/':
            if (b.isZero()) {
              throw new Error('No se puede dividir entre 0');
            }
            evalStack.push(a.dividedBy(b));
            break;
          case '^':
            evalStack.push(a.pow(b));
            break;
        }
      }
    }

    if (evalStack.length !== 1) {
      throw new Error('Expresión inválida');
    }

    const finalDecimal = evalStack[0];
    const formatted = formatNumberString(finalDecimal);

    return {
      success: true,
      result: finalDecimal.toString(),
      displayValue: formatted,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return {
      success: false,
      error: message,
    };
  }
}
