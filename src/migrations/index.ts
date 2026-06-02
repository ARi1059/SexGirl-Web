import * as migration_20260531_125639_initial from './20260531_125639_initial';
import * as migration_20260601_060138_m6_categories from './20260601_060138_m6_categories';
import * as migration_20260601_092338_m7_customers_favorites from './20260601_092338_m7_customers_favorites';
import * as migration_20260602_143634_add_price_to_products from './20260602_143634_add_price_to_products';

export const migrations = [
  {
    up: migration_20260531_125639_initial.up,
    down: migration_20260531_125639_initial.down,
    name: '20260531_125639_initial',
  },
  {
    up: migration_20260601_060138_m6_categories.up,
    down: migration_20260601_060138_m6_categories.down,
    name: '20260601_060138_m6_categories',
  },
  {
    up: migration_20260601_092338_m7_customers_favorites.up,
    down: migration_20260601_092338_m7_customers_favorites.down,
    name: '20260601_092338_m7_customers_favorites',
  },
  {
    up: migration_20260602_143634_add_price_to_products.up,
    down: migration_20260602_143634_add_price_to_products.down,
    name: '20260602_143634_add_price_to_products'
  },
];
