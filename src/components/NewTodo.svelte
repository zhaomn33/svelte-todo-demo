<script>
  import { selectOnFocus } from "../actions.js";
  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  export let autofocus = false;

  let name = '';
  let nameEl; // 对 name 输入框 DOM 节点的引用

  // if (autofocus) nameEl.focus();

  const addTodo = () => {
    dispatch('addTodo', name);
    name = '';
    nameEl.focus(); // 聚焦 name 输入框
  }

  const onCancel = () => {
    name = '';
    nameEl.focus(); // 聚焦 name 输入框
  }

  console.log("initializing:", nameEl);
  onMount(() => {
    // console.log("mounted:", nameEl);
    autofocus && nameEl.focus() // 如果 autofocus 为 true，则运行 nameEl.focus()
  });
</script>

<form 
  on:submit|preventDefault={addTodo} 
  on:keydown={(e) => e.key === 'Escape' && onCancel()}
>
  <h2 class="label-wrapper">
    <label 
      for="todo-0" 
      class="label__lg"
    >
      What needs to be done?
    </label>
  </h2>
  <input
    bind:value={name}
    bind:this={nameEl}
    use:selectOnFocus
    type="text" 
    id="todo-0" 
    autoComplete="off" 
    class="input input__lg" 
  />
  <button 
    type="submit" 
    disabled={!name} 
    class="btn btn__primary btn__lg"
  >
    Add
  </button>
</form>
