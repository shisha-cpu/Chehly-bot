const { Telegraf, Markup } = require('telegraf');

// Конфигурация бота
const BOT_TOKEN = '8432249611:AAHWMs9ZysSoRuKVxhGdO-FE-bPP2xyWmXs';
const GROUP_ID = '-1002540229091'; // Замените на реальный ID группы

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Данные товаров (без фото для начала)
const products = {
    seatCovers: [
        { id: 1, name: 'Черная алькантара / Черная экокожа' },
        { id: 2, name: 'Экокожа белая' },
        { id: 3, name: 'Синяя алькантара / Черная экокожа' },
        { id: 4, name: 'Черная экокожа / Оранжевая экокожа' },
        { id: 5, name: 'Темно-серая экокожа' },
        { id: 6, name: 'Черная экокожа / Слоновая кость экокожа' },
        { id: 7, name: 'Черная экокожа' },
        { id: 8, name: 'Черная экокожа / Серая экокожа' },
        { id: 9, name: 'Перевернутый бугатти' },
        { id: 10, name: 'Ромб люкс' },
        { id: 11, name: 'Анаконда алькантара' },
        { id: 12, name: 'Экстра' },
        { id: 13, name: 'Броня' },
        { id: 14, name: 'Жук' },
        { id: 15, name: 'Супер узкая классика' },
        { id: 16, name: 'Анаконда экокожа' },
        { id: 17, name: 'Классика под оригинал' },
        { id: 18, name: 'Паук алькантара' },
        { id: 19, name: 'Галочки' },
        { id: 20, name: 'Аллигатор' },
        { id: 21, name: 'Каркасные Под оригинал' },
        { id: 22, name: 'Каркасные соты' },
        { id: 23, name: 'Каркасные супер узкая классика' },
        { id: 24, name: 'Каркасные ромбы' },
    ],
    carMats: [
        { id: 25, name: 'Экокожа + ворс премиум' },
        { id: 26, name: 'Экокожа + Ева' },
        { id: 27, name: 'Коврики в багажник' },
        { id: 28, name: 'Цвета на выбор - 13000 комплект' }
    ]
};

// Тексты информации
const infoTexts = {
    about: `🏭 О КОМПАНИИ AutoAтельe

Профессиональное производство авточехлов и автоковров с 2010 года.

Наши преимущества:
✅ Собственное производство
✅ Качественные материалы
✅ Гарантия 1 год
✅ Индивидуальный подход
✅ Доставка по всей России

Мы используем только проверенные материалы: экокожа, алькантара, премиальные ткани.`,

    installation: `🔧 УСТАНОВКА АВТОЧЕХЛОВ

Процесс установки прост и понятен:

1. Начните с переднего сидения водителя
2. Аккуратно наденьте чехол на сиденье
3. Закрепите липучки и крючки
4. Расправьте материал
5. Повторите для других сидений

⚠️ ВАЖНО: При наличии подушек безопасности убедитесь, что швы не мешают их работе.

Нужна помощь? Закажите бесплатную консультацию!`,

    payment: `💰 ОПЛАТА И ДОСТАВКА

🚚 СПОСОБЫ ДОСТАВКИ:
• Курьером по Владимирской области - 400 ₽
• Самовывоз (Владимир, Москва) - БЕСПЛАТНО
• ТК "ПЭК", "Деловые линии" - по тарифам
• Почта России - по тарифам

💳 СПОСОБЫ ОПЛАТЫ:
• Наличными при получении
• Перевод на карту Сбербанка
• Наложенный платеж
• Онлайн-оплата

🎯 ГАРАНТИЯ: 1 год на всю продукцию!`
};

// Меню
const mainMenu = Markup.keyboard([
    ['🚗 Авточехлы', '🛒 Автоковры'],
    ['ℹ️ О нас', '🔧 Установка'],
    ['💰 Оплата и доставка', '📞 Консультация']
]).resize();

const backButton = Markup.keyboard(['⬅️ Назад']).resize();

// Хранилище состояний пользователей
const userStates = new Map();

// Функция показа товаров
async function showProducts(ctx, productType, categoryName) {
    const productsList = products[productType];
    
    let message = `📦 ${categoryName}\n\n`;
    
    productsList.forEach((product, index) => {
        message += `${index + 1}. ${product.name}\n`;
    });
    
    message += `\nВыберите товар для заказа:`;
    
    // Создаем inline-кнопки для товаров
    const buttons = productsList.map(product => 
        [Markup.button.callback(product.name, `product_${productType}_${product.id}`)]
    );
    
    buttons.push([Markup.button.callback('⬅️ Назад в меню', 'back_to_menu')]);
    
    await ctx.reply(message, Markup.inlineKeyboard(buttons));
}

// Функция обработки заказа
async function processOrder(ctx, productType, productId) {
    const productsList = products[productType];
    const product = productsList.find(p => p.id === productId);
    
    if (!product) {
        await ctx.reply('Товар не найден', mainMenu);
        return;
    }

    userStates.set(ctx.from.id, {
        step: 'order_phone',
        productType: productType,
        productId: productId,
        productName: product.name
    });

    await ctx.reply(
        `🛒 ВЫБРАН ТОВАР:\n${product.name}\n\n📱 Введите ваш номер телефона для связи:`,
        Markup.removeKeyboard()
    );
}

// Функция начала консультации
function startConsultation(ctx) {
    userStates.set(ctx.from.id, { step: 'consultation_name' });
    ctx.reply('👤 Пожалуйста, введите ваше ФИО:', Markup.removeKeyboard());
}

// ОБРАБОТЧИКИ КОМАНД

// Команда /start
bot.start(async (ctx) => {
    console.log(`👤 Новый пользователь: ${ctx.from.first_name} (ID: ${ctx.from.id})`);
    await ctx.reply(
        `👋 Добро пожаловать в <b>AutoAтельe</b>!\n\n` +
        `Мы производим качественные авточехлы и автоковры с доставкой по всей России.\n\n` +
        `Выберите интересующий раздел:`,
        { 
            parse_mode: 'HTML',
            ...mainMenu 
        }
    );
});

// Команда /help
bot.help(async (ctx) => {
    await ctx.reply(
        `ℹ️ <b>ПОМОЩЬ ПО БОТУ</b>\n\n` +
        `• <b>🚗 Авточехлы</b> - каталог авточехлов\n` +
        `• <b>🛒 Автоковры</b> - каталог автоковров\n` +
        `• <b>ℹ️ О нас</b> - информация о компании\n` +
        `• <b>🔧 Установка</b> - инструкция по установке\n` +
        `• <b>💰 Оплата и доставка</b> - условия доставки\n` +
        `• <b>📞 Консультация</b> - бесплатная консультация\n\n` +
        `Для возврата в меню используйте кнопку "⬅️ Назад"`,
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ОБРАБОТЧИКИ КНОПОК МЕНЮ

bot.hears('🚗 Авточехлы', async (ctx) => {
    await showProducts(ctx, 'seatCovers', 'АВТОЧЕХЛЫ');
});

bot.hears('🛒 Автоковры', async (ctx) => {
    await showProducts(ctx, 'carMats', 'АВТОКОВРЫ');
});

bot.hears('ℹ️ О нас', async (ctx) => {
    await ctx.reply(infoTexts.about, backButton);
});

bot.hears('🔧 Установка', async (ctx) => {
    await ctx.reply(infoTexts.installation, backButton);
});

bot.hears('💰 Оплата и доставка', async (ctx) => {
    await ctx.reply(infoTexts.payment, backButton);
});

bot.hears('📞 Консультация', async (ctx) => {
    startConsultation(ctx);
});

bot.hears('⬅️ Назад', async (ctx) => {
    userStates.delete(ctx.from.id);
    await ctx.reply('🏠 Главное меню:', mainMenu);
});

// ОБРАБОТЧИКИ INLINE-КНОПОК

// Обработка выбора товара
bot.action(/product_(seatCovers|carMats)_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const [, productType, productId] = ctx.match;
    await processOrder(ctx, productType, parseInt(productId));
});

// Кнопка "Назад в меню"
bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.reply('🏠 Главное меню:', mainMenu);
});

// ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ (формы)
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userText = ctx.message.text;
    const state = userStates.get(userId);

    // Если нет состояния - показываем меню
    if (!state) {
        await ctx.reply('Пожалуйста, выберите действие из меню:', mainMenu);
        return;
    }

    try {
        // Консультация - шаг 1: ФИО
        if (state.step === 'consultation_name') {
            state.name = userText;
            state.step = 'consultation_phone';
            await ctx.reply('📱 Теперь введите ваш номер телефона:');
            
        // Консультация - шаг 2: Телефон
        } else if (state.step === 'consultation_phone') {
            state.phone = userText;
            state.step = 'consultation_question';
            await ctx.reply('❔ Опишите ваш вопрос или проблему:');
            
        // Консультация - шаг 3: Вопрос
        } else if (state.step === 'consultation_question') {
            state.question = userText;

            // Отправка заявки в группу
            const consultationMessage = 
                `📞 <b>НОВАЯ ЗАЯВКА НА КОНСУЛЬТАЦИЮ</b>\n\n` +
                `👤 <b>ФИО:</b> ${state.name}\n` +
                `📱 <b>Телефон:</b> ${state.phone}\n` +
                `❓ <b>Вопрос:</b> ${state.question}\n` +
                `👤 <b>Пользователь:</b> @${ctx.from.username || ctx.from.first_name}\n` +
                `🆔 <b>ID:</b> ${userId}`;

            await bot.telegram.sendMessage(GROUP_ID, consultationMessage, { parse_mode: 'HTML' });
            
            await ctx.reply(
                '✅ <b>Спасибо! Ваша заявка отправлена.</b>\n\n' +
                'Наш менеджер свяжется с вами в ближайшее время для консультации.',
                { parse_mode: 'HTML', ...mainMenu }
            );
            userStates.delete(userId);
            
        // Заказ товара - шаг: Телефон
        } else if (state.step === 'order_phone') {
            const phone = userText;
            const productName = state.productName;
            const productType = state.productType === 'seatCovers' ? 'Авточехлы' : 'Автоковры';

            // Отправка заказа в группу
            const orderMessage = 
                `🛒 <b>НОВЫЙ ЗАКАЗ</b>\n\n` +
                `📦 <b>Категория:</b> ${productType}\n` +
                `🏷️ <b>Товар:</b> ${productName}\n` +
                `📱 <b>Телефон:</b> ${phone}\n` +
                `👤 <b>Пользователь:</b> @${ctx.from.username || ctx.from.first_name}\n` +
                `🆔 <b>ID:</b> ${userId}`;

            await bot.telegram.sendMessage(GROUP_ID, orderMessage, { parse_mode: 'HTML' });
            
            await ctx.reply(
                '✅ <b>Спасибо! Ваш заказ принят.</b>\n\n' +
                'Наш менеджер свяжется с вами в ближайшее время для уточнения деталей заказа.',
                { parse_mode: 'HTML', ...mainMenu }
            );
            userStates.delete(userId);
        }
    } catch (error) {
        console.error('❌ Ошибка обработки сообщения:', error);
        await ctx.reply(
            '❌ Произошла ошибка. Пожалуйста, попробуйте еще раз.',
            mainMenu
        );
        userStates.delete(userId);
    }
});

// ОБРАБОТКА ОШИБОК
bot.catch((err, ctx) => {
    console.error('❌ Ошибка бота:', err);
    console.error('Контекст ошибки:', ctx);
});

// ЗАПУСК БОТА
async function startBot() {
    try {
        console.log('🟡 Запуск бота AutoAтельe...');
        
        // Тестируем подключение
        const botInfo = await bot.telegram.getMe();
        console.log(`🟢 Бот @${botInfo.username} успешно подключен!`);
        
        // Запускаем бота
        await bot.launch();
        console.log('🚀 Бот успешно запущен и готов к работе!');
        console.log('📱 Перейдите в бота и отправьте /start для начала работы');
        
    } catch (error) {
        console.error('🔴 ОШИБКА ЗАПУСКА БОТА:', error.message);
        console.log('\n💡 ВОЗМОЖНЫЕ ПРИЧИНЫ:');
        console.log('1. Неверный токен бота');
        console.log('2. Проблемы с интернет-соединением');
        console.log('3. Блокировка Telegram в вашем регионе');
        console.log('4. Неправильный формат токена');
        
        process.exit(1);
    }
}

// ОБРАБОТКА ЗАВЕРШЕНИЯ РАБОТЫ
process.once('SIGINT', () => {
    console.log('\n🛑 Остановка бота...');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('\n🛑 Остановка бота...');
    bot.stop('SIGTERM');
    process.exit(0);
});

// ЗАПУСК ПРОГРАММЫ
console.log('🤖 AutoAтельe Bot - Starting...');
startBot();