import * as migration_20260531_125639_initial from './20260531_125639_initial';

export const migrations = [
  {
    up: migration_20260531_125639_initial.up,
    down: migration_20260531_125639_initial.down,
    name: '20260531_125639_initial'
  },
];
