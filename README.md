# Diet Tracker

A modern diet tracking application with AI-powered food analysis using Claude.

![Diet Tracker Screenshot](./screenshot.png)

## Features

- 📊 **Daily Progress Tracking** - Track calories, protein, carbs, and fats with visual progress bars
- 📸 **AI Food Analysis** - Take a photo of your food and let Claude analyze the nutritional content
- 📅 **Weekly Meal Planning** - Plan meals for each day of the week
- 📖 **Recipe Library** - Save and reuse your favorite meals with 10 pre-loaded recipes
- ⚡ **Quick Actions** - Log planned meals with one click, save meals as recipes

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Anthropic Claude API** - AI-powered food image analysis
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key (for food photo analysis)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/diet-tracker.git
   cd diet-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Anthropic API key:
   ```
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Logging Meals

1. Go to the **Today** tab
2. Either:
   - Click "Take Photo of Food" to use AI analysis
   - Or enter meal details manually
3. Click "Add Meal" to log

### Saving Recipes

1. Fill in the meal details
2. Click "Save as Recipe" instead of "Add Meal"
3. Access saved recipes in the **Recipes** tab

### Meal Planning

1. Go to the **Meal Plan** tab
2. Select a day and optionally a time
3. Fill in meal details or load from recipes
4. Click "Add to Meal Plan"
5. Use "Log Now" to quickly log a planned meal

## API Key Security Note

⚠️ **Important**: The current implementation exposes the API key in the browser. For production use, you should:

1. Create a backend proxy server
2. Move API calls to the server
3. Only expose your own authenticated endpoints to the frontend

## Project Structure

```
diet-tracker/
├── src/
│   ├── components/
│   │   ├── DietTracker.tsx    # Main component
│   │   └── ProgressBar.tsx    # Progress bar component
│   ├── data/
│   │   └── recipes.ts         # Default recipes
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [Anthropic](https://anthropic.com) for the Claude API
- [Lucide](https://lucide.dev) for the beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
