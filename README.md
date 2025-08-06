This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 🚀 Features

- **Maternal Healthcare Management**: Complete platform for pregnant women, family members, and ASHA workers
- **Multi-language Support**: English and Hindi internationalization
- **Push Notifications**: Real-time notifications for appointments and health reminders
- **Offline Support**: PWA with Service Worker for offline functionality
- **AI-Powered Symptom Logging**: Voice-to-text symptom recording with Gemini AI
- **Emergency Alerts**: GPS-based emergency notifications via SMS
- **Role-based Access**: Different dashboards for patients, family, and healthcare workers

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📱 Push Notifications Setup

The application includes Web Push Notifications for real-time updates:

### For Users:
1. Visit any dashboard (Patient, Family, or ASHA)
2. Look for the "Push Notifications" section
3. Click "Enable Notifications" to subscribe
4. Grant permission when prompted by your browser

### For ASHA Workers:
1. Go to ASHA Dashboard
2. Use the "Send Notifications" section to notify all patients
3. Choose from:
   - **Appointment Reminders**: Notify about upcoming appointments
   - **Health Check-up Reminders**: Encourage symptom logging
   - **Custom Messages**: Send personalized messages

### Notification Types:
- 📅 **Appointment Reminders**: Weekly appointment notifications
- 🩺 **Health Check-ups**: Regular health monitoring reminders  
- 🚨 **Emergency Alerts**: Immediate emergency notifications
- 📢 **Custom Messages**: Personalized messages from ASHA workers

## Environment Variables

Make sure to set up these environment variables in your `.env` file:

```env
# Database
MONGODB_URL=your_mongodb_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret

# Email (for OTP)
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Twilio (for SMS)
TWILIO_ACC_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

To generate VAPID keys for push notifications:
```bash
npx web-push generate-vapid-keys
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── locales/              # Translation files (en, hi)
└── models/               # MongoDB/Mongoose models
```

## Technologies Used

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with OTP
- **Push Notifications**: Web Push API with VAPID
- **AI Integration**: Google Gemini AI
- **SMS**: Twilio
- **Offline Support**: Service Workers, IndexedDB
- **Internationalization**: Custom i18n with React Context

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
