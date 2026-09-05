import e from "express";
import {db} from "../index.js";
import { NewUser,users } from "../schema.js";
import {eq} from "drizzle-orm";


export async function createUser(user:NewUser){
    const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();
    return result;
}

export async function deleteUsers(){
    await db.delete(users);
}

export async function findByEmail(email:string){
    const [result] = await db.select().from(users).where(eq(users.email,email));
    return result;

}
export async function updateUser(id:string,email:string,password:string){
const [result] = await db.update(users).set({email,hashed_password:password}).where(eq(users.id,id)).returning({id:users.id,createdAt:users.createdAt,updatedAt:users.updatedAt,email:users.email,isChirpyRed:users.is_chirpy_red});
return result;
}

export async function  updateToChirpyRed(id:string){
 await db.update(users).set({is_chirpy_red:true}).where(eq(users.id,id));

}

export async function findUserById(id:string){
    const [result] = await db.select().from(users).where(eq(users.id,id));
    return result;
}