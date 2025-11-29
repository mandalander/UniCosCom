if (typeof window === 'undefined') {
    const noop = () => null;
    const storage = {
        getItem: noop,
        setItem: noop,
        removeItem: noop,
        clear: noop,
        length: 0,
        key: noop,
    };

    if (!global.localStorage) {
        (global as any).localStorage = storage;
    }
}
