const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../datahive.db');
const db = new sqlite3.Database(dbPath);

// Promisify SQLite methods for elegant async/await usage
const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

async function initDB() {
  console.log('Initializing SQLite Database...');
  
  // 1. Create Tables
  await query.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      desc TEXT,
      creator_name TEXT NOT NULL,
      creator_avatar TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query.exec(`
    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      text TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );
  `);

  await query.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id TEXT NOT NULL,
      username TEXT NOT NULL,
      option_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(poll_id, username)
    );
  `);

  await query.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      author TEXT NOT NULL,
      avatar TEXT NOT NULL,
      voted_option_id TEXT,
      text TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );
  `);

  await query.exec(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id TEXT NOT NULL,
      username TEXT NOT NULL,
      UNIQUE(comment_id, username)
    );
  `);

  console.log('Tables initialized successfully.');

  // 2. Check if seed data exists. If not, populate it.
  const pollCount = await query.get('SELECT COUNT(*) as count FROM polls');
  if (pollCount.count === 0) {
    console.log('No polls found. Seeding initial database data...');
    await seedData();
  }
}

async function seedData() {
  const passwordHash = await bcrypt.hash('123456', 10);
  
  // Default mock polls from frontend mockData.js
  const INITIAL_POLLS = [
    {
      id: "poll-1",
      question: "大家常用的视频 App 是什么？",
      desc: "统计一下大家平时刷视频或者追剧用的最多的 App，集思广益，看看大家有什么新奇好用的 App 推荐！",
      creator: { name: "小华", avatar: "华" },
      category: "🎬 娱乐",
      tags: ["视频", "App", "日常"],
      options: [
        { id: "opt-1-1", text: "腾讯视频", votes: 45 },
        { id: "opt-1-2", text: "爱奇艺", votes: 38 },
        { id: "opt-1-3", text: "优酷", votes: 20 },
        { id: "opt-1-4", text: "哔哩哔哩 (B站)", votes: 120 },
        { id: "opt-1-5", text: "抖音 / 快手", votes: 95 },
        { id: "opt-1-6", text: "其他 (评论区推荐)", votes: 15 }
      ],
      comments: [
        {
          id: "c-1-1",
          author: "二次元赛高",
          avatar: "C",
          votedOptionId: "opt-1-4",
          text: "B站不仅是二次元，现在学习和看科普视频也是首选！各种教程、数码评测非常多。没有贴片广告真的很良心，我的精神食粮。",
          timestamp: "2026-06-14T10:30:00Z",
          likes: 42
        },
        {
          id: "c-1-2",
          author: "剧荒患者",
          avatar: "J",
          votedOptionId: "opt-1-1",
          text: "最近追独播大剧，腾讯视频的画质和网络延迟表现不错。虽然有广告 and 超前点播，但独播剧多没办法啊。",
          timestamp: "2026-06-14T11:15:00Z",
          likes: 18
        },
        {
          id: "c-1-3",
          author: "刷短视频的羊",
          avatar: "S",
          votedOptionId: "opt-1-5",
          text: "平时工作累了只想躺着刷刷抖音，不需要脑子。很多生活小常识和搞笑段子确实很解压，时间不知不觉就过去了。",
          timestamp: "2026-06-14T12:00:00Z",
          likes: 31
        },
        {
          id: "c-1-4",
          author: "阿影",
          avatar: "A",
          votedOptionId: "opt-1-2",
          text: "爱奇艺的迷雾剧场质量还是硬的，为了看悬疑剧冲了会员，基本每年都会出一两部精品，比如之前的《隐秘的角落》。",
          timestamp: "2026-06-14T12:45:00Z",
          likes: 24
        },
        {
          id: "c-1-5",
          author: "大眼萌",
          avatar: "D",
          votedOptionId: "opt-1-6",
          text: "我用 NAS + Kodi，自己下载 4K 蓝光片源在电视上看，国内视频网站的画质压缩得太严重了，特别是暗部细节根本看不了。",
          timestamp: "2026-06-14T13:20:00Z",
          likes: 9
        }
      ],
      createdAt: "2026-06-14T08:00:00Z"
    },
    {
      id: "poll-2",
      question: "你目前工作或学习中最常用的 AI 助手是哪一个？",
      desc: "AI 工具大爆发！大家现在平时写代码、写文案或者翻译，用得最顺手的是哪一个？",
      creator: { name: "极客小哥", avatar: "极" },
      category: "🤖 科技",
      tags: ["AI", "生产力", "科技"],
      options: [
        { id: "opt-2-1", text: "ChatGPT (OpenAI)", votes: 98 },
        { id: "opt-2-2", text: "Claude (Anthropic)", votes: 112 },
        { id: "opt-2-3", text: "Gemini (Google)", votes: 65 },
        { id: "opt-2-4", text: "Kimi / 秘塔 (国内黑马)", votes: 78 },
        { id: "opt-2-5", text: "豆包 / 智谱清言", votes: 44 },
        { id: "opt-2-6", text: "其他 (评论区讨论)", votes: 12 }
      ],
      comments: [
        {
          id: "c-2-1",
          author: "代码搬运工",
          avatar: "D",
          votedOptionId: "opt-2-2",
          text: "写代码绝对首选 Claude 3.5 Sonnet，逻辑能力和代码生成质量极高，上下文也很长，写出来的代码很少有低级 bug。",
          timestamp: "2026-06-14T09:10:00Z",
          likes: 56
        },
        {
          id: "c-2-2",
          author: "论文写作狗",
          avatar: "L",
          votedOptionId: "opt-2-4",
          text: "国内的 Kimi 读长文档是真的强，我经常把二三十页的英文论文丢给它帮我做大纲摘要，速度极快，中文理解也很到位。",
          timestamp: "2026-06-14T09:40:00Z",
          likes: 38
        },
        {
          id: "c-2-3",
          author: "思考的维度",
          avatar: "S",
          votedOptionId: "opt-2-1",
          text: "ChatGPT 的生态最好，自定义 GPTs 和语音模式真的很强大，日常搜东西或者充当百宝袋，依然是离不开 ChatGPT。",
          timestamp: "2026-06-14T10:05:00Z",
          likes: 22
        },
        {
          id: "c-2-4",
          author: "Google粉",
          avatar: "G",
          votedOptionId: "opt-2-3",
          text: "Gemini 和 Google Workspace 结合起来很方便，特别是用它处理 Gmail 邮件和 Docs。而且超长上下文输入也是天花板级别。",
          timestamp: "2026-06-14T10:55:00Z",
          likes: 14
        }
      ],
      createdAt: "2026-06-13T12:00:00Z"
    },
    {
      id: "poll-3",
      question: "你的电脑浏览器首选是什么？",
      desc: "浏览器是通往互联网的窗口。有人追求极致速度，有人需要海量插件，你的主浏览器是哪位？",
      creator: { name: "猫咪爱吃鱼", avatar: "猫" },
      category: "📱 软件",
      tags: ["浏览器", "工具", "效率"],
      options: [
        { id: "opt-3-1", text: "Google Chrome", votes: 156 },
        { id: "opt-3-2", text: "Microsoft Edge", votes: 84 },
        { id: "opt-3-3", text: "Apple Safari", votes: 48 },
        { id: "opt-3-4", text: "Mozilla Firefox", votes: 22 },
        { id: "opt-3-5", text: "Arc / Brave (新潮体验)", votes: 31 },
        { id: "opt-3-6", text: "其他 (360/夸克等)", votes: 12 }
      ],
      comments: [
        {
          id: "c-3-1",
          author: "前端螺丝钉",
          avatar: "Q",
          votedOptionId: "opt-3-1",
          text: "作为前端开发，Chrome DevTools 简直是无可替代的！性能、调试工具、新标准支持都是最好的。各种插件也是应有尽有。",
          timestamp: "2026-06-14T06:15:00Z",
          likes: 19
        }
      ],
      createdAt: "2026-06-12T10:00:00Z"
    },
    {
      id: "poll-4",
      question: "大家平时睡眠时间大概是几个小时？",
      desc: "早睡早起还是熬夜修仙？投一票看看大家平时能睡够几个小时，健康最重要！",
      creator: { name: "养生大师", avatar: "养" },
      category: "🍔 生活",
      tags: ["健康", "睡眠", "生活"],
      options: [
        { id: "opt-4-1", text: "不足 5 小时", votes: 12 },
        { id: "opt-4-2", text: "5 - 6 小时", votes: 64 },
        { id: "opt-4-3", text: "6 - 7 小时", votes: 110 },
        { id: "opt-4-4", text: "7 - 8 小时 (标准睡眠)", votes: 145 },
        { id: "opt-4-5", text: "8 小时以上", votes: 24 }
      ],
      comments: [
        {
          id: "c-4-1",
          author: "熬夜大仙",
          avatar: "A",
          votedOptionId: "opt-4-2",
          text: "程序员一枚，每天下班到家十点多了，还要打两局游戏刷刷手机。虽然知道熬夜不好，但只有深夜的时间是真正属于自己的。一般睡6个小时，白天全靠咖啡吊命。",
          timestamp: "2026-06-14T05:30:00Z",
          likes: 27
        },
        {
          id: "c-4-2",
          author: "规律生活",
          avatar: "G",
          votedOptionId: "opt-4-4",
          text: "每天晚上 11 点半雷打不动睡觉，早上 7 点 15 醒。雷打不动的标准睡眠，人到中年，真熬不动了，稍微晚点睡第二天头脑就会发昏，还是身体要紧。",
          timestamp: "2026-06-14T07:15:00Z",
          likes: 45
        },
        {
          id: "c-4-3",
          author: "考研战士",
          avatar: "K",
          votedOptionId: "opt-4-1",
          text: "今年二战考研，每天复习到凌晨两点，早上六点半就爬起来背单词。确实很累，但为了梦想只能拼这几个月了，考上再好好补觉！",
          timestamp: "2026-06-14T08:00:00Z",
          likes: 19
        }
      ],
      createdAt: "2026-06-11T15:00:00Z"
    },
    {
      id: "poll-5",
      question: "你最喜欢/最常玩的电子游戏平台是什么？",
      desc: "你是掌机党、硬核 PC 玩家、还是主机信仰粉？亦或是随时随地开黑的手游达人？投上一票并来评论区晒晒你的配置和游戏库吧！",
      creator: { name: "无敌暴龙战神", avatar: "无" },
      category: "🎬 娱乐",
      tags: ["游戏", "娱乐", "生活"],
      options: [
        { id: "opt-5-1", text: "PC 平台 (Steam / Epic 等)", votes: 142 },
        { id: "opt-5-2", text: "智能手机 (手游 / 移动端)", votes: 98 },
        { id: "opt-5-3", text: "主机平台 (PlayStation / Xbox)", votes: 45 },
        { id: "opt-5-4", text: "便携掌机 (Switch / Steam Deck)", votes: 61 },
        { id: "opt-5-5", text: "不怎么玩游戏", votes: 15 }
      ],
      comments: [
        {
          id: "c-5-1",
          author: "Steam喜加一",
          avatar: "S",
          votedOptionId: "opt-5-1",
          text: "Steam 每年大促都在买买买，库存里几百个游戏了，虽然大部分都没时间玩。13700K+4080 配起来就是为了追求极致画质，享受折腾 MOD 的乐趣！",
          timestamp: "2026-06-14T09:20:00Z",
          likes: 38
        },
        {
          id: "c-5-2",
          author: "马力欧分欧",
          avatar: "M",
          votedOptionId: "opt-5-4",
          text: "作为一个上班族，Switch 真的太方便了。通勤路上或者躺在床上摸鱼来一局塞尔达或宝可梦，碎片化时间神器。Steam Deck 玩独立游戏也是绝配。",
          timestamp: "2026-06-14T09:55:00Z",
          likes: 29
        },
        {
          id: "c-5-3",
          author: "手残党路过",
          avatar: "S",
          votedOptionId: "opt-5-2",
          text: "现在每天工作累得要死，哪有心思去开电脑做大作。还是王者荣耀和原神方便，随开随玩，社交性强，朋友开黑首选，充钱能解决很多问题。",
          timestamp: "2026-06-14T10:10:00Z",
          likes: 12
        },
        {
          id: "c-5-4",
          author: "主机党老王",
          avatar: "Z",
          votedOptionId: "opt-5-3",
          text: "客厅配个 75 寸 4K 电视，下班躺沙发上拿着手柄玩 PS5/XSX 的独占大作，音画效果和手柄震动反馈是小显示器和手机比不了的，沉浸感拉满！",
          timestamp: "2026-06-14T11:00:00Z",
          likes: 23
        }
      ],
      createdAt: "2026-06-14T11:00:00Z"
    },
    {
      id: "poll-6",
      question: "你平时的午餐解决方式主要是什么？",
      desc: "民以食为天！中午这一顿大家一般怎么解决？是吃外卖、在食堂将就，还是自己带便当呢？",
      creator: { name: "美食探店家", avatar: "美" },
      category: "🍔 生活",
      tags: ["美食", "生活", "打工人"],
      options: [
        { id: "opt-6-1", text: "点外卖", votes: 110 },
        { id: "opt-6-2", text: "公司 / 学校食堂", votes: 85 },
        { id: "opt-6-3", text: "自己做带便当 (带饭)", votes: 34 },
        { id: "opt-6-4", text: "出去下馆子 / 便利店", votes: 48 },
        { id: "opt-6-5", text: "经常不吃午餐", votes: 9 }
      ],
      comments: [
        {
          id: "c-6-1",
          author: "吃外卖狂魔",
          avatar: "C",
          votedOptionId: "opt-6-1",
          text: "点外卖虽然油大又不健康，但实在太省事了。每天上午工作到十一点半脑子都木了，在美团上随便点一个解决了，吃完还能在工位上睡半小时午觉。",
          timestamp: "2026-06-14T03:30:00Z",
          likes: 31
        },
        {
          id: "c-6-2",
          author: "小当家传人",
          avatar: "X",
          votedOptionId: "opt-6-3",
          text: "自己做饭虽然前一天晚上要准备，但卫生和营养完全可以自己控制。少油少盐，吃得放心，而且一个月能省下大几百块伙食费！",
          timestamp: "2026-06-14T04:15:00Z",
          likes: 54
        },
        {
          id: "c-6-3",
          author: "食堂常客",
          avatar: "S",
          votedOptionId: "opt-6-2",
          text: "公司食堂有餐补，两荤一素才15块钱，而且卫生有保障，出菜快不用等，我觉得性价比是最高的。吃完还可以顺便在园区散个步。",
          timestamp: "2026-06-14T05:00:00Z",
          likes: 18
        },
        {
          id: "c-6-4",
          author: "街头食神",
          avatar: "J",
          votedOptionId: "opt-6-4",
          text: "中午必须和同事一起出去吃，顺便走一走晒晒太阳，不然一天到晚憋在写字楼里整个人都要发霉了。附近各种面馆、便利店换着吃。",
          timestamp: "2026-06-14T05:45:00Z",
          likes: 22
        }
      ],
      createdAt: "2026-06-13T15:00:00Z"
    },
    {
      id: "poll-7",
      question: "对于买车，你的核心考量和倾向是？",
      desc: "新能源大潮已势不可挡，但燃油车依然有其拥趸。如果你现在买车，你的第一选择会是？",
      creator: { name: "车评人阿杰", avatar: "车" },
      category: "🤖 科技",
      tags: ["出行", "汽车", "科技"],
      options: [
        { id: "opt-7-1", text: "纯电动汽车 (BEV / 绿牌)", votes: 78 },
        { id: "opt-7-2", text: "插电混动 / 增程式汽车 (PHEV/EREV)", votes: 112 },
        { id: "opt-7-3", text: "传统燃油车 (ICE / 蓝牌)", votes: 56 },
        { id: "opt-7-4", text: "不打算买车 / 乘公共交通", votes: 43 }
      ],
      comments: [
        {
          id: "c-7-1",
          author: "极氪车主",
          avatar: "J",
          votedOptionId: "opt-7-1",
          text: "家里有充电桩的话，开纯电车实在太香了！一公里只要几分钱，保养便宜得像不用钱，而且智能驾驶和智能座舱体验用过就回不去了。",
          timestamp: "2026-06-14T06:30:00Z",
          likes: 34
        },
        {
          id: "c-7-2",
          author: "混动真香",
          avatar: "H",
          votedOptionId: "opt-7-2",
          text: "混动是目前的最佳解。平时通勤用电，省心；长途出行用油，完全没有续航和排队充电的焦虑，能油能电，续航随随便便一千多公里。",
          timestamp: "2026-06-14T07:20:00Z",
          likes: 42
        },
        {
          id: "c-7-3",
          author: "机械美学",
          avatar: "J",
          votedOptionId: "opt-7-3",
          text: "燃油车的机械质感和发动机变速箱配合的顺畅感是电动玩具给不了的。而且开个十年都不用担心电池衰减和系统OTA死机问题，踏实。",
          timestamp: "2026-06-14T08:15:00Z",
          likes: 29
        },
        {
          id: "c-7-4",
          author: "地铁一族",
          avatar: "D",
          votedOptionId: "opt-7-4",
          text: "一线城市早晚高峰堵车太严重，找车位难，停车费一个月一两千。坐地铁非常准时，出去应酬喝酒也省得叫代驾，养车成本太高，不划算。",
          timestamp: "2026-06-14T09:00:00Z",
          likes: 15
        }
      ],
      createdAt: "2026-06-12T18:00:00Z"
    }
  ];

  // Insert mock users, polls, options, and comments
  const usersToSeed = new Map(); // name -> avatar

  for (const poll of INITIAL_POLLS) {
    usersToSeed.set(poll.creator.name, poll.creator.avatar);
    
    // Save poll to database
    await query.run(
      'INSERT INTO polls (id, question, desc, creator_name, creator_avatar, category, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        poll.id,
        poll.question,
        poll.desc,
        poll.creator.name,
        poll.creator.avatar,
        poll.category,
        JSON.stringify(poll.tags),
        poll.createdAt
      ]
    );

    // Save options
    for (const opt of poll.options) {
      await query.run(
        'INSERT INTO options (id, poll_id, text, votes) VALUES (?, ?, ?, ?)',
        [opt.id, poll.id, opt.text, opt.votes]
      );
    }

    // Save comments and comments authors
    for (const c of poll.comments) {
      usersToSeed.set(c.author, c.avatar);
      
      await query.run(
        'INSERT INTO comments (id, poll_id, author, avatar, voted_option_id, text, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [c.id, poll.id, c.author, c.avatar, c.votedOptionId, c.text, c.likes, c.timestamp]
      );
      
      // Seed these mock votes (each commenter has voted)
      if (c.votedOptionId) {
        await query.run(
          'INSERT OR IGNORE INTO votes (poll_id, username, option_id) VALUES (?, ?, ?)',
          [poll.id, c.author, c.votedOptionId]
        );
      }
    }
  }

  // Insert all mock users with encrypted passwords
  for (const [username, avatar] of usersToSeed.entries()) {
    await query.run(
      'INSERT OR IGNORE INTO users (username, password_hash, avatar) VALUES (?, ?, ?)',
      [username, passwordHash, avatar]
    );
  }

  console.log('Seed database completed successfully!');
}

module.exports = {
  query,
  initDB
};
