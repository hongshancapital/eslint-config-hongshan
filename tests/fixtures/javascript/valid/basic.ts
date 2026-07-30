const greeting = 'Hello, world!';

function greet(name: string): string {
  return `${greeting}, ${name}!`;
}

const result = greet('User');

export { greet, result };
