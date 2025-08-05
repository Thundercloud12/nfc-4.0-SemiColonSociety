# Audio Features Documentation

## Overview
The Symptom Logger now includes browser-based Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities using the Web Speech API.

## Features Added

### 🎤 Speech-to-Text (STT)
- **Technology**: Web Speech Recognition API
- **Functionality**: Convert user's voice input to text
- **Language**: English (US)
- **Browser Support**: Chrome, Edge, Safari (with vendor prefixes)

### 🔊 Text-to-Speech (TTS)
- **Technology**: Web Speech Synthesis API
- **Functionality**: Read bot responses aloud
- **Settings**: Rate: 0.8x, Pitch: 1.0, Volume: 0.7
- **Browser Support**: Most modern browsers

## User Interface Elements

### Audio Control Panel
Located above the text input area:
- **Audio Toggle**: ON/OFF button to enable/disable TTS
- **Voice Input Button**: Start/Stop listening for voice input
- **Stop Speaking Button**: Cancel ongoing speech synthesis
- **Support Indicators**: Shows which audio features are available

### Visual Feedback
- **Status Bar**: Appears when audio is active
  - 🎤 Listening indicator with animated bars
  - 🔊 Speaking indicator with animated bars
- **Button States**: 
  - Listening button pulses red when active
  - Audio toggle shows green when enabled

### Enhanced Instructions
- Updated help section to include audio feature information
- Green info box shows available audio capabilities
- Clear instructions for voice input usage

## Keyboard Shortcuts
- **Ctrl + Space**: Toggle voice recording on/off
- **Escape**: Stop all audio (listening and speaking)

## How It Works

### Voice Input Flow
1. User clicks "🎤 Start Speaking" or uses Ctrl+Space
2. Browser requests microphone permission (if not granted)
3. Visual indicator shows listening status
4. Speech is converted to text and added to the input field
5. User can edit the text before sending

### Voice Output Flow
1. User enables audio with the toggle button
2. When bot responds, TTS automatically speaks the response
3. Small delay (500ms) for better user experience
4. Visual indicator shows speaking status
5. User can stop speaking at any time

## Technical Implementation

### State Management
```javascript
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [speechSupported, setSpeechSupported] = useState(false);
const [ttsSupported, setTtsSupported] = useState(false);
const [audioEnabled, setAudioEnabled] = useState(false);
```

### Key Functions
- `initializeAudio()`: Set up Web Speech APIs
- `startListening()` / `stopListening()`: Control voice input
- `speakText(text)` / `stopSpeaking()`: Control voice output
- `toggleAudio()`: Enable/disable TTS features

### Browser Compatibility
- **STT**: Chrome, Edge, Safari (webkit prefix)
- **TTS**: All modern browsers
- **Graceful Degradation**: Features hide if not supported

## Future Enhancements (Phase 2 & 3)
- **Coqui TTS**: Better voice quality with custom models
- **Vosk STT**: Offline speech recognition support
- **Voice Selection**: Multiple voice options
- **Language Support**: Multi-language audio features

## Security Considerations
- Microphone permission required for STT
- No audio data sent to external servers
- All processing happens in browser
- Privacy-first approach

## Usage Tips
1. **Quiet Environment**: Better recognition in low-noise settings
2. **Clear Speech**: Speak clearly and at moderate pace
3. **Punctuation**: Say "period", "comma" for punctuation
4. **Editing**: Always review voice-to-text before sending
5. **Audio Toggle**: Enable audio for hands-free responses

## Troubleshooting
- **No Microphone Access**: Check browser permissions
- **STT Not Working**: Verify browser compatibility
- **TTS Not Working**: Check system audio settings
- **Poor Recognition**: Speak more clearly or reduce background noise
