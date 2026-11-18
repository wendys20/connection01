export default async function handler(req, res) {
    const ADMIN_PASSWORD = "123456";
    const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
    const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    const KEY = "discuss_data";

    // ===== 跨域CORS 关键修复 =====
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if(req.method === "OPTIONS") return res.status(200).end();

    const redisFetch = async (body) => {
        return await fetch(REDIS_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
            body: JSON.stringify(body)
        }).then(r=>r.json());
    }

    if(req.method === 'GET'){
        const r = await redisFetch(["GET", KEY]);
        const data = r.result ? JSON.parse(r.result) : {};
        return res.status(200).json(data);
    }

    if(req.method === 'POST'){
        const {action, topicId, content, time, pwd, idx} = req.body;
        const r = await redisFetch(["GET", KEY]);
        let data = r.result ? JSON.parse(r.result) : {};

        if(action === "add"){
            if(!topicId || !content?.trim()) return res.status(400).json({ok:false});
            if(!data[topicId]) data[topicId] = [];
            data[topicId].push({content:content.trim(), time});
            await redisFetch(["SET", KEY, JSON.stringify(data)]);
            return res.status(200).json({ok:true});
        }
        if(action === "delete"){
            if(pwd !== ADMIN_PASSWORD) return res.status(403).json({ok:false});
            if(data[topicId]) data[topicId].splice(idx,1);
            await redisFetch(["SET", KEY, JSON.stringify(data)]);
            return res.status(200).json({ok:true});
        }
        if(action === "clear"){
            if(pwd !== ADMIN_PASSWORD) return res.status(403).json({ok:false});
            await redisFetch(["SET", KEY, JSON.stringify({})]);
            return res.status(200).json({ok:true});
        }
    }
    return res.status(405).end();
}
