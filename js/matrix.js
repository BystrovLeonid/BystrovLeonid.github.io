'use strict';

class Matrix {
  constructor({ rows, cols, data, fill }) {

    this.rows = +rows > 0 ? +rows : 0;
    this.cols = +cols > 0 ? +cols : 0;

    if (typeof fill === 'function') {
      this.data =
        data ?
          data : new Array(rows * cols).fill(0).map(() => fill());
    } else if (typeof fill === 'number') {
      this.data =
        data ?
          data : new Array(rows * cols).fill(fill);
    } else {
      this.data =
        data ?
          data : new Array(rows * cols).fill(0);
    }
  }
}

function substractMatrixFromMatrix(A, B) {

  if (A.rows !== B.rows || A.cols !== B.cols) {
    return;
  }

  let Result = new Matrix({ rows: A.rows, cols: A.cols });

  Result.data.forEach((_, i) => Result.data[i] = A.data[i] - B.data[i]);

  return Result;
}

function appendMatrixToMatrix(A, B) {

  if (A.rows !== B.rows || A.cols !== B.cols) {
    return;
  }

  let Result = new Matrix({ rows: A.rows, cols: A.cols });

  Result.data.forEach((_, i) => Result.data[i] = A.data[i] + B.data[i]);

  return Result;
}

function multiplyMatrixByNumber(A, N) {

  let Result = new Matrix({ rows: A.rows, cols: A.cols });

  Result.data.forEach((_, i) => Result.data[i] = A.data[i] * N);

  return Result;
}

function multiplyMatrixByMatrix(
  A, B,
  ATranspose = false,
  BTranspose = false) {

  if (ATranspose && BTranspose) {

    if (A.rows !== B.cols) {
      return;
    }

    let Result = new Matrix({ rows: A.cols, cols: B.rows });

    for (let i = 0, r = 0; i < A.cols; i++) {
      for (let j = 0; j < B.rows; j++, r++) {
        for (let k = 0; k < A.rows; k++) {
          Result.data[r] += A.data[k * A.cols + i] * B.data[k + B.cols * j];
        }
      }
    }

    return Result;

  } else if (BTranspose) {

    if (A.cols !== B.cols) {
      return;
    }

    let Result = new Matrix({ rows: A.rows, cols: B.rows });

    for (let i = 0, r = 0; i < A.rows; i++) {
      for (let j = 0; j < B.rows; j++, r++) {
        for (let k = 0; k < A.cols; k++) {
          Result.data[r] += A.data[k + A.cols * i] * B.data[k + B.cols * j];
        }
      }
    }

    return Result;

  } else if (ATranspose) {

    if (A.rows !== B.rows) {
      return;
    }

    let Result = new Matrix({ rows: A.cols, cols: B.cols });

    for (let i = 0, r = 0; i < A.cols; i++) {
      for (let j = 0; j < B.cols; j++, r++) {
        for (let k = 0; k < A.rows; k++) {
          Result.data[r] += A.data[k * A.cols + i] * B.data[k * B.cols + j];
        }
      }
    }

    return Result;

  } else {

    if (A.cols !== B.rows) {
      return;
    }

    let Result = new Matrix({ rows: A.rows, cols: B.cols });

    for (let i = 0, r = 0; i < A.rows; i++) {
      for (let j = 0; j < B.cols; j++, r++) {
        for (let k = 0; k < A.cols; k++) {
          Result.data[r] += A.data[k + A.cols * i] * B.data[k * B.cols + j];
        }
      }
    }

    return Result;
  }
}
