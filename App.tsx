import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HistoryItem, Theme, CalculatorButtonType } from './types.ts';
import { BASIC_BUTTONS, SCIENTIFIC_BUTTONS, MAX_HISTORY } from './constants.tsx';
import HistoryOverlay from './components/HistoryOverlay.tsx';
import { evaluateExpression, formatNumberString } from './utils/calculatorEngine.ts';
import { playClickSound } from './utils/sound.ts';
import { 
  Sun, 
  Moon, 
  History, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Copy, 
  Check, 
  Delete 
} from 'lucide-react';
import { Decimal } from 'decimal.js';

const App: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isScientificOpen, setIsScientificOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hasJustCalculated, setHasJustCalculated] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);
  
  // For repeating last operation when pressing "=" consecutively (like native calculators)
  const lastOperationRef = useRef<{ op: string; operand: string } | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  // Initialize and remove loading screen
  useEffect(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 400);
    }

    try {
      const savedHistory = localStorage.getItem('calc_history_v2');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedSound = localStorage.getItem('calc_sound');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');

      const savedTheme = localStorage.getItem('calc_theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } else {
        // Default to dark as in design
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    } catch {
      // Fallback
    }
  }, []);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem('calc_history_v2', JSON.stringify(history));
    } catch {
      // Storage full or unavailable
    }
  }, [history]);

  // Save sound setting
  useEffect(() => {
    try {
      localStorage.setItem('calc_sound', String(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // Handle theme changes
  useEffect(() => {
    try {
      localStorage.setItem('calc_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Ignore
    }
  }, [theme]);

  // Trigger tactile / audio feedback
  const triggerFeedback = useCallback((type: 'number' | 'operator' | 'action' | 'equals' | 'error' = 'number') => {
    if ('vibrate' in navigator) {
      if (type === 'equals') navigator.vibrate(25);
      else if (type === 'action') navigator.vibrate([10, 20]);
      else if (type === 'error') navigator.vibrate([40, 30, 40]);
      else navigator.vibrate(8);
    }
    if (soundEnabled) {
      playClickSound(type);
    }
  }, [soundEnabled]);

  // Compute live preview whenever expression or display updates
  useEffect(() => {
    if (!expression || hasJustCalculated) {
      setLivePreview(null);
      return;
    }

    // Only show live preview if there's at least one operator
    const hasOp = /[\+\-\*\/^]/.test(expression);
    if (!hasOp) {
      setLivePreview(null);
      return;
    }

    const evalResult = evaluateExpression(expression);
    if (evalResult.success && evalResult.displayValue && evalResult.displayValue !== expression) {
      setLivePreview(evalResult.displayValue);
    } else {
      setLivePreview(null);
    }
  }, [expression, hasJustCalculated]);

  const toggleTheme = () => {
    triggerFeedback('action');
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSound = () => {
    triggerFeedback('action');
    setSoundEnabled(prev => !prev);
  };

  // Perform Calculation
  const calculateResult = useCallback(() => {
    if (!expression && display === '0') return;

    let targetExpr = expression;

    // If repeat equals is triggered (consecutive '=' clicks)
    if (hasJustCalculated && lastOperationRef.current) {
      const { op, operand } = lastOperationRef.current;
      targetExpr = `${display} ${op} ${operand}`;
    } else if (!targetExpr) {
      targetExpr = display;
    }

    const evalResult = evaluateExpression(targetExpr);

    if (evalResult.success && evalResult.displayValue) {
      triggerFeedback('equals');
      const resultVal = evalResult.displayValue;
      
      // Store repeat operation if applicable
      const match = targetExpr.match(/([\+\-\*\/^])\s*([0-9.]+(?:%|\b))$/);
      if (match) {
        lastOperationRef.current = { op: match[1], operand: match[2] };
      }

      const newItem: HistoryItem = {
        id: generateId(),
        expression: targetExpr,
        result: resultVal,
        timestamp: Date.now()
      };

      setHistory(prev => [newItem, ...prev.slice(0, MAX_HISTORY - 1)]);
      setDisplay(resultVal);
      setExpression(targetExpr);
      setHasJustCalculated(true);
    } else {
      triggerFeedback('error');
      setDisplay('Error');
      setHasJustCalculated(true);
    }
  }, [expression, display, hasJustCalculated, triggerFeedback]);

  // Handle Button Clicks
  const handleButtonClick = useCallback((value: string, type: CalculatorButtonType) => {
    // 1. ACTION (Clear, Equals, Backspace, History)
    if (type === CalculatorButtonType.ACTION) {
      if (value === 'CLEAR') {
        triggerFeedback('action');
        setDisplay('0');
        setExpression('');
        setLivePreview(null);
        setHasJustCalculated(false);
        lastOperationRef.current = null;
      } else if (value === '=') {
        calculateResult();
      } else if (value === 'BACKSPACE') {
        triggerFeedback('action');
        if (hasJustCalculated) {
          setDisplay('0');
          setExpression('');
          setHasJustCalculated(false);
          return;
        }

        if (display.length > 1 && display !== 'Error') {
          const nextDisplay = display.slice(0, -1);
          setDisplay(nextDisplay);
          setExpression(prev => prev.slice(0, -1));
        } else {
          setDisplay('0');
          setExpression('');
        }
      } else if (value === 'HISTORY') {
        triggerFeedback('action');
        setIsHistoryOpen(true);
      }
      return;
    }

    // 2. FUNCTION (Negate, Percent)
    if (type === CalculatorButtonType.FUNCTION) {
      triggerFeedback('operator');
      if (value === 'NEGATE') {
        if (display === '0' || display === 'Error') return;
        try {
          const d = new Decimal(display);
          const negated = formatNumberString(d.negated());
          setDisplay(negated);
          
          if (hasJustCalculated || !expression) {
            setExpression(negated);
          } else {
            // Replace the last number in expression with negated
            const parts = expression.split(/([\+\-\*\/^])/);
            if (parts.length > 0) {
              parts[parts.length - 1] = negated;
              setExpression(parts.join(''));
            }
          }
        } catch {
          // Ignore
        }
      } else if (value === 'PERCENT') {
        if (display === 'Error') return;
        if (hasJustCalculated) {
          try {
            const val = new Decimal(display).dividedBy(100);
            const str = formatNumberString(val);
            setDisplay(str);
            setExpression(str);
          } catch {
            //
          }
        } else {
          setExpression(prev => prev + '%');
          setDisplay(prev => prev + '%');
        }
      }
      return;
    }

    // 3. SCIENTIFIC FUNCTIONS
    if (type === CalculatorButtonType.SCIENTIFIC) {
      triggerFeedback('operator');
      if (value === '(' || value === ')') {
        if (hasJustCalculated) {
          setExpression(value);
          setDisplay(value);
          setHasJustCalculated(false);
        } else {
          setExpression(prev => prev + value);
          setDisplay(prev => (prev === '0' ? value : prev + value));
        }
      } else if (value === 'pi') {
        const piVal = '3.14159265';
        if (hasJustCalculated || display === '0') {
          setDisplay(piVal);
          setExpression(piVal);
          setHasJustCalculated(false);
        } else {
          setExpression(prev => prev + '*' + piVal);
          setDisplay(piVal);
        }
      } else if (value === 'e') {
        const eVal = '2.71828182';
        if (hasJustCalculated || display === '0') {
          setDisplay(eVal);
          setExpression(eVal);
          setHasJustCalculated(false);
        } else {
          setExpression(prev => prev + '*' + eVal);
          setDisplay(eVal);
        }
      } else if (value === 'sqrt') {
        try {
          if (display !== 'Error' && !display.startsWith('-')) {
            const res = new Decimal(display).squareRoot();
            const formatted = formatNumberString(res);
            setDisplay(formatted);
            setExpression(`sqrt(${display})`);
            setHasJustCalculated(true);
          }
        } catch {
          setDisplay('Error');
        }
      } else if (value === 'sqr') {
        try {
          if (display !== 'Error') {
            const res = new Decimal(display).pow(2);
            const formatted = formatNumberString(res);
            setDisplay(formatted);
            setExpression(`(${display})^2`);
            setHasJustCalculated(true);
          }
        } catch {
          setDisplay('Error');
        }
      } else if (value === 'inv') {
        try {
          if (display !== '0' && display !== 'Error') {
            const res = new Decimal(1).dividedBy(new Decimal(display));
            const formatted = formatNumberString(res);
            setDisplay(formatted);
            setExpression(`1/(${display})`);
            setHasJustCalculated(true);
          }
        } catch {
          setDisplay('Error');
        }
      } else if (value === 'fact') {
        try {
          const n = parseInt(display, 10);
          if (n >= 0 && n <= 100) {
            let fact = new Decimal(1);
            for (let i = 2; i <= n; i++) fact = fact.times(i);
            const formatted = formatNumberString(fact);
            setDisplay(formatted);
            setExpression(`fact(${n})`);
            setHasJustCalculated(true);
          }
        } catch {
          setDisplay('Error');
        }
      } else if (value === 'ln') {
        try {
          if (display !== 'Error' && Number(display) > 0) {
            const res = new Decimal(display).naturalLogarithm();
            const formatted = formatNumberString(res);
            setDisplay(formatted);
            setExpression(`ln(${display})`);
            setHasJustCalculated(true);
          }
        } catch {
          setDisplay('Error');
        }
      } else if (value === '^') {
        setHasJustCalculated(false);
        setExpression(prev => prev + '^');
      }
      return;
    }

    // 4. OPERATOR (+, -, *, /)
    if (type === CalculatorButtonType.OPERATOR) {
      triggerFeedback('operator');
      lastOperationRef.current = null;

      if (hasJustCalculated) {
        setExpression(display + value);
        setHasJustCalculated(false);
        return;
      }

      if (!expression && display === '0') {
        if (value === '-') {
          setExpression('-');
          setDisplay('-');
        }
        return;
      }

      const lastChar = expression.slice(-1);
      if (['+', '-', '*', '/', '^'].includes(lastChar)) {
        // If clicking another operator immediately, replace previous operator
        setExpression(prev => prev.slice(0, -1) + value);
      } else {
        setExpression(prev => (prev ? prev + value : display + value));
      }
      return;
    }

    // 5. NUMBER & DECIMAL (0-9, .)
    if (type === CalculatorButtonType.NUMBER) {
      triggerFeedback('number');

      if (hasJustCalculated) {
        const nextVal = value === '.' ? '0.' : value;
        setDisplay(nextVal);
        setExpression(nextVal);
        setHasJustCalculated(false);
        return;
      }

      if (value === '.') {
        // Prevent double dot in the current number segment
        const segments = expression.split(/[\+\-\*\/^]/);
        const currentSegment = segments[segments.length - 1] || '';
        if (currentSegment.includes('.')) return;

        if (display === '0' || !expression || /[\+\-\*\/^]$/.test(expression)) {
          setDisplay('0.');
          setExpression(prev => prev + '0.');
        } else {
          setDisplay(prev => prev + '.');
          setExpression(prev => prev + '.');
        }
        return;
      }

      // Normal digit 0-9
      if (display === '0' && value === '0') return;

      if (display === '0' || /[\+\-\*\/^]$/.test(expression)) {
        setDisplay(value);
        setExpression(prev => prev + value);
      } else {
        setDisplay(prev => (prev === '0' ? value : prev + value));
        setExpression(prev => (prev === '0' ? value : prev + value));
      }
    }
  }, [display, expression, hasJustCalculated, calculateResult, triggerFeedback]);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open or focusing an input
      if (isHistoryOpen) {
        if (e.key === 'Escape') setIsHistoryOpen(false);
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleButtonClick(e.key, CalculatorButtonType.NUMBER);
      } else if (e.key === '.' || e.key === ',') {
        handleButtonClick('.', CalculatorButtonType.NUMBER);
      } else if (e.key === '+') {
        handleButtonClick('+', CalculatorButtonType.OPERATOR);
      } else if (e.key === '-') {
        handleButtonClick('-', CalculatorButtonType.OPERATOR);
      } else if (e.key === '*' || e.key.toLowerCase() === 'x') {
        handleButtonClick('*', CalculatorButtonType.OPERATOR);
      } else if (e.key === '/') {
        e.preventDefault();
        handleButtonClick('/', CalculatorButtonType.OPERATOR);
      } else if (e.key === '%') {
        handleButtonClick('PERCENT', CalculatorButtonType.FUNCTION);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleButtonClick('=', CalculatorButtonType.ACTION);
      } else if (e.key === 'Backspace') {
        handleButtonClick('BACKSPACE', CalculatorButtonType.ACTION);
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleButtonClick('CLEAR', CalculatorButtonType.ACTION);
      } else if (e.key === '(' || e.key === ')') {
        handleButtonClick(e.key, CalculatorButtonType.SCIENTIFIC);
      } else if (e.key.toLowerCase() === 'h') {
        setIsHistoryOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleButtonClick, isHistoryOpen]);

  // Copy result to clipboard
  const copyDisplayToClipboard = () => {
    if (display === 'Error') return;
    navigator.clipboard.writeText(display);
    triggerFeedback('action');
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 2000);
  };

  // Display touch swipe detection (swipe left/right to backspace)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStartRef.current;
    if (Math.abs(diff) > 40) {
      handleButtonClick('BACKSPACE', CalculatorButtonType.ACTION);
    }
    touchStartRef.current = null;
  };

  // Format expression for header formula line
  const formatHeaderFormula = (expr: string) => {
    if (!expr) return '';
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/(?<![0-9)])-/g, ' − ')
      .replace(/\^/g, ' ^ ')
      .replace(/sqrt\(/g, '√(')
      .trim();
  };

  // Dynamic font scaling for main display
  const getDisplayFontSize = (text: string) => {
    const len = text.length;
    if (len <= 7) return 'text-6xl sm:text-7xl';
    if (len <= 10) return 'text-5xl sm:text-6xl';
    if (len <= 13) return 'text-4xl sm:text-5xl';
    if (len <= 17) return 'text-3xl sm:text-4xl';
    return 'text-2xl sm:text-3xl';
  };

  const isClearAll = !expression && display === '0';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 bg-zinc-100 dark:bg-zinc-950 transition-colors selection:bg-blue-500/20 font-sans overflow-y-auto">
      {/* Calculator Body Container */}
      <main 
        role="main"
        aria-label="Calculadora Digital"
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-zinc-900/10 dark:shadow-black/60 overflow-hidden flex flex-col min-h-[560px] h-auto my-auto border border-zinc-200/80 dark:border-zinc-800/80 transition-all"
      >
        {/* Top Bar Header */}
        <header className="px-6 pt-5 pb-1 flex justify-between items-center z-10 select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Calculadora Pro" className="w-5 h-5 rounded-md shadow-sm select-none" />
            <span className="font-brand font-semibold text-sm tracking-[0.22em] text-zinc-700 dark:text-zinc-300 uppercase">
              Calculadora
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/40">
            {/* Scientific functions toggle */}
            <button
              onClick={() => {
                triggerFeedback('action');
                setIsScientificOpen(prev => !prev);
              }}
              title={isScientificOpen ? 'Modo estándar' : 'Funciones avanzadas'}
              aria-label="Funciones avanzadas"
              className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                isScientificOpen
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
              aria-label={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
              className={`p-2 rounded-xl transition-all ${
                soundEnabled 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' 
                  : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* History Overlay trigger */}
            <button
              onClick={() => {
                triggerFeedback('action');
                setIsHistoryOpen(true);
              }}
              title="Historial de operaciones"
              aria-label="Ver historial"
              className="relative p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              <History className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-900" />
              )}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              aria-label="Cambiar tema"
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Visor Numérico (Compact, balanced height eliminating the top void) */}
        <section 
          className="h-28 sm:h-32 min-h-[110px] shrink-0 flex flex-col justify-end px-7 pt-1 pb-3 text-right relative cursor-pointer select-none"
          onClick={copyDisplayToClipboard}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          title="Toca para copiar • Desliza para borrar"
          aria-live="polite"
        >
          {/* Copy Notification Toast */}
          <div 
            className={`absolute top-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-zinc-100 dark:text-zinc-900 text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-all duration-200 pointer-events-none ${
              copyNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>Copiado al portapapeles</span>
          </div>

          {/* Formula / Expression & Live Preview Line */}
          <div className="flex items-center justify-end gap-2 text-zinc-400 dark:text-zinc-500 font-mono font-medium truncate opacity-85 tracking-wide text-base sm:text-lg min-h-[1.5rem] mb-0.5">
            <span className="truncate">{formatHeaderFormula(expression)}</span>
            {livePreview && (
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm animate-fade-in shrink-0 bg-blue-500/10 dark:bg-blue-400/10 px-1.5 py-0.5 rounded-md">
                = {livePreview}
              </span>
            )}
          </div>

          {/* Main Large Display Number */}
          <div 
            className={`font-mono font-medium text-zinc-900 dark:text-zinc-100 break-all leading-none tracking-tight transition-all duration-150 flex items-center justify-end min-h-[3rem] sm:min-h-[3.75rem] ${getDisplayFontSize(display)}`}
          >
            {display}
          </div>
        </section>

        {/* Scientific drawer (when toggled) */}
        {isScientificOpen && (
          <div className="grid grid-cols-5 gap-2 px-6 py-3 bg-zinc-100/80 dark:bg-zinc-800/40 border-t border-zinc-200/60 dark:border-zinc-800/60 animate-slide-up shrink-0">
            {SCIENTIFIC_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleButtonClick(btn.value, btn.type)}
                className={`h-11 rounded-2xl flex items-center justify-center text-sm font-medium transition-all active:scale-90 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 shadow-sm ${
                  btn.colorClass || 'text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Keypad Grid */}
        <section 
          aria-label="Teclado numérico"
          className="grid grid-cols-4 gap-2.5 sm:gap-3 p-4 sm:p-6 bg-zinc-50/90 dark:bg-zinc-800/30 rounded-t-[3rem] border-t border-zinc-200/60 dark:border-zinc-800/80 select-none shrink-0"
        >
          {BASIC_BUTTONS.map((btn) => {
            // Dynamic label for Clear (AC when clean, C when typing)
            let currentLabel = btn.label;
            if (btn.value === 'CLEAR') {
              currentLabel = isClearAll ? 'AC' : 'C';
            }

            const isEquals = btn.value === '=';
            const isBackspace = btn.value === 'BACKSPACE';
            const isClear = btn.value === 'CLEAR';
            const isNumber = btn.type === CalculatorButtonType.NUMBER;

            return (
              <button
                key={btn.value + btn.label}
                onClick={() => handleButtonClick(btn.value, btn.type)}
                aria-label={btn.ariaLabel || btn.label}
                className={`relative aspect-square flex items-center justify-center text-2xl font-medium transition-all duration-100 active:scale-90 rounded-3xl touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isNumber ? 'font-mono' : ''
                } ${
                  isEquals
                    ? 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30 active:bg-blue-700'
                    : isClear
                    ? 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                    : isNumber
                    ? 'bg-white dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 shadow-sm border border-zinc-200/40 dark:border-zinc-700/20'
                    : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70'
                } ${btn.colorClass || ''}`}
              >
                {isBackspace ? (
                  <Delete className="w-6 h-6 stroke-[1.8]" />
                ) : (
                  <span>{currentLabel}</span>
                )}
              </button>
            );
          })}
        </section>

        {/* History Overlay Drawer / Modal */}
        <HistoryOverlay 
          isOpen={isHistoryOpen} 
          history={history} 
          onClose={() => setIsHistoryOpen(false)} 
          onClear={() => {
            triggerFeedback('action');
            setHistory([]);
          }} 
          onSelect={(item) => {
            triggerFeedback('number');
            setDisplay(item.result);
            setExpression(item.result);
            setHasJustCalculated(true);
            setIsHistoryOpen(false);
          }}
          onUseExpression={(expr) => {
            triggerFeedback('number');
            setExpression(expr);
            setDisplay(expr);
            setHasJustCalculated(false);
            setIsHistoryOpen(false);
          }}
        />
      </main>
    </div>
  );
};

export default App;
