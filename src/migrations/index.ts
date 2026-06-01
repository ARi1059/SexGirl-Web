import * as migration_20260531_125639_initial from './20260531_125639_initial';
import * as migration_20260601_060138_m6_categories from './20260601_060138_m6_categories';

export const migrations = [
  {
    up: migration_20260531_125639_initial.up,
    down: migration_20260531_125639_initial.down,
    name: '20260531_125639_initial',
  },
  {
    up: migration_20260601_060138_m6_categories.up,
    down: migration_20260601_060138_m6_categories.down,
    name: '20260601_060138_m6_categories'
  },
];
