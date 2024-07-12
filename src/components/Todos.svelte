
<!-- <script lang="ts"> -->
<script>
  import FilterButton from "./FilterButton.svelte";
  import Todo from "./Todo.svelte";
  import MoreActions from "./MoreActions.svelte";
  import NewTodo from "./NewTodo.svelte";
  import TodosStatus from "./TodosStatus.svelte";
  import { alert } from "../stores.js";

  export let todos = [];
  let newTodoName = "";
  let newTodoId;
  let todosStatus; // 对 TodosStatus 实例的引用

  $: newTodoId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
  // $: {
  //   if (totalTodos === 0) {
  //     newTodoId = 1;
  //   } else {
  //     newTodoId = Math.max(...todos.map((t) => t.id)) + 1;
  //   }
  // }
  // $: totalTodos = todos.length;
  // $: completedTodos = todos.filter((todo) => todo.completed).length;

  let filter = "all";
  $: {
    if (filter === "all") {
      $alert = "Browsing all to-dos";
    } else if (filter === "active") {
      $alert = "Browsing active to-dos";
    } else if (filter === "completed") {
      $alert = "Browsing completed to-dos";
    }
  }
  const filterTodos = (filter, todos) =>
    filter === "active"
      ? todos.filter((t) => !t.completed)
      : filter === "completed"
        ? todos.filter((t) => t.completed)
        : todos;

  function addTodo(name) {
    todos = [...todos, { id: newTodoId, name, completed: false }];
    $alert = `Todo '${name}' has been added`;
  }

  function removeTodo(todo) {
    todos = todos.filter((t) => t.id !== todo.id);
    todosStatus.focus(); // 将焦点放在状态标题上
    $alert = `Todo '${todo.name}' has been deleted`;
  }

  function updateTodo(todo) {
    const i = todos.findIndex((t) => t.id === todo.id);
    if (todos[i].name !== todo.name)
      $alert = `todo '${todos[i].name}' has been renamed to '${todo.name}'`;
    if (todos[i].completed !== todo.completed)
      $alert = `todo '${todos[i].name}' marked as ${
        todo.completed ? "completed" : "active"
      }`;
    todos[i] = { ...todos[i], ...todo };
  }

  const checkAllTodos = (completed) =>{
    // todos.forEach((t) => (t.completed = completed));
    // console.log("todos", todos);
    // 将新数组赋值 促使todos更新
    todos = todos.map((t) => ({ ...t, completed }));
    $alert = `${completed ? "Checked" : "Unchecked"} ${todos.length} to-dos`;
  }

  const removeCompletedTodos = () =>{
    $alert = `Removed ${todos.filter((t) => t.completed).length} to-dos`;
    todos = todos.filter((t) => !t.completed);
  }
</script>

<!-- Todos.svelte -->
<div class="todoapp stack-large">
  <!-- 新待办 -->
  <NewTodo autofocus on:addTodo={(e) => addTodo(e.detail)} />

  <!-- 过滤器 -->
  <FilterButton bind:filter={filter} />
  <!-- <FilterButton {filter} onclick={ (clicked) => filter = clicked }/> -->

  <!-- 待办状态 -->
  <TodosStatus bind:this={todosStatus} {todos} />

  <!-- 待办 -->
  <ul role="list" class="todo-list stack-large" aria-labelledby="list-heading">
    {#each filterTodos(filter, todos) as todo (todo.id)}
      <li class="todo">
        <!-- e 参数（事件对象）在 detail 属性中保存了要删除的待办事项 -->
        <Todo {todo} on:update={(e) => updateTodo(e.detail)} on:remove={(e) => removeTodo(e.detail)}/>
      </li>
    {:else}
      <li>Nothing to do here!</li>
    {/each}
  </ul>

  <hr />

  <!-- <Todo todo={ { name: 'a new task with no id!', completed: false } } /> -->

  <!-- 更多操作 -->
  <MoreActions
    {todos}
    on:checkAll={(e) => checkAllTodos(e.detail)}
    on:removeCompleted={removeCompletedTodos}
  />
</div>