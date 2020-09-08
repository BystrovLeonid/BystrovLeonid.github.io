'use strict';

importScripts('commands.js');
importScripts('matrix.js');

// Образ - нарисованное изображение,
// что-то что изображает что либо,
// что перцептрон способен распознать.

// Веса перцептрона.
let Weights = null;

// Полученные образы и правильные ответы на них.
let X = [];
let Y = [];

// Максимальное количество циклов обучения.
let Limit = 1000;

// Скорость обучения.
// Подбирается опытным путём.
// Если слишком маленькая то сеть будет долго обучаться,
// и алгоритм градиентного спуска может попасть в локальный минимум,
// (проще говоря, сеть может не обучится, застряв в одной точке).
// Если слишком большая то сеть будет обучаться слишком быстро и
// и может так и не обучиться новому образу и/или забыть старый.
// (может проскочить точку глобального минимума).
let LearningRate = 0.01;

// Обработка сообщений от управляющего скрипта.
onmessage = e => {

  switch (e.data.Command) {
    case Commands.INITIALIZE: {

      // Инициализация весов случайными значениями от 0 до 1.
      Weights = new Matrix({
        rows: e.data.Inputs,
        cols: e.data.Outputs,
        fill: Math.random
      });

      break;
    }
    case Commands.TEST: {

      // Прямое прохождение сигнала.
      // Массив ответов сети по количеству нейронов/классов образов.
      postMessage({
        Command: Commands.TESTRESULT,
        result: multiplyMatrixByMatrix(e.data.X, Weights)
      });

      break;
    }
    case Commands.TRAIN: {

      // Добавить новый образ в обучающий набор.
      X.push(e.data.X);
      Y.push(e.data.Y);

      // Глобальная ошибка, сумма всех локальных ошибок.
      // Её и будем минимизировать, до нуля.
      let globalError = 0;

      // Цикл обучения.
      let trainCycle = 0;

      // Массив индексов примеров, будет перемешиваться в процесе обучения,
      // что бы сеть обучалась на примерах идущих каждый раз в разном порядке.
      let samplePosition = Array(X.length).fill(0).map((_, i) => i);

      // Обучение.
      do {

        trainCycle++;

        // В начале цикла обучения глобальная ошибка равна нулю.
        globalError = 0;

        // Перемешать индексы примеров для обучения.
        samplePosition.sort(() => Math.random() - Math.random());

        // Пройтись по всем образам в обучающем наборе.
        for (let s = 0; s < X.length; s++) {

          // Прямое прохождение сигнала.
          let result = multiplyMatrixByMatrix(X[samplePosition[s]], Weights);

          // Функция активации:
          // если отклик нейрона на образ больше порога активации
          // то нейрон активируется.
          result.data.forEach((e, i) => result.data[i] = e > 0.5 ? 1 : 0);


          // Локальная ошибка, используется для коррекции весов сети.
          let localError = substractMatrixFromMatrix(e.data.Y, result);

          globalError = localError.data.reduce((a, b) => a + Math.abs(b), 0);


          // Настройка весов.
          // К каждому весовому коэффиценту прибавляется 
          // соответствущий элемент входного образа
          // умноженный на локальную ошибку сети и
          // умноженный на скорость обучения.
          Weights =
            appendMatrixToMatrix(
              Weights,
              multiplyMatrixByNumber(
                multiplyMatrixByMatrix(
                  e.data.X,
                  localError,
                  true
                ),
                LearningRate
              )
            );
        }


        postMessage({
          Command: Commands.TRAINCYCLE,
          globalError: globalError,
          cycle: trainCycle
        });

        // Выполнять обучение до тех пор пока сеть не будет ошибаться,
        // или не выйдет за лимит обучения.
      } while (globalError > 0 && trainCycle < Limit);


      if (trainCycle === Limit) {
        // Сеть не обучилась новому образу.

        postMessage({
          Command: Commands.TRAINRESULT,
          result: false
        });

        // Удалить конфликтный образ из набора.
        X.pop();
        Y.pop();
      } else {
        // Сеть обучилась новому образу.

        postMessage({
          Command: Commands.TRAINRESULT,
          result: true,
          cyclesCount: trainCycle,
          samplesCount: X.length
        });
      }

      break;
    }
  }
};
