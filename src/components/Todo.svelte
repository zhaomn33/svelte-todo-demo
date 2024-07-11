<script>
  import { selectOnFocus } from "../actions.js";
  import { createEventDispatcher, tick } from "svelte";
  const dispatch = createEventDispatcher();
  
  export let todo

  let editing = false; // 跟踪编辑模式
  let name = todo.name; // 存储被编辑的待办事项名称
  let nameEl; // 对 name 输入框 DOM 节点的引用
  let editButtonPressed = false; // 跟踪编辑按钮是否已按下，以便在取消或保存后将焦点放在它上面

  function update(updatedTodo) {
    todo = { ...todo, ...updatedTodo }; // 将修改应用于待办事项
    dispatch("update", todo); // 发出更新事件 (更新父组件)
  }

  function onCancel() {
    name = todo.name; // 将名称恢复为初始值，并
    editing = false; // 退出编辑模式
  }

  function onSave() {
    update({ name }); // 更新待办事项名称
    editing = false; // 退出编辑模式
  }

  function onRemove() {
    dispatch("remove", todo); // 发出删除事件
  }

  async function onEdit() {
    editButtonPressed = true; // 用户按下了编辑按钮，焦点将返回到编辑按钮
    editing = true; // 进入编辑模式

    // await tick(); // 在任何待处理的状态更改应用到 DOM 后解析
    // nameEl.focus(); // 将焦点设置到 name 输入框（Svelte 还没有更新 DOM）

    // setTimeout(() => nameEl.focus(), 0); // 异步调用，将焦点设置到 name 输入框
  }
  const focusOnInit = (node) =>
    node && typeof node.focus === "function" && node.focus();

  const focusEditButton = (node) => editButtonPressed && node.focus();

  function onToggle() {
    update({ completed: !todo.completed }); // 更新待办事项状态
  }

</script>

<div class="stack-small">
  {#if editing}
    <!-- 用于编辑待办事项的标记：标签、输入文本、取消和保存按钮 -->
    <form on:submit|preventDefault={onSave} class="stack-small" on:keydown={(e) => e.key === 'Escape' && onCancel()}>
      <div class="form-group">
        <label for="todo-{todo.id}" class="todo-label">New name for '{todo.name}'</label>
        <input
          bind:value={name}
          use:selectOnFocus
          use:focusOnInit
          type="text"
          id="todo-{todo.id}"
          autocomplete="off"
          class="todo-text" 
        />
        <!-- bind:this={nameEl} -->
      </div>
      <div class="btn-group">
        <button class="btn todo-cancel" on:click={onCancel} type="button">
          Cancel<span class="visually-hidden">renaming {todo.name}</span>
          </button>
        <button class="btn btn__primary todo-edit" type="submit" disabled={!name}>
          Save<span class="visually-hidden">new name for {todo.name}</span>
        </button>
      </div>
    </form>
  {:else}
    <!-- 用于显示待办事项的标记：复选框、标签、编辑和删除按钮 -->
    <div class="c-cb">
      <input type="checkbox" id="todo-{todo.id}"
        on:click={onToggle} checked={todo.completed}
      >
      <label for="todo-{todo.id}" class="todo-label">{todo.name}</label>
    </div>
    <div class="btn-group">
      <button type="button" class="btn" on:click={onEdit} use:focusEditButton>
        Edit<span class="visually-hidden"> {todo.name}</span>
      </button>
      <button type="button" class="btn btn__danger" on:click={onRemove}>
        Delete<span class="visually-hidden"> {todo.name}</span>
      </button>
    </div>
  {/if}
</div>