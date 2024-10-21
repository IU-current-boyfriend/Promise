import Promise from "./Promise.js";

//情况1
// const p = new Promise((resolve, reject) => {
//   // resolve("resolve");
//   // resolve({
//   //   then(onFulfilled, onRejected) {
//   //     onFulfilled(1000);
//   //   },
//   // });
//   function fn() {}
//   // Function.prototype.then = function (onFulfilled) {
//   //   // console.log("1");
//   //   onFulfilled(10000);
//   // };
//   fn.then = function (onFulfilled) {
//     onFulfilled(10000);
//   };
//   resolve(fn);
// });

// p.then(
//   (res) => {
//     console.log("res: =>", res);
//   },
//   (err) => {
//     console.log("err :=>", err);
//   }
// );

// const p = new Promise((resolve, reject) => {
//   // reject("我是抛出的异常信息");
//   resolve(1000);
// });

// onFulfilled、onRejected函数是undefined的时候，then方法没有任何处理

// 如何延续下去？将错误
// p.catch().catch((err) => {
//   console.log("err: =>", err);
// });

// p.finally(() => 77).then((res) => {
//   console.log("res: =>", res);
// });
// p.finally(() => {
//   throw new Error("错误...");
// }).catch((err) => {
//   console.log("err: =>", err);
// });

// p.then((res) => {
//   console.log("res1:", res);
//   return "aaa";
// })
//   .then((res) => {
//     console.log("res2", res);
//     return res;
//   })
//   .catch((err) => {
//     console.log("err:", err);
//   })
//   .finally(() => {
//     console.log("finally");
//   });

// // .catch((err) => {
//   console.log("err:", err);
// })
/**
 * 1. finally : 首先回调函数没有提供参数
 * 2. finally：
 *    返回值的问题：
 *      成功状态，延续value值
 *      内部存在异常，则提供延续异常
 *
 *
 */

// p.then().then((res) => {
//   console.log("res: =>", res);
// });

// 手写catch方法、并且处理then方法中onFulfilled、onRejected函数返回值
// 是Promise对象的情况

// Promise.resolve(100).then((res) => {
//   console.log("res: =>", res);
// });

// Promise.reject("oh...err").catch((err) => {
//   console.log("err: =>", err);
// });

//测试数据
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1111);
    // reject(111);
  }, 1000);
});
const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(2222);
    // resolve(22222);
  }, 2000);
});
const p3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    // resolve(3333);
    reject(3333);
  }, 3000);
});
// p2触发reject，则直接返回p2对应的reject内容
Promise.any([p1, p2, p3])
  .then((value) => {
    console.log("value:", value);
  })
  .catch((err) => console.log("err:", err));

// Promise.all([p1, p2, p3]).then((res) => {
//   console.log("then: =>", res);
// });
