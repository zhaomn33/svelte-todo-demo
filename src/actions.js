export function selectOnFocus(node) {
  if (node && typeof node.select === "function") {
    // 确保 node 已定义并具有 select() 方法
    const onFocus = (event) => node.select(); // 事件处理器
    node.addEventListener("focus", onFocus); // 当 node 获得焦点时调用 onFocus()
    return {
      destroy: () => node.removeEventListener("focus", onFocus), // 当节点从 DOM 中移除时执行此操作
    };
  }
}