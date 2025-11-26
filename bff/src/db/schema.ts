import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  primaryKey,
  foreignKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums
export const comicStatusEnum = pgEnum('comic_status', ['draft', 'generating', 'completed', 'published']);
export const ageRatingEnum = pgEnum('age_rating', ['G', 'PG', 'PG-13', '18+']);
export const tokenTransactionTypeEnum = pgEnum('token_transaction_type', ['purchase', 'spend', 'bonus', 'refund']);
export const podOrderStatusEnum = pgEnum('pod_order_status', ['pending', 'processing', 'shipped', 'delivered', 'failed']);
export const nftTypeEnum = pgEnum('nft_type', ['character', 'comic', 'badge']);

// Users table
export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    avatar: text('avatar'),
    role: varchar('role', { length: 50 }).default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIndex: uniqueIndex('users_email_idx').on(table.email),
  })
);

// Comics table
export const comics = pgTable(
  'comics',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    theme: varchar('theme', { length: 100 }).notNull(),
    status: comicStatusEnum('status').default('draft').notNull(),
    thumbnail: text('thumbnail'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('comics_user_id_idx').on(table.userId),
    statusIndex: index('comics_status_idx').on(table.status),
  })
);

// Characters table
export const characters = pgTable(
  'characters',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    imageUrl: text('image_url').notNull(),
    faceEmbedding: text('face_embedding'), // JSON string of vector
    metadata: jsonb('metadata').default({}),
    nftTokenId: varchar('nft_token_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('characters_user_id_idx').on(table.userId),
  })
);

// Pages table
export const pages = pgTable(
  'pages',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    comicId: varchar('comic_id', { length: 36 })
      .notNull()
      .references(() => comics.id, { onDelete: 'cascade' }),
    pageNumber: integer('page_number').notNull(),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    comicIdIndex: index('pages_comic_id_idx').on(table.comicId),
  })
);

// Panels table
export const panels = pgTable(
  'panels',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    pageId: varchar('page_id', { length: 36 })
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    panelNumber: integer('panel_number').notNull(),
    imageUrl: text('image_url').notNull(),
    description: text('description').notNull(),
    characters: jsonb('characters').default([]),
    speechBubbles: jsonb('speech_bubbles').default([]),
  },
  (table) => ({
    pageIdIndex: index('panels_page_id_idx').on(table.pageId),
  })
);

// Choices table (for CYOA branching)
export const choices = pgTable(
  'choices',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    pageId: varchar('page_id', { length: 36 })
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 500 }).notNull(),
    nextPageId: varchar('next_page_id', { length: 36 }),
    requiredTokens: integer('required_tokens').default(0),
    consequence: text('consequence'),
  },
  (table) => ({
    pageIdIndex: index('choices_page_id_idx').on(table.pageId),
  })
);

// Token balances table
export const tokenBalances = pgTable(
  'token_balances',
  {
    userId: varchar('user_id', { length: 36 })
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    balance: integer('balance').default(0).notNull(),
    spent: integer('spent').default(0).notNull(),
    earned: integer('earned').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// Token transactions table
export const tokenTransactions = pgTable(
  'token_transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: tokenTransactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    relatedId: varchar('related_id', { length: 36 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('token_transactions_user_id_idx').on(table.userId),
  })
);

// Stripe checkout sessions
export const stripeCheckoutSessions = pgTable(
  'stripe_checkout_sessions',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    priceId: varchar('price_id', { length: 255 }).notNull(),
    packageId: varchar('package_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('stripe_sessions_user_id_idx').on(table.userId),
  })
);

// NFTs table
export const nfts = pgTable(
  'nfts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contractAddress: varchar('contract_address', { length: 255 }).notNull(),
    tokenId: varchar('token_id', { length: 255 }).notNull(),
    type: nftTypeEnum('type').notNull(),
    metadata: jsonb('metadata').notNull(),
    transactionHash: varchar('transaction_hash', { length: 255 }),
    mintedAt: timestamp('minted_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('nfts_user_id_idx').on(table.userId),
  })
);

// POD Orders table
export const podOrders = pgTable(
  'pod_orders',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    comicId: varchar('comic_id', { length: 36 })
      .notNull()
      .references(() => comics.id),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerId: varchar('provider_id', { length: 255 }).notNull(),
    product: varchar('product', { length: 50 }).notNull(),
    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    status: podOrderStatusEnum('status').default('pending').notNull(),
    trackingNumber: varchar('tracking_number', { length: 255 }),
    shippingAddress: jsonb('shipping_address').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('pod_orders_user_id_idx').on(table.userId),
    comicIdIndex: index('pod_orders_comic_id_idx').on(table.comicId),
  })
);

// Analytics events table
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    event: varchar('event', { length: 255 }).notNull(),
    properties: jsonb('properties').default({}),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('analytics_events_user_id_idx').on(table.userId),
    eventIndex: index('analytics_events_event_idx').on(table.event),
  })
);

// Social media posts table
export const socialMediaPosts = pgTable(
  'social_media_posts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    comicId: varchar('comic_id', { length: 36 }),
    platform: varchar('platform', { length: 50 }).notNull(),
    content: text('content').notNull(),
    mediaUrls: jsonb('media_urls').default([]),
    status: varchar('status', { length: 50 }).default('draft'),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    engagementMetrics: jsonb('engagement_metrics').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('social_posts_user_id_idx').on(table.userId),
  })
);
