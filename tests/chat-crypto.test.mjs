import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {deriveConversationKey,encryptMessage,decryptMessage,encryptFile,decryptFile,isEncryptedText,isEncryptedAttachment,ENCRYPTED_FILE_MAX_BYTES} from "../lib/chat-crypto.mjs";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222",c="33333333-3333-4333-8333-333333333333";
test("AES-GCM text round trip across separately derived keys",async()=>{
 const first=await deriveConversationKey("a long shared secret for testing",a,b);
 const second=await deriveConversationKey("a long shared secret for testing",b,a);
 const encoded=await encryptMessage("Привет! 😀 Strong encryption.",first);
 assert.ok(isEncryptedText(encoded));
 assert.equal(await decryptMessage(encoded,second),"Привет! 😀 Strong encryption.");
 assert.equal(await decryptMessage("ordinary legacy text",second),"ordinary legacy text");
 await assert.rejects(decryptMessage(encoded,null));
 await assert.rejects(decryptMessage(encoded,await deriveConversationKey("incorrect secret for test",a,b)));
 await assert.rejects(decryptMessage(encoded,await deriveConversationKey("a long shared secret for testing",a,c)));
});
test("Encrypted attachment is not directly readable and can be decrypted with a shared key",async()=>{
 const key=await deriveConversationKey("private chat secret with enough length",a,b);
 const file=new Blob([new Uint8Array([2,3,5,7,11])],{type:"image/png"});
 const encrypted=await encryptFile(file,key);
 assert.equal(encrypted.type,"application/json");
 assert.equal(isEncryptedAttachment(a+"/"+b+"/enc-11111111-1111-4111-8111-111111111111.json"),true);
 const json=JSON.parse(await encrypted.text());
 assert.equal(json.format,"repo-radar-e2ee-file-v1");
 const result=await decryptFile(encrypted,key,"image/png");
 assert.deepEqual([...new Uint8Array(await result.arrayBuffer())],[2,3,5,7,11]);
 await assert.rejects(decryptFile(encrypted,await deriveConversationKey("an alternate chat passphrase",a,b),"image/png"));
});
test("Reject weak secrets and oversized encrypted files",async()=>{
 await assert.rejects(deriveConversationKey("short",a,b));
 const key=await deriveConversationKey("long enough secret for this conversation",a,b);
 await assert.rejects(encryptFile({size:ENCRYPTED_FILE_MAX_BYTES+1},key));
});
