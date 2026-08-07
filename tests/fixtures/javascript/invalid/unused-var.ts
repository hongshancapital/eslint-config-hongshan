// unusedGreeting is declared but never used - should trigger @typescript-eslint/no-unused-vars
const unusedGreeting = 'Hello, world!';

function greet(name: string): string {
  return `Hello, ${name}!`;
}

export { greet };
