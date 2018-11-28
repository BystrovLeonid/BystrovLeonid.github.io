'use strict'

// Образ - нарисованное изображение,
// что-то что изображает что либо,
// что перцептрон способен распознать.


// Кнопки, нажатие на кнопку обучает перцептрон
// конкретному образу.
let teach = document.getElementById('button-box');

// Область для рисования.
let draw = document.getElementById('draw');
// Контекст рисования.
let ctx = draw.getContext('2d');

// Маленькая область в которую помещается уменьшенное изображение образа
// перед распознаванием/обучением, масштаб на всю область.
let preview = document.createElement('canvas').getContext('2d');

// Здесь отображаются события.
let log = document.getElementById('log');

// Результат распознавания.
let result = document.getElementById('result');


// Ширина и высота области рисования.
const W = 300;
const H = 300;

// Ширина и высота preview
const mW = 30;
const mH = 30;

// Переменные для прямоугольника выделения.
let l = W; // Left
let r = 0; // Right
let t = H; // Top
let b = 0; // Bottom

// Ширина линии рисования.
const lw = 20;


// Символьные представления распознаваемых образов.
// 10 классов образов: числа 0-9
// Количество нейронов в сети тоже 10,
// по одному нейрону на каждый класс образов.
// Каждый нейрон должен активироваться только на тот образ,
// чей индекс он имеет.
// Например нейрон с индексом 0 должен активироваться
// только если нарисован ноль,
// и не должен активироваться на любую другую цифру.
const C = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// const C = Array.apply(null, {length: 30}).map(Number.call, Number);
// const C = ['&#9723;', '&#9711;', '&#9651;'];
// const C = ['x', 'o'];


// Веса перцептрона.
let w = [];

// Полученные образы и правильные ответы на них.
let imagesSet = [];
let imagesSetAnswer = [];

// Максимальное количество циклов обучения.
let limit = 1000;

// Скорость обучения.
// Подбирается опытным путём.
// Если слишком маленькая то сеть будет долго обучаться,
// и алгоритм градиентного спуска может попасть в локальный минимум,
// (проще говоря, сеть может не обучится, застряв в одной точке).
// Если слишком большая то сеть будет обучаться слишком быстро и
// и может так и не обучиться новому образу и/или забыть старый.
// (может проскочить точку глобального минимума).
let learningRate = 0.01;


// Получить чёрно-белое изображение образа 8 бит.
function blackAndWhite8bit() {

  // Вырезать образ по прямоугольнику выделения и
  // скопировать уменьшенную копию в preview.
  // Растянув при этом образ на весь preview.
  preview.drawImage(
    draw,
    l - lw / 2,
    t - lw / 2,
    r - l + lw,
    b - t + lw,
    0, 0, mW, mH
  );

  // Данные изображения из preview.
  let image = preview.getImageData(0, 0, mW, mH).data;

  // Массив данных чёрно-белое изображения.
  let bw = [];

  // Берётся каждый 4 байт из изображения
  // RGBA - Red Green Blue Alpha
  // Поскольку изначально изображение чёрно-белое,
  // то чёрный пиксел - RGBA(0,   0,   0,   255)
  //     белый пиксел - RGBA(255, 255, 255, 255)
  // В этом цикле берётся Red.
  // 255, ?, ?, ? -> 1
  // 200, ?, ?, ? -> 1
  // 0  , ?, ?, ? -> 0
  // Т.е. сеть видит только красный.
  // Здесь же происходит нормализация входных данных,
  // 0 - нет сигнала, 1 - есть сигнал.
  for (let i = 0; i < mW * mH * 4; i += 4) {
    bw.push(image[i] == 0 ? 0 : 1);
  }

  // Проверка, нарисован ли образ.
  // Если все биты равны нулям то ничего не нарисовано.
  // Если что-то нарисовано, тогда вернуть данные.
  for (let i = 0; i < mW * mH; i++) {
    if (bw[i]) {
      return bw;
    }
  }
}

// Рисует прямоугольник выделения.
function selectionRect(lineColor) {

  ctx.lineWidth = 1;
  ctx.strokeStyle = lineColor;

  ctx.strokeRect(
    l - lw / 2,
    t - lw / 2,
    r - l + lw,
    b - t + lw
  );
}

// Возвращает максимальный элемент массива.
function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

// Возвращает массив указанной длины, заполненный нулями.
function getArrayOfZeros(arrayLength) {
  return Array
    .apply(null, Array(arrayLength))
    .map(Number.prototype.valueOf, 0);
}


//
document.addEventListener('DOMContentLoaded', function () {
  // Настройка.

  // Добавить кнопки с символьными представлениями образов.
  for (let i = 0; i < C.length; i++) {
    teach.innerHTML +=
      `<button data-image-index="${i}">${C[i]}</button>`;
  }

  // Инициализация весов случайными значениями от 0 до 1.
  for (let i = 0; i < mW * mH * C.length; i++) {
    w.push(Math.random());
  }

  // Задать ширину и высоту окна рисования.
  draw.width = W;
  draw.height = W;

  // Задать ширину и высоту preview. (Не обязательно)
  preview.width = mW;
  preview.height = mH;

  // Закрасить окно рисования.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Настройка стилей рисования линии.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';


  // Нажатие кнопки мыши или касание, начать рисование линии.  
  function startDraw() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = lw;

    ctx.beginPath();
  }
  draw.addEventListener('mousedown', startDraw);
  draw.addEventListener('touchstart', startDraw);

  // Рисует линию.
  function drawLine(x, y) {
    // Линия.
    ctx.lineTo(x, y);
    ctx.stroke();

    // Вычисляет границы прямоугольника выделения.
    l = Math.min(l, x);
    r = Math.max(r, x);

    t = Math.min(t, y);
    b = Math.max(b, y);
  }
  draw.addEventListener('mousemove', function (e) {
    if (e.buttons > 0) {
      drawLine(
        e.layerX,
        e.layerY
      );
    }
  });
  draw.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      drawLine(
        e.touches[0].clientX - draw.getBoundingClientRect().left,
        e.touches[0].clientY - draw.getBoundingClientRect().top
      );
    }
  });

  // draw.onmouseup = draw.ontouchend = function () {
  //   selectionRect('#00eeee');
  // };


  // Очистка области рисования.
  function clear() {
    result.textContent = '_';

    ctx.fillRect(0, 0, W, H);

    l = W;
    r = 0;
    t = H;
    b = 0;
  }

  // Кнопка очистить.
  document.getElementById('clear').addEventListener('click', clear);

  // Кнопка распознать.
  document.getElementById('recognize').addEventListener('click', function () {

    // Показать прямоугольник выделения.
    // Синего цвета.
    selectionRect('#0000ee');

    // Получить чёрно-белое изображение образа 8 бит.
    let bw = blackAndWhite8bit();

    //
    if (bw === undefined) {
      log.textContent = 'Нарисуйте.';
      return;
    }

    // Массив ответов сети по количеству нейронов/классов образов.
    // изначально      [0, 0, 0, ...
    // индекс нейрона   0  1  2  ...
    let results = getArrayOfZeros(C.length);

    // Прямое прохождение сигнала.
    //
    // Полученный образ распространяется на каждый нейрон сети,
    for (let n = 0; n < C.length; n++) {
      // Вычисляется отклик нейрона на полученный образ.
      // Каждый элемент весовых коэффицентов w[i]
      // умножается на каждый элемент входного образа bw[i]
      // все произведения суммируется.
      for (let i = 0; i < mW * mH; i++) {
        results[n] += bw[i] * w[i + mW * mH * n];
      }
    }

    // Получаем индекс максимального значения из массива.
    // Это индекс нейрона который дал наибольший отклик.
    let imageIndex = results.indexOf(getMaxOfArray(results));

    // Показать распознанный образ.
    result.innerHTML = C[imageIndex];

    // Подсветить соответствующую кнопку.
    teach.children[imageIndex].style.borderColor = '#0000ee';
    setTimeout(() => {
      teach.children[imageIndex].style.borderColor = 'transparent';
    }, 1000);

  }); // Кнопка распознать.


  // Обучение.
  teach.addEventListener('click', function (e) {

    //
    let imageIndex;

    // Индекс образа с кнопки.
    if (e.target.dataset.imageIndex === undefined) {
      if (e.target.parentElement.dataset.imageIndex === undefined) {
        return;
      } else {
        imageIndex = +e.target.parentElement.dataset.imageIndex;
      }
    } else {
      imageIndex = +e.target.dataset.imageIndex;
    }

    // Показать прямоугольник выделения.
    // Зелёным цветом.
    selectionRect('#00ee00');

    // Получить чёрно-белое изображение образа 8 бит.
    let bw = blackAndWhite8bit();

    // 
    if (bw === undefined) {
      log.textContent = 'Нарисуйте.';
      return;
    }


    // Массив заполненный нулями, длина массива равна
    // количесиву нейронов/классов образов.
    let correct = getArrayOfZeros(C.length);

    // Правильный ответ.
    // Присвоить по индексу нейрона единицу, 
    // этот нейрон должен дать отклик на полученный образ.
    correct[imageIndex] = 1;

    // Добавить новый образ в обучающий набор.
    imagesSet.push(bw);
    imagesSetAnswer.push(correct);

    // Глобальная ошибка, сумма всех локальных ошибок.
    // Её и будем минимизировать, до нуля.
    let gError = 0;

    // Цикл обучения.
    let ep = 0;

    //
    log.textContent = '';

    // Обучение.
    do {
      // 
      ep++;

      // В начале цикла обучения глобальная ошибка равна нулю.
      gError = 0;

      // Пройтись по всем образам в обучающем наборе.
      for (let s = 0; s < imagesSet.length; s++) {

        // Ответы сети.
        let result = getArrayOfZeros(C.length);

        // Прямое прохождение сигнала.
        for (let n = 0; n < C.length; n++) {
          for (let i = 0; i < mW * mH; i++) {
            result[n] += imagesSet[s][i] * w[i + mW * mH * n];
          }
          // Функция активации:
          // если отклик нейрона на образ больше порога активации
          // то нейрон активируется.
          result[n] = result[n] > 0.5 ? 1 : 0;
        }

        // Настройка весов.
        for (let n = 0; n < C.length; n++) {
          // 
          if (imagesSetAnswer[s][n] == result[n]) {
            // Ответ правильный, обучение не требуется.

            continue;
          } else {
            // Ответ не правильный.

            // Вычисление локальной ошибки сети.
            let lError = imagesSetAnswer[s][n] - result[n];

            // Вычисление глобальной ошибки сети.
            // Обязательно прибавлять абсолютное значение,
            // поскольку ошибка может быть отрицательной или положительной.
            // Здесь локальная ошибка может быть -1 или 1.
            gError += Math.abs(lError);

            // Корректировка весов нейрона с индексом n.
            for (let i = 0; i < mW * mH; i++) {
              // К каждому весовому коэффиценту прибавляется 
              // соответствущий элемент входного образа
              // умноженный на локальную ошибку сети и
              // умноженный на скорость обучения.
              w[i + mW * mH * n] += imagesSet[s][i] * lError * learningRate;
            }
          }
        }
      }

      //
      log.textContent = `Цикл: ${ep}, глобальная ошибка: ${gError}\n`;

      // Выполнять обучение до тех пор пока сеть не будет ошибаться,
      // или не выйдет за лимит обучения.
    } while (gError > 0 && ep < limit);


    if (ep == limit) {
      // Сеть не обучилась новому образу.

      //
      log.textContent = `Ошибка. Конфликтный образ, не обучен!`;

      // Удалить конфликтный образ из набора.
      imagesSet.pop();
      imagesSetAnswer.pop();
    } else {
      // Сеть обучилась новому образу.

      //
      clear();

      //
      log.textContent =
        `Обучен, циклы: ${ep}, количество примеров: ${imagesSet.length}`;
    }
  }); // Обучение.

}); // DOMContentLoaded