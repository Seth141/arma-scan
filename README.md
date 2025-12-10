# ArmaScan - AI Hand Measurement Tool

A modern web application that uses Google MediaPipe and Next.js to scan and measure hand dimensions in real-time.

## Features

- **Real-time Hand Detection**: Uses MediaPipe Hands for accurate hand landmark detection
- **Precise Measurements**: Measures palm width, palm length, individual finger lengths, and total hand length
- **Beautiful UI**: Modern, responsive interface with smooth animations
- **Live Camera Feed**: Real-time video processing with hand landmark visualization
- **Measurement Display**: Detailed breakdown of all hand measurements with visual indicators

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **MediaPipe**: Google's ML framework for hand detection
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with camera access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd armascan
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Start Scanning**: Click the "Start" button to activate the camera
2. **Position Your Hand**: Place your hand in front of the camera with fingers spread
3. **View Measurements**: Real-time measurements will appear on the right panel
4. **Stop Scanning**: Click "Stop" to pause the camera feed

## Measurement Details

The application measures:

- **Palm Width**: Distance across the palm
- **Palm Length**: Distance from wrist to palm center
- **Finger Lengths**: Individual measurements for each finger
- **Total Hand Length**: Complete length from wrist to middle finger tip

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Camera Permissions

The application requires camera access to function. Make sure to:

1. Allow camera permissions when prompted
2. Ensure good lighting for accurate detection
3. Keep your hand clearly visible in the camera frame

## Development

### Project Structure

```
armascan/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/             # React components
│   ├── HandScanner.tsx    # Main scanner component
│   ├── MeasurementDisplay.tsx # Measurement display
│   └── Header.tsx         # Header component
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
└── README.md             # This file
```

### Key Components

- **HandScanner**: Manages MediaPipe integration and camera feed
- **MeasurementDisplay**: Shows measurement results with beautiful UI
- **Header**: Application header with branding

## Troubleshooting

### Camera Issues
- Ensure camera permissions are granted
- Try refreshing the page
- Check if another application is using the camera

### MediaPipe Loading Issues
- Ensure stable internet connection (MediaPipe models are loaded from CDN)
- Try clearing browser cache
- Check browser console for errors

### Measurement Accuracy
- Ensure good lighting
- Keep hand steady and fingers spread
- Position hand clearly in camera frame
- Avoid rapid movements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Google MediaPipe team for the excellent hand detection models
- Next.js team for the amazing React framework
- Tailwind CSS for the utility-first styling approach 