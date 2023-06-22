import { IF_QUESTIONS_RU } from './messages';

const RELEASE_IS_STABLE = 'Релиз стабилен';
const RELEASE_IN_TESTING = 'Релиз тестируется';

const DONE_EMOJI = '✅';
const TESTING_EMOJI = '🧪';
const IN_PROGRESS_EMOJI = '⏳';
const NOT_DONE_EMOJI = '❌';

const UPGRADE_2_0_RU = {
  title: 'Успешный переход на версию Superset 2.0',
  date: '17.03.2023',
  subTitle: RELEASE_IS_STABLE,
  extra: IF_QUESTIONS_RU,
  listTitle: 'Новая функциональность / исправлены проблемы в версии 2.0',
  releases: [
    {
      date: `${DONE_EMOJI} 17.03.2023`,
      status: RELEASE_IS_STABLE,
      messages: [
        'Исправлены проблемы с отображением кириллицы при экспорте графиков в CSV формате',
        'Улучшена общая стилистика (plugin | standalone)',
        'Улучшена работа с нативными фильтрами (plugin | standalone)',
        'Изменены названия CSV файлов при экспорте (plugin | standalone)',
        'Убрано ограничение DODOIS_FRIENDLY (plugin | standalone)',
        'Увеличено поле ввода SQL в модалке редакатирования датасета',
      ],
    },
  ],
  listTitleExtra: 'Возможные проблемы в версии 2.0',
  messagesExtra: [
    'Возможные проблемы с d3 форматированием',
    'Возможные проблемы с отображением некоторых графиков',
  ],
};

const NEW_FEATURES_APRIL_2023_RU = {
  title: 'Обновления [Апрель 2023]',
  date: '11.04.2023',
  subTitle: RELEASE_IS_STABLE,
  extra: IF_QUESTIONS_RU,
  listTitle: 'Новая функциональность / исправлены проблемы',
  releases: [
    {
      date: `${DONE_EMOJI} 11.04.2023`,
      status: RELEASE_IS_STABLE,
      messages: [
        'Для того, чтобы дашборд появился в DODOIS (Аналитика (Бета)) необходимо указать CERTIFIED BY и CERTIFICATION DETAILS в Superset Standalone',
        'Добавлен Change Log фич и фиксов',
        'Включена поддержка Cross-filters (standalone, plugin)',
        'Включена поддержка Filter-sets (standalone)',
        'Включен тип визуализации MapBox',
      ],
    },
  ],
  listTitleExtra: 'Возможные проблемы',
  messagesExtra: [
    'Если вашего дашборда нет в списке дашбордов, проверьте правильность заполнения CERTIFIED BY и CERTIFICATION DETAILS',
    'Пример верного формата: CERTIFIED BY -> DODOPIZZA, CERTIFICATION DETAILS -> OfficeManager/Analytics',
  ],
};

const NEW_FEATURES_MAY_2023_RU = {
  title: 'Обновления [Май 2023]',
  date: '03.05.2023',
  subTitle: RELEASE_IS_STABLE,
  extra: IF_QUESTIONS_RU,
  listTitle: 'Новая функциональность / исправлены проблемы',
  releases: [
    {
      date: `${DONE_EMOJI} 03.05.2023`,
      status: RELEASE_IS_STABLE,
      messages: [
        'Добавили правила по работе с полями CERTIFIED BY и CERTIFICATION DETAILS в Superset Standalone, в модальном окне изменения дашборда',
        'Зарелизили в Дринкит Superset Dashboard plugin',
        'Реализовали возможность управления списком дашбордов из Superset: дринкит пицца и донер 42 теперь могут управлять, какие дашборды им показать во вкладке Аналитика',
        'Добавлена кнопка и модальное окно Changelog в Superset Standalone',
        'Добавлена кнопка Show/Hide values во всех графиках Time-series для пользовательского управления показа значений на графике',
        'Добавили цветовую индикацию, если метрика растет или падает в Big Number with Trendline',
        'Исправили проблемы с фильтрами периода',
        'Добавили разные стилизованные Welcome Screens для бизнесов',
      ],
    },
  ],
  listTitleExtra: 'Что планируем брать в работу?',
  messagesExtra: [
    `${DONE_EMOJI} Доработкой функциональности для Changelog (удобное отображение нового обновления)`,
    `${DONE_EMOJI} Начинаем груммить введение инструмента для организации списка дашбордов и списка графиков в Standalone Superset`,
    `${DONE_EMOJI} Обрабатываем разделение по бизнесам в Superset Dashboard Plugin (визуальное, функциональное)`,
  ],
};

const NEW_FEATURES_JUNE_2023_RU = {
  title: 'Обновления [Июнь 2023]',
  date: '22.06.2023',
  subTitle: RELEASE_IN_TESTING,
  extra: IF_QUESTIONS_RU,
  listTitle: 'Новая функциональность / исправлены проблемы',
  releases: [
    {
      date: `${TESTING_EMOJI} 22.06.2023`,
      status: RELEASE_IN_TESTING,
      messages: [
        'Добавили переводы на русский язык в разных частях системы',
        'Убрали кнопку "ОК" при выборе даты при выборе фильтра в дашборде',
        'Улучшили вид Changelog',
      ],
    },
    {
      date: `${DONE_EMOJI} 16.06.2023`,
      status: RELEASE_IS_STABLE,
      messages: [
        'Добавили возможность показывать алерты на главной странице в плагине Superset в DODOIS',
        'Добавили возможность создавать алерты в Standalone',
      ],
    },
    {
      date: `${DONE_EMOJI} 12.06.2023`,
      status: RELEASE_IS_STABLE,
      messages: [
        'Добавили переводы для Русского языка при выборке фильтров в Дашборде',
        'Добавили переводы для Русского языка в настройке фильтров Дашборда',
        'Добавили новые валюты в форматирование чисел: Bulgarian lev, UAE Dirham',
        'Добавили пользовательское сообщение о том, что вход в суперсет невозможен без email',
        'Добавили новые валюты в форматирование чисел: Naira, Romanian Leu, Somoni, Dong, Serbian Dinar, Armenian Dram, Lari, Rupiah, Azerbaijan Manat',
        'Исправили разные проблемы пользователей в разных типах графиков',
      ],
    },
    {
      date: `${DONE_EMOJI} 02.06.2023`,
      status: RELEASE_IS_STABLE,
      messages: [
        'Обновили логотип в Superset standalone',
        'Изменили форматирование десятичных (вместо точек - запятые)',
        'Изменили форматирование чисел (вместо запятых - пробелы)',
        'Добавили новые валюты в форматирование чисел: Euro, Zloty, Som, Uzbekistan Sum',
      ],
    },
  ],
  listTitleExtra: 'Что планируем брать в работу?',
  messagesExtra: [
    `${DONE_EMOJI} Добавить все необходимые валюты в форматирование`,
    `${IN_PROGRESS_EMOJI} Улучшить и локализовать форматирование чисел`,
    `${IN_PROGRESS_EMOJI} Улучшить выбор дат в дашборде`,
    `${IN_PROGRESS_EMOJI} Использовать локализацию из DODOIS во вкладке Аналитика`,
    `${NOT_DONE_EMOJI} Доработать Pivot Table v2: возможность сортировки столбцов`,
    `${DONE_EMOJI} Упростить выбор дат в фильтрах`,
    `${DONE_EMOJI} Переименовать "Аналитика (Бета)" в "Аналитика"`,
    `${DONE_EMOJI} Перевести на русский язык фильтрацию по датам`,
    `${DONE_EMOJI} Улучшить переводы на русский язык по всему Superset`,
    `${DONE_EMOJI} Улучшить уведомление пользователей о важных вещах в Superset Standalone и Superset dashboard plugin`,
  ],
};

export {
  UPGRADE_2_0_RU,
  NEW_FEATURES_APRIL_2023_RU,
  NEW_FEATURES_MAY_2023_RU,
  NEW_FEATURES_JUNE_2023_RU,
};
