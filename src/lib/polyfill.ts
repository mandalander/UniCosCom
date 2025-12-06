
// This polyfill was causing issues in Next.js environment (localStorage not boolean, etc)
// We will rely on explicit checks (typeof window !== 'undefined') in the code instead.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// if (typeof window === 'undefined') {
//     const noop = () => null;
//     const storage = {
//         getItem: noop,
//         setItem: noop,
//         removeItem: noop,
//         clear: noop,
//         length: 0,
//         key: noop,
//     };
//
//     if (!global.localStorage) {
//         (global as any).localStorage = storage;
//     }
// }
