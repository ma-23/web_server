const fs = require('fs');
let content = fs.readFileSync('src/index.ts', 'utf8');

content = content.replace(/import \{_400\} from "\.\/_400\.js";\nimport \{ _401 \} from "\.\/_401\.js";\nimport \{ _403 \} from "\.\/_403\.js";\nimport \{ _404 \} from "\.\/_404\.js";/, 'import { ApiError } from "./ApiError.js";');

const middlewareErrosOld = `const middlewareErros = (err:Error,req:Request,res:Response,next:NextFunction)=>{
  if(err instanceof _400){
    res.status(400).json({error:err.message});
  }
  else if(err instanceof _401){
    res.status(401).json({error:err.message});
  }
  else if(err instanceof _403){
    res.status(403).json({error:err.message});
  }
  else if (err instanceof _404){
    res.status(404).json({error:err.message});
  }else{
    console.log(err.message);
    res.status(500).json({error:"Internal Server Errors"});
  }
}`;

const middlewareErrosNew = `const middlewareErros = (err:Error,req:Request,res:Response,next:NextFunction)=>{
  if(err instanceof ApiError){
    res.status(err.statusCode).json({error:err.message});
  }else{
    console.error(err);
    res.status(500).json({error:"Internal Server Errors"});
  }
}`;
content = content.replace(middlewareErrosOld, middlewareErrosNew);

content = content.replace(/throw new _404\("error"\);/g, 'throw new ApiError(404, "Not found");');

const apiUsersOld = `}else{
  res.status(400).json("Bad request");
}`;
const apiUsersNew = `}else{
  throw new ApiError(400, "Bad request");
}`;
content = content.replace(apiUsersOld, apiUsersNew);

content = content.replace(/throw new _401\("incorrect email or password"\);/g, 'throw new ApiError(401, "incorrect email or password");');

content = content.replace(/throw new _400\("Chirp is too long\. Max length is 140"\);/g, 'throw new ApiError(400, "Chirp is too long. Max length is 140");');

const apiChirpsOld = `if(typeof req.body.body !== "string" || typeof req.body.userId !=="string"){
res.status(400).json("Bad Request");
return 
}`;
const apiChirpsNew = `if(typeof req.body.body !== "string" || typeof req.body.userId !=="string"){
  throw new ApiError(400, "Bad Request");
}`;
content = content.replace(apiChirpsOld, apiChirpsNew);

const adminResetOld = `if(config.api.platform !=="dev"){
    res.status(403).send();
  }`;
const adminResetNew = `if(config.api.platform !=="dev"){
    throw new ApiError(403, "Forbidden");
  }`;
content = content.replace(adminResetOld, adminResetNew);

fs.writeFileSync('src/index.ts', content);
