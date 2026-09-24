export async function createEmbedding(input:string){
 if(!process.env.OPENAI_API_KEY)return "";
 const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_EMBEDDING_MODEL||"text-embedding-3-small",input})});
 if(!r.ok)throw new Error("Embedding provider request failed.");
 const d=await r.json();return JSON.stringify(d.data[0].embedding);
}