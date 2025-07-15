const axios = require('axios');
const fs = require('fs');

const API_KEY = '-mV6ejMuS4uDgQgkodk4AN';
const FIRESEC_URL = 'http://127.0.0.1:8081/api/personnel/employee';

async function fetchFiresecEmployees() {
  const url = `${FIRESEC_URL}?Action=SCUDConfig&apiKey=${encodeURIComponent(API_KEY)}`;
  const headers = {
    Accept: 'application/json',
    'Accept-Charset': 'utf-8',
  };

  const response = await axios.get(url, { headers });
  let data = response.data;

  // Принудительная очистка
  if (typeof data === 'string') {
    data = data
      .replace(/[\u0000-\u001F]+/g, ' ') // удаляем управляющие символы
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\t/g, ' ');
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Ошибка парсинга JSON вручную:', e.message);
      return null;
    }
  }

  return data.root ?? data;
}

function collectEmployees(node, path = []) {
  let employees = [];
  if (!node) return employees;

  if (Array.isArray(node.employees)) {
    employees = node.employees.map(emp => {
      let tokens = [];
      if (Array.isArray(emp.tokens)) {
        tokens = emp.tokens;
      } else if (emp.tokens && typeof emp.tokens === 'object') {
        tokens = [emp.tokens];
      } else if (typeof emp.tokens === 'string') {
        console.warn('Неправильный формат tokens:', emp.tokens, 'у', emp.lastName, emp.firstName, emp.id);
      }

      // Получаем номер карты (tokenCode первой карты, если есть)
      let cardNumber = '';
      if (tokens.length > 0 && tokens[0] && typeof tokens[0].tokenCode === 'string') {
        cardNumber = tokens[0].tokenCode;
      }

      // Название арендатора — последний элемент в folderPath
      const folderArr = path.filter(Boolean);
      const tenant = folderArr.length > 0 ? folderArr[folderArr.length - 1] : '';

      return {
        fullName: [emp.lastName, emp.firstName, emp.middleName].filter(Boolean).join(' '),
        serial: emp.serial,
        cardNumber,
        tenant,
      };
    });
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const childTitle = (child && typeof child.title === 'string' && child.title.trim() !== '')
        ? child.title
        : '(Без названия)';
      const childPath = [...path, childTitle];
      employees = employees.concat(collectEmployees(child, childPath));
    }
  }

  return employees;
}

(async () => {
  try {
    const root = await fetchFiresecEmployees();
    if (!root) {
      console.error('Ошибка: данные не получены или структура некорректна.');
      return;
    }

    // Находим папку "Арендаторы" в корне KazanMall
    const arendatoryNode = Array.isArray(root.children)
      ? root.children.find(child => child && child.title === 'Арендаторы')
      : null;

    if (!arendatoryNode) {
      console.error('Папка "Арендаторы" не найдена!');
      return;
    }

    const allEmployees = collectEmployees(arendatoryNode, ['KazanMall', 'Арендаторы']);
    fs.writeFileSync('employees.json', JSON.stringify(allEmployees, null, 2), 'utf-8');
    console.log('Сохранено сотрудников:', allEmployees.length, 'в файл employees.json');
  } catch (err) {
    console.error('Ошибка при получении сотрудников Firesec:', err.message);
  }
})(); 