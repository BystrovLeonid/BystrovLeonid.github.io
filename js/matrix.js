'use strict';

class Matrix {
  constructor(cols, rows, data) {
    this.cols = cols;
    this.rows = rows;
    this.data = data ? data : new Array(cols * rows).fill(0);
  }
}

function multiplyMatrixByNumber(A, N) {
  A.data.forEach((e, i) => A.data[i] = e * N);
}

function multiplyMatrixByMatrix(
  A, B,
  ATranspose = false,
  BTranspose = false) {

  if (ATranspose && BTranspose) {

    if (A.rows !== B.cols) {
      return;
    }

    let Result = new Matrix(A.cols, B.rows);

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

    let Result = new Matrix(A.rows, B.rows);

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

    let Result = new Matrix(A.cols, B.cols);

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

    let Result = new Matrix(A.rows, B.cols);

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
