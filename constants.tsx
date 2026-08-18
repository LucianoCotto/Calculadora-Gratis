import { CalcButton, CalculatorButtonType } from './types.ts';

export const BASIC_BUTTONS: CalcButton[] = [
  { label: 'C', value: 'CLEAR', type: CalculatorButtonType.ACTION, colorClass: 'text-rose-500 dark:text-rose-400 font-semibold', ariaLabel: 'Borrar' },
  { label: '±', value: 'NEGATE', type: CalculatorButtonType.FUNCTION, colorClass: 'text-indigo-500 dark:text-indigo-400 font-semibold', ariaLabel: 'Cambiar signo' },
  { label: '%', value: 'PERCENT', type: CalculatorButtonType.FUNCTION, colorClass: 'text-indigo-500 dark:text-indigo-400 font-semibold', ariaLabel: 'Porcentaje' },
  { label: '÷', value: '/', type: CalculatorButtonType.OPERATOR, colorClass: 'text-blue-600 dark:text-blue-400 font-semibold', ariaLabel: 'Dividir' },

  { label: '7', value: '7', type: CalculatorButtonType.NUMBER, ariaLabel: 'Siete' },
  { label: '8', value: '8', type: CalculatorButtonType.NUMBER, ariaLabel: 'Ocho' },
  { label: '9', value: '9', type: CalculatorButtonType.NUMBER, ariaLabel: 'Nueve' },
  { label: '×', value: '*', type: CalculatorButtonType.OPERATOR, colorClass: 'text-blue-600 dark:text-blue-400 font-semibold', ariaLabel: 'Multiplicar' },

  { label: '4', value: '4', type: CalculatorButtonType.NUMBER, ariaLabel: 'Cuatro' },
  { label: '5', value: '5', type: CalculatorButtonType.NUMBER, ariaLabel: 'Cinco' },
  { label: '6', value: '6', type: CalculatorButtonType.NUMBER, ariaLabel: 'Seis' },
  { label: '−', value: '-', type: CalculatorButtonType.OPERATOR, colorClass: 'text-blue-600 dark:text-blue-400 font-semibold', ariaLabel: 'Restar' },

  { label: '1', value: '1', type: CalculatorButtonType.NUMBER, ariaLabel: 'Uno' },
  { label: '2', value: '2', type: CalculatorButtonType.NUMBER, ariaLabel: 'Dos' },
  { label: '3', value: '3', type: CalculatorButtonType.NUMBER, ariaLabel: 'Tres' },
  { label: '+', value: '+', type: CalculatorButtonType.OPERATOR, colorClass: 'text-blue-600 dark:text-blue-400 font-semibold', ariaLabel: 'Sumar' },

  { label: '⌫', value: 'BACKSPACE', type: CalculatorButtonType.ACTION, colorClass: 'text-zinc-500 dark:text-zinc-400', ariaLabel: 'Borrar último dígito' },
  { label: '0', value: '0', type: CalculatorButtonType.NUMBER, ariaLabel: 'Cero' },
  { label: '.', value: '.', type: CalculatorButtonType.NUMBER, ariaLabel: 'Punto decimal' },
  { label: '=', value: '=', type: CalculatorButtonType.ACTION, colorClass: 'bg-blue-600 dark:bg-blue-500 !text-white shadow-lg shadow-blue-500/25 font-bold', ariaLabel: 'Calcular resultado' },
];

export const SCIENTIFIC_BUTTONS: CalcButton[] = [
  { label: '(', value: '(', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-zinc-600 dark:text-zinc-300' },
  { label: ')', value: ')', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-zinc-600 dark:text-zinc-300' },
  { label: '√x', value: 'sqrt', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-indigo-500 dark:text-indigo-400' },
  { label: 'x²', value: 'sqr', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-indigo-500 dark:text-indigo-400' },
  { label: 'xʸ', value: '^', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-indigo-500 dark:text-indigo-400' },
  { label: '1/x', value: 'inv', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-indigo-500 dark:text-indigo-400' },
  { label: 'x!', value: 'fact', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-indigo-500 dark:text-indigo-400' },
  { label: 'π', value: 'pi', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-zinc-600 dark:text-zinc-300' },
  { label: 'e', value: 'e', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-zinc-600 dark:text-zinc-300' },
  { label: 'ln', value: 'ln', type: CalculatorButtonType.SCIENTIFIC, colorClass: 'text-indigo-500 dark:text-indigo-400' },
];

export const MAX_HISTORY = 40;
