import * as migration_20260530_172300 from './20260530_172300';
import * as migration_20260530_180245 from './20260530_180245';
import * as migration_20260530_181436 from './20260530_181436';
import * as migration_20260531_055352 from './20260531_055352';
import * as migration_20260531_123058 from './20260531_123058';
import * as migration_20260531_124711 from './20260531_124711';
import * as migration_20260531_205156 from './20260531_205156';
import * as migration_20260602_061757 from './20260602_061757';
import * as migration_20260603_095107 from './20260603_095107';
import * as migration_20260603_154448 from './20260603_154448';
import * as migration_20260604_051952 from './20260604_051952';
import * as migration_20260610_095221 from './20260610_095221';
import * as migration_20260611_072906 from './20260611_072906';
import * as migration_20260611_080305 from './20260611_080305';

export const migrations = [
  {
    up: migration_20260530_172300.up,
    down: migration_20260530_172300.down,
    name: '20260530_172300',
  },
  {
    up: migration_20260530_180245.up,
    down: migration_20260530_180245.down,
    name: '20260530_180245',
  },
  {
    up: migration_20260530_181436.up,
    down: migration_20260530_181436.down,
    name: '20260530_181436',
  },
  {
    up: migration_20260531_055352.up,
    down: migration_20260531_055352.down,
    name: '20260531_055352',
  },
  {
    up: migration_20260531_123058.up,
    down: migration_20260531_123058.down,
    name: '20260531_123058',
  },
  {
    up: migration_20260531_124711.up,
    down: migration_20260531_124711.down,
    name: '20260531_124711',
  },
  {
    up: migration_20260531_205156.up,
    down: migration_20260531_205156.down,
    name: '20260531_205156',
  },
  {
    up: migration_20260602_061757.up,
    down: migration_20260602_061757.down,
    name: '20260602_061757',
  },
  {
    up: migration_20260603_095107.up,
    down: migration_20260603_095107.down,
    name: '20260603_095107',
  },
  {
    up: migration_20260603_154448.up,
    down: migration_20260603_154448.down,
    name: '20260603_154448',
  },
  {
    up: migration_20260604_051952.up,
    down: migration_20260604_051952.down,
    name: '20260604_051952',
  },
  {
    up: migration_20260610_095221.up,
    down: migration_20260610_095221.down,
    name: '20260610_095221',
  },
  {
    up: migration_20260611_072906.up,
    down: migration_20260611_072906.down,
    name: '20260611_072906',
  },
  {
    up: migration_20260611_080305.up,
    down: migration_20260611_080305.down,
    name: '20260611_080305'
  },
];
