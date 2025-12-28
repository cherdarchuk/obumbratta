// history.svelte.js
export class HistoryState {
	#stack = $state([]);
	#index = $state(0);
	#timer = null;
	
	// Functions to read/write YOUR external state
	#get;
	#set;

	constructor(getter, setter) {
		this.#get = getter;
		this.#set = setter;
		// Initialize stack with the current value of your state
		this.#stack = [getter()];
	}

	canUndo = $derived(this.#index > 0);
	canRedo = $derived(this.#index < this.#stack.length - 1);

	snapshot() {
		clearTimeout(this.#timer);
		
		const val = this.#get();
		// If value hasn't changed since last snapshot, ignore
		if (val === this.#stack[this.#index]) return;

		const newStack = this.#stack.slice(0, this.#index + 1);
		newStack.push(val);
    // Limit history size to 50 entries
    if (newStack.length > 50) newStack.shift();
		this.#stack = newStack;
		this.#index = newStack.length - 1;
	}

	snapshotDebounced(delay = 500) {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => {
			this.snapshot();
		}, delay);
	}

	undo() {
		clearTimeout(this.#timer);
		if (this.canUndo) {
			this.#index--;
			// Update your external state with the value from history
			this.#set(this.#stack[this.#index]);
		}
	}

	redo() {
		clearTimeout(this.#timer);
		if (this.canRedo) {
			this.#index++;
			// Update your external state with the value from history
			this.#set(this.#stack[this.#index]);
		}
	}
}