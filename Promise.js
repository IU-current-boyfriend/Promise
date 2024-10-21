/**
 * 三个状态： pending  rejected  fulilled
 */

const PROMISE_STATUS_PENDING = "pending";
const PROMISE_STATUS_FULILLED = "fulilled";
const PROMISE_STATUS_REJECTED = "rejected";

class MyPromise {
  constructor(executor) {
    // 默认的状态 pending状态
    this.status = PROMISE_STATUS_PENDING;

    // value和reason变量
    this.value = undefined;
    this.reason = undefined;

    // onFulfilled回调函数
    this.onFulfilled = null;
    // onRejected回调函数
    this.onRejected = null;

    // 队列的形式
    this.onFulfilledFns = [];
    this.onRejectedFns = [];

    // resolve回调函数
    const resolve = (value) => {
      if (this.status === PROMISE_STATUS_PENDING) {
        // value.[[__proto__]] = MyPromise.prototype
        if (value instanceof MyPromise) {
          value.then(resolve, reject);
          return;
        }

        if (
          value !== null &&
          (typeof value === "object" || typeof value === "function")
        ) {
          let then;
          try {
            then = value.then;
          } catch (err) {
            reject(err);
            return;
          }

          if (typeof then === "function") {
            let called = false;
            try {
              then.call(
                value,
                (y) => {
                  if (called) return;
                  called = true;
                  resolve(y);
                },
                (r) => {
                  if (called) return;
                  called = true;
                  reject(r);
                }
              );
            } catch (error) {
              if (called) return;
              called = true;
              reject(error);
            }
          }
          return;
        }

        // 执行顺序,executor优先于then方法
        window.queueMicrotask(() => {
          // 如果状态固定,就无须执行
          if (this.status !== PROMISE_STATUS_PENDING) return;
          this.status = PROMISE_STATUS_FULILLED;
          this.value = value;
          this.onFulfilledFns.forEach((fn) => fn(this.value));
        });
        // this.onFulfilled(this.value);
      }
    };
    // rejected回调函数
    const reject = (reason) => {
      if (this.status === PROMISE_STATUS_PENDING) {
        // 执行顺序,executor优先于then方法
        window.queueMicrotask(() => {
          // 如果状态固定,就无须执行
          if (this.status !== PROMISE_STATUS_PENDING) return;
          this.status = PROMISE_STATUS_REJECTED;
          this.reason = reason;
          this.onRejectedFns.forEach((fn) => fn(this.reason));
        });
        // this.onRejected(this.reason);
      }
    };
    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      if (this.status === PROMISE_STATUS_FULILLED && onFulfilled)
        execFunctionWithCatchError(onFulfilled, this.value, resolve, reject);

      if (this.status === PROMISE_STATUS_REJECTED && onRejected)
        execFunctionWithCatchError(onRejected, this.reason, resolve, reject);

      if (this.status === PROMISE_STATUS_PENDING) {
        // 处理then方法中onFulfilled、onRejected回调函数是undefined的问题
        // 如果是undefined的话，需要把它延续下去
        const defaultRejected = (err) => {
          throw err;
        };
        const defaultFulfilled = (val) => val;

        onFulfilled = onFulfilled || defaultFulfilled;
        onRejected = onRejected || defaultRejected;

        onFulfilled &&
          this.onFulfilledFns.push(() => {
            execFunctionWithCatchError(
              onFulfilled,
              this.value,
              resolve,
              reject
            );
          });
        onRejected &&
          this.onRejectedFns.push(() =>
            execFunctionWithCatchError(onRejected, this.reason, resolve, reject)
          );
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally) {
    return this.then(
      (val) => {
        onFinally();
        return val;
      },
      () => {
        onFinally();
      }
    );
  }

  // 类的静态方法
  static resolve(val) {
    return new MyPromise((resolve) => resolve(val));
  }

  static reject(reason) {
    return new MyPromise((undefined, reject) => reject(reason));
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      // promises如果不是可迭代对象或者字符串的情况下,抛出异常
      if (!promises[Symbol.iterator])
        throw new TypeError(
          `${typeof promises} ${promises} is iterable (cannot read property Symbol(Symbol.iterator)) `
        );
      // 需要返回的结果数组
      const values = [];

      // 是否读取完毕
      let lock = false;

      promises.forEach((p, index) => {
        // 有可能p不是promise对象，所以你就不能通过Promise.then()去获取promise携带的值
        // 如果p不是promise对象
        MyPromise.resolve(p)
          .then((res) => {
            if (promises.length - 1 === index) lock = true;
            values[index] = res;
            lock && resolve(values);
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  static allSettled(promises) {
    return new Promise((resolve, reject) => {
      if (!promises[Symbol.iterator])
        throw new TypeError(
          `${typeof promises} ${promises} is iterator (cannot read property Symbol(Symbol.iterator))`
        );

      const values = [];
      // 是否读取完毕
      let lock = false;
      promises.forEach((p, index) => {
        // 有可能p不是promise对象，所以你就不能通过Promise.then()去获取promise携带的值
        // 如果p不是promise对象
        MyPromise.resolve(p)
          .then((res) => {
            if (promises.length - 1 === index) lock = true;
            values[index] = {
              status: p.status,
              value: p.value,
            };
            lock && resolve(values);
          })
          .catch((err) => {
            values[index] = {
              status: p.status,
              reason: p.reason,
            };
            lock && reject(err);
          });
      });
    });
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      // promises如果不是可迭代对象或者字符串的情况下,抛出异常
      if (!promises[Symbol.iterator])
        throw new TypeError(
          `${typeof promises} ${promises} is iterable (cannot read property Symbol(Symbol.iterator)) `
        );
      promises.forEach((p) => {
        MyPromise.resolve(p)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  static any(promises) {
    return new Promise((resolve, reject) => {
      if (!promises[Symbol.iterator])
        throw new TypeError(
          `${typeof promises} ${promises} is iterable (cannot read property Symbol(Symbol.iterator)) `
        );

      // 是否读取完毕
      let lock = false;

      promises.forEach((p, index) => {
        MyPromise.resolve(p)
          .then((res) => {
            resolve(res);
          })
          .catch(() => {
            if (promises.length - 1 === index) lock = true;
            lock && reject(`AggregateError: All promises were rejected`);
          });
      });
    });
  }
}

function execFunctionWithCatchError(execFn, value, resolve, reject) {
  try {
    resolve(execFn(value));
  } catch (err) {
    reject(err);
  }
}

export default MyPromise;
