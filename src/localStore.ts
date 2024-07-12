import { writable } from "svelte/store";

import type { JsonValue } from "./types/json.type";

export const localStore = <T extends JsonValue>(key: string, initial: T) => {
  // 接收本地存储的键和初始值

  // Web 存储只支持保存字符串值
  const toString = (value: T) => JSON.stringify(value, null, 2); // 辅助函数
  const toObj = JSON.parse; // 辅助函数

  if (localStorage.getItem(key) === null) {
    // 本地存储中不存在该项
    localStorage.setItem(key, toString(initial)); // 使用初始值初始化本地存储
  }

  const saved = toObj(localStorage.getItem(key)); // 转换为对象

  const { subscribe, set, update } = writable<T>(saved); // 创建底层的可写 store

  return {
    subscribe,
    set: (value: T) => {
      localStorage.setItem(key, toString(value)); // 也将值以字符串形式保存到本地存储
      return set(value);
    },
    update,
  };
};