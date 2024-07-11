import App from './App.svelte';

const app = new App({
	target: document.body, // 要把组件渲染在哪一个 DOM 元素
	// props: { // 指定 App 组件中的属性值
	// 	name: 'world'
	// }
});

export default app;