import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums
export const comicStatusEnum = pgEnum('comic_status', ['draft', 'generating', 'completed', 'published']);
export const tokenTransactionTypeEnum = pgEnum('token_transaction_type', ['purchase', 'spend', 'bonus', 'refund']);
export const nftTypeEnum = pgEnum('nft_type', ['character', 'comic', 'badge']);

// Users
export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    avatar: text('avatar'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
);

// Comics
export const comics = pgTable(
  'comics',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    theme: varchar('theme', { length: 100 }).notNull(),
    status: comicStatusEnum('status').default('draft'),
    thumbnail: text('thumbnail'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('comics_user_id_idx').on(table.userId),
  })
);

// Characters
export const characters = pgTable(
  'characters',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url').notNull(),
    faceEmbedding: text('face_embedding'),
    metadata: jsonb('metadata').default({}),
    nftTokenId: varchar('nft_token_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('characters_user_id_idx').on(table.userId),
  })
);

// Pages
export const pages = pgTable(
  'pages',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    comicId: varchar('comic_id', { length: 36 }).notNull().references(() => comics.id, { onDelete: 'cascade' }),
    pageNumber: integer('page_number').notNull(),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    comicIdIdx: index('pages_comic_id_idx').on(table.comicId),
  })
);

// Panels
export const panels = pgTable(
  'panels',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    pageId: varchar('page_id', { length: 36 }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
    panelNumber: integer('panel_number').notNull(),
    imageUrl: text('image_url').notNull(),
    description: text('description'),
  },
  (table) => ({
    pageIdIdx: index('panels_page_id_idx').on(table.pageId),
  })
);

// Choices (CYOA branching)
export const choices = pgTable(
  'choices',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    pageId: varchar('page_id', { length: 36 }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 500 }).notNull(),
    nextPageId: varchar('next_page_id', { length: 36 }),
    requiredTokens: integer('required_tokens').default(0),
  },
  (table) => ({
    pageIdIdx: index('choices_page_id_idx').on(table.pageId),
  })
);

// Token Balances
export const tokenBalances = pgTable('token_balances', {
  userId: varchar('user_id', { length: 36 })
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').default(0),
  spent: integer('spent').default(0),
  earned: integer('earned').default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Token Transactions
export const tokenTransactions = pgTable(
  'token_transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: tokenTransactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    relatedId: varchar('related_id', { length: 36 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('token_transactions_user_id_idx').on(table.userId),
  })
);

// Stripe Payments
export const stripePayments = pgTable(
  'stripe_payments',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    sessionId: varchar('session_id', { length: 255 }).notNull(),
    packageId: varchar('package_id', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('stripe_payments_user_id_idx').on(table.userId),
  })
);

// NFTs
export const nfts = pgTable(
  'nfts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    relatedId: varchar('related_id', { length: 36 }), // character or comic ID
    type: nftTypeEnum('type').notNull(),
    tokenId: varchar('token_id', { length: 255 }),
    contractAddress: varchar('contract_address', { length: 255 }),
    metadata: jsonb('metadata').notNull(),
    transactionHash: varchar('transaction_hash', { length: 255 }),
    mintedAt: timestamp('minted_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('nfts_user_id_idx').on(table.userId),
  })
);

// Analytics Events
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).references(() => users.id),
    event: varchar('event', { length: 255 }).notNull(),
    properties: jsonb('properties').default({}),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('analytics_events_user_id_idx').on(table.userId),
    eventIdx: index('analytics_events_event_idx').on(table.event),
  })
);
