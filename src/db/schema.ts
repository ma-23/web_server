
import { PgTable,varchar,boolean,uuid,timestamp, pgTable } from "drizzle-orm/pg-core";


export const users = pgTable("users",{
id:uuid("id").primaryKey().defaultRandom(),
createdAt:timestamp("createdAt").notNull().defaultNow(),
updatedAt:timestamp("updatedAt").notNull().defaultNow().$onUpdate(()=>{return new Date()}),
email:varchar("email",{length:256}).notNull().unique(),

hashed_password:varchar().notNull().default("unset"),
is_chirpy_red: boolean().default(false),
});
export type NewUser = typeof users.$inferInsert;

export const chirps = pgTable("chirps",{
id:uuid("id").primaryKey().defaultRandom(),
createdAt:timestamp("createdAt").notNull().defaultNow(),
updatedAt:timestamp("updatedAt").notNull().defaultNow().$onUpdate(()=>{return new Date()}),
body: varchar("body",{length:140}).notNull(),
user_id:uuid("userId").references(()=>users.id,{onDelete:"cascade"})



});
export type Chrips = typeof chirps.$inferInsert;

export const refresh_tokens = pgTable("refresh_tokens",{
token:varchar("token").primaryKey(),
createdAt:timestamp("createdAt").notNull().defaultNow(),
updatedAt:timestamp("updatedAt").notNull().defaultNow().$onUpdate(()=>{return new Date()}),
user_id:uuid().references(()=>users.id,{onDelete:"cascade"}),
expires_at:timestamp().notNull(),
revoked_at:timestamp()

});

export type RefreshTokens = typeof refresh_tokens.$inferInsert;