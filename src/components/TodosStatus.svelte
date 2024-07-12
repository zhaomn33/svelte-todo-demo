<script lang="ts">
  import type { TodoType } from "../types/todo.type";

  export let todos: TodoType[];
  let completedTodos: number;

  $: totalTodos = todos.length;
  $: completedTodos = todos.filter((todo: TodoType) => todo.completed).length;

  let headingEl: HTMLElement;

  export function focus() {
    // 简写版本: export const focus = () => headingEl.focus()
    headingEl.focus();
  }
</script>

<!-- 使用 bind:this={headingEl} 指令可以将 DOM 节点的引用存储在变量 headingEl 中 -->
<h2 id="list-heading" bind:this={headingEl} tabindex={-1}>
  {completedTodos} out of {totalTodos} items completed
</h2>