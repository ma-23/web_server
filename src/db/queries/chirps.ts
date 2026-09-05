import { chirps } from "../schema.js";
import type { Chrips } from "../schema.js";
import {db} from "../index.js";
import {asc,eq} from "drizzle-orm";

export async function addChrips(chrip:Chrips){
    const [result] = await db.insert(chirps).values(chrip).returning();
    return result;  
}
export async function getAllChrips(authorId?: string){
    const result = await db.select().from(chirps)
        .where(authorId ? eq(chirps.user_id, authorId) : undefined)
        
    return result;
}
export async function getChrip(id:string){
    const [result] = await db.select().from(chirps).where(eq(chirps.id,id))
    return result;
}

export async function deleteChrip(id:string){
    await db.delete(chirps).where(eq(chirps.id,id));
}