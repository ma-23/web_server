import { describe, it, expect } from "vitest";
import { makeJWT, validateJWT,getBearerToken } from "./src/auth.js";
import type { Request } from "express";
import { IncomingMessage } from "node:http";
import {createRequest} from "node-mocks-http";

describe("JWT Authentication Functions", () => {
  const secret = "super-secret-key-123";
  const wrongSecret = "wrong-key-456";
  const userID = "user-uuid-789";

  it("should create and successfully validate a valid JWT token", () => {
    const expiresIn = 3600; // 1 hour
    const token = makeJWT(userID, expiresIn, secret);
    
    expect(typeof token).toBe("string");
    
    // The validation should return the exact userID we passed in
    const extractedUserID = validateJWT(token, secret);
    expect(extractedUserID).toBe(userID);
  });

  it("should reject a JWT that was signed with the wrong secret", () => {
    const expiresIn = 3600;
    const token = makeJWT(userID, expiresIn, secret);

    // Attempting to validate with a different secret should throw an error
    expect(() => validateJWT(token, wrongSecret)).toThrowError("Invalid JWT token");
  });

  it("should reject an expired JWT token", () => {
    // We pass a negative expiration time to instantly expire the token upon creation
    const expiresIn = -10; 
    const token = makeJWT(userID, expiresIn, secret);

    // Attempting to validate an expired token should throw an error
    expect(() => validateJWT(token, secret)).toThrowError("Invalid JWT token");
  });
});

describe("Testing getBearerToken",()=>{
const userId = "123";
const expires_at = 3600;
const secret = "Da Vinci";
const token = makeJWT(userId,expires_at,secret);
const correct_request = createRequest({headers:{"authorization":`Bearer ${token}`}})
const wrong_request = createRequest();
it("It should be able to extract a token in an authorization header",()=>{
expect(getBearerToken(correct_request)).toBe(token);
});

it("It should fail when the authorization header doesn't exist.",()=>{

  expect(()=>getBearerToken(wrong_request)).toThrowError("401: No token sent.");
})




});