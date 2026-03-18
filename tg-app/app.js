// ===================================================
// Репетитор по китайскому — Telegram Mini App
// Главный файл: навигация, экраны, упражнения, чат
// ===================================================

const App = {
  // --- Состояние приложения ---
  state: {
    currentScreen: 'welcome',
    screenHistory: [],          // стек навигации для кнопки «назад»
    user: {
      goal: null,               // цель: study/work/travel/hobby
      level: null,              // уровень: zero/beginner/intermediate
      dailyGoal: null,          // ежедневная цель: 5/10/15/20 мин
      onboardingDone: false,    // прошёл ли онбординг полностью
      xp: 0,
      streak: 0,
      wordsLearned: [],         // id выученных слов
      completedLessons: [],     // id пройденных уроков
      currentLesson: 1,         // id текущего урока
      lastActiveDate: null,
      settings: {
        pinyin: true,
        sound: true,
        dailyGoal: 10
      }
    },
    // Текущее упражнение
    exercise: {
      lessonId: null,
      exercises: [],
      currentIndex: 0,
      correctCount: 0,
      selectedAnswer: null,
      answered: false           // блокировка после ответа
    },
    // Мини-урок (онбординг)
    miniLesson: {
      currentIndex: 0,
      correctCount: 0,
      answered: false,
      questions: [
        {
          hanzi: '你好', pinyin: 'nǐ hǎo',
          prompt: 'Как переводится?',
          correct: 'Привет',
          options: ['Привет', 'Спасибо', 'Пока', 'Извини']
        },
        {
          hanzi: '谢谢', pinyin: 'xièxie',
          prompt: 'Как переводится?',
          correct: 'Спасибо',
          options: ['Привет', 'Спасибо', 'Пока', 'Извини']
        },
        {
          hanzi: '再见', pinyin: 'zàijiàn',
          prompt: 'Как переводится?',
          correct: 'До свидания',
          options: ['До свидания', 'Спасибо', 'Привет', 'Извини']
        }
      ]
    }
  },

  // --- Загруженные данные ---
  data: {
    words: [],
    lessons: [],
    categories: []
  },

  // --- Telegram WebApp ---
  tg: null,

  // =============================================
  // Инициализация приложения
  // =============================================
  async init() {
    try {
      // Подключаем Telegram WebApp SDK
      // Проверяем, что мы реально внутри Telegram, а не просто загрузили SDK
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && tgWebApp.initData && tgWebApp.initData !== '') {
        this.tg = tgWebApp;
        this.tg.ready();
        this.tg.expand();  // Полноэкранный режим

        // Обработчик кнопки «Назад»
        this.tg.BackButton.onClick(() => this.goBack());
      } else {
        this.tg = null; // Не в Telegram — используем fallback
      }

      // Загружаем данные
      await this.loadData();

      // Загружаем сохранённый прогресс
      this.loadProgress();

      // Обновляем стрик
      this.updateStreak();

      // Показываем нужный экран
      if (this.state.user.onboardingDone) {
        // Уже прошёл онбординг — на дашборд
        this.navigate('dashboard');
      } else if (this.state.user.goal && this.state.user.level && this.state.user.dailyGoal) {
        // Прошёл выборы, но не мини-урок
        this.navigate('mini-lesson');
        this.renderMiniLesson();
      } else if (this.state.user.goal && this.state.user.level) {
        this.navigate('daily-goal');
      } else if (this.state.user.goal) {
        this.navigate('level');
      } else {
        this.navigate('welcome');
      }
    } catch (e) {
      console.error('Ошибка инициализации:', e);
      // Показываем welcome-экран даже при ошибке
      this.navigate('welcome');
    }
  },

  // =============================================
  // Загрузка данных из JSON
  // =============================================
  async loadData() {
    try {
      const [wordsRes, lessonsRes] = await Promise.all([
        fetch('data/hsk1.json'),
        fetch('data/lessons.json')
      ]);
      if (!wordsRes.ok || !lessonsRes.ok) throw new Error('HTTP error');
      const wordsData = await wordsRes.json();
      const lessonsData = await lessonsRes.json();

      this.data.words = wordsData.words;
      this.data.lessons = lessonsData.lessons;
      this.data.categories = lessonsData.categories;
    } catch (e) {
      console.warn('fetch не сработал, загружаем встроенные данные:', e.message);
      this.loadEmbeddedData();
    }
  },

  // Встроенные данные — fallback когда fetch недоступен
  loadEmbeddedData() {
    this.data.categories = [
      { id: "basics", title: "Основы", icon: "📚", description: "Базовые слова и фразы" },
      { id: "conversation", title: "Разговорный", icon: "💬", description: "Повседневное общение" },
      { id: "grammar", title: "Грамматика", icon: "📝", description: "Структура предложений" },
      { id: "business", title: "Деловой", icon: "💼", description: "Бизнес и работа" }
    ];

    this.data.words = [
      { id:1, hanzi:"你好", pinyin:"nǐ hǎo", tones:[3,3], translation:"Привет", category:"приветствия", examples:[{hanzi:"你好，我叫小明。",pinyin:"Nǐ hǎo, wǒ jiào Xiǎomíng.",translation:"Привет, меня зовут Сяомин."}] },
      { id:2, hanzi:"谢谢", pinyin:"xièxie", tones:[4,0], translation:"Спасибо", category:"приветствия", examples:[{hanzi:"谢谢你！",pinyin:"Xièxie nǐ!",translation:"Спасибо тебе!"}] },
      { id:3, hanzi:"再见", pinyin:"zàijiàn", tones:[4,4], translation:"До свидания", category:"приветствия", examples:[{hanzi:"老师，再见！",pinyin:"Lǎoshī, zàijiàn!",translation:"Учитель, до свидания!"}] },
      { id:4, hanzi:"对不起", pinyin:"duìbuqǐ", tones:[4,0,3], translation:"Извините", category:"приветствия", examples:[{hanzi:"对不起，我迟到了。",pinyin:"Duìbuqǐ, wǒ chídào le.",translation:"Извините, я опоздал."}] },
      { id:5, hanzi:"没关系", pinyin:"méi guānxi", tones:[2,1,0], translation:"Ничего страшного", category:"приветствия", examples:[] },
      { id:6, hanzi:"请", pinyin:"qǐng", tones:[3], translation:"Пожалуйста / Прошу", category:"приветствия", examples:[] },
      { id:7, hanzi:"不客气", pinyin:"bú kèqi", tones:[2,4,0], translation:"Не за что", category:"приветствия", examples:[] },
      { id:8, hanzi:"一", pinyin:"yī", tones:[1], translation:"Один", category:"числа", examples:[{hanzi:"一个人",pinyin:"yī gè rén",translation:"Один человек"}] },
      { id:9, hanzi:"二", pinyin:"èr", tones:[4], translation:"Два", category:"числа", examples:[] },
      { id:10, hanzi:"三", pinyin:"sān", tones:[1], translation:"Три", category:"числа", examples:[] },
      { id:11, hanzi:"四", pinyin:"sì", tones:[4], translation:"Четыре", category:"числа", examples:[] },
      { id:12, hanzi:"五", pinyin:"wǔ", tones:[3], translation:"Пять", category:"числа", examples:[] },
      { id:13, hanzi:"六", pinyin:"liù", tones:[4], translation:"Шесть", category:"числа", examples:[] },
      { id:14, hanzi:"七", pinyin:"qī", tones:[1], translation:"Семь", category:"числа", examples:[] },
      { id:15, hanzi:"八", pinyin:"bā", tones:[1], translation:"Восемь", category:"числа", examples:[] },
      { id:16, hanzi:"九", pinyin:"jiǔ", tones:[3], translation:"Девять", category:"числа", examples:[] },
      { id:17, hanzi:"十", pinyin:"shí", tones:[2], translation:"Десять", category:"числа", examples:[] },
      { id:21, hanzi:"我", pinyin:"wǒ", tones:[3], translation:"Я", category:"местоимения", examples:[] },
      { id:22, hanzi:"你", pinyin:"nǐ", tones:[3], translation:"Ты", category:"местоимения", examples:[] },
      { id:23, hanzi:"他", pinyin:"tā", tones:[1], translation:"Он", category:"местоимения", examples:[] },
      { id:24, hanzi:"她", pinyin:"tā", tones:[1], translation:"Она", category:"местоимения", examples:[] },
      { id:31, hanzi:"爸爸", pinyin:"bàba", tones:[4,0], translation:"Папа", category:"семья", examples:[] },
      { id:32, hanzi:"妈妈", pinyin:"māma", tones:[1,0], translation:"Мама", category:"семья", examples:[] },
      { id:33, hanzi:"哥哥", pinyin:"gēge", tones:[1,0], translation:"Старший брат", category:"семья", examples:[] },
      { id:34, hanzi:"姐姐", pinyin:"jiějie", tones:[3,0], translation:"Старшая сестра", category:"семья", examples:[] },
      { id:35, hanzi:"弟弟", pinyin:"dìdi", tones:[4,0], translation:"Младший брат", category:"семья", examples:[] },
      { id:36, hanzi:"妹妹", pinyin:"mèimei", tones:[4,0], translation:"Младшая сестра", category:"семья", examples:[] },
      { id:37, hanzi:"儿子", pinyin:"érzi", tones:[2,0], translation:"Сын", category:"семья", examples:[] },
      { id:38, hanzi:"女儿", pinyin:"nǚ'ér", tones:[3,2], translation:"Дочь", category:"семья", examples:[] },
      { id:39, hanzi:"朋友", pinyin:"péngyou", tones:[2,0], translation:"Друг", category:"семья", examples:[] },
      { id:42, hanzi:"水", pinyin:"shuǐ", tones:[3], translation:"Вода", category:"еда", examples:[] },
      { id:43, hanzi:"茶", pinyin:"chá", tones:[2], translation:"Чай", category:"еда", examples:[] },
      { id:44, hanzi:"米饭", pinyin:"mǐfàn", tones:[3,4], translation:"Рис (варёный)", category:"еда", examples:[] },
      { id:45, hanzi:"菜", pinyin:"cài", tones:[4], translation:"Блюдо / Овощи", category:"еда", examples:[] },
      { id:46, hanzi:"苹果", pinyin:"píngguǒ", tones:[2,3], translation:"Яблоко", category:"еда", examples:[] },
      { id:47, hanzi:"水果", pinyin:"shuǐguǒ", tones:[3,3], translation:"Фрукты", category:"еда", examples:[] },
      { id:51, hanzi:"是", pinyin:"shì", tones:[4], translation:"Быть / Являться", category:"глаголы", examples:[] },
      { id:54, hanzi:"吃", pinyin:"chī", tones:[1], translation:"Есть (кушать)", category:"глаголы", examples:[] },
      { id:55, hanzi:"喝", pinyin:"hē", tones:[1], translation:"Пить", category:"глаголы", examples:[] },
      { id:65, hanzi:"想", pinyin:"xiǎng", tones:[3], translation:"Хотеть / Думать", category:"глаголы", examples:[] },
      { id:66, hanzi:"喜欢", pinyin:"xǐhuan", tones:[3,0], translation:"Любить / Нравиться", category:"глаголы", examples:[] },
      { id:71, hanzi:"叫", pinyin:"jiào", tones:[4], translation:"Звать / Зовут", category:"глаголы", examples:[] },
      { id:89, hanzi:"高兴", pinyin:"gāoxìng", tones:[1,4], translation:"Радостный / Рад", category:"прилагательные", examples:[] },
      { id:118, hanzi:"名字", pinyin:"míngzi", tones:[2,0], translation:"Имя", category:"повседневное", examples:[] }
    ];

    this.data.lessons = [
      {
        id:1, title:"Числа 1–10", category:"basics", description:"Считаем по-китайски",
        previewChars:["一","二","三","四","五"], wordIds:[8,9,10,11,12,13,14,15,16,17], xpReward:20,
        exercises:[
          {type:"choice_translation",prompt:"Как переводится?",wordId:8,correctAnswer:"Один",options:["Один","Два","Три","Пять"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:10,correctAnswer:"Три",options:["Два","Три","Четыре","Семь"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Пять",correctAnswer:"五",options:["三","五","六","八"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Восемь",correctAnswer:"八",options:["六","七","八","九"]},
          {type:"tone_listen",prompt:"Послушай и выбери правильный тон",wordId:8,correctAnswer:"yī (1-й тон)",options:["yī (1-й тон)","yí (2-й тон)","yǐ (3-й тон)","yì (4-й тон)"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:13,correctAnswer:"Шесть",options:["Четыре","Пять","Шесть","Девять"]},
          {type:"match_pairs",prompt:"Соедини пары",pairs:[{hanzi:"一",translation:"Один"},{hanzi:"三",translation:"Три"},{hanzi:"七",translation:"Семь"},{hanzi:"十",translation:"Десять"}]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Десять",correctAnswer:"十",options:["七","八","九","十"]},
          {type:"pinyin_input",prompt:"Напиши пиньинь",wordId:10,correctAnswer:"san",acceptAlso:["sān"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:16,correctAnswer:"Девять",options:["Шесть","Семь","Восемь","Девять"]}
        ]
      },
      {
        id:2, title:"Приветствия", category:"basics", description:"Здороваемся и прощаемся",
        previewChars:["你好","谢谢","再见"], wordIds:[1,2,3,4,5,6,7], xpReward:20,
        exercises:[
          {type:"choice_translation",prompt:"Как переводится?",wordId:1,correctAnswer:"Привет",options:["Привет","Спасибо","До свидания","Извините"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:2,correctAnswer:"Спасибо",options:["Привет","Спасибо","Пожалуйста","Извините"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"До свидания",correctAnswer:"再见",options:["你好","谢谢","再见","对不起"]},
          {type:"tone_listen",prompt:"Послушай и выбери правильный тон",wordId:2,correctAnswer:"xièxie (4-й + нейтральный)",options:["xīexie (1-й + нейтральный)","xiéxie (2-й + нейтральный)","xiěxie (3-й + нейтральный)","xièxie (4-й + нейтральный)"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:4,correctAnswer:"Извините",options:["Спасибо","Извините","Привет","Не за что"]},
          {type:"match_pairs",prompt:"Соедини пары",pairs:[{hanzi:"你好",translation:"Привет"},{hanzi:"谢谢",translation:"Спасибо"},{hanzi:"再见",translation:"До свидания"},{hanzi:"请",translation:"Пожалуйста"}]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Ничего страшного",correctAnswer:"没关系",options:["不客气","没关系","对不起","谢谢"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:7,correctAnswer:"Не за что",options:["Спасибо","Пожалуйста","Не за что","Ничего страшного"]},
          {type:"pinyin_input",prompt:"Напиши пиньинь",wordId:1,correctAnswer:"ni hao",acceptAlso:["nǐ hǎo","nihao"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Не за что",correctAnswer:"不客气",options:["不客气","没关系","请","谢谢"]}
        ]
      },
      {
        id:3, title:"Знакомство", category:"basics", description:"Представляемся и спрашиваем имя",
        previewChars:["我","你","叫","名字"], wordIds:[21,22,23,24,71,118,51,89], xpReward:25,
        exercises:[
          {type:"choice_translation",prompt:"Как переводится?",wordId:21,correctAnswer:"Я",options:["Я","Ты","Он","Мы"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:71,correctAnswer:"Звать / Зовут",options:["Быть","Иметь","Звать / Зовут","Говорить"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Имя",correctAnswer:"名字",options:["名字","汉字","学生","朋友"]},
          {type:"choice_translation",prompt:"Как переводится 你叫什么名字？",wordId:null,sentence:"你叫什么名字？",correctAnswer:"Как тебя зовут?",options:["Как тебя зовут?","Где ты живёшь?","Сколько тебе лет?","Откуда ты?"]},
          {type:"tone_listen",prompt:"Послушай и выбери правильный тон",wordId:21,correctAnswer:"wǒ (3-й тон)",options:["wō (1-й тон)","wó (2-й тон)","wǒ (3-й тон)","wò (4-й тон)"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:51,correctAnswer:"Быть / Являться",options:["Быть / Являться","Иметь / Есть","Делать","Хотеть"]},
          {type:"match_pairs",prompt:"Соедини пары",pairs:[{hanzi:"我",translation:"Я"},{hanzi:"你",translation:"Ты"},{hanzi:"他",translation:"Он"},{hanzi:"她",translation:"Она"}]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Он",correctAnswer:"他",options:["我","你","他","她"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:89,correctAnswer:"Радостный / Рад",options:["Красивый","Радостный / Рад","Хороший","Большой"]},
          {type:"pinyin_input",prompt:"Напиши пиньинь",wordId:71,correctAnswer:"jiao",acceptAlso:["jiào"]}
        ]
      },
      {
        id:4, title:"Семья", category:"basics", description:"Мама, папа, братья и сёстры",
        previewChars:["爸爸","妈妈","哥哥","姐姐"], wordIds:[31,32,33,34,35,36,37,38,39], xpReward:25,
        exercises:[
          {type:"choice_translation",prompt:"Как переводится?",wordId:31,correctAnswer:"Папа",options:["Мама","Папа","Старший брат","Друг"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:32,correctAnswer:"Мама",options:["Мама","Старшая сестра","Младшая сестра","Дочь"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Старший брат",correctAnswer:"哥哥",options:["爸爸","哥哥","弟弟","儿子"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Старшая сестра",correctAnswer:"姐姐",options:["妈妈","姐姐","妹妹","女儿"]},
          {type:"tone_listen",prompt:"Послушай и выбери правильный тон",wordId:32,correctAnswer:"māma (1-й + нейтральный)",options:["māma (1-й + нейтральный)","máma (2-й + нейтральный)","mǎma (3-й + нейтральный)","màma (4-й + нейтральный)"]},
          {type:"match_pairs",prompt:"Соедини пары",pairs:[{hanzi:"爸爸",translation:"Папа"},{hanzi:"妈妈",translation:"Мама"},{hanzi:"哥哥",translation:"Старший брат"},{hanzi:"妹妹",translation:"Младшая сестра"}]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:35,correctAnswer:"Младший брат",options:["Старший брат","Младший брат","Сын","Друг"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:37,correctAnswer:"Сын",options:["Дочь","Сын","Младший брат","Папа"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Друг",correctAnswer:"朋友",options:["朋友","同学","先生","哥哥"]},
          {type:"pinyin_input",prompt:"Напиши пиньинь",wordId:32,correctAnswer:"mama",acceptAlso:["māma"]}
        ]
      },
      {
        id:5, title:"Еда и напитки", category:"basics", description:"Заказываем в кафе",
        previewChars:["水","茶","米饭","菜"], wordIds:[42,43,44,45,46,47,54,55], xpReward:25,
        exercises:[
          {type:"choice_translation",prompt:"Как переводится?",wordId:42,correctAnswer:"Вода",options:["Вода","Чай","Рис","Фрукты"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:43,correctAnswer:"Чай",options:["Вода","Чай","Молоко","Сок"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Рис (варёный)",correctAnswer:"米饭",options:["水果","米饭","苹果","菜"]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:54,correctAnswer:"Есть (кушать)",options:["Пить","Есть (кушать)","Покупать","Готовить"]},
          {type:"tone_listen",prompt:"Послушай и выбери правильный тон",wordId:43,correctAnswer:"chá (2-й тон)",options:["chā (1-й тон)","chá (2-й тон)","chǎ (3-й тон)","chà (4-й тон)"]},
          {type:"choice_hanzi",prompt:"Выбери иероглиф",translation:"Яблоко",correctAnswer:"苹果",options:["水果","苹果","米饭","茶"]},
          {type:"match_pairs",prompt:"Соедини пары",pairs:[{hanzi:"水",translation:"Вода"},{hanzi:"茶",translation:"Чай"},{hanzi:"吃",translation:"Есть"},{hanzi:"喝",translation:"Пить"}]},
          {type:"choice_translation",prompt:"Как переводится?",wordId:55,correctAnswer:"Пить",options:["Есть","Пить","Покупать","Хотеть"]},
          {type:"choice_translation",prompt:"Как переводится 我想喝水?",wordId:null,sentence:"我想喝水",correctAnswer:"Я хочу пить воду",options:["Я хочу пить воду","Я хочу есть рис","Я люблю чай","Я пью воду"]},
          {type:"pinyin_input",prompt:"Напиши пиньинь",wordId:42,correctAnswer:"shui",acceptAlso:["shuǐ"]}
        ]
      }
    ];
  },

  // =============================================
  // Навигация между экранами
  // =============================================
  navigate(screenName, addToHistory = true) {
    const oldScreen = document.querySelector('.screen.active');
    const newScreen = document.getElementById(`screen-${screenName}`);
    if (!newScreen) return;

    // Добавляем в историю для кнопки «Назад»
    if (addToHistory && this.state.currentScreen !== screenName) {
      this.state.screenHistory.push(this.state.currentScreen);
    }

    // Анимация: старый экран уходит, новый появляется
    if (oldScreen) {
      oldScreen.classList.remove('active');
    }
    newScreen.classList.add('active');

    this.state.currentScreen = screenName;

    // Показать/скрыть Tab Bar
    const tabScreens = ['dashboard', 'lessons', 'chat', 'profile'];
    const tabBar = document.getElementById('tab-bar');
    if (tabScreens.includes(screenName)) {
      tabBar.classList.add('visible');
      // Подсветить активный таб
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      const activeTab = this.getTabForScreen(screenName);
      document.querySelector(`.tab[data-tab="${activeTab}"]`)?.classList.add('active');
    } else {
      tabBar.classList.remove('visible');
    }

    // BackButton Telegram
    if (this.tg) {
      const noBackScreens = ['welcome', 'dashboard'];
      if (noBackScreens.includes(screenName)) {
        this.tg.BackButton.hide();
      } else {
        this.tg.BackButton.show();
      }
    }

    // MainButton Telegram
    this.updateMainButton(screenName);

    // Обновить данные на экране
    this.updateScreenData(screenName);
  },

  // Определить какой таб подсвечивать
  getTabForScreen(screen) {
    if (screen === 'lessons' || screen === 'dashboard') return 'dashboard';
    if (screen === 'chat') return 'chat';
    if (screen === 'profile') return 'profile';
    return 'dashboard';
  },

  // Переключение табов
  switchTab(tab) {
    this.haptic('selection');
    this.navigate(tab);
  },

  // Кнопка «Назад»
  goBack() {
    if (this.state.screenHistory.length > 0) {
      const prevScreen = this.state.screenHistory.pop();
      this.navigate(prevScreen, false);
    }
  },

  // =============================================
  // MainButton Telegram
  // =============================================
  _mainButtonHandler: null,

  updateMainButton(screen) {
    // Скрываем все fallback-кнопки
    document.querySelectorAll('.fallback-btn').forEach(b => b.style.display = 'none');

    if (this.tg) {
      const mb = this.tg.MainButton;

      // Снимаем предыдущий обработчик
      if (this._mainButtonHandler) {
        mb.offClick(this._mainButtonHandler);
        this._mainButtonHandler = null;
      }

      switch (screen) {
        case 'welcome':
          mb.setText('Начать обучение');
          this._mainButtonHandler = () => this.navigate('goal');
          mb.onClick(this._mainButtonHandler);
          mb.show();
          break;

        case 'mini-lesson':
          mb.hide();
          break;

        case 'result':
          mb.setText('На главную');
          this._mainButtonHandler = () => this.navigate('dashboard');
          mb.onClick(this._mainButtonHandler);
          mb.show();
          break;

        default:
          mb.hide();
          break;
      }
    } else {
      // Fallback для браузера — показываем HTML-кнопки
      switch (screen) {
        case 'welcome':
          const btnStart = document.getElementById('btn-start');
          if (btnStart) btnStart.style.display = 'block';
          break;
        case 'result':
          const btnDash = document.getElementById('btn-to-dashboard');
          if (btnDash) btnDash.style.display = 'block';
          break;
      }
    }
  },

  // Показать MainButton для мини-урока и упражнений
  showCheckButton(callback) {
    if (this.tg) {
      const mb = this.tg.MainButton;
      if (this._mainButtonHandler) {
        mb.offClick(this._mainButtonHandler);
      }
      mb.setText('Проверить');
      this._mainButtonHandler = callback;
      mb.onClick(this._mainButtonHandler);
      mb.show();
    } else {
      this._showFallbackAction('Проверить', callback);
    }
  },

  showContinueButton(callback) {
    if (this.tg) {
      const mb = this.tg.MainButton;
      if (this._mainButtonHandler) {
        mb.offClick(this._mainButtonHandler);
      }
      mb.setText('Продолжить');
      this._mainButtonHandler = callback;
      mb.onClick(this._mainButtonHandler);
      mb.show();
    } else {
      this._showFallbackAction('Продолжить', callback);
    }
  },

  hideMainButton() {
    if (this.tg) {
      const mb = this.tg.MainButton;
      if (this._mainButtonHandler) {
        mb.offClick(this._mainButtonHandler);
        this._mainButtonHandler = null;
      }
      mb.hide();
    } else {
      // Убираем динамическую fallback-кнопку
      const fb = document.getElementById('fallback-action-btn');
      if (fb) fb.remove();
    }
  },

  // Динамическая fallback-кнопка для браузера
  _showFallbackAction(text, callback) {
    let fb = document.getElementById('fallback-action-btn');
    if (!fb) {
      fb = document.createElement('button');
      fb.id = 'fallback-action-btn';
      fb.className = 'fallback-btn';
      document.body.appendChild(fb);
    }
    fb.textContent = text;
    fb.style.display = 'block';
    fb.onclick = () => {
      fb.style.display = 'none';
      callback();
    };
  },

  // =============================================
  // Обновление данных на экранах
  // =============================================
  updateScreenData(screen) {
    switch (screen) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'profile':
        this.renderProfile();
        break;
    }
  },

  // =============================================
  // ОНБОРДИНГ
  // =============================================
  selectGoal(btn) {
    btn.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    this.state.user.goal = btn.dataset.value;
    this.haptic('selection');
    this.saveProgress();
    setTimeout(() => this.navigate('level'), 300);
  },

  selectLevel(btn) {
    btn.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    this.state.user.level = btn.dataset.value;
    this.haptic('selection');
    this.saveProgress();
    setTimeout(() => this.navigate('daily-goal'), 300);
  },

  // --- Ежедневная цель (новый экран) ---
  selectDailyGoal(btn) {
    btn.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    this.state.user.dailyGoal = parseInt(btn.dataset.value);
    this.state.user.settings.dailyGoal = parseInt(btn.dataset.value);
    this.haptic('selection');
    this.saveProgress();
    setTimeout(() => {
      this.navigate('mini-lesson');
      this.state.miniLesson.currentIndex = 0;
      this.state.miniLesson.correctCount = 0;
      this.renderMiniLesson();
    }, 300);
  },

  // =============================================
  // МИНИ-УРОК (aha moment в онбординге)
  // =============================================
  renderMiniLesson() {
    const ml = this.state.miniLesson;
    const q = ml.questions[ml.currentIndex];
    ml.answered = false;

    // Обновляем точки прогресса
    const dots = document.querySelectorAll('#mini-dots .mini-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i < ml.currentIndex) dot.classList.add('done');
      if (i === ml.currentIndex) dot.classList.add('active');
    });

    document.getElementById('mini-counter').textContent =
      `${ml.currentIndex + 1}/${ml.questions.length}`;

    const body = document.getElementById('mini-lesson-body');
    body.innerHTML = `
      <p class="exercise-prompt">${q.prompt}</p>
      <div class="exercise-hanzi hanzi">${q.hanzi}</div>
      <div class="exercise-pinyin">${q.pinyin}</div>
      <button class="exercise-audio" onclick="App.speak('${q.hanzi}')">🔊</button>
      <div class="exercise-options">
        ${q.options.map(opt => `
          <button class="exercise-option" onclick="App.selectMiniAnswer(this, '${opt.replace(/'/g, "\\'")}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="mini-feedback-area"></div>
    `;

    this.hideMainButton();
  },

  selectMiniAnswer(btn, answer) {
    const ml = this.state.miniLesson;
    if (ml.answered) return;
    ml.answered = true;

    const q = ml.questions[ml.currentIndex];
    const isCorrect = answer === q.correct;

    // Подсветка
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      btn.parentElement.querySelectorAll('.exercise-option').forEach(opt => {
        if (opt.textContent.trim() === q.correct) opt.classList.add('correct');
      });
    } else {
      ml.correctCount++;
    }

    // Обратная связь
    const feedback = document.getElementById('mini-feedback-area');
    if (isCorrect) {
      feedback.innerHTML = `<div class="answer-feedback correct">✅ Правильно!</div>`;
      this.haptic('success');
      this.showXpFloat('+10 XP');
    } else {
      feedback.innerHTML = `<div class="answer-feedback wrong">❌ Правильный ответ: ${q.correct}</div>`;
      this.haptic('error');
    }

    // Кнопка «Продолжить»
    setTimeout(() => {
      this.showContinueButton(() => this.nextMiniQuestion());
    }, 400);
  },

  nextMiniQuestion() {
    const ml = this.state.miniLesson;
    ml.currentIndex++;

    if (ml.currentIndex >= ml.questions.length) {
      // Мини-урок завершён — показываем поздравление
      this.showMiniCongrats();
    } else {
      this.renderMiniLesson();
    }
  },

  showMiniCongrats() {
    const body = document.getElementById('mini-lesson-body');
    body.innerHTML = `
      <div class="mini-congrats">
        <div class="mini-congrats-icon">🎉</div>
        <h2 class="mini-congrats-title">Ты уже знаешь 3 иероглифа!</h2>
        <p class="mini-congrats-subtitle">Отличное начало! Продолжай в том же духе.</p>
        <div class="mini-congrats-words">
          <span>你好</span>
          <span>谢谢</span>
          <span>再见</span>
        </div>
      </div>
    `;

    // Обновляем точки — все done
    document.querySelectorAll('#mini-dots .mini-dot').forEach(d => {
      d.classList.remove('active');
      d.classList.add('done');
    });

    // Confetti!
    this.showConfetti();
    this.haptic('success');

    // Добавляем слова в выученные
    [1, 2, 3].forEach(id => {
      if (!this.state.user.wordsLearned.includes(id)) {
        this.state.user.wordsLearned.push(id);
      }
    });
    this.state.user.xp += 30;
    this.state.user.onboardingDone = true;
    this.state.user.lastActiveDate = new Date().toDateString();
    this.state.user.streak = 1;
    this.saveProgress();

    // MainButton — перейти на дашборд
    const goToDashboard = () => {
      this.state.screenHistory = []; // Очистить историю онбординга
      this.navigate('dashboard');
    };

    if (this.tg) {
      const mb = this.tg.MainButton;
      if (this._mainButtonHandler) mb.offClick(this._mainButtonHandler);
      mb.setText('Начать учиться!');
      this._mainButtonHandler = goToDashboard;
      mb.onClick(this._mainButtonHandler);
      mb.show();
    } else {
      this._showFallbackAction('Начать учиться!', goToDashboard);
    }
  },

  // =============================================
  // ДАШБОРД
  // =============================================
  renderDashboard() {
    const user = this.state.user;

    // Стрик и XP
    document.getElementById('streak-count').textContent = user.streak;
    document.getElementById('xp-count').textContent = user.xp;

    // Текущий урок
    const lesson = this.data.lessons.find(l => l.id === user.currentLesson);
    if (lesson) {
      document.getElementById('current-lesson-title').textContent =
        `Урок ${lesson.id}: ${lesson.title}`;
      document.getElementById('current-lesson-xp').textContent = `+${lesson.xpReward} XP`;

      const progress = user.completedLessons.includes(lesson.id) ? 100 : 0;
      document.getElementById('current-lesson-progress').style.width = `${progress}%`;
      document.getElementById('current-lesson-progress-text').textContent = `${progress}%`;
    }

    // Лок на разделы кроме «Основы»
    document.querySelectorAll('.category-card').forEach(card => {
      const cat = card.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
      if (cat && cat !== 'basics') {
        card.classList.add('locked');
      }
    });
  },

  continueLesson() {
    const lessonId = this.state.user.currentLesson;
    this.startLesson(lessonId);
  },

  // =============================================
  // СПИСОК УРОКОВ РАЗДЕЛА
  // =============================================
  openCategory(categoryId) {
    this.haptic('selection');

    // Проверяем доступность раздела
    if (categoryId !== 'basics') {
      if (this.tg) {
        this.tg.showPopup({
          title: 'Раздел заблокирован',
          message: 'Этот раздел будет доступен в платной версии.',
          buttons: [{ type: 'ok' }]
        });
      } else {
        alert('Раздел заблокирован. Будет доступен в платной версии.');
      }
      return;
    }

    const category = this.data.categories.find(c => c.id === categoryId);
    const lessons = this.data.lessons.filter(l => l.category === categoryId);

    document.getElementById('lessons-category-title').textContent =
      `${category.icon} ${category.title}`;

    const list = document.getElementById('lessons-list');
    list.innerHTML = '';

    lessons.forEach(lesson => {
      const completed = this.state.user.completedLessons.includes(lesson.id);
      const current = lesson.id === this.state.user.currentLesson;
      const locked = lesson.id > this.state.user.currentLesson && !completed;

      const status = completed ? '✅' : current ? '🔵' : '🔒';
      const stateClass = completed ? 'completed' : current ? 'available' : 'locked';

      const item = document.createElement('button');
      item.className = `lesson-item ${stateClass}`;
      item.innerHTML = `
        <span class="lesson-status">${status}</span>
        <div class="lesson-info">
          <div class="lesson-name">${lesson.title}</div>
          <div class="lesson-desc">${lesson.description}</div>
          <div class="lesson-preview hanzi">${lesson.previewChars.join(' ')}</div>
          <div class="lesson-meta">⏱ 5 мин · 📝 ${lesson.exercises.length} заданий · ⭐ ${lesson.xpReward} XP</div>
        </div>
      `;
      if (!locked) {
        item.addEventListener('click', () => this.startLesson(lesson.id));
      } else {
        item.addEventListener('click', () => {
          this.haptic('error');
          if (this.tg) {
            this.tg.showPopup({
              title: 'Урок заблокирован',
              message: `Сначала пройдите предыдущий урок.`,
              buttons: [{ type: 'ok' }]
            });
          } else {
            alert('Урок заблокирован. Сначала пройдите предыдущий урок.');
          }
        });
      }
      list.appendChild(item);
    });

    this.navigate('lessons');
  },

  // =============================================
  // УПРАЖНЕНИЯ
  // =============================================
  startLesson(lessonId) {
    const lesson = this.data.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    this.haptic('impact');

    this.state.exercise = {
      lessonId: lessonId,
      exercises: [...lesson.exercises],
      currentIndex: 0,
      correctCount: 0,
      selectedAnswer: null,
      answered: false,
      lessonData: lesson
    };

    this.navigate('exercise');
    this.renderExercise();
  },

  renderExercise() {
    const { exercises, currentIndex } = this.state.exercise;
    const ex = exercises[currentIndex];
    if (!ex) return;

    // Прогресс
    const progress = ((currentIndex) / exercises.length) * 100;
    document.getElementById('exercise-progress').style.width = `${progress}%`;
    document.getElementById('exercise-counter').textContent =
      `${currentIndex + 1}/${exercises.length}`;

    const body = document.getElementById('exercise-body');
    this.state.exercise.selectedAnswer = null;
    this.state.exercise.answered = false;

    // Рендерим по типу упражнения
    switch (ex.type) {
      case 'choice_translation':
        this.renderChoiceTranslation(body, ex);
        break;
      case 'choice_hanzi':
        this.renderChoiceHanzi(body, ex);
        break;
      case 'tone_listen':
        this.renderToneListen(body, ex);
        break;
      case 'match_pairs':
        this.renderMatchPairs(body, ex);
        break;
      case 'pinyin_input':
        this.renderPinyinInput(body, ex);
        break;
      default:
        this.renderChoiceTranslation(body, ex);
    }

    this.hideMainButton();
  },

  // --- Тип: выбор перевода (иероглиф → русский) ---
  renderChoiceTranslation(body, ex) {
    const word = ex.wordId ? this.data.words.find(w => w.id === ex.wordId) : null;
    const showPinyin = this.state.user.settings.pinyin;

    body.innerHTML = `
      <p class="exercise-prompt">${ex.prompt}</p>
      ${word ? `
        <div class="exercise-hanzi hanzi">${word.hanzi}</div>
        ${showPinyin ? `<div class="exercise-pinyin">${word.pinyin}</div>` : ''}
        <button class="exercise-audio" onclick="App.speak('${word.hanzi}')">🔊</button>
      ` : `
        <div class="exercise-hanzi hanzi" style="font-size:28px">${ex.sentence || ''}</div>
      `}
      <div class="exercise-options">
        ${ex.options.map(opt => `
          <button class="exercise-option" onclick="App.selectExerciseOption(this, '${opt.replace(/'/g, "\\'")}', '${ex.correctAnswer.replace(/'/g, "\\'")}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <button class="skip-button" onclick="App.skipExercise('${ex.correctAnswer.replace(/'/g, "\\'")}')">Не знаю →</button>
      <div id="feedback-area"></div>
    `;
  },

  // --- Тип: выбор иероглифа (русский → иероглиф) ---
  renderChoiceHanzi(body, ex) {
    body.innerHTML = `
      <p class="exercise-prompt">${ex.prompt}</p>
      <div class="exercise-hanzi" style="font-size:22px;font-weight:600">${ex.translation}</div>
      <div style="height:28px"></div>
      <div class="exercise-options">
        ${ex.options.map(opt => `
          <button class="exercise-option hanzi" style="font-size:22px" onclick="App.selectExerciseOption(this, '${opt}', '${ex.correctAnswer}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <button class="skip-button" onclick="App.skipExercise('${ex.correctAnswer}')">Не знаю →</button>
      <div id="feedback-area"></div>
    `;
  },

  // --- Тип: выбор тона ---
  renderToneListen(body, ex) {
    const word = this.data.words.find(w => w.id === ex.wordId);

    body.innerHTML = `
      <p class="exercise-prompt">${ex.prompt}</p>
      <div class="exercise-hanzi hanzi">${word.hanzi}</div>
      <button class="exercise-audio" onclick="App.speak('${word.hanzi}')">🔊</button>
      <div class="exercise-options">
        ${ex.options.map(opt => `
          <button class="exercise-option" style="font-size:14px" onclick="App.selectExerciseOption(this, '${opt.replace(/'/g, "\\'")}', '${ex.correctAnswer.replace(/'/g, "\\'")}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <button class="skip-button" onclick="App.skipExercise()">Не знаю →</button>
      <div id="feedback-area"></div>
    `;

    // Автоматически воспроизводим
    if (this.state.user.settings.sound) {
      setTimeout(() => this.speak(word.hanzi), 400);
    }
  },

  // --- Тип: сопоставление пар ---
  renderMatchPairs(body, ex) {
    const shuffledTranslations = [...ex.pairs.map(p => p.translation)].sort(() => Math.random() - 0.5);

    body.innerHTML = `
      <p class="exercise-prompt">${ex.prompt}</p>
      <div class="match-grid">
        ${ex.pairs.map(p => `
          <button class="match-item hanzi" data-type="hanzi" data-pair="${p.translation}" onclick="App.selectMatch(this)">
            ${p.hanzi}
          </button>
        `).join('')}
        ${shuffledTranslations.map(t => `
          <button class="match-item" data-type="translation" data-pair="${t}" onclick="App.selectMatch(this)">
            ${t}
          </button>
        `).join('')}
      </div>
      <div id="feedback-area"></div>
    `;

    this._matchState = { selected: null, matchedCount: 0, totalPairs: ex.pairs.length };
  },

  selectMatch(btn) {
    const state = this._matchState;

    if (!state.selected) {
      btn.classList.add('selected');
      state.selected = btn;
    } else if (state.selected === btn) {
      btn.classList.remove('selected');
      state.selected = null;
    } else {
      const first = state.selected;
      const second = btn;

      const firstIsHanzi = first.dataset.type === 'hanzi';
      const secondIsHanzi = second.dataset.type === 'hanzi';

      if (firstIsHanzi === secondIsHanzi) {
        first.classList.remove('selected');
        btn.classList.add('selected');
        state.selected = btn;
        return;
      }

      const hanziBtn = firstIsHanzi ? first : second;
      const transBtn = firstIsHanzi ? second : first;

      if (hanziBtn.dataset.pair === transBtn.dataset.pair) {
        hanziBtn.classList.remove('selected');
        hanziBtn.classList.add('matched');
        transBtn.classList.add('matched');
        state.matchedCount++;
        this.haptic('success');

        if (state.matchedCount === state.totalPairs) {
          this.state.exercise.correctCount++;
          this.showXpFloat('+10 XP');
          setTimeout(() => this.nextExercise(), 600);
        }
      } else {
        second.classList.add('wrong-match');
        first.classList.add('wrong-match');
        this.haptic('error');
        setTimeout(() => {
          first.classList.remove('selected', 'wrong-match');
          second.classList.remove('wrong-match');
        }, 400);
      }
      state.selected = null;
    }
  },

  // --- Тип: ввод пиньинь ---
  renderPinyinInput(body, ex) {
    const word = this.data.words.find(w => w.id === ex.wordId);
    body.innerHTML = `
      <p class="exercise-prompt">${ex.prompt}</p>
      <div class="exercise-hanzi hanzi">${word.hanzi}</div>
      <button class="exercise-audio" onclick="App.speak('${word.hanzi}')">🔊</button>
      <input type="text" class="pinyin-input" id="pinyin-answer" placeholder="Введи пиньинь..." autocomplete="off" autocapitalize="none">
      <button class="skip-button" onclick="App.skipExercise('${ex.correctAnswer}')">Не знаю →</button>
      <div id="feedback-area"></div>
    `;

    setTimeout(() => document.getElementById('pinyin-answer')?.focus(), 300);
  },

  // --- Выбор варианта ответа ---
  selectExerciseOption(btn, selected, correct) {
    if (this.state.exercise.answered) return;
    this.state.exercise.answered = true;
    this.state.exercise.selectedAnswer = selected;

    const isCorrect = selected === correct;

    // Подсветка кнопок
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      btn.parentElement.querySelectorAll('.exercise-option').forEach(opt => {
        if (opt.textContent.trim() === correct) opt.classList.add('correct');
      });
    }

    // Находим слово для объяснения
    const ex = this.state.exercise.exercises[this.state.exercise.currentIndex];
    const word = ex.wordId ? this.data.words.find(w => w.id === ex.wordId) : null;

    // Обратная связь
    const feedback = document.getElementById('feedback-area');
    if (isCorrect) {
      this.state.exercise.correctCount++;
      feedback.innerHTML = `<div class="answer-feedback correct">✅ Правильно! +10 XP</div>`;
      this.haptic('success');
      this.showXpFloat('+10 XP');
    } else {
      // Объяснение при ошибке
      const explanation = word
        ? `${word.hanzi} (${word.pinyin}) = ${word.translation}`
        : correct;
      feedback.innerHTML = `<div class="answer-feedback wrong">❌ Неверно.<br>${explanation}</div>`;
      this.haptic('error');
    }

    // Скрываем кнопку "Не знаю"
    const skipBtn = body?.querySelector('.skip-button') || document.querySelector('.skip-button');
    if (skipBtn) skipBtn.style.display = 'none';

    // Сохраняем после каждого ответа
    this.saveProgress();

    // Через 1.5 сек — следующее
    setTimeout(() => this.nextExercise(), 1500);
  },

  // --- Кнопка «Не знаю» ---
  skipExercise(correctAnswer) {
    if (this.state.exercise.answered) return;
    this.state.exercise.answered = true;

    const ex = this.state.exercise.exercises[this.state.exercise.currentIndex];
    const word = ex.wordId ? this.data.words.find(w => w.id === ex.wordId) : null;

    // Подсветить правильный
    document.querySelectorAll('.exercise-option').forEach(opt => {
      const answer = correctAnswer || ex.correctAnswer;
      if (opt.textContent.trim() === answer) opt.classList.add('correct');
    });

    const feedback = document.getElementById('feedback-area');
    const explanation = word
      ? `${word.hanzi} (${word.pinyin}) = ${word.translation}`
      : ex.correctAnswer || correctAnswer;
    feedback.innerHTML = `<div class="answer-feedback wrong">💡 Запомни: ${explanation}</div>`;
    this.haptic('selection');

    // Скрываем "Не знаю"
    document.querySelectorAll('.skip-button').forEach(b => b.style.display = 'none');

    // Через 2 сек — следующее (без штрафа и без +XP)
    setTimeout(() => this.nextExercise(), 2000);
  },

  // --- Проверка пиньинь ---
  checkPinyinAnswer() {
    if (this.state.exercise.answered) return;
    const input = document.getElementById('pinyin-answer');
    if (!input) return;

    this.state.exercise.answered = true;
    const answer = input.value.trim().toLowerCase();
    const ex = this.state.exercise.exercises[this.state.exercise.currentIndex];
    const correct = ex.correctAnswer.toLowerCase();
    const alsoAccept = (ex.acceptAlso || []).map(s => s.toLowerCase());

    const isCorrect = answer === correct || alsoAccept.includes(answer);

    const feedback = document.getElementById('feedback-area');
    if (isCorrect) {
      this.state.exercise.correctCount++;
      input.style.borderColor = 'var(--success)';
      feedback.innerHTML = `<div class="answer-feedback correct">✅ Правильно!</div>`;
      this.haptic('success');
      this.showXpFloat('+10 XP');
    } else {
      input.style.borderColor = 'var(--error)';
      feedback.innerHTML = `<div class="answer-feedback wrong">❌ Правильный ответ: ${ex.correctAnswer}</div>`;
      this.haptic('error');
    }

    document.querySelectorAll('.skip-button').forEach(b => b.style.display = 'none');
    this.saveProgress();
    setTimeout(() => this.nextExercise(), 1500);
  },

  // --- Следующее упражнение ---
  nextExercise() {
    this.state.exercise.currentIndex++;

    if (this.state.exercise.currentIndex >= this.state.exercise.exercises.length) {
      this.finishLesson();
    } else {
      this.renderExercise();
    }
  },

  // --- Завершение урока ---
  finishLesson() {
    const { lessonId, correctCount, exercises, lessonData } = this.state.exercise;
    const total = exercises.length;
    const xpEarned = lessonData.xpReward;

    // Обновляем прогресс
    if (!this.state.user.completedLessons.includes(lessonId)) {
      this.state.user.completedLessons.push(lessonId);
    }
    this.state.user.xp += xpEarned;

    // Добавляем выученные слова
    const wordIds = lessonData.wordIds || [];
    wordIds.forEach(id => {
      if (!this.state.user.wordsLearned.includes(id)) {
        this.state.user.wordsLearned.push(id);
      }
    });

    // Следующий урок
    const maxLesson = Math.max(...this.data.lessons.map(l => l.id));
    if (this.state.user.currentLesson <= lessonId && lessonId < maxLesson) {
      this.state.user.currentLesson = lessonId + 1;
    }

    // Обновляем стрик
    this.state.user.lastActiveDate = new Date().toDateString();
    this.updateStreak();

    // Сохраняем
    this.saveProgress();

    // Показываем результат
    document.getElementById('result-xp').textContent = `+${xpEarned} XP`;
    document.getElementById('result-correct').textContent = `${correctCount}/${total}`;
    document.getElementById('result-streak').textContent = `${this.state.user.streak} дн.`;

    // Список выученных слов
    const wordsContainer = document.getElementById('result-words');
    wordsContainer.innerHTML = '';
    wordIds.slice(0, 6).forEach(id => {
      const word = this.data.words.find(w => w.id === id);
      if (!word) return;
      wordsContainer.innerHTML += `
        <div class="result-word">
          <span class="result-word-hanzi hanzi">${word.hanzi}</span>
          <span class="result-word-pinyin">${word.pinyin}</span>
          <span class="result-word-translation">${word.translation}</span>
          <button class="exercise-audio" style="width:32px;height:32px;font-size:16px;margin:0" onclick="App.speak('${word.hanzi}')">🔊</button>
        </div>
      `;
    });

    this.navigate('result');
    this.haptic('success');
    this.showConfetti();
  },

  // Выход из урока
  exitExercise() {
    if (this.tg) {
      this.tg.showPopup({
        title: 'Выйти из урока?',
        message: 'Прогресс текущего урока будет потерян.',
        buttons: [
          { id: 'exit', type: 'destructive', text: 'Выйти' },
          { id: 'stay', type: 'cancel', text: 'Остаться' }
        ]
      }, (btnId) => {
        if (btnId === 'exit') this.navigate('dashboard');
      });
    } else {
      if (confirm('Выйти из урока? Прогресс будет потерян.')) {
        this.navigate('dashboard');
      }
    }
  },

  // =============================================
  // ПРОФИЛЬ
  // =============================================
  renderProfile() {
    const user = this.state.user;

    // Имя из Telegram
    if (this.tg?.initDataUnsafe?.user) {
      const tgUser = this.tg.initDataUnsafe.user;
      document.getElementById('profile-name').textContent =
        tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
    }

    // Статистика
    document.getElementById('profile-streak').textContent = user.streak;
    document.getElementById('profile-xp').textContent = user.xp;
    document.getElementById('profile-words').textContent = user.wordsLearned.length;

    // Прогресс по разделам
    this.data.categories.forEach(cat => {
      const catLessons = this.data.lessons.filter(l => l.category === cat.id);
      const completedCount = catLessons.filter(l => user.completedLessons.includes(l.id)).length;
      const pct = catLessons.length ? Math.round((completedCount / catLessons.length) * 100) : 0;

      const progBar = document.getElementById(`prog-${cat.id}`);
      const pctLabel = document.getElementById(`pct-${cat.id}`);
      if (progBar) progBar.style.width = `${pct}%`;
      if (pctLabel) pctLabel.textContent = `${pct}%`;
    });

    // Достижения
    const achievements = document.getElementById('achievements-list');
    const checks = [
      { name: 'Первый урок', done: user.completedLessons.length > 0 },
      { name: '3 дня подряд', done: user.streak >= 3 },
      { name: '7 дней подряд', done: user.streak >= 7 },
      { name: '30 дней подряд', done: user.streak >= 30 },
      { name: '10 слов выучено', done: user.wordsLearned.length >= 10 },
      { name: '50 слов выучено', done: user.wordsLearned.length >= 50 },
      { name: '100 слов выучено', done: user.wordsLearned.length >= 100 },
      { name: '150 слов (HSK 1)', done: user.wordsLearned.length >= 150 }
    ];

    achievements.innerHTML = checks.map(a =>
      `<div class="achievement ${a.done ? 'unlocked' : 'locked'}">${a.done ? '🏆' : '🔒'} ${a.name}</div>`
    ).join('');
  },

  // =============================================
  // AI-ЧАТ (заглушка)
  // =============================================
  sendChip(text) {
    document.getElementById('chat-input').value = text;
    this.sendMessage();
  },

  sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const messages = document.getElementById('chat-messages');

    // Сообщение пользователя
    messages.innerHTML += `
      <div class="chat-bubble user">
        <div class="chat-text">${this.escapeHtml(text)}</div>
      </div>
    `;

    // Скрываем чипы после первого сообщения
    document.getElementById('chat-chips').classList.add('hidden');

    // Имитация ответа AI
    setTimeout(() => {
      const reply = this.getAiReply(text);
      messages.innerHTML += `
        <div class="chat-bubble bot">
          <div class="chat-avatar">🤖</div>
          <div class="chat-text">${reply}</div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }, 800);

    messages.scrollTop = messages.scrollHeight;
  },

  // Простой AI-ответчик (без API, мок для демо)
  getAiReply(question) {
    const q = question.toLowerCase();

    if (q.includes('тон') || q.includes('тона')) {
      return `В китайском 4 тона + нейтральный:<br><br>
        <span style="color:var(--tone1)">1-й (ровный): mā 妈 — мама</span><br>
        <span style="color:var(--tone2)">2-й (восходящий): má 麻 — конопля</span><br>
        <span style="color:var(--tone3)">3-й (нисходяще-восходящий): mǎ 马 — лошадь</span><br>
        <span style="color:var(--tone4)">4-й (нисходящий): mà 骂 — ругать</span><br><br>
        Тон меняет значение слова! Тренируйся на слух 🎧`;
    }

    if (q.includes('привет') || q.includes('你好')) {
      return `«Привет» по-китайски — <strong class="hanzi">你好</strong> (nǐ hǎo).<br><br>
        你 (nǐ) = ты<br>好 (hǎo) = хороший<br><br>
        Буквально: «ты хороший» — так китайцы здороваются! 😊`;
    }

    if (q.includes('спасибо') || q.includes('谢谢')) {
      return `«Спасибо» по-китайски — <strong class="hanzi">谢谢</strong> (xièxie).<br><br>
        Оба слога с 4-м тоном (нисходящим).<br>
        На это отвечают: <strong class="hanzi">不客气</strong> (bú kèqi) — «Не за что!»`;
    }

    if (q.includes('是') && q.includes('有')) {
      return `Отличный вопрос!<br><br>
        <strong class="hanzi">是</strong> (shì) = «быть, являться»<br>
        → 我<strong>是</strong>学生 — Я <strong>являюсь</strong> студентом<br><br>
        <strong class="hanzi">有</strong> (yǒu) = «иметь, есть»<br>
        → 我<strong>有</strong>一本书 — У меня <strong>есть</strong> книга<br><br>
        是 — отождествление (А = Б)<br>
        有 — обладание (У А есть Б)`;
    }

    if (q.includes('считать') || q.includes('числ') || q.includes('цифр')) {
      return `Числа от 1 до 10:<br><br>
        <span class="hanzi">一</span> yī — 1 &nbsp; <span class="hanzi">二</span> èr — 2<br>
        <span class="hanzi">三</span> sān — 3 &nbsp; <span class="hanzi">四</span> sì — 4<br>
        <span class="hanzi">五</span> wǔ — 5 &nbsp; <span class="hanzi">六</span> liù — 6<br>
        <span class="hanzi">七</span> qī — 7 &nbsp; <span class="hanzi">八</span> bā — 8<br>
        <span class="hanzi">九</span> jiǔ — 9 &nbsp; <span class="hanzi">十</span> shí — 10<br><br>
        Попробуй посчитать вслух! 🔢`;
    }

    if (q.includes('семь') || q.includes('семья') || q.includes('мама') || q.includes('папа')) {
      return `Семья по-китайски:<br><br>
        <span class="hanzi">爸爸</span> bàba — папа<br>
        <span class="hanzi">妈妈</span> māma — мама<br>
        <span class="hanzi">哥哥</span> gēge — старший брат<br>
        <span class="hanzi">姐姐</span> jiějie — старшая сестра<br>
        <span class="hanzi">弟弟</span> dìdi — младший брат<br>
        <span class="hanzi">妹妹</span> mèimei — младшая сестра`;
    }

    // Ответ по умолчанию
    return `Хороший вопрос! 🤔<br><br>
      В полной версии здесь работает AI-наставник на базе Claude, который объяснит любую тему.<br><br>
      Пока попробуй спросить:<br>
      • Объясни тоны<br>
      • Как сказать «привет»?<br>
      • Как сказать «спасибо»?<br>
      • Разница 是 и 有<br>
      • Научи считать`;
  },

  // =============================================
  // НАСТРОЙКИ
  // =============================================
  saveSetting(key, value) {
    this.state.user.settings[key] = value;
    this.saveProgress();
    this.haptic('selection');
  },

  setDailyGoal(minutes, btn) {
    document.querySelectorAll('.goal-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.state.user.settings.dailyGoal = minutes;
    this.saveProgress();
    this.haptic('selection');
  },

  // =============================================
  // ТАРИФЫ (заглушка)
  // =============================================
  showPayment(plan) {
    if (this.tg) {
      this.tg.showPopup({
        title: 'Оплата',
        message: `Оплата тарифа "${plan}" будет доступна в следующей версии. Сейчас всё бесплатно! 🎉`,
        buttons: [{ type: 'ok' }]
      });
    } else {
      alert(`Оплата тарифа "${plan}" будет доступна в следующей версии.`);
    }
    this.haptic('impact');
  },

  // =============================================
  // СТРИК
  // =============================================
  updateStreak() {
    const today = new Date().toDateString();
    const lastDate = this.state.user.lastActiveDate;

    if (!lastDate) {
      this.state.user.streak = 0;
    } else if (lastDate === today) {
      // Уже занимался сегодня — стрик не меняется
    } else {
      const last = new Date(lastDate);
      const now = new Date();
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        this.state.user.streak++;
      } else if (diffDays > 1) {
        this.state.user.streak = 0;
      }
    }

    this.state.user.lastActiveDate = today;
  },

  // =============================================
  // ПРОИЗНОШЕНИЕ (Web Speech API)
  // =============================================
  speak(text) {
    if (!this.state.user.settings.sound) return;
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  },

  // =============================================
  // HAPTIC FEEDBACK (Telegram)
  // =============================================
  haptic(type) {
    if (!this.tg?.HapticFeedback) return;

    switch (type) {
      case 'success':
        this.tg.HapticFeedback.notificationOccurred('success');
        break;
      case 'error':
        this.tg.HapticFeedback.notificationOccurred('error');
        break;
      case 'impact':
        this.tg.HapticFeedback.impactOccurred('medium');
        break;
      case 'selection':
        this.tg.HapticFeedback.selectionChanged();
        break;
    }
  },

  // =============================================
  // АНИМАЦИИ: Confetti + XP Float
  // =============================================
  showConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#e74c3c', '#f39c12', '#27ae60', '#2980b9', '#9b59b6', '#e91e63'];

    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 1 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      container.appendChild(piece);
    }

    // Убрать через 4 секунды
    setTimeout(() => { container.innerHTML = ''; }, 4000);
  },

  showXpFloat(text) {
    const el = document.getElementById('xp-float');
    el.textContent = text;
    el.classList.remove('show');
    // Форсируем reflow
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1300);
  },

  // =============================================
  // СОХРАНЕНИЕ / ЗАГРУЗКА ПРОГРЕССА
  // =============================================
  saveProgress() {
    const data = JSON.stringify(this.state.user);

    // Telegram CloudStorage
    if (this.tg?.CloudStorage) {
      this.tg.CloudStorage.setItem('userProgress', data);
    }

    // localStorage (fallback)
    try {
      localStorage.setItem('repetitor_progress', data);
    } catch (e) { /* игнорируем */ }
  },

  loadProgress() {
    let saved = null;

    // Пробуем localStorage (быстрее)
    try {
      saved = localStorage.getItem('repetitor_progress');
    } catch (e) { /* игнорируем */ }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Мержим с дефолтами чтобы не потерять новые поля
        this.state.user = {
          ...this.state.user,
          ...parsed,
          settings: { ...this.state.user.settings, ...(parsed.settings || {}) }
        };

        // Восстанавливаем настройки на экране
        const pinyinToggle = document.getElementById('setting-pinyin');
        const soundToggle = document.getElementById('setting-sound');
        if (pinyinToggle) pinyinToggle.checked = this.state.user.settings.pinyin;
        if (soundToggle) soundToggle.checked = this.state.user.settings.sound;
      } catch (e) {
        console.error('Ошибка загрузки прогресса:', e);
      }
    }

    // Telegram CloudStorage (async)
    if (this.tg?.CloudStorage) {
      this.tg.CloudStorage.getItem('userProgress', (err, value) => {
        if (!err && value) {
          try {
            const parsed = JSON.parse(value);
            this.state.user = {
              ...this.state.user,
              ...parsed,
              settings: { ...this.state.user.settings, ...(parsed.settings || {}) }
            };
          } catch (e) { /* игнорируем */ }
        }
      });
    }
  },

  // =============================================
  // УТИЛИТЫ
  // =============================================
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// =============================================
// Запуск приложения
// =============================================
document.addEventListener('DOMContentLoaded', () => App.init());

// Обработка Enter в поле пиньинь
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('pinyin-answer')) {
    App.checkPinyinAnswer();
  }
});
