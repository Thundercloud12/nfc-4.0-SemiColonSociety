'use client';

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const LocationMap = dynamic(() => import('../../components/LocationMap'), { ssr: false });

export default function RegisterForm() {
  const { t } = useTranslation('auth');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: '',
    languagePreference: 'hi',
    // Pregnant specific
    pregnancyMonth: '',
    medications: '',
    expectedDeliveryDate: '',
    highRisk: false,
    // Family specific
    uniqueCode: '',
    // Location data
    location: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India default

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};

            const locationData = {
              coordinates: { latitude, longitude },
              address: data.display_name || '',
              city: address.city || address.town || address.village || '',
              state: address.state || '',
              country: address.country || '',
              postalCode: address.postcode || ''
            };

            setFormData(prev => ({
              ...prev,
              location: locationData
            }));

            setMapCenter([latitude, longitude]);
            setShowMap(true);
          } else {
            setLocationError('Failed to get address details');
          }
        } catch (error) {
          setLocationError('Failed to get address details');
          // Save at least the coordinates even if address fails
          setFormData(prev => ({
            ...prev,
            location: {
              coordinates: { latitude, longitude },
              address: `${latitude}, ${longitude}`,
              city: '',
              state: '',
              country: '',
              postalCode: ''
            }
          }));
          setMapCenter([latitude, longitude]);
          setShowMap(true);
        }
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Failed to get location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error occurred.';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 min
      }
    );
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const locationData = {
          coordinates: { latitude: lat, longitude: lng },
          address: data.display_name || '',
          city: address.city || address.town || address.village || '',
          state: address.state || '',
          country: address.country || '',
          postalCode: address.postcode || ''
        };
        setFormData(prev => ({
          ...prev,
          location: locationData
        }));
        setMapCenter([lat, lng]);
      }
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        location: {
          coordinates: { latitude: lat, longitude: lng },
          address: `${lat}, ${lng}`,
          city: '',
          state: '',
          country: '',
          postalCode: ''
        }
      }));
      setMapCenter([lat, lng]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Only send what the API expects!
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        languagePreference: formData.languagePreference,
        location: formData.location
      };

      if (formData.role === 'pregnant') {
        submitData.pregnancyInfo = {
          month: parseInt(formData.pregnancyMonth, 10),
          medications: formData.medications
            ? formData.medications.split(',').map(med => med.trim()).filter(med => med)
            : [],
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          highRisk: formData.highRisk,
        };
      } else if (formData.role === 'family') {
        submitData.uniqueCode = formData.uniqueCode;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Success: ${result.message}`);
        if (result.uniqueCode) {
          setMessage(prev => `${prev}\nYour unique code: ${result.uniqueCode}\n${result.note}`);
        }
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          role: '',
          languagePreference: 'hi',
          pregnancyMonth: '',
          medications: '',
          expectedDeliveryDate: '',
          highRisk: false,
          uniqueCode: '',
          location: null
        });
      } else {
        setMessage(`Error: ${result.error || result.message || "Unknown error"}`);
      }
    } catch (error) {
      setMessage('Error: Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-pink-50">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Language Switcher */}
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">{t('auth.createAccount')}</h2>
            <p className="text-gray-600 text-lg">{t('auth.registerSubtitle')}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-pink-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.name')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder={t('auth.name')}
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.phone')} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="bg-pink-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                
                Select Your Role
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['pregnant', 'family', 'asha'].map((role) => (
                  <label key={role} className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      formData.role === role 
                        ? 'border-pink-500 bg-pink-100 shadow-md' 
                        : 'border-pink-200 bg-white hover:border-pink-300'
                    }`}>
                      <div className="text-2xl mb-2">
                   
                      </div>
                      <div className="font-semibold text-gray-800 capitalize">{role}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {role === 'pregnant' ? 'Expecting mother' : 
                         role === 'family' ? 'Family member' : 
                         'Healthcare worker'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Preference */}
            <div className="bg-pink-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        
                Language Preference
              </h3>
              
              <select
                name="languagePreference"
                value={formData.languagePreference}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-pink-200 bg-pink-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
              >
                <option value="hi">🇮🇳 Hindi</option>
                <option value="mr">🇮🇳 Marathi</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>

            {/* Role-specific sections */}
            {formData.role === 'pregnant' && (
              <div className="bg-rose-50 p-6 rounded-xl border-2 border-rose-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                 
                  Pregnancy Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pregnancy Month *
                    </label>
                    <input
                      type="number"
                      name="pregnancyMonth"
                      value={formData.pregnancyMonth}
                      onChange={handleInputChange}
                      min="1"
                      max="9"
                      required
                      placeholder="Month (1-9)"
                      className="w-full px-4 py-3 border-2 border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      name="expectedDeliveryDate"
                      value={formData.expectedDeliveryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Medications (comma-separated)
                  </label>
                  <textarea
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    placeholder="e.g., Folic acid, Iron supplements"
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 resize-none"
                    rows="3"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="highRisk"
                      checked={formData.highRisk}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                      formData.highRisk 
                        ? 'bg-red-500 border-red-500' 
                        : 'border-rose-300 hover:border-rose-400'
                    }`}>
                      {formData.highRisk && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      This is a high-risk pregnancy
                    </span>
                  </label>
                </div>
              </div>
            )}

            {formData.role === 'family' && (
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  Family Connection
                </h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unique Code from Pregnant Woman *
                  </label>
                  <input
                    type="text"
                    name="uniqueCode"
                    value={formData.uniqueCode}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter the unique code"
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Ask the pregnant woman for her unique code to link your accounts
                  </p>
                </div>
              </div>
            )}

            {/* Location Section */}
            <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                
                Location (Optional but Recommended)
              </h3>
              
              {!formData.location ? (
                <div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full px-6 py-4 bg-pink-50 text-pink-500 rounded-lg hover:border-1 hover:border-pink-400 focus:outline-none focus:ring- focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {locationLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Getting Location...
                      </span>
                    ) : (
                      " Get Current Location"
                    )}
                  </button>
                  
                  {locationError && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm text-center">
                      <div className="flex items-center">
                       
                        {locationError}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600 mt-4 text-center">
                    Location helps ASHA workers provide better local healthcare services
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-800 flex items-center mb-2">
                          <span className="mr-2">✅</span>
                          Location Captured Successfully
                        </p>
                        <p className="text-sm text-green-700 mb-2">
                           {formData.location.address || `${formData.location.coordinates.latitude}, ${formData.location.coordinates.longitude}`}
                        </p>
                        {formData.location.city && (
                          <p className="text-xs text-green-600">
                             {formData.location.city}, {formData.location.state}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, location: null }));
                          setShowMap(false);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-semibold px-3 py-1 rounded hover:bg-green-200 transition-all duration-200"
                      >
                         Clear
                      </button>
                    </div>
                  </div>
                  
                  {showMap && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-700 font-semibold">
                           Click on the map to adjust your location
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowMap(false)}
                          className="text-sm text-gray-500 hover:text-gray-700 font-semibold px-3 py-1 rounded hover:bg-gray-200 transition-all duration-200"
                        >
                          Hide Map
                        </button>
                      </div>
                      
                      <div className="h-64 w-full border-2 border-green-300 rounded-lg overflow-hidden shadow-md">
                        <LocationMap
                          center={mapCenter}
                          location={formData.location}
                          onMapClick={handleMapClick}
                        />
                      </div>
                    </div>
                  )}
                  
                  {!showMap && (
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="w-full px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-semibold"
                    >
                       Show Map to Adjust Location
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  " Create Account"
                )}
              </button>
            </div>
          </form>

          {/* Success/Error Messages */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl border-l-4  shadow-sm`}>
              <div className="flex items-start">
              
                <div className="flex-1">
                  <div className="whitespace-pre-line">{message}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
