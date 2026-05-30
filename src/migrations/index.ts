import * as migration_20260530_172300 from './20260530_172300';

export const migrations = [
  {
    up: migration_20260530_172300.up,
    down: migration_20260530_172300.down,
    name: '20260530_172300'
  },
];
