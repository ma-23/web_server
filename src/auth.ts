import * as argon2  from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import { ApiError } from "./ApiError.js";
import { randomBytes } from "node:crypto";
type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
export async function hashPassword(password:string){
    
const hash = await  argon2.hash(password);
    return hash;
}

export async function checkPasswordHash(password:string,hash:string){
    const is_equal = await argon2.verify(hash,password);
    return is_equal;
}

export function makeJWT(userID:string,expiresIn:number,secret:string){
    const payload:payload  = {iss:"chirpy",sub:userID,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+expiresIn};

    const token = jwt.sign(payload,secret);
    return token;
}

export function validateJWT(tokenString: string, secret: string): string{
try{
  
    const payload = jwt.verify(tokenString,secret);
    return payload.sub as string;
}catch(err){
    throw new ApiError(401,"Invalid JWT token");
}
}




export function getBearerToken(req:Request){
let header = req.get("authorization");
if(!header){
  throw new ApiError(401,"401: No token sent.");
}
header = header.trim();
const token = header.split(" ");
if(token.length === 2 && token[0] ==="Bearer"){
return token[1]; 
}
throw new ApiError(401,"Not JWT");


}

export function  makeRefreshToken(){
const random = randomBytes(32);
const hex_string = random.toString("hex");
return hex_string;
}


export function getAPIKey(req:Request){
let header = req.get("authorization");
if(!header){
  throw new ApiError(401,"401: No token sent.");
}
header = header.trim();
const token = header.split(" ");
if(token.length === 2 && token[0] ==="ApiKey"){
return token[1]; 
}
throw new ApiError(401,"Not JWT");


}