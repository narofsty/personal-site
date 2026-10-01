---
title: JavaScript 里的函数与箭头函数
date: 2026-09-24
tags: [JavaScript, 前端]
summary: 整理普通函数和箭头函数到底差在哪：this、arguments、能不能当构造函数，以及什么时候不该用箭头函数。
---

> **这是一篇示例文章**，用来演示排版效果（标题锚点、代码高亮、表格、引用）。你可以直接改这个文件的内容，或者删掉它写自己的。

学到第 10 章 Functions 的时候，箭头函数和普通函数的区别一直让我有点糊。这篇把它整理清楚。

## 一、最直观的区别：写法

```js
// 普通函数声明
function add(a, b) {
  return a + b;
}

// 函数表达式
const add2 = function (a, b) {
  return a + b;
};

// 箭头函数
const add3 = (a, b) => a + b;
```

箭头函数省掉的是 `function` 关键字和大括号，但**真正重要的区别不在写法上**。

## 二、四点和普通函数不同

### 1. this 的指向

箭头函数**没有自己的 this**，它会捕获定义时外层作用域的 this：

```js
const timer = {
  seconds: 0,
  start() {
    // 普通函数里的 this 会指向调用者，这里会出错
    // 箭头函数则沿用 start() 的 this，也就是 timer 本身
    setInterval(() => {
      this.seconds++;
      console.log(this.seconds);
    }, 1000);
  },
};

timer.start();
```

这是箭头函数最实用的一点：**回调函数里不用再写 `const self = this`**。

### 2. 没有 arguments 对象

```js
function normal() {
  console.log(arguments); // 能拿到实参列表
}

const arrow = () => {
  // console.log(arguments); // ReferenceError
};
```

箭头函数里要用剩余参数代替：`(...args) => {}`。

### 3. 不能当构造函数

```js
const Person = (name) => {
  this.name = name;
};

// new Person('wxq'); // TypeError: Person is not a constructor
```

### 4. 没有 prototype

箭头函数没有 `prototype` 属性，所以也没法用来做继承。

## 三、对比表

| 特性 | 普通函数 | 箭头函数 |
| --- | --- | --- |
| 自己的 `this` | 有 | 无（继承外层） |
| `arguments` | 有 | 无 |
| 用作构造函数 `new` | 可以 | 不可以 |
| `prototype` | 有 | 无 |
| 适合做回调 | 一般 | **推荐** |

## 四、什么时候不该用箭头函数

1. **对象的方法**——`this` 会指向外层而不是对象本身
2. **需要 `arguments` 的时候**
3. **需要 `new` 的时候**
4. **事件处理里需要 `this` 指向被点击元素的时候**

```js
const counter = {
  count: 0,
  // ❌ 这里用箭头函数，this 不会指向 counter
  // increment: () => { this.count++ },

  // ✅ 用普通函数
  increment() {
    this.count++;
  },
};
```

## 五、小结

一句话记住：**箭头函数是"没有自己身份的轻量函数"**——它不绑定自己的 this，不能 new，也不该用来当对象方法。其余场景，尤其是回调，优先用箭头函数。

## 参考

- [MDN: 箭头函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- 课程第 10 章 Functions
