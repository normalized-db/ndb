export type LogMode = 'disabled' // disable logging
  | 'simple' // `LogEntry<?>` except `item`-field
  | 'full'; // include `item`-field
