'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(() => import('../../components/LocationMap'), { ssr: false });

export default function RegisterForm() {
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
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center of India

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log('Input change:', { name, value, type }); // Debug log
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
                    // Reverse geocoding using OpenStreetMap Nominatim API
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
                        
                        // Set map center and show map
                        setMapCenter([latitude, longitude]);
                        setShowMap(true);
                        
                        console.log('Location captured:', locationData);
                    } else {
                        setLocationError('Failed to get address details');
                    }
                } catch (error) {
                    console.error('Error getting address:', error);
                    setLocationError('Failed to get address details');
                    
                    // Still save coordinates even if address lookup fails
                    const locationData = {
                        coordinates: { latitude, longitude },
                        address: `${latitude}, ${longitude}`,
                        city: '',
                        state: '',
                        country: '',
                        postalCode: ''
                    };
                    
                    setFormData(prev => ({
                        ...prev,
                        location: locationData
                    }));
                    
                    // Set map center and show map
                    setMapCenter([latitude, longitude]);
                    setShowMap(true);
                }
                
                setLocationLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
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
                maximumAge: 300000 // 5 minutes
            }
        );
    };

    const handleMapClick = async (e) => {
        const { lat, lng } = e.latlng;
        
        try {
            // Reverse geocoding for the new location
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
                console.log('Updated location:', locationData);
            }
        } catch (error) {
            console.error('Error getting address for clicked location:', error);
            // Still update with coordinates
            const locationData = {
                coordinates: { latitude: lat, longitude: lng },
                address: `${lat}, ${lng}`,
                city: '',
                state: '',
                country: '',
                postalCode: ''
            };
            
            setFormData(prev => ({
                ...prev,
                location: locationData
            }));
            
            setMapCenter([lat, lng]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Prepare data based on role
            const submitData = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                languagePreference: formData.languagePreference,
                location: formData.location // Include location data
            };

            // Add role-specific data
            if (formData.role === 'pregnant') {
                submitData.pregnancyInfo = {
                    month: parseInt(formData.pregnancyMonth),
                    medications: formData.medications.split(',').map(med => med.trim()).filter(med => med),
                    expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
                    highRisk: formData.highRisk,
                };
            } else if (formData.role === 'family') {
                submitData.uniqueCode = formData.uniqueCode;
            }
            console.log(formData);
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                    password: '',
                    email: '',
                    role: '',
                    languagePreference: 'hi',
                    pregnancyMonth: '',
                    medications: '',
                    expectedDeliveryDate: '',
                    highRisk: false,
                    uniqueCode: '',
                    location: null, // Reset location
                });
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            console.log(formData);
            console.log(error);
            
            setMessage('Error: Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Role</option>
                        <option value="pregnant">Pregnant Woman</option>
                        <option value="family">Family Member</option>
                        <option value="asha">ASHA Worker</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language Preference
                    </label>
                    <select
                        name="languagePreference"
                        value={formData.languagePreference}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="hi">Hindi</option>
                        <option value="mr">Marathi</option>
                        <option value="gu">Gujarati</option>
                        <option value="en">English</option>
                    </select>
                </div>

                {/* Location Section */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location (Optional but Recommended)
                    </label>
                    
                    {!formData.location ? (
                        <div>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={locationLoading}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {locationLoading ? "Getting Location..." : "📍 Get Current Location"}
                            </button>
                            
                            {locationError && (
                                <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                                    {locationError}
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                                Location helps ASHA workers provide better local healthcare services.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-300 rounded-md p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">
                                            ✅ Location Captured
                                        </p>
                                        <p className="text-sm text-green-700 mt-1">
                                            {formData.location.address || `${formData.location.coordinates.latitude}, ${formData.location.coordinates.longitude}`}
                                        </p>
                                        {formData.location.city && (
                                            <p className="text-xs text-green-600 mt-1">
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
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            
                            {showMap && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            Click on the map to adjust your location
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowMap(false)}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Hide Map
                                        </button>
                                    </div>
                                    
                                    <div className="h-64 w-full border border-gray-300 rounded-md overflow-hidden">
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
                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                                >
                                    🗺️ Show Map to Adjust Location
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pregnant Woman Specific Fields */}
                {formData.role === 'pregnant' && (
                    <div className="space-y-4 p-4 bg-pink-50 rounded-md">
                        <h3 className="font-medium text-gray-800">Pregnancy Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pregnancy Month (1-9) *
                            </label>
                            <input
                                type="number"
                                name="pregnancyMonth"
                                value={formData.pregnancyMonth}
                                onChange={handleInputChange}
                                min="1"
                                max="9"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Medications (comma separated)
                            </label>
                            <input
                                type="text"
                                name="medications"
                                value={formData.medications}
                                onChange={handleInputChange}
                                placeholder="e.g. Iron tablets, Folic acid"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Delivery Date
                            </label>
                            <input
                                type="date"
                                name="expectedDeliveryDate"
                                value={formData.expectedDeliveryDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="highRisk"
                                    checked={formData.highRisk}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">High Risk Pregnancy</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Family Member Specific Fields */}
                {formData.role === 'family' && (
                    <div className="space-y-4 p-4 bg-green-50 rounded-md">
                        <h3 className="font-medium text-gray-800">Family Link Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unique Code from Pregnant Woman *
                            </label>
                            <input
                                type="text"
                                name="uniqueCode"
                                value={formData.uniqueCode}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter 8-character code"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ask the pregnant woman for her unique code to link your accounts
                            </p>
                        </div>
                    </div>
                )}

                {/* ASHA Worker gets no additional fields */}
                {formData.role === 'asha' && (
                    <div className="p-4 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-700">
                            As an ASHA worker, you'll receive a unique identification code after registration.
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-line ${
                    message.startsWith('Success') 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
