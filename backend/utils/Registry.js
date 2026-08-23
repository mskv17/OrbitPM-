class Registry {
    constructor(name="registry") {
        this.name = name;
        this.items = new Map();
    }

    register(key, value) {
        if (this.items.has(key)) {
            throw new Error(`Key "${key}" is already registered in ${this.name}.`);
        }
        this.items.set(key, value);
    }

    get(key) {
        if (!this.items.has(key)) {
            throw new Error(`Key "${key}" is not registered in ${this.name}.`);
        }
        return this.items.get(key);
    }
}

export default Registry;