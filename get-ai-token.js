const data = require('./assets/data/rag/enhanced-feishu-full-content.json');
const node = data.nodes.find(n => n.title === 'AI创投季度观察');
console.log('Node found:', !!node);
if (node) {
    console.log('obj_token:', node.obj_token);
    console.log('node_token:', node.node_token);
}
