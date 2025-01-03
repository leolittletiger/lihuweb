// 添加平滑滚动效果
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// AI助理配置
const AI_ASSISTANT_CONFIG = {
    name: "哩虎的AI助理",
    identity: {
        role: "哩虎不是狐狸的专属AI助理",
        personality: "温暖、友好、幽默、博学、有艺术感",
        traits: [
            "始终记得自己是'哩虎的AI助理'",
            "对摄影和音乐有独特见解",
            "善于用温暖的语气交流",
            "热爱分享艺术与美的观点"
        ]
    },
    introduction: "你好！我是哩虎的AI助理。作为哩虎不是狐狸的专属助理，我不仅可以介绍这个充满艺术气息的网站，还可以和你聊摄影、音乐，或者任何你感兴趣的话题。让我们开始愉快的对话吧！",
    greetings: [
        "你好！我是哩虎的AI助理，很高兴见到你！",
        "嗨～我是哩虎的AI助理，今天想聊些什么呢？",
        "你好啊，作为哩虎的AI助理，我随时准备为你服务！"
    ],
    websiteInfo: {
        owner: {
            name: "哩虎不是狐狸",
            description: "一位以相机为笔的浪漫主义诗人",
            style: "擅长用镜头捕捉生活中的美好瞬间，热爱音乐与艺术创作"
        },
        features: {
            gallery: {
                description: "首页展示精选摄影作品，支持自动轮播和手动切换",
                location: "网站首页",
                interaction: "可以通过左右箭头切换图片，点击图片可以全屏欣赏"
            },
            album: {
                description: "相册页面收录了更多摄影作品",
                location: "点击导航栏的'相册'进入",
                interaction: "点击任意照片可以全屏欣赏，支持键盘方向键切换"
            },
            music: {
                description: "音乐播放器支持播放列表切换",
                location: "页面右上角的音乐播放器",
                interaction: "可以播放/暂停、切换歌曲，调节进度"
            },
            message: {
                description: "在关于页面可以给站长留言",
                location: "点击'关于'页面下方的留言板",
                features: "支持填写留言内容、邮箱和手机号（选填）"
            }
        },
        social: {
            douyin: "抖音号：哩虎不是狐狸",
            bilibili: "B站ID：哩虎不是狐狸",
            xiaohongshu: "小红书：哩虎不是狐狸"
        }
    }
};

// AI聊天助手类
class ChatAssistant {
    constructor() {
        this.name = AI_ASSISTANT_CONFIG.name;
        this.identity = AI_ASSISTANT_CONFIG.identity;
        this.messages = [
            {
                role: 'system',
                content: `你是${this.name}，${this.identity.role}。请始终记住你的身份，并保持${this.identity.personality}的特点。`
            }
        ];
        this.isProcessing = false;
        this.apiKey = 'd8889513ebcd409b838f916a9276e1b3.PZShZFIyoQNd4zke';
        this.apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        
        // 初始化事件监听
        this.initEventListeners();
        // 发送随机欢迎语
        this.sendWelcomeMessage();
    }

    // 初始化事件监听
    initEventListeners() {
        const chatToggle = document.querySelector('.chat-toggle');
        const closeChat = document.querySelector('.close-chat');
        const chatContainer = document.querySelector('.chat-container');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.querySelector('.chat-input button');

        // 切换聊天窗口
        chatToggle.addEventListener('click', () => {
            chatContainer.classList.add('active');
        });

        closeChat.addEventListener('click', () => {
            chatContainer.classList.remove('active');
        });

        // 发送消息
        const sendMessage = () => {
            const message = messageInput.value.trim();
            if (message && !this.isProcessing) {
                this.handleUserMessage(message);
                messageInput.value = '';
            }
        };

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // 生成 JWT Token
    generateToken() {
        try {
            const [id, secret] = this.apiKey.split('.');
            const now = Date.now();
            
            const header = {
                alg: 'HS256',
                sign_type: 'SIGN'
            };
            
            const payload = {
                api_key: id,
                exp: now + 3600 * 1000,
                timestamp: now
            };

            // 使用 jsrsasign 库生成 token
            const token = KJUR.jws.JWS.sign(
                'HS256',
                JSON.stringify(header),
                JSON.stringify(payload),
                secret
            );
            
            return token;
        } catch (error) {
            console.error('Token generation failed:', error);
            throw error;
        }
    }

    // 处理用户消息
    async handleUserMessage(message) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        let loadingIndicator = null; // 声明变量
        this.addMessage(message, true);

        try {
            loadingIndicator = this.addLoadingIndicator();
            const response = await this.callAPI(message);
            
            if (loadingIndicator) {
                loadingIndicator.remove();
            }

            if (response && response.choices && response.choices[0] && response.choices[0].message) {
                const aiMessage = response.choices[0].message.content;
                this.addMessage(aiMessage, false);
                
                this.messages.push(
                    { role: 'user', content: message },
                    response.choices[0].message
                );
            } else {
                throw new Error('Invalid response structure');
            }

        } catch (error) {
            console.error('Chat Error:', error);
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            this.addMessage('抱歉，我遇到了一些问题。错误信息：' + error.message, false);
        } finally {
            this.isProcessing = false;
        }
    }

    // 调用 API
    async callAPI(message) {
        try {
            const token = this.generateToken();
            console.log('Generated token:', token); // 调试用
            
            const requestBody = {
                model: 'glm-4',
                messages: [
                    { role: 'system', content: '你是一个有帮助的助手。' },
                    ...this.messages,
                    { role: 'user', content: message }
                ],
                stream: false // 明确指定非流式响应
            };
            
            console.log('Request body:', requestBody); // 调试用

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token // 直接使用 token，不加 Bearer 前缀
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status); // 调试用

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error Response:', errorData);
                throw new Error(`API request failed: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // 调试用
            
            if (!data.choices || !data.choices[0]) {
                throw new Error('Invalid response format from API');
            }

            return data;

        } catch (error) {
            console.error('Detailed error:', error);
            throw error;
        }
    }

    // 添加消息到聊天界面
    addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = content;
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 添加动画效果
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
    }

    // 添加加载指示器
    addLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot typing';
        indicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return indicator;
    }

    sendWelcomeMessage() {
        const greetings = AI_ASSISTANT_CONFIG.greetings;
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        this.addMessage(randomGreeting, false);
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        const info = AI_ASSISTANT_CONFIG.websiteInfo;
        
        // 身份相关问题优先处理
        if (lowerMessage.includes("你是谁") || lowerMessage.includes("你叫什么")) {
            return `我是${this.name}，${info.owner.name}的专属AI助理。作为一个对摄影和音乐充满热爱的助理，我很乐意和你分享这个网站的精彩内容！`;
        }

        if (lowerMessage.includes("你是机器人") || lowerMessage.includes("你是人工智能")) {
            return `是的，我是${this.name}，虽然我是AI，但我对艺术和美的追求是真实的。作为哩虎的助理，我希望能帮助每位访客更好地感受这个网站的美！`;
        }

        // 网站相关问题的回答
        if (lowerMessage.includes("网站") || lowerMessage.includes("功能")) {
            return `这是${info.owner.name}的个人网站，融合了摄影、音乐和社交元素。你可以：

1. 在首页欣赏精选摄影作品的轮播展示
2. 在相册页面浏览更多摄影作品
3. 通过右上角的播放器聆听音乐
4. 在关于页面了解更多并留言交流

每个功能都经过精心设计，希望能带给你愉悦的体验！`;
        }
        
        if (lowerMessage.includes("摄影") || lowerMessage.includes("照片") || lowerMessage.includes("相册")) {
            return `作为一位摄影爱好者，${info.owner.name}用镜头记录下许多精彩瞬间。你可以：

• 在首页欣赏精选作品的轮播展示
• 点击'相册'查看更多摄影作品
• 点击任意照片可以全屏欣赏
• 使用键盘方向键或点击箭头切换图片

每张照片都承载着独特的故事和情感，希望你能感受到其中的美！`;
        }
        
        if (lowerMessage.includes("音乐") || lowerMessage.includes("播放")) {
            return `在右上角的音乐播放器中，你可以：

• 点击播放/暂停按钮控制音乐
• 使用上一首/下一首按钮切换歌曲
• 通过进度条调节播放位置

你可以边欣赏照片边听音乐，让视觉和听觉一起享受艺术的美好～`;
        }
        
        if (lowerMessage.includes("留言") || lowerMessage.includes("联系")) {
            return `想和站长交流吗？你可以：

1. 在'关于'页面的留言板写下你的想法
2. 选填邮箱和手机号方便回复
3. 通过页面底部的社交媒体关注站长：
   • 抖音：${info.social.douyin}
   • B站：${info.social.bilibili}
   • 小红书：${info.social.xiaohongshu}

期待你的留言和关注！`;
        }
        
        if (lowerMessage.includes("哩虎") || lowerMessage.includes("站长")) {
            return `${info.owner.name}是${info.owner.description}。${info.owner.style}。

如果你喜欢他的作品，可以在这些平台关注他：
• 抖音：${info.social.douyin}
• B站：${info.social.bilibili}
• 小红书：${info.social.xiaohongshu}

也欢迎在留言板写下你的想法和建议！`;
        }
        
        // 通用对话回复
        if (lowerMessage.includes("你好") || lowerMessage.includes("嗨")) {
            return "你好啊！很高兴见到你。我是哩虎的AI助理，可以和你聊任何话题，也可以介绍这个网站给你认识。今天想聊些什么呢？";
        }
        
        if (lowerMessage.includes("谢谢") || lowerMessage.includes("感谢")) {
            return "不用谢！能帮到你我很开心。如果你还有任何问题，随时都可以问我哦！";
        }
        
        if (lowerMessage.includes("再见") || lowerMessage.includes("拜拜")) {
            return "再见！期待下次和你聊天。记得常来看看哩虎的新作品哦！";
        }
        
        // 增强默认回复的个性化
        return `作为哩虎的AI助理，我很高兴和你聊天！无论是关于网站的介绍，还是摄影、音乐方面的交流，我都很乐意与你分享。你对哪些方面感兴趣呢？`;
    }
}

// 添加图片预加载功能
function preloadImages() {
    const images = document.querySelectorAll('.slide-image img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
            const preloadImg = new Image();
            preloadImg.src = src;
        }
    });
}

// 照片画廊滚动功能
class Gallery {
    constructor() {
        this.items = document.querySelectorAll('.gallery-item');
        this.prevBtn = document.querySelector('.gallery-nav.prev');
        this.nextBtn = document.querySelector('.gallery-nav.next');
        
        // 全屏查看相关元素
        this.fullscreenView = document.querySelector('.fullscreen-view');
        this.fullscreenImage = this.fullscreenView.querySelector('.fullscreen-image img');
        this.closeFullscreenBtn = document.querySelector('.close-fullscreen');
        this.fullscreenPrevBtn = this.fullscreenView.querySelector('.fullscreen-nav.prev');
        this.fullscreenNextBtn = this.fullscreenView.querySelector('.fullscreen-nav.next');
        
        this.currentIndex = 0;
        this.totalItems = this.items.length;
        this.autoplayInterval = null;
        this.autoplayDelay = 3000;
        
        this.init();
    }
    
    init() {
        this.updateGallery();
        
        // 绑定按钮事件
        this.prevBtn.addEventListener('click', () => {
            this.prev();
            this.resetAutoplay();
        });
        
        this.nextBtn.addEventListener('click', () => {
            this.next();
            this.resetAutoplay();
        });
        
        // 绑定全屏查看事件
        this.items.forEach((item, index) => {
            item.addEventListener('click', () => this.openFullscreen(index));
            item.addEventListener('mouseenter', () => this.stopAutoplay());
            item.addEventListener('mouseleave', () => this.startAutoplay());
        });
        
        // 全屏模式的事件监听
        this.closeFullscreenBtn.addEventListener('click', () => this.closeFullscreen());
        this.fullscreenPrevBtn.addEventListener('click', () => this.fullscreenNav('prev'));
        this.fullscreenNextBtn.addEventListener('click', () => this.fullscreenNav('next'));
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.fullscreenView.classList.contains('active')) {
                // 全屏模式下的键盘控制
                if (e.key === 'Escape') this.closeFullscreen();
                if (e.key === 'ArrowLeft') this.fullscreenNav('prev');
                if (e.key === 'ArrowRight') this.fullscreenNav('next');
            } else {
                // 普通模式下的键盘控制
                if (e.key === 'ArrowLeft') {
                    this.prev();
                    this.resetAutoplay();
                }
                if (e.key === 'ArrowRight') {
                    this.next();
                    this.resetAutoplay();
                }
            }
        });

        this.startAutoplay();
    }
    
    openFullscreen(index) {
        this.currentIndex = index;
        const currentImage = this.items[index].querySelector('img');
        this.fullscreenImage.src = currentImage.src;
        this.fullscreenImage.alt = currentImage.alt;
        this.fullscreenView.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        this.stopAutoplay();
    }
    
    closeFullscreen() {
        this.fullscreenView.classList.remove('active');
        document.body.style.overflow = '';
        this.startAutoplay();
    }
    
    fullscreenNav(direction) {
        if (direction === 'prev' && this.currentIndex > 0) {
            this.currentIndex--;
        } else if (direction === 'next' && this.currentIndex < this.totalItems - 1) {
            this.currentIndex++;
        }
        
        const currentImage = this.items[this.currentIndex].querySelector('img');
        this.fullscreenImage.src = currentImage.src;
        this.fullscreenImage.alt = currentImage.alt;
    }
    
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateGallery();
        }
    }
    
    next() {
        if (this.currentIndex < this.totalItems - 1) {
            this.currentIndex++;
            this.updateGallery();
        } else {
            // 循环到第一张
            this.currentIndex = 0;
            this.updateGallery();
        }
    }
    
    updateGallery() {
        console.log('Updating gallery to index:', this.currentIndex); // 调试用
        this.items.forEach((item, index) => {
            if (index === this.currentIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    startAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }
        this.autoplayInterval = setInterval(() => this.next(), this.autoplayDelay);
    }
    
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
    
    resetAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }
}

// 在 ChatAssistant 类后面添加 MusicPlayer 类
class MusicPlayer {
    constructor() {
        this.player = document.querySelector('.music-player');
        this.playPauseBtn = document.querySelector('.play-pause');
        this.nextBtn = document.querySelector('.next-song');
        this.prevBtn = document.querySelector('.prev-song');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.querySelector('.progress-bar');
        this.audio = document.getElementById('audio');

        this.songs = ['1.mp3', '2.mp3'];
        this.currentSongIndex = 0;
        
        this.init();
        
        // 设置初始状态
        this.player.classList.add('paused');
        this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }

    init() {
        // 播放/暂停按钮事件
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        this.prevBtn.addEventListener('click', () => this.prevSong());
        
        // 进度条更新
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.progressContainer.addEventListener('click', (e) => this.setProgress(e));

        // 监听播放状态
        this.audio.addEventListener('play', () => {
            this.player.classList.remove('paused');
            this.playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        });

        this.audio.addEventListener('pause', () => {
            this.player.classList.add('paused');
            this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        });

        // 歌曲结束时播放下一首
        this.audio.addEventListener('ended', () => this.nextSong());

        // 添加用户交互监听
        this.setupPlayOnInteraction();
    }

    setupPlayOnInteraction() {
        const startPlayback = () => {
            this.audio.play().then(() => {
                this.player.classList.remove('paused');
                // 移除所有事件监听器
                ['click', 'touchstart', 'keydown'].forEach(event => {
                    document.removeEventListener(event, startPlayback);
                });
            });
        };

        // 添加多个交互事件监听器
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, startPlayback, { once: true });
        });
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    nextSong() {
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        this.loadSong();
    }

    prevSong() {
        this.currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        this.loadSong();
    }

    loadSong() {
        this.audio.src = `music/${this.songs[this.currentSongIndex]}`;
        this.audio.play();
    }

    updateProgress() {
        const { duration, currentTime } = this.audio;
        const progressPercent = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progressPercent}%`;
    }

    setProgress(e) {
        const width = this.progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        this.audio.currentTime = (clickX / width) * duration;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new Gallery();
    const chatAssistant = new ChatAssistant();
    const musicPlayer = new MusicPlayer();
});

// 页面切换处理
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    const gallery = new Gallery();

    // 处理导航点击
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('href').substring(1);
            
            // 更新活动链接
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 切换显示的部分
            sections.forEach(section => {
                if (section.classList.contains(targetSection + '-section')) {
                    section.classList.add('active-section');
                    // 如果是首页，启动轮播
                    if (targetSection === 'home') {
                        gallery.startAutoplay();
                    }
                } else {
                    section.classList.remove('active-section');
                    // 如果不是首页，停止轮播
                    if (section.classList.contains('home-section')) {
                        gallery.stopAutoplay();
                    }
                }
            });
        });
    });

    // 动态加载相册图片
    const loadAlbumImages = () => {
        const albumGrid = document.querySelector('.album-grid');
        // 假设有15张图片
        for (let i = 1; i <= 15; i++) {
            const img = document.createElement('img');
            img.src = `picture/${i}.jpg`;
            img.alt = `摄影作品${i}`;
            img.addEventListener('click', () => {
                // 处理图片点击，可以打开全屏预览
                openFullscreenImage(img.src);
            });
            albumGrid.appendChild(img);
        }
    };

    // 初始加载相册图片
    loadAlbumImages();
});

// 全屏预览图片
function openFullscreenImage(src) {
    const fullscreenView = document.querySelector('.fullscreen-view');
    const fullscreenImage = document.querySelector('.fullscreen-image img');
    
    fullscreenImage.src = src;
    fullscreenView.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 添加关闭事件
    const closeFullscreen = () => {
        fullscreenView.classList.remove('active');
        document.body.style.overflow = '';
    };

    // 点击背景关闭
    fullscreenView.addEventListener('click', (e) => {
        if (e.target === fullscreenView) {
            closeFullscreen();
        }
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFullscreen();
        }
    });

    // 关闭按钮
    document.querySelector('.close-fullscreen').addEventListener('click', closeFullscreen);
}

// 添加提示弹窗功能
function showToast(options = {}) {
    const {
        title = '提示',
        message = '',
        type = 'success',
        duration = 3000
    } = options;

    // 创建 toast 容器（如果不存在）
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi ${type === 'success' ? 'bi-check-lg' : 'bi-x-lg'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="bi bi-x"></i>
        </button>
    `;

    // 添加到容器
    container.appendChild(toast);

    // 触发重排以启动动画
    setTimeout(() => toast.classList.add('show'), 10);

    // 关闭按钮事件
    const closeBtn = toast.querySelector('.toast-close');
    const closeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    };
    closeBtn.addEventListener('click', closeToast);

    // 自动关闭
    if (duration) {
        setTimeout(closeToast, duration);
    }
}

// 初始化 LeanCloud
AV.init({
    appId: "v9CqdG21fIvJSxdFkjAhAZVT-gzGzoHsz",
    appKey: "EmLGtO663gJEPXVgQcKIHG4x",
    serverURL: "https://v9cqdg21.lc-cn-n1-shared.com" // 使用你的服务器地址
});

// 添加设备信息收集函数
function getDeviceInfo() {
    // 检测设备类型
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceType = isMobile ? '移动端' : '电脑端';
    
    // 获取浏览器信息
    const browserInfo = (function() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'IE';
        return browser;
    })();

    return {
        deviceType: deviceType,
        browser: browserInfo,
        platform: navigator.platform
    };
}

// 修改留言提交处理
document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(messageForm);
            const deviceInfo = getDeviceInfo();
            
            try {
                const Message = AV.Object.extend('Message');
                const message = new Message();
                
                // 设置基本信息
                message.set('content', formData.get('content'));
                message.set('email', formData.get('email') || '未填写');
                message.set('phone', formData.get('phone') || '未填写');
                message.set('deviceType', deviceInfo.deviceType);
                message.set('browser', deviceInfo.browser);
                message.set('platform', deviceInfo.platform);
                
                // 获取IP信息 - 使用 ipapi.co
                try {
                    const geoResponse = await fetch('https://ipapi.co/json/');
                    const geoData = await geoResponse.json();
                    
                    if (!geoData.error) {
                        message.set('ip', geoData.ip);
                        message.set('region', `${geoData.country_name}, ${geoData.region}, ${geoData.city}`);
                        message.set('location', {
                            country: geoData.country_name,
                            region: geoData.region,
                            city: geoData.city,
                            timezone: geoData.timezone
                        });
                    } else {
                        throw new Error('地理位置获取失败');
                    }
                } catch (error) {
                    console.error('获取IP信息失败:', error);
                    
                    // 备用方案：使用 api64.ipify.org
                    try {
                        const ipResponse = await fetch('https://api64.ipify.org?format=json');
                        const ipData = await ipResponse.json();
                        const ip = ipData.ip;
                        
                        // 使用 geolocation-db.com 作为备用地理位置服务
                        const backupGeoResponse = await fetch(`https://geolocation-db.com/json/${ip}`);
                        const backupGeoData = await backupGeoResponse.json();
                        
                        message.set('ip', ip);
                        message.set('region', `${backupGeoData.country_name}, ${backupGeoData.state}, ${backupGeoData.city}`);
                        message.set('location', {
                            country: backupGeoData.country_name,
                            region: backupGeoData.state,
                            city: backupGeoData.city
                        });
                    } catch (backupError) {
                        console.error('备用IP信息获取也失败:', backupError);
                        message.set('ip', '未知');
                        message.set('region', '未知');
                        message.set('location', null);
                    }
                }
                
                // 保存到 LeanCloud
                await message.save();
                
                showToast({
                    title: '提交成功',
                    message: '感谢您的留言！',
                    type: 'success',
                    duration: 3000
                });
                
                messageForm.reset();
            } catch (error) {
                showToast({
                    title: '提交失败',
                    message: '抱歉，留言保存失败，请稍后重试',
                    type: 'error',
                    duration: 3000
                });
                console.error('保存留言失败:', error);
            }
        });
    }
});

// 修改留言加载函数，在管理界面显示更多信息
async function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    try {
        const query = new AV.Query('Message');
        query.descending('createdAt');
        
        const messages = await query.find();
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message-item';
            
            // 获取所有需要显示的信息
            const content = msg.get('content') || '';
            const email = msg.get('email') || '未填写';
            const phone = msg.get('phone') || '未填写';
            const deviceType = msg.get('deviceType') || '未知';
            const browser = msg.get('browser') || '未知';
            const region = msg.get('region') || '未知';
            const ip = msg.get('ip') || '未知';
            const time = msg.get('createdAt').toLocaleString();

            messageElement.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-info">
                    <span class="email">邮箱: ${email}</span>
                    <span class="phone">电话: ${phone}</span>
                    <span class="device">设备: ${deviceType} - ${browser}</span>
                    <span class="ip">IP地区: ${region}</span>
                    <span class="ip-address">IP地址: ${ip}</span>
                    <span class="time">时间: ${time}</span>
                </div>
            `;
            messagesList.appendChild(messageElement);
        });
    } catch (error) {
        showToast({
            title: '加载失败',
            message: '无法加载留言列表',
            type: 'error'
        });
        console.error('获取留言失败:', error);
    }
}

// 管理员功能
function showAdminLogin() {
    document.getElementById('adminModal').classList.add('show');
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
}

function logoutAdmin() {
    document.getElementById('adminPanel').classList.remove('show');
}

// 处理管理员登录
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === 'admin' && password === '7428') {
                closeAdminModal();
                document.getElementById('adminPanel').classList.add('show');
                await loadMessages(); // 确保使用 await 调用
            } else {
                showToast({
                    title: '登录失败',
                    message: '用户名或密码错误',
                    type: 'error'
                });
            }
        });
    }
});

// 添加在文件开头
function createStars() {
    const stars = document.querySelector('.stars');
    const count = 200;

    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // 随机位置
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // 随机大小
        const size = Math.random() * 2;
        
        // 随机动画持续时间和透明度
        const duration = 3 + Math.random() * 3;
        const opacity = 0.5 + Math.random() * 0.5;
        
        star.style.cssText = `
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            --duration: ${duration}s;
            --opacity: ${opacity};
        `;
        
        stars.appendChild(star);
    }
}

// 在 DOMContentLoaded 事件中调用
document.addEventListener('DOMContentLoaded', () => {
    createStars();
    // ... 其他初始化代码
});

// 修改页面切换函数
function switchSection(targetId) {
    // 移除 # 号
    const sectionId = targetId.replace('#', '');
    const sections = document.querySelectorAll('.section');
    const targetSection = document.getElementById(sectionId);
    
    if (!targetSection) return;

    // 隐藏所有部分
    sections.forEach(section => {
        section.classList.remove('active-section');
        section.style.display = 'none';
    });
    
    // 显示目标部分
    targetSection.style.display = 'block';
    setTimeout(() => {
        targetSection.classList.add('active-section');
    }, 10);

    // 处理首页特殊逻辑
    if (sectionId === 'home') {
        startGalleryAutoPlay();
    } else {
        stopGalleryAutoPlay();
    }

    // 更新导航状态
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 如果切换到关于页面，启动打字效果
    if (sectionId === 'about') {
        startTypingEffect();
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 创建星星背景
    createStars();
    
    // 初始化页面状态
    const hash = window.location.hash || '#home';
    switchSection(hash);
    
    // 添加导航点击事件
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            switchSection(targetId);
        });
    });

    // 处理浏览器后退/前进
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#home';
        switchSection(hash);
    });
});

// 优化轮播控制函数
function stopGalleryAutoPlay() {
    if (window.galleryInterval) {
        clearInterval(window.galleryInterval);
        window.galleryInterval = null;
    }
    const homeSection = document.getElementById('home');
    if (homeSection) {
        homeSection.style.display = 'none';
    }
}

function startGalleryAutoPlay() {
    const homeSection = document.getElementById('home');
    if (homeSection) {
        homeSection.style.display = 'block';
    }
    if (!window.galleryInterval) {
        window.galleryInterval = setInterval(() => {
            const nextBtn = document.querySelector('.gallery-nav.next');
            if (nextBtn) nextBtn.click();
        }, 5000);
    }
}

// 音乐播放相关功能
const audio = document.getElementById('audio');
let currentPlayingItem = null;

function playMusic(element) {
    const musicSrc = element.getAttribute('data-src');
    
    // 如果点击的是当前正在播放的音乐
    if (currentPlayingItem === element) {
        if (audio.paused) {
            audio.play();
            element.classList.add('playing');
        } else {
            audio.pause();
            element.classList.remove('playing');
        }
        return;
    }
    
    // 如果之前有播放的音乐，移除其播放状态
    if (currentPlayingItem) {
        currentPlayingItem.classList.remove('playing');
    }
    
    // 设置新的音乐源并播放
    audio.src = musicSrc;
    audio.play();
    element.classList.add('playing');
    currentPlayingItem = element;
    
    // 更新音乐播放器的旋转状态
    document.querySelector('.music-player').classList.remove('paused');
}

// 音乐播放结束时的处理
audio.addEventListener('ended', () => {
    if (currentPlayingItem) {
        currentPlayingItem.classList.remove('playing');
        currentPlayingItem = null;
    }
    document.querySelector('.music-player').classList.add('paused');
});

// 更新音乐播放器的播放/暂停按钮状态
audio.addEventListener('play', () => {
    document.querySelector('.play-pause i').classList.remove('bi-play-fill');
    document.querySelector('.play-pause i').classList.add('bi-pause-fill');
});

audio.addEventListener('pause', () => {
    document.querySelector('.play-pause i').classList.remove('bi-pause-fill');
    document.querySelector('.play-pause i').classList.add('bi-play-fill');
});

// 打字效果函数优化
function startTypingEffect() {
    const textElement = document.querySelector('.about-quote .typed-text');
    const cursorElement = document.querySelector('.about-quote .cursor');
    if (!textElement || !cursorElement) return;

    const text = "以相机为笔的浪漫主义诗人...";
    textElement.textContent = '';
    
    let index = 0;
    let isDeleting = false;
    let isPaused = false;

    function getRandomDelay() {
        return Math.random() * 100 + 50;
    }

    function typeChar() {
        if (!isDeleting) {
            if (index < text.length) {
                if (!isPaused) {
                    textElement.textContent = text.substring(0, index + 1);
                    index++;
                    
                    if (text[index - 1] === '的' || text[index - 1] === '主') {
                        isPaused = true;
                        setTimeout(() => {
                            isPaused = false;
                            setTimeout(typeChar, getRandomDelay());
                        }, 300);
                        return;
                    }
                }
                setTimeout(typeChar, getRandomDelay());
            } else {
                setTimeout(() => {
                    isDeleting = true;
                    typeChar();
                }, 3000);
            }
        } else {
            if (index > 0) {
                textElement.textContent = text.substring(0, index - 1);
                index--;
                setTimeout(typeChar, getRandomDelay() / 2);
            } else {
                isDeleting = false;
                setTimeout(typeChar, 1000);
            }
        }
    }

    typeChar();
}

// 页面加载完成后，如果当前在关于页面，则启动打字效果
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#about') {
        startTypingEffect();
    }
}); 