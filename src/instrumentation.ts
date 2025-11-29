export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        if (typeof global !== 'undefined') {
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
            } else if (typeof global.localStorage.getItem !== 'function') {
                // Fix broken localStorage
                const oldStorage = global.localStorage;
                (global as any).localStorage = {
                    ...oldStorage,
                    getItem: noop,
                    setItem: noop,
                    removeItem: noop,
                    clear: noop,
                    length: 0,
                    key: noop,
                };
            }
        }
    }
}
