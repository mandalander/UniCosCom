export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        if (typeof global !== 'undefined') {
            const storage = {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
                clear: () => { },
                length: 0,
                key: () => null,
            };

            if (!global.localStorage) {
                (global as any).localStorage = storage;
            } else if (typeof (global.localStorage as any)?.getItem !== 'function') {
                // Fix broken localStorage - replace with working mock
                (global as any).localStorage = storage;
            }
        }
    }
}
