const GLOBAL_WARNING_DEFAULT_HEADER = 'Unexpected error happend =(';
const GLOBAL_WARNING_DEFAULT_BODY =
  'Случилась непредвиденная ошибка в Superset dashboard plugin. Обратитесь в команду тех поддержки';

const LIMIT_WARNING_HEADER = 'Измените параметры фильтров';
const LIMIT_WARNING_BODY =
  'Визуальный элемент не может быть отрисован, так как количество данных выборки превысило лимит. Количество строк выборки не должно превышать ';

const UNAVAILABLE_HEADER = 'Maintanance message';
const UNAVAILABLE_BODY =
  'Superset Dashboard Plugin is currently not available. It is either broken or major updates are happening at this time. The tech team is currently working on resolving this problem. Please be patient';

const UNAVAILABLE_BODY_RU =
  'Superset Dashboard Plugin в настоящее время недоступен. Он либо сломан, либо происходят важные обновления. Техническая команда работает над решением этой проблемы. Пожалуйста, будьте терпеливы';

const RULES_RU = {
  title: 'Добро пожаловать в Superset dashboard plugin',
  messages: {
    one: 'Слева можно выбрать интересующий дашборд.',
    two: 'Данный инструмент встроен в DODO IS и показывает дашборды из standalone сервиса по ссылке: https://analytics.dodois.io/',
    three:
      'Если у Вас возникли вопросы, то можно обратиться в команду Data Engineering',
  },
  btnRulesText: 'Правила работы с аналитикой',
  btnAnalyticsText: 'Перейти в аналитику  (standalone)',
};

const CSV_TEMP_PROBLEM_RU = {
  title: 'Внимание! Экспорт данных в CSV формате временно не работает.',
  subTitle: 'Текущее решение:',
  messages: [
    'Перейти в standalone сервис по ссылке: https://analytics.dodois.io/ или выше по кнопке "Перейти в аналитику (standalone)".',
    'Выбрать отчет и настроить в нем фильтры.',
    'У визуального элемента в правом верхнем углу нажать на три точки - выбрать "Export CSV"',
  ],
  date: 'Команда Data Engineering работает над устранением данной пробемы (08.02.2023)',
};

const UPGRADE_2_0_RU = {
  title: 'Переход на версию Superset 2.0',
  subTitle: 'Ожидаются проблемы со стабильной работой Superset.',
  listTitle:
    'Новая функциональность / исправлены проблемы / возможные проблемы в версии 2.0 (по не стабильной работе системы просим оповестить команду DE)',
  messages: [
    'Исправлены проблемы с отображением кириллицы при экспорте графиков в CSV формате',
    'Исправлены проблемы со стилистикой дашбордов',
    'Улучшена работа с нативными фильтрами (урезан URL)',
    'Возможные проблемы с d3 форматированием',
    'Возможные проблемы с отображением некоторых графиков',
  ],
  date: 'Команда Data Engineering работает над стабилизацией (07.03.2023)',
};

export {
  RULES_RU,
  GLOBAL_WARNING_DEFAULT_HEADER,
  GLOBAL_WARNING_DEFAULT_BODY,
  LIMIT_WARNING_HEADER,
  LIMIT_WARNING_BODY,
  UNAVAILABLE_HEADER,
  UNAVAILABLE_BODY,
  UNAVAILABLE_BODY_RU,
  CSV_TEMP_PROBLEM_RU,
  UPGRADE_2_0_RU,
};
