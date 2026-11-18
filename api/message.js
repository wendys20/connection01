import { kv } from '@vercel/kv';
const ADMIN_PASSWORD = "123456";
export default async function handler(req, res) {
    if(req.method === 'GET'){
        const data = await kv.get('discuss_data') || {};
        return res.status(200).json(data);
    }
    if(req.method === 'POST'){
        const {action, topicId, content, time, pwd, idx} = req.body;
        let data = await kv.get('discuss_data') || {};
        if(action === "add"){
            if(!topicId || !content?.trim()) return res.status(400).json({ok:false});
            if(!data[topicId]) data[topicId] = [];
            data[topicId].push({content:content.trim(), time});
            await kv.set('discuss_data', data);
            return res.status(200).json({ok:true});
        }
        if(action === "delete"){
            if(pwd !== ADMIN_PASSWORD) return res.status(403).json({ok:false});
            if(data[topicId]) data[topicId].splice(idx,1);
            await kv.set('discuss_data', data);
            return res.status(200).json({ok:true});
        }
        if(action === "clear"){
            if(pwd !== ADMIN_PASSWORD) return res.status(403).json({ok:false});
            await kv.set('discuss_data',{});
            return res.status(200).json({ok:true});
        }
    }
    res.status(405).end();
}
