// Optional per-conversation, passphrase-based end-to-end encryption.
// Content is encrypted on the device, before it reaches Supabase.
// Metadata (sender, recipient, timestamps, file name/type/size) is NOT E2EE.
// No password, key, or ciphertext decryption result is persisted in storage.
const encoder=new TextEncoder(),decoder=new TextDecoder();
const TEXT_PREFIX="rr-e2ee:v1:";
export const ENCRYPTED_ATTACHMENT_FORMAT="repo-radar-e2ee-file-v1";
export const ENCRYPTED_FILE_MAX_BYTES=15*1024*1024;
export const ENCRYPTED_TEXT_MAX_CHARS=2600;
function cryptoApi(){if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)throw Error("Web Crypto requires HTTPS");return globalThis.crypto;}
function toB64(data){
 const bytes=data instanceof Uint8Array?data:new Uint8Array(data);
 let out="";for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return btoa(out);
}
function fromB64(text){
 if(typeof text!=="string"||text.length>42_000_000)throw Error("Invalid encrypted data");
 const binary=atob(text),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return bytes;
}
function peerScope(one,two){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(one)||!uuid.test(two)||one===two)throw Error("Invalid conversation");
 return [one.toLowerCase(),two.toLowerCase()].sort().join(":");
}
export function isEncryptedText(text){return typeof text==="string"&&text.startsWith(TEXT_PREFIX);}
export function isEncryptedAttachment(path){return /\/(?:enc-)[0-9a-f-]{36}\.json$/i.test(String(path));}
export async function deriveConversationKey(passphrase,one,two){
 if(typeof passphrase!=="string"||Array.from(passphrase).length<12||passphrase.length>512)throw Error("Use at least 12 characters for the shared secret");
 const api=cryptoApi(),scope=peerScope(one,two);
 // Same two peers on multiple devices derive the same key with the shared secret.
 const salt=await api.subtle.digest("SHA-256",encoder.encode("RepoRadar/DM/2026/v1/"+scope));
 const root=await api.subtle.importKey("raw",encoder.encode(passphrase),"PBKDF2",false,["deriveKey"]);
 const key=await api.subtle.deriveKey({name:"PBKDF2",salt,iterations:240000,hash:"SHA-256"},root,
  {name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
 return {key,scope};
}
function extra(scope,type){return encoder.encode("RepoRadar/v1/"+type+"/"+scope);}
async function seal(data,session,type){
 const api=cryptoApi(),nonce=api.getRandomValues(new Uint8Array(12));
 const ciphertext=await api.subtle.encrypt({name:"AES-GCM",iv:nonce,additionalData:extra(session.scope,type)},session.key,data);
 return {nonce:toB64(nonce),ciphertext:toB64(ciphertext)};
}
async function unseal(nonce,cipher,session,type){
 const n=fromB64(nonce);if(n.length!==12)throw Error("Invalid encrypted nonce");
 return cryptoApi().subtle.decrypt({name:"AES-GCM",iv:n,additionalData:extra(session.scope,type)},session.key,fromB64(cipher));
}
export async function encryptMessage(text,session){
 if(!text)return "";
 if(Array.from(text).length>ENCRYPTED_TEXT_MAX_CHARS||encoder.encode(text).byteLength>2750)throw Error("Encrypted message is too long");
 const x=await seal(encoder.encode(text),session,"text");
 return TEXT_PREFIX+x.nonce+":"+x.ciphertext;
}
export async function decryptMessage(payload,session){
 if(!isEncryptedText(payload))return payload;
 const parts=payload.slice(TEXT_PREFIX.length).split(":");
 if(parts.length!==2||!session)throw Error("Missing or invalid conversation secret");
 return decoder.decode(await unseal(parts[0],parts[1],session,"text"));
}
export async function encryptFile(file,session){
 if(!file||file.size>ENCRYPTED_FILE_MAX_BYTES)throw Error("Encrypted files are limited to 15 MB");
 const bytes=await file.arrayBuffer(),x=await seal(bytes,session,"file");
 return new Blob([JSON.stringify({format:ENCRYPTED_ATTACHMENT_FORMAT,nonce:x.nonce,ciphertext:x.ciphertext})],{type:"application/json"});
}
export async function decryptFile(blob,session,mime){
 if(!session||blob.size>25*1024*1024)throw Error("Encrypted attachment is too large or the secret is missing");
 const data=JSON.parse(await blob.text());
 if(data?.format!==ENCRYPTED_ATTACHMENT_FORMAT)throw Error("Invalid encrypted attachment");
 const bytes=await unseal(data.nonce,data.ciphertext,session,"file");
 return new Blob([bytes],{type:mime||"application/octet-stream"});
}
