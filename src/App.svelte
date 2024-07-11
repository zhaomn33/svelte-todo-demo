<!-- 使 Todos 组件能够将更新后的待办事项返回给其父组件 -->
<!-- <Todos bind:todos /> -->

<Alert />
<Todos bind:todos={$todos} />

<script lang="ts">
  import Todos from "./components/Todos.svelte";
  import Alert from "./components/Alert.svelte";
  import { todos } from "./stores.js";

	// let todos = [
  // $todos = [
  //   { id: 1, name: "Create a Svelte starter app", completed: true },
  //   { id: 2, name: "Create your first component", completed: true },
  //   { id: 3, name: "Complete the rest of the tutorial", completed: false }
  // ];
  // console.log("todos store - todos:", todos);
  // console.log("todos store content - $todos:", $todos);
</script>

