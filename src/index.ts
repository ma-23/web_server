import express,{NextFunction, type Express,type Request, type Response} from "express";
import {config} from "./config.js";
import { error } from "node:console";
import { ApiError } from "./ApiError.js";
import { createUser, deleteUsers, findByEmail, findUserById, updateToChirpyRed, updateUser } from "./db/queries/users.js";
import { addChrips, deleteChrip, getAllChrips, getChrip } from "./db/queries/chirps.js";
import {insertRefreshTokens,getUserFromRefreshToken, revokeToken} from "./db/queries/refresh_tokens.js";
import { checkPasswordHash, getAPIKey, getBearerToken, hashPassword,makeJWT, makeRefreshToken, validateJWT } from "./auth.js";
import { NewUser } from "./db/schema.js";

const app:Express = express();
const PORT  = 8080;

// ==========================================
// MIDDLEWARE DEFINITIONS
// ==========================================

const middlewareLogResponses = (req:Request,res:Response,next:NextFunction) =>{
res.on("finish",()=>{
    const code = res.statusCode;
    if(code < 200 && code > 299 ){
        console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${code}`);
    }
})
next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.api.fileserverHits += 1;
  next();
}

const numberOfHits = (req:Request,res:Response,next:NextFunction) =>{
    res.set("Content-Type","text/html");
    res.set("charset","utf-8");
    res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`);
}

const middlewareErros = (err:Error,req:Request,res:Response,next:NextFunction)=>{
  if(err instanceof ApiError){
    res.status(err.statusCode).json({error:err.message});
  }else{
    console.error(err);
    res.status(500).json({error:"Internal Server Errors"});
  }
}

// ==========================================
// GLOBAL MIDDLEWARE REGISTRATION
// ==========================================
app.use(express.json());
app.use(middlewareLogResponses);

// ==========================================
// STATIC ROUTES
// ==========================================
app.use("/app",middlewareMetricsInc,express.static("./src/app"));

// ==========================================
// GET ROUTES
// ==========================================
app.get("/api/healthz",(req:Request,res:Response)=>{
  res.set('Content-Type','text/plain');
  res.set("charset=utf-8");
  res.send("OK");
});

app.get("/admin/metrics",numberOfHits);

app.get("/api/chirps",async(req:Request,res:Response)=>{
const authorId = req.query.authorId as string | undefined;
const result = await getAllChrips(authorId);
if(!req.query.sort || req.query.sort ==="asc"){
result.sort((a,b) => a.createdAt.getTime()-b.createdAt.getTime())

}else{
result.sort((a,b) => -1*(a.createdAt.getTime()-b.createdAt.getTime()))

}

res.status(200).json(result)

});
app.get("/api/chirps/:chirpId",async (req:Request,res:Response)=>{
const id:string = req.params.chirpId as string;
const result = await getChrip(id);
if(result){
  res.status(200).json(result);
}else{
  throw new ApiError(404, "Not found");
}
}
  );

// ==========================================
// POST ROUTES
// ==========================================


app.post("/admin/reset",async (req:Request,res:Response,next:NextFunction)=>{
  if(config.api.platform !=="dev"){
    throw new ApiError(403, "Forbidden");
  }else{
    await deleteUsers();
  config.api.fileserverHits = 0;
  res.send();
  }
});


app.post("/api/users",async (req:Request,res:Response)=>{
if(typeof req.body.email === "string"&& typeof req.body.password ==="string"){
const email = req.body.email;
const password = req.body.password;
const hashed = await hashPassword(password);
const result = await createUser({email,hashed_password:hashed});
const {hashed_password, is_chirpy_red, ...safeUser} = result;
res.status(201).json({ ...safeUser, isChirpyRed: is_chirpy_red });
}else{
  throw new ApiError(400, "Bad request");
}

});


app.post("/api/login",async (req:Request,res:Response)=>{
if(typeof req.body.email !== "string" || typeof req.body.password !== "string"){
  throw new ApiError(401, "incorrect email or password");
}
//access token 1 hour JWT
//Refresh token 60 days, database.

const email = req.body.email;
const password = req.body.password;

const query = await findByEmail(email);
if( query && await checkPasswordHash(password,query.hashed_password)){
const {hashed_password, is_chirpy_red, ...safeUser} = query
// create a short-lived access token (expires in 1 hour)
const token = makeJWT(safeUser.id,3600,config.api.secret);

// Generate a long-lived refresh token (expires in 60 days) and store it in DB
const sixty_days_in_milliseconds = 1000*3600*24*60;
const expires_at = new Date(Date.now()+sixty_days_in_milliseconds);
const random_token = makeRefreshToken();
const refreshToken = await insertRefreshTokens({token:random_token,user_id:safeUser.id,expires_at:expires_at});

res.status(200).json({...safeUser, isChirpyRed: is_chirpy_red, token,refreshToken:refreshToken.token});
}else{
  throw new ApiError(401, "incorrect email or password");
}



})

app.post("/api/chirps",async (req:Request,res:Response)=>{
type Body = {
  body:string;
};
type Success = {
  cleanedBody:string;
};
//First, check weather the user has a token and the token is valid, from there you will get the userId
const token = getBearerToken(req);
const user_id = validateJWT(token,config.api.secret);




if(typeof req.body.body !== "string" ){
  throw new ApiError(400, "Bad Request");
}

const input:Body = req.body;

if(input.body.length > 140){
  throw new ApiError(400, "Chirp is too long. Max length is 140");
}
//assuming success.
//create the array of bad words
// create the array of bad words for the profanity filter
const bad_words = ["kerfuffle","sharbert","fornax"];

let words:string|string[] = input.body.split(" ");
for(let i = 0; i < words.length; i++){
  const nuteral = words[i].toLocaleLowerCase();
  if(bad_words.includes(nuteral)){
    words[i] = "****"; // Redact profanity
  }
}
words = words.join(" ");
const result = await addChrips({body:words,user_id});
res.status(201).json({
  id: result.id,
  createdAt: result.createdAt,
  updatedAt: result.updatedAt,
  body: result.body,
  userId: result.user_id
});
});


app.post("/api/refresh",async(req:Request,res:Response)=>{
const refresh_token = getBearerToken(req);
const query  = await getUserFromRefreshToken(refresh_token);
if(query && !query.revoked_at && Date.now()<query.expires_at.getTime()){
  const token = makeJWT(query.user_id as string,3600,config.api.secret)
  res.status(200).json({token});
  return;
}
throw new ApiError(401,"Unathorized");
});

app.post("/api/revoke",async(req,res)=>{
const refresh_token = getBearerToken(req);
const query = await getUserFromRefreshToken(refresh_token);
if(query){
  await revokeToken(query.token);
  
}
res.status(204).send();
});

// ==========================================
// WEB HOOKS  
// ==========================================

app.post("/api/polka/webhooks",async (req,res)=>{
type Body  ={
  event:string;
  data:{
    userId:string
  }

}

const key = getAPIKey(req);
if(key !== config.api.polka_key){
  res.status(401).send();
  return; // Stop execution if unauthorized
}

const body:Body = req.body;

// Only process "user.upgraded" events
if(body.event!== "user.upgraded"){
  res.status(204).send();
  return;
}
const user = await findUserById(body.data.userId);
if(!user){
  res.status(404).send();
  return ;
}
await updateToChirpyRed(body.data.userId);
res.status(204).send();



});


// ==========================================
// PUT ROUTES
// ==========================================

app.put("/api/users",async (req,res)=>{
const token = getBearerToken(req);
const id = validateJWT(token,config.api.secret);
const {password,email} = req.body;
if(!password || !email ){
  throw new ApiError(401,"missing email or password.");
}
const hashed = await  hashPassword(password);
const result = await updateUser(id,email,hashed);
res.status(200).json(result);

});


// ==========================================
// DELETE ROUTES
// ==========================================

app.delete("/api/chirps/:chirpId",async (req,res)=>{
const token = getBearerToken(req);
 const id =  validateJWT(token,config.api.secret);

 
 const chirp = await getChrip(req.params.chirpId);
if(!chirp){
  res.status(404).json();
  return;
}
 if(id !== chirp.user_id){
  res.status(403).json("Forbidden.");
  return;
 }

await deleteChrip(req.params.chirpId);
res.status(204).send();




});

// ==========================================
// ERROR HANDLING MIDDLEWARE (Must be last)
// ==========================================
app.use(middlewareErros);

// ==========================================
// SERVER START
// ==========================================
app.listen(8080,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
});