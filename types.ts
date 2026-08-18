export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type Theme = 'light' | 'dark';

export enum CalculatorButtonType {
  NUMBER = 'NUMBER',
  OPERATOR = 'OPERATOR',
  FUNCTION = 'FUNCTION',
  ACTION = 'ACTION',
  SCIENTIFIC = 'SCIENTIFIC'
}

export interface CalcButton {
  label: string;
  displayLabel?: string;
  value: string;
  type: CalculatorButtonType;
  colorClass?: string;
  icon?: string;
  ariaLabel?: string;
}
