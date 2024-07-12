
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function split_css_unit(value) {
        const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
        return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config(options);
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/FilterButton.svelte generated by Svelte v3.59.2 */

    const file$6 = "src/components/FilterButton.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let button0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let button0_aria_pressed_value;
    	let t5;
    	let button1;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let span5;
    	let button1_aria_pressed_value;
    	let t11;
    	let button2;
    	let span6;
    	let t13;
    	let span7;
    	let t15;
    	let span8;
    	let button2_aria_pressed_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "Show";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "All";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "tasks";
    			t5 = space();
    			button1 = element("button");
    			span3 = element("span");
    			span3.textContent = "Show";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "Active";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "tasks";
    			t11 = space();
    			button2 = element("button");
    			span6 = element("span");
    			span6.textContent = "Show";
    			t13 = space();
    			span7 = element("span");
    			span7.textContent = "Completed";
    			t15 = space();
    			span8 = element("span");
    			span8.textContent = "tasks";
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$6, 7, 4, 309);
    			add_location(span1, file$6, 8, 4, 355);
    			attr_dev(span2, "class", "visually-hidden");
    			add_location(span2, file$6, 9, 4, 376);
    			attr_dev(button0, "class", "btn toggle-btn");
    			attr_dev(button0, "aria-pressed", button0_aria_pressed_value = /*filter*/ ctx[0] === 'all');
    			toggle_class(button0, "btn__primary", /*filter*/ ctx[0] === 'all');
    			add_location(button0, file$6, 6, 2, 170);
    			attr_dev(span3, "class", "visually-hidden");
    			add_location(span3, file$6, 12, 4, 581);
    			add_location(span4, file$6, 13, 4, 627);
    			attr_dev(span5, "class", "visually-hidden");
    			add_location(span5, file$6, 14, 4, 651);
    			attr_dev(button1, "class", "btn toggle-btn");
    			attr_dev(button1, "aria-pressed", button1_aria_pressed_value = /*filter*/ ctx[0] === 'active');
    			toggle_class(button1, "btn__primary", /*filter*/ ctx[0] === 'active');
    			add_location(button1, file$6, 11, 2, 433);
    			attr_dev(span6, "class", "visually-hidden");
    			add_location(span6, file$6, 17, 4, 865);
    			add_location(span7, file$6, 18, 4, 911);
    			attr_dev(span8, "class", "visually-hidden");
    			add_location(span8, file$6, 19, 4, 938);
    			attr_dev(button2, "class", "btn toggle-btn");
    			attr_dev(button2, "aria-pressed", button2_aria_pressed_value = /*filter*/ ctx[0] === 'completed');
    			toggle_class(button2, "btn__primary", /*filter*/ ctx[0] === 'completed');
    			add_location(button2, file$6, 16, 2, 708);
    			attr_dev(div, "class", "filters btn-group stack-exception");
    			add_location(div, file$6, 5, 0, 120);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(button0, t1);
    			append_dev(button0, span1);
    			append_dev(button0, t3);
    			append_dev(button0, span2);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, span3);
    			append_dev(button1, t7);
    			append_dev(button1, span4);
    			append_dev(button1, t9);
    			append_dev(button1, span5);
    			append_dev(div, t11);
    			append_dev(div, button2);
    			append_dev(button2, span6);
    			append_dev(button2, t13);
    			append_dev(button2, span7);
    			append_dev(button2, t15);
    			append_dev(button2, span8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 1 && button0_aria_pressed_value !== (button0_aria_pressed_value = /*filter*/ ctx[0] === 'all')) {
    				attr_dev(button0, "aria-pressed", button0_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 1) {
    				toggle_class(button0, "btn__primary", /*filter*/ ctx[0] === 'all');
    			}

    			if (dirty & /*filter*/ 1 && button1_aria_pressed_value !== (button1_aria_pressed_value = /*filter*/ ctx[0] === 'active')) {
    				attr_dev(button1, "aria-pressed", button1_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 1) {
    				toggle_class(button1, "btn__primary", /*filter*/ ctx[0] === 'active');
    			}

    			if (dirty & /*filter*/ 1 && button2_aria_pressed_value !== (button2_aria_pressed_value = /*filter*/ ctx[0] === 'completed')) {
    				attr_dev(button2, "aria-pressed", button2_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 1) {
    				toggle_class(button2, "btn__primary", /*filter*/ ctx[0] === 'completed');
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FilterButton', slots, []);
    	let { filter = 'all' } = $$props;
    	const writable_props = ['filter'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FilterButton> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, filter = 'all');
    	const click_handler_1 = () => $$invalidate(0, filter = 'active');
    	const click_handler_2 = () => $$invalidate(0, filter = 'completed');

    	$$self.$$set = $$props => {
    		if ('filter' in $$props) $$invalidate(0, filter = $$props.filter);
    	};

    	$$self.$capture_state = () => ({ filter });

    	$$self.$inject_state = $$props => {
    		if ('filter' in $$props) $$invalidate(0, filter = $$props.filter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filter, click_handler, click_handler_1, click_handler_2];
    }

    class FilterButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { filter: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FilterButton",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get filter() {
    		throw new Error("<FilterButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filter(value) {
    		throw new Error("<FilterButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function selectOnFocus(node) {
      if (node && typeof node.select === "function") {
        // 确保 node 已定义并具有 select() 方法
        const onFocus = (event) => node.select(); // 事件处理器
        node.addEventListener("focus", onFocus); // 当 node 获得焦点时调用 onFocus()
        return {
          destroy: () => node.removeEventListener("focus", onFocus), // 当节点从 DOM 中移除时执行此操作
        };
      }
    }

    /* src/components/Todo.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$1 } = globals;
    const file$5 = "src/components/Todo.svelte";

    // (64:2) {:else}
    function create_else_block$1(ctx) {
    	let div0;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0;
    	let label;
    	let t1_value = /*todo*/ ctx[0].name + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let div1;
    	let button0;
    	let t3;
    	let span0;
    	let t4_value = /*todo*/ ctx[0].name + "";
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let span1;
    	let t7_value = /*todo*/ ctx[0].name + "";
    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t3 = text("Edit");
    			span0 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Delete");
    			span1 = element("span");
    			t7 = text(t7_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = "todo-" + /*todo*/ ctx[0].id);
    			input.checked = input_checked_value = /*todo*/ ctx[0].completed;
    			add_location(input, file$5, 66, 6, 2353);
    			attr_dev(label, "for", label_for_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(label, "class", "todo-label");
    			add_location(label, file$5, 69, 6, 2463);
    			attr_dev(div0, "class", "c-cb");
    			add_location(div0, file$5, 65, 4, 2328);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$5, 73, 12, 2660);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn");
    			add_location(button0, file$5, 72, 6, 2575);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$5, 76, 14, 2813);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn__danger");
    			add_location(button1, file$5, 75, 6, 2732);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$5, 71, 4, 2545);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, t3);
    			append_dev(button0, span0);
    			append_dev(span0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(button1, t6);
    			append_dev(button1, span1);
    			append_dev(span1, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*onToggle*/ ctx[9], false, false, false, false),
    					listen_dev(button0, "click", /*onEdit*/ ctx[6], false, false, false, false),
    					action_destroyer(/*focusEditButton*/ ctx[8].call(null, button0)),
    					listen_dev(button1, "click", /*onRemove*/ ctx[5], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*todo*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[0].completed)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todo*/ 1 && t1_value !== (t1_value = /*todo*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && t4_value !== (t4_value = /*todo*/ ctx[0].name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*todo*/ 1 && t7_value !== (t7_value = /*todo*/ ctx[0].name + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(64:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:2) {#if editing}
    function create_if_block$1(ctx) {
    	let form;
    	let div0;
    	let label;
    	let t0;
    	let t1_value = /*todo*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let label_for_value;
    	let t3;
    	let input;
    	let input_id_value;
    	let t4;
    	let div1;
    	let button0;
    	let t5;
    	let span0;
    	let t6;
    	let t7_value = /*todo*/ ctx[0].name + "";
    	let t7;
    	let t8;
    	let button1;
    	let t9;
    	let span1;
    	let t10;
    	let t11_value = /*todo*/ ctx[0].name + "";
    	let t11;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			label = element("label");
    			t0 = text("New name for '");
    			t1 = text(t1_value);
    			t2 = text("'");
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t5 = text("Cancel");
    			span0 = element("span");
    			t6 = text("renaming ");
    			t7 = text(t7_value);
    			t8 = space();
    			button1 = element("button");
    			t9 = text("Save");
    			span1 = element("span");
    			t10 = text("new name for ");
    			t11 = text(t11_value);
    			attr_dev(label, "for", label_for_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(label, "class", "todo-label");
    			add_location(label, file$5, 42, 8, 1524);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", input_id_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "todo-text");
    			add_location(input, file$5, 43, 8, 1614);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$5, 41, 6, 1491);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$5, 56, 16, 1994);
    			attr_dev(button0, "class", "btn todo-cancel");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$5, 55, 8, 1911);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$5, 59, 14, 2169);
    			attr_dev(button1, "class", "btn btn__primary todo-edit");
    			attr_dev(button1, "type", "submit");
    			button1.disabled = button1_disabled_value = !/*name*/ ctx[2];
    			add_location(button1, file$5, 58, 8, 2080);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$5, 54, 6, 1879);
    			attr_dev(form, "class", "stack-small");
    			add_location(form, file$5, 40, 4, 1371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			append_dev(div0, label);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*name*/ ctx[2]);
    			append_dev(form, t4);
    			append_dev(form, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t5);
    			append_dev(button0, span0);
    			append_dev(span0, t6);
    			append_dev(span0, t7);
    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			append_dev(button1, t9);
    			append_dev(button1, span1);
    			append_dev(span1, t10);
    			append_dev(span1, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					action_destroyer(selectOnFocus.call(null, input)),
    					action_destroyer(/*focusOnInit*/ ctx[7].call(null, input)),
    					listen_dev(button0, "click", /*onCancel*/ ctx[3], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(/*onSave*/ ctx[4]), false, true, false, false),
    					listen_dev(form, "keydown", /*keydown_handler*/ ctx[11], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todo*/ 1 && t1_value !== (t1_value = /*todo*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*name*/ 4 && input.value !== /*name*/ ctx[2]) {
    				set_input_value(input, /*name*/ ctx[2]);
    			}

    			if (dirty & /*todo*/ 1 && t7_value !== (t7_value = /*todo*/ ctx[0].name + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*todo*/ 1 && t11_value !== (t11_value = /*todo*/ ctx[0].name + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*name*/ 4 && button1_disabled_value !== (button1_disabled_value = !/*name*/ ctx[2])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(39:2) {#if editing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[1]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "stack-small");
    			add_location(div, file$5, 37, 0, 1284);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Todo', slots, []);
    	let { todo } = $$props;
    	const dispatch = createEventDispatcher();
    	let editing = false; // 跟踪编辑模式
    	let name = todo.name; // 存储被编辑的待办事项名称
    	let nameEl; // 对 name 输入框 DOM 节点的引用
    	let editButtonPressed = false; // 跟踪编辑按钮是否已按下，以便在取消或保存后将焦点放在它上面

    	function update(updatedTodo) {
    		$$invalidate(0, todo = Object.assign(Object.assign({}, todo), updatedTodo)); // 将修改应用于待办事项
    		dispatch("update", todo); // 发出更新事件 (更新父组件)
    	}

    	function onCancel() {
    		$$invalidate(2, name = todo.name); // 将名称恢复为初始值，并
    		$$invalidate(1, editing = false); // 退出编辑模式
    	}

    	function onSave() {
    		update({ name }); // 更新待办事项名称
    		$$invalidate(1, editing = false); // 退出编辑模式
    	}

    	function onRemove() {
    		dispatch("remove", todo); // 发出删除事件
    	}

    	async function onEdit() {
    		editButtonPressed = true; // 用户按下了编辑按钮，焦点将返回到编辑按钮
    		$$invalidate(1, editing = true); // 进入编辑模式
    	} // await tick(); // 在任何待处理的状态更改应用到 DOM 后解析
    	// nameEl.focus(); // 将焦点设置到 name 输入框（Svelte 还没有更新 DOM）

    	// setTimeout(() => nameEl.focus(), 0); // 异步调用，将焦点设置到 name 输入框
    	const focusOnInit = node => node && typeof node.focus === "function" && node.focus();

    	const focusEditButton = node => editButtonPressed && node.focus();

    	function onToggle() {
    		update({ completed: !todo.completed }); // 更新待办事项状态
    	}

    	$$self.$$.on_mount.push(function () {
    		if (todo === undefined && !('todo' in $$props || $$self.$$.bound[$$self.$$.props['todo']])) {
    			console.warn("<Todo> was created without expected prop 'todo'");
    		}
    	});

    	const writable_props = ['todo'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	const keydown_handler = e => e.key === 'Escape' && onCancel();

    	$$self.$$set = $$props => {
    		if ('todo' in $$props) $$invalidate(0, todo = $$props.todo);
    	};

    	$$self.$capture_state = () => ({
    		selectOnFocus,
    		createEventDispatcher,
    		tick,
    		todo,
    		dispatch,
    		editing,
    		name,
    		nameEl,
    		editButtonPressed,
    		update,
    		onCancel,
    		onSave,
    		onRemove,
    		onEdit,
    		focusOnInit,
    		focusEditButton,
    		onToggle
    	});

    	$$self.$inject_state = $$props => {
    		if ('todo' in $$props) $$invalidate(0, todo = $$props.todo);
    		if ('editing' in $$props) $$invalidate(1, editing = $$props.editing);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('nameEl' in $$props) nameEl = $$props.nameEl;
    		if ('editButtonPressed' in $$props) editButtonPressed = $$props.editButtonPressed;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todo,
    		editing,
    		name,
    		onCancel,
    		onSave,
    		onRemove,
    		onEdit,
    		focusOnInit,
    		focusEditButton,
    		onToggle,
    		input_input_handler,
    		keydown_handler
    	];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { todo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get todo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/MoreActions.svelte generated by Svelte v3.59.2 */
    const file$4 = "src/components/MoreActions.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let button0;
    	let t0_value = (/*completed*/ ctx[1] ? 'Check' : 'Uncheck') + "";
    	let t0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = text(" all");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("Remove completed");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn__primary");
    			button0.disabled = button0_disabled_value = /*todos*/ ctx[0].length === 0;
    			add_location(button0, file$4, 13, 2, 398);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn__primary");
    			button1.disabled = button1_disabled_value = /*completedTodos*/ ctx[2] === 0;
    			add_location(button1, file$4, 15, 2, 548);
    			attr_dev(div, "class", "btn-group");
    			add_location(div, file$4, 12, 0, 372);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(button0, t1);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*checkAll*/ ctx[3], false, false, false, false),
    					listen_dev(button1, "click", /*removeCompleted*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completed*/ 2 && t0_value !== (t0_value = (/*completed*/ ctx[1] ? 'Check' : 'Uncheck') + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button0_disabled_value !== (button0_disabled_value = /*todos*/ ctx[0].length === 0)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*completedTodos*/ 4 && button1_disabled_value !== (button1_disabled_value = /*completedTodos*/ ctx[2] === 0)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let completedTodos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MoreActions', slots, []);
    	const dispatch = createEventDispatcher();
    	let { todos } = $$props;
    	let completed = true;

    	const checkAll = () => {
    		dispatch('checkAll', completed);
    		$$invalidate(1, completed = !completed);
    	};

    	const removeCompleted = () => dispatch('removeCompleted');

    	$$self.$$.on_mount.push(function () {
    		if (todos === undefined && !('todos' in $$props || $$self.$$.bound[$$self.$$.props['todos']])) {
    			console.warn("<MoreActions> was created without expected prop 'todos'");
    		}
    	});

    	const writable_props = ['todos'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MoreActions> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		todos,
    		completed,
    		checkAll,
    		removeCompleted,
    		completedTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('completed' in $$props) $$invalidate(1, completed = $$props.completed);
    		if ('completedTodos' in $$props) $$invalidate(2, completedTodos = $$props.completedTodos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1) {
    			$$invalidate(2, completedTodos = todos.filter(t => t.completed).length);
    		}
    	};

    	return [todos, completed, completedTodos, checkAll, removeCompleted];
    }

    class MoreActions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { todos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MoreActions",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get todos() {
    		throw new Error("<MoreActions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<MoreActions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/NewTodo.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/NewTodo.svelte";

    function create_fragment$4(ctx) {
    	let form;
    	let h2;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let t3;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			h2 = element("h2");
    			label = element("label");
    			label.textContent = "What needs to be done?";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			t3 = text("Add");
    			attr_dev(label, "for", "todo-0");
    			attr_dev(label, "class", "label__lg");
    			add_location(label, file$3, 35, 4, 806);
    			attr_dev(h2, "class", "label-wrapper");
    			add_location(h2, file$3, 34, 2, 775);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "todo-0");
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "input input__lg");
    			add_location(input, file$3, 42, 2, 916);
    			attr_dev(button, "type", "submit");
    			button.disabled = button_disabled_value = !/*name*/ ctx[0];
    			attr_dev(button, "class", "btn btn__primary btn__lg");
    			add_location(button, file$3, 51, 2, 1084);
    			add_location(form, file$3, 30, 0, 671);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h2);
    			append_dev(h2, label);
    			append_dev(form, t1);
    			append_dev(form, input);
    			set_input_value(input, /*name*/ ctx[0]);
    			/*input_binding*/ ctx[6](input);
    			append_dev(form, t2);
    			append_dev(form, button);
    			append_dev(button, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					action_destroyer(selectOnFocus.call(null, input)),
    					listen_dev(form, "submit", prevent_default(/*addTodo*/ ctx[2]), false, true, false, false),
    					listen_dev(form, "keydown", /*keydown_handler*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input.value !== /*name*/ ctx[0]) {
    				set_input_value(input, /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && button_disabled_value !== (button_disabled_value = !/*name*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			/*input_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NewTodo', slots, []);
    	const dispatch = createEventDispatcher();
    	let { autofocus = false } = $$props;
    	let name = '';
    	let nameEl; // 对 name 输入框 DOM 节点的引用

    	// if (autofocus) nameEl.focus();
    	const addTodo = () => {
    		dispatch('addTodo', name);
    		$$invalidate(0, name = '');
    		nameEl.focus(); // 聚焦 name 输入框
    	};

    	const onCancel = () => {
    		$$invalidate(0, name = '');
    		nameEl.focus(); // 聚焦 name 输入框
    	};

    	console.log("initializing:", nameEl);

    	onMount(() => {
    		// console.log("mounted:", nameEl);
    		autofocus && nameEl.focus(); // 如果 autofocus 为 true，则运行 nameEl.focus()
    	});

    	const writable_props = ['autofocus'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<NewTodo> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			nameEl = $$value;
    			$$invalidate(1, nameEl);
    		});
    	}

    	const keydown_handler = e => e.key === 'Escape' && onCancel();

    	$$self.$$set = $$props => {
    		if ('autofocus' in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    	};

    	$$self.$capture_state = () => ({
    		selectOnFocus,
    		createEventDispatcher,
    		onMount,
    		dispatch,
    		autofocus,
    		name,
    		nameEl,
    		addTodo,
    		onCancel
    	});

    	$$self.$inject_state = $$props => {
    		if ('autofocus' in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('nameEl' in $$props) $$invalidate(1, nameEl = $$props.nameEl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		nameEl,
    		addTodo,
    		onCancel,
    		autofocus,
    		input_input_handler,
    		input_binding,
    		keydown_handler
    	];
    }

    class NewTodo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { autofocus: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewTodo",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get autofocus() {
    		throw new Error("<NewTodo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<NewTodo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TodosStatus.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/components/TodosStatus.svelte";

    function create_fragment$3(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(/*completedTodos*/ ctx[0]);
    			t1 = text(" out of ");
    			t2 = text(/*totalTodos*/ ctx[2]);
    			t3 = text(" items completed");
    			attr_dev(h2, "id", "list-heading");
    			attr_dev(h2, "tabindex", "-1");
    			add_location(h2, file$2, 12, 0, 355);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			/*h2_binding*/ ctx[5](h2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completedTodos*/ 1) set_data_dev(t0, /*completedTodos*/ ctx[0]);
    			if (dirty & /*totalTodos*/ 4) set_data_dev(t2, /*totalTodos*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			/*h2_binding*/ ctx[5](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let totalTodos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TodosStatus', slots, []);
    	let { todos } = $$props;
    	let completedTodos;
    	let headingEl;

    	function focus() {
    		// 简写版本: export const focus = () => headingEl.focus()
    		headingEl.focus();
    	}

    	$$self.$$.on_mount.push(function () {
    		if (todos === undefined && !('todos' in $$props || $$self.$$.bound[$$self.$$.props['todos']])) {
    			console.warn("<TodosStatus> was created without expected prop 'todos'");
    		}
    	});

    	const writable_props = ['todos'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TodosStatus> was created with unknown prop '${key}'`);
    	});

    	function h2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			headingEl = $$value;
    			$$invalidate(1, headingEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('todos' in $$props) $$invalidate(3, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		todos,
    		completedTodos,
    		headingEl,
    		focus,
    		totalTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(3, todos = $$props.todos);
    		if ('completedTodos' in $$props) $$invalidate(0, completedTodos = $$props.completedTodos);
    		if ('headingEl' in $$props) $$invalidate(1, headingEl = $$props.headingEl);
    		if ('totalTodos' in $$props) $$invalidate(2, totalTodos = $$props.totalTodos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 8) {
    			$$invalidate(2, totalTodos = todos.length);
    		}

    		if ($$self.$$.dirty & /*todos*/ 8) {
    			$$invalidate(0, completedTodos = todos.filter(todo => todo.completed).length);
    		}
    	};

    	return [completedTodos, headingEl, totalTodos, todos, focus, h2_binding];
    }

    class TodosStatus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { todos: 3, focus: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodosStatus",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get todos() {
    		throw new Error("<TodosStatus>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<TodosStatus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		return this.$$.ctx[4];
    	}

    	set focus(value) {
    		throw new Error("<TodosStatus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const localStore = (key, initial) => {
      // 接收本地存储的键和初始值

      // Web 存储只支持保存字符串值
      const toString = (value) => JSON.stringify(value, null, 2); // 辅助函数
      const toObj = JSON.parse; // 辅助函数

      if (localStorage.getItem(key) === null) {
        // 本地存储中不存在该项
        localStorage.setItem(key, toString(initial)); // 使用初始值初始化本地存储
      }

      const saved = toObj(localStorage.getItem(key)); // 转换为对象

      const { subscribe, set, update } = writable(saved); // 创建底层的可写 store

      return {
        subscribe,
        set: (value) => {
          localStorage.setItem(key, toString(value)); // 也将其作为字符串保存到本地存储中
          return set(value);
        },
        update,
      };
    };

    const alert = writable("Welcome to the to-do list app!");
    // export const todos = writable([]);

    const initialTodos = [
      { id: 1, name: "Visit MDN web docs", completed: true },
      { id: 2, name: "Complete the Svelte Tutorial", completed: false },
    ];

    const todos = localStore("mdn-svelte-todo", initialTodos);

    /* src/components/Todos.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file$1 = "src/components/Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (88:4) {:else}
    function create_else_block(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "Nothing to do here!";
    			add_location(li, file$1, 88, 6, 3070);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(88:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:4) {#each filterTodos(filter, todos) as todo (todo.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let todo;
    	let t;
    	let current;

    	todo = new Todo({
    			props: { todo: /*todo*/ ctx[18] },
    			$$inline: true
    		});

    	todo.$on("update", /*update_handler*/ ctx[12]);
    	todo.$on("remove", /*remove_handler*/ ctx[13]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			create_component(todo.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "todo");
    			add_location(li, file$1, 83, 6, 2868);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(todo, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const todo_changes = {};
    			if (dirty & /*filter, todos*/ 3) todo_changes.todo = /*todo*/ ctx[18];
    			todo.$set(todo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(todo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(83:4) {#each filterTodos(filter, todos) as todo (todo.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let newtodo;
    	let t0;
    	let filterbutton;
    	let updating_filter;
    	let t1;
    	let todosstatus;
    	let t2;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t3;
    	let hr;
    	let t4;
    	let moreactions;
    	let current;

    	newtodo = new NewTodo({
    			props: { autofocus: true },
    			$$inline: true
    		});

    	newtodo.$on("addTodo", /*addTodo_handler*/ ctx[9]);

    	function filterbutton_filter_binding(value) {
    		/*filterbutton_filter_binding*/ ctx[10](value);
    	}

    	let filterbutton_props = {};

    	if (/*filter*/ ctx[1] !== void 0) {
    		filterbutton_props.filter = /*filter*/ ctx[1];
    	}

    	filterbutton = new FilterButton({
    			props: filterbutton_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(filterbutton, 'filter', filterbutton_filter_binding));
    	let todosstatus_props = { todos: /*todos*/ ctx[0] };
    	todosstatus = new TodosStatus({ props: todosstatus_props, $$inline: true });
    	/*todosstatus_binding*/ ctx[11](todosstatus);
    	let each_value = /*filterTodos*/ ctx[3](/*filter*/ ctx[1], /*todos*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*todo*/ ctx[18].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	moreactions = new MoreActions({
    			props: { todos: /*todos*/ ctx[0] },
    			$$inline: true
    		});

    	moreactions.$on("checkAll", /*checkAll_handler*/ ctx[14]);
    	moreactions.$on("removeCompleted", /*removeCompletedTodos*/ ctx[8]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(newtodo.$$.fragment);
    			t0 = space();
    			create_component(filterbutton.$$.fragment);
    			t1 = space();
    			create_component(todosstatus.$$.fragment);
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			create_component(moreactions.$$.fragment);
    			attr_dev(ul, "role", "list");
    			attr_dev(ul, "class", "todo-list stack-large");
    			attr_dev(ul, "aria-labelledby", "list-heading");
    			add_location(ul, file$1, 81, 2, 2727);
    			add_location(hr, file$1, 92, 2, 3122);
    			attr_dev(div, "class", "todoapp stack-large");
    			add_location(div, file$1, 69, 0, 2398);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(newtodo, div, null);
    			append_dev(div, t0);
    			mount_component(filterbutton, div, null);
    			append_dev(div, t1);
    			mount_component(todosstatus, div, null);
    			append_dev(div, t2);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			append_dev(div, t3);
    			append_dev(div, hr);
    			append_dev(div, t4);
    			mount_component(moreactions, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const filterbutton_changes = {};

    			if (!updating_filter && dirty & /*filter*/ 2) {
    				updating_filter = true;
    				filterbutton_changes.filter = /*filter*/ ctx[1];
    				add_flush_callback(() => updating_filter = false);
    			}

    			filterbutton.$set(filterbutton_changes);
    			const todosstatus_changes = {};
    			if (dirty & /*todos*/ 1) todosstatus_changes.todos = /*todos*/ ctx[0];
    			todosstatus.$set(todosstatus_changes);

    			if (dirty & /*filterTodos, filter, todos, updateTodo, removeTodo*/ 107) {
    				each_value = /*filterTodos*/ ctx[3](/*filter*/ ctx[1], /*todos*/ ctx[0]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(ul, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}

    			const moreactions_changes = {};
    			if (dirty & /*todos*/ 1) moreactions_changes.todos = /*todos*/ ctx[0];
    			moreactions.$set(moreactions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newtodo.$$.fragment, local);
    			transition_in(filterbutton.$$.fragment, local);
    			transition_in(todosstatus.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(moreactions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newtodo.$$.fragment, local);
    			transition_out(filterbutton.$$.fragment, local);
    			transition_out(todosstatus.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(moreactions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(newtodo);
    			destroy_component(filterbutton);
    			/*todosstatus_binding*/ ctx[11](null);
    			destroy_component(todosstatus);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();
    			destroy_component(moreactions);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $alert;
    	validate_store(alert, 'alert');
    	component_subscribe($$self, alert, $$value => $$invalidate(16, $alert = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Todos', slots, []);
    	let { todos } = $$props;
    	let newTodoName = "";
    	let newTodoId;
    	let todosStatus; // 对 TodosStatus 实例的引用

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

    	const filterTodos = (filter, todos) => filter === "active"
    	? todos.filter(t => !t.completed)
    	: filter === "completed"
    		? todos.filter(t => t.completed)
    		: todos;

    	function addTodo(name) {
    		$$invalidate(0, todos = [...todos, { id: newTodoId, name, completed: false }]);
    		set_store_value(alert, $alert = `Todo '${name}' has been added`, $alert);
    	}

    	function removeTodo(todo) {
    		$$invalidate(0, todos = todos.filter(t => t.id !== todo.id));
    		todosStatus.focus(); // 将焦点放在状态标题上
    		set_store_value(alert, $alert = `Todo '${todo.name}' has been deleted`, $alert);
    	}

    	function updateTodo(todo) {
    		const i = todos.findIndex(t => t.id === todo.id);
    		if (todos[i].name !== todo.name) set_store_value(alert, $alert = `todo '${todos[i].name}' has been renamed to '${todo.name}'`, $alert);
    		if (todos[i].completed !== todo.completed) set_store_value(alert, $alert = `todo '${todos[i].name}' marked as ${todo.completed ? "completed" : "active"}`, $alert);
    		$$invalidate(0, todos[i] = Object.assign(Object.assign({}, todos[i]), todo), todos);
    	}

    	const checkAllTodos = completed => {
    		// todos.forEach((t) => (t.completed = completed));
    		// console.log("todos", todos);
    		// 将新数组赋值 促使todos更新
    		$$invalidate(0, todos = todos.map(t => Object.assign(Object.assign({}, t), { completed })));

    		set_store_value(alert, $alert = `${completed ? "Checked" : "Unchecked"} ${todos.length} to-dos`, $alert);
    	};

    	const removeCompletedTodos = () => {
    		set_store_value(alert, $alert = `Removed ${todos.filter(t => t.completed).length} to-dos`, $alert);
    		$$invalidate(0, todos = todos.filter(t => !t.completed));
    	};

    	$$self.$$.on_mount.push(function () {
    		if (todos === undefined && !('todos' in $$props || $$self.$$.bound[$$self.$$.props['todos']])) {
    			console.warn("<Todos> was created without expected prop 'todos'");
    		}
    	});

    	const writable_props = ['todos'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Todos> was created with unknown prop '${key}'`);
    	});

    	const addTodo_handler = e => addTodo(e.detail);

    	function filterbutton_filter_binding(value) {
    		filter = value;
    		$$invalidate(1, filter);
    	}

    	function todosstatus_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			todosStatus = $$value;
    			$$invalidate(2, todosStatus);
    		});
    	}

    	const update_handler = e => updateTodo(e.detail);
    	const remove_handler = e => removeTodo(e.detail);
    	const checkAll_handler = e => checkAllTodos(e.detail);

    	$$self.$$set = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		FilterButton,
    		Todo,
    		MoreActions,
    		NewTodo,
    		TodosStatus,
    		alert,
    		todos,
    		newTodoName,
    		newTodoId,
    		todosStatus,
    		filter,
    		filterTodos,
    		addTodo,
    		removeTodo,
    		updateTodo,
    		checkAllTodos,
    		removeCompletedTodos,
    		$alert
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('newTodoName' in $$props) newTodoName = $$props.newTodoName;
    		if ('newTodoId' in $$props) newTodoId = $$props.newTodoId;
    		if ('todosStatus' in $$props) $$invalidate(2, todosStatus = $$props.todosStatus);
    		if ('filter' in $$props) $$invalidate(1, filter = $$props.filter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1) {
    			newTodoId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1;
    		}

    		if ($$self.$$.dirty & /*filter*/ 2) {
    			{
    				if (filter === "all") {
    					set_store_value(alert, $alert = "Browsing all to-dos", $alert);
    				} else if (filter === "active") {
    					set_store_value(alert, $alert = "Browsing active to-dos", $alert);
    				} else if (filter === "completed") {
    					set_store_value(alert, $alert = "Browsing completed to-dos", $alert);
    				}
    			}
    		}
    	};

    	return [
    		todos,
    		filter,
    		todosStatus,
    		filterTodos,
    		addTodo,
    		removeTodo,
    		updateTodo,
    		checkAllTodos,
    		removeCompletedTodos,
    		addTodo_handler,
    		filterbutton_filter_binding,
    		todosstatus_binding,
    		update_handler,
    		remove_handler,
    		checkAll_handler
    	];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { todos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get todos() {
    		throw new Error("<Todos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<Todos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        const [xValue, xUnit] = split_css_unit(x);
        const [yValue, yUnit] = split_css_unit(y);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/Alert.svelte generated by Svelte v3.59.2 */
    const file = "src/components/Alert.svelte";

    // (34:0) {#if visible}
    function create_if_block(ctx) {
    	let div;
    	let svg;
    	let path;
    	let t0;
    	let p;
    	let t1;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*$alert*/ ctx[0]);
    			attr_dev(path, "d", "M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z");
    			add_location(path, file, 38, 62, 1190);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "class", "svelte-1nfdodl");
    			add_location(svg, file, 38, 2, 1130);
    			attr_dev(p, "class", "svelte-1nfdodl");
    			add_location(p, file, 39, 2, 1635);
    			attr_dev(div, "role", "alert");
    			attr_dev(div, "class", "svelte-1nfdodl");
    			add_location(div, file, 35, 0, 997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[3], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$alert*/ 1) set_data_dev(t1, /*$alert*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;

    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fly,
    					{
    						delay: 250,
    						duration: 300,
    						x: 0,
    						y: -100,
    						opacity: 0.5
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fly,
    				{
    					delay: 250,
    					duration: 300,
    					x: 0,
    					y: -100,
    					opacity: 0.5
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:0) {#if visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*visible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $alert;
    	validate_store(alert, 'alert');
    	component_subscribe($$self, alert, $$value => $$invalidate(0, $alert = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Alert', slots, []);
    	let { ms = 3000 } = $$props;
    	let visible;
    	let timeout;

    	const onMessageChange = (message, ms) => {
    		clearTimeout(timeout);

    		if (!message) {
    			// 如果消息为空，则隐藏提示
    			$$invalidate(1, visible = false);
    		} else {
    			$$invalidate(1, visible = true); // 显示提示
    			if (ms > 0) timeout = setTimeout(() => $$invalidate(1, visible = false), ms); // 并在 ms 毫秒后隐藏
    		}
    	};

    	onDestroy(() => clearTimeout(timeout)); // 确保我们清除超时
    	const writable_props = ['ms'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Alert> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, visible = false);

    	$$self.$$set = $$props => {
    		if ('ms' in $$props) $$invalidate(2, ms = $$props.ms);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		alert,
    		fly,
    		ms,
    		visible,
    		timeout,
    		onMessageChange,
    		$alert
    	});

    	$$self.$inject_state = $$props => {
    		if ('ms' in $$props) $$invalidate(2, ms = $$props.ms);
    		if ('visible' in $$props) $$invalidate(1, visible = $$props.visible);
    		if ('timeout' in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$alert, ms*/ 5) {
    			onMessageChange($alert, ms); // 每当 alert store 或 ms 属性发生变化时运行 onMessageChange
    		}
    	};

    	return [$alert, visible, ms, click_handler];
    }

    class Alert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { ms: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get ms() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ms(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let alert;
    	let t;
    	let todos_1;
    	let updating_todos;
    	let current;
    	alert = new Alert({ $$inline: true });

    	function todos_1_todos_binding(value) {
    		/*todos_1_todos_binding*/ ctx[1](value);
    	}

    	let todos_1_props = {};

    	if (/*$todos*/ ctx[0] !== void 0) {
    		todos_1_props.todos = /*$todos*/ ctx[0];
    	}

    	todos_1 = new Todos({ props: todos_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(todos_1, 'todos', todos_1_todos_binding));

    	const block = {
    		c: function create() {
    			create_component(alert.$$.fragment);
    			t = space();
    			create_component(todos_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(alert, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(todos_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const todos_1_changes = {};

    			if (!updating_todos && dirty & /*$todos*/ 1) {
    				updating_todos = true;
    				todos_1_changes.todos = /*$todos*/ ctx[0];
    				add_flush_callback(() => updating_todos = false);
    			}

    			todos_1.$set(todos_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			transition_in(todos_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			transition_out(todos_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(alert, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(todos_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $todos;
    	validate_store(todos, 'todos');
    	component_subscribe($$self, todos, $$value => $$invalidate(0, $todos = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function todos_1_todos_binding(value) {
    		$todos = value;
    		todos.set($todos);
    	}

    	$$self.$capture_state = () => ({ Todos, Alert, todos, $todos });
    	return [$todos, todos_1_todos_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body, // 要把组件渲染在哪一个 DOM 元素
        // props: { // 指定 App 组件中的属性值
        // 	name: 'world'
        // }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
