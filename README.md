# Word Search Game

A modern word search game built with Vue 3, Quasar, and Pinia. Features include:

- Multiple difficulty levels and categories
- Dark mode support
- Touch-optimized interface
- Progress tracking and statistics
- Animations and sound effects
- High scores and achievements

## Prerequisites

- Node.js v18+ (LTS recommended)
- npm v6.13.4+ or yarn v1.21.1+

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/wordsearch.git
cd wordsearch
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:9000` by default.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── assets/        # Static assets (images, fonts)
├── boot/          # App initialization code
├── components/    # Vue components
├── composables/   # Vue composables (hooks)
├── css/          # Global styles
├── layouts/      # Page layouts
├── pages/        # Page components
├── router/       # Vue Router configuration
└── stores/       # Pinia stores
```

### Key Features

- **Game Logic**: Core game functionality in `useWordGrid` composable
- **State Management**: Game state handled by Pinia stores
- **Animations**: CSS and JavaScript animations for enhanced UX
- **Touch Support**: Optimized for both desktop and mobile devices
- **Dark Mode**: System-aware dark mode with manual toggle
- **Statistics**: Progress tracking and achievements

## Testing

The project uses Vitest for unit testing. Key test files:

- `useWordGrid.test.js` - Tests for core game logic
- `useTimer.test.js` - Tests for timer functionality

Run tests with:

```bash
npm run test       # Run tests
npm run test:watch # Watch mode
```

## Building for Production

1. Build the app:

```bash
npm run build
```

2. The built files will be in the `dist` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
