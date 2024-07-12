import { writable } from "svelte/store";
import { localStore } from "./localStore.js";
import type { TodoType } from "./types/todo.type";

export const alert = writable("Welcome to the to-do list app!");
// export const todos = writable([]);

const initialTodos: TodoType[] = [
  { id: 1, name: "Visit MDN web docs", completed: true },
  { id: 2, name: "Complete the Svelte Tutorial", completed: false },
];

export const todos = localStore<TodoType[]>("mdn-svelte-todo", initialTodos);