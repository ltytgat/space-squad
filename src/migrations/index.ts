import * as migration_20260530_172300 from './20260530_172300';
import * as migration_20260530_180245 from './20260530_180245';

export const migrations = [
  {
    up: migration_20260530_172300.up,
    down: migration_20260530_172300.down,
    name: '20260530_172300',
  },
  {
    up: migration_20260530_180245.up,
    down: migration_20260530_180245.down,
    name: '20260530_180245'
  },
];
