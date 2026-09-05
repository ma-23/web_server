import {db} from "../index.js";
import { refresh_tokens } from "../schema.js";
import type { RefreshTokens } from "../schema.js";
import {eq} from "drizzle-orm"



export async function insertRefreshTokens(new_token:RefreshTokens){
const [result] = await db.insert(refresh_tokens).values(new_token).returning();
return result;
}

export async function getUserFromRefreshToken(token:string){
    const [result]  = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token,token))
    return result;
}

export async function revokeToken(token:string){
    await db.update(refresh_tokens).set({revoked_at:new Date(),updatedAt: new Date()}).where(eq(refresh_tokens.token,token));
}