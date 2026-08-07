// status is a restricted global variable - using it unqualified should trigger no-restricted-globals
const x = status;

export { x };
