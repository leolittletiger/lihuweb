const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.static('.')); // 服务静态文件

// 存储留言的文件路径
const messagesFile = path.join(__dirname, 'data', 'messages.json');

// 确保数据目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// 确保消息文件存在
if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, '[]');
}

// 处理提交留言的请求
app.post('/api/messages', (req, res) => {
    try {
        const message = {
            ...req.body,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };

        // 读取现有消息
        const messages = JSON.parse(fs.readFileSync(messagesFile));
        
        // 添加新消息
        messages.push(message);
        
        // 保存回文件
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        
        res.json({ success: true, message: '留言已保存' });
    } catch (error) {
        console.error('保存留言失败:', error);
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

// 获取所有留言
app.get('/api/messages', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(messagesFile));
        res.json(messages);
    } catch (error) {
        console.error('读取留言失败:', error);
        res.status(500).json({ success: false, message: '读取失败' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 