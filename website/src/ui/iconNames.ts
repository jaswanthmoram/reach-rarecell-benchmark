// Mirrors every <symbol id="i-…"> in public/icons.svg (78). The System page renders the gallery from it.
export const ICON_NAMES = [
  'house', 'ranking', 'stack', 'database', 'flask', 'images-square', 'book-open-text', 'quotes', 'github-logo', 'copy',
  'check', 'download-simple', 'arrow-up-right', 'arrow-right', 'caret-up-down', 'caret-down', 'funnel-simple',
  'terminal-window', 'microscope', 'dna', 'seal-check', 'timer', 'magnifying-glass', 'list', 'x', 'warning-circle',
  'info', 'sun', 'moon', 'target', 'chart-line-up', 'scales', 'file-text', 'arrow-left', 'caret-left', 'caret-right',
  'caret-up', 'plus', 'minus', 'chart-scatter', 'chart-bar', 'flow-arrow', 'git-branch', 'lightning', 'clock', 'cpu',
  'tree-structure', 'list-numbers', 'eye', 'code', 'brackets-curly', 'package', 'cube', 'books', 'envelope', 'users',
  'user-circle', 'globe', 'link', 'pulse', 'graph', 'funnel', 'sliders-horizontal', 'arrows-out-simple',
  'arrow-square-out', 'lock-key', 'test-tube', 'atom', 'virus', 'share-network', 'calendar-blank', 'hash', 'percent',
  'stack-simple', 'squares-four', 'grid-four', 'rows', 'table',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
