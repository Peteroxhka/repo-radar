// File-kind detection is based on an allowlisted extension and declared MIME,
// not arbitrary HTML content or paths supplied by another user.
const kindByExtension={
 jpg:"image",jpeg:"image",png:"image",webp:"image",gif:"image",bmp:"image",heic:"image",
 mp4:"video",webm:"video",mov:"video",m4v:"video",
 mp3:"audio",m4a:"audio",aac:"audio",ogg:"audio",wav:"audio",flac:"audio",
 pdf:"pdf",txt:"document",md:"document",csv:"document",json:"document",
 doc:"document",docx:"document",xls:"document",xlsx:"document",
 ppt:"document",pptx:"document",odt:"document",ods:"document",odp:"document",
 zip:"archive","7z":"archive",rar:"archive"
};
export function safeAttachmentName(name){
 const value=String(name||"Attachment").replace(/[\u0000-\u001f\u007f]/g,"").replace(/[\\/]/g,"").trim();
 return (value||"Attachment").slice(0,180);
}
export function attachmentKind(name,mime){
 const ext=safeAttachmentName(name).split(".").pop().toLowerCase();
 const kind=kindByExtension[ext]||"document";
 const type=String(mime||"").toLowerCase();
 if(kind==="image"&&type&&!type.startsWith("image/"))return "document";
 if(kind==="video"&&type&&!type.startsWith("video/"))return "document";
 if(kind==="audio"&&type&&!type.startsWith("audio/"))return "document";
 return kind;
}
export function attachmentIcon(kind){
 return ({image:"🖼️",video:"🎬",audio:"🎵",pdf:"📕",document:"📄",archive:"🗜️"})[kind]||"📎";
}
export function prettyBytes(bytes){
 const value=Number(bytes)||0;
 if(value<1024)return value+" B";
 if(value<1024*1024)return (value/1024).toFixed(1)+" KB";
 return (value/(1024*1024)).toFixed(1)+" MB";
}
export function isPrivateStorageUrl(raw,origin){
 try{
  const url=new URL(raw),project=new URL(origin);
  return url.protocol==="https:"&&url.origin===project.origin &&
    url.pathname.includes("/storage/v1/object/sign/")&&url.searchParams.has("token");
 }catch{return false;}
}
